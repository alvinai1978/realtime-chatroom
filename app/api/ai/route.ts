import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const DEFAULT_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const DEFAULT_MODEL = 'meta/llama-3.1-8b-instruct';

type ChatHistoryItem = {
  user_name?: string;
  content?: string;
  is_ai?: boolean;
};

type ChatRequest = {
  message?: string;
  room?: string;
  userName?: string;
  history?: ChatHistoryItem[];
};

function cleanDetail(value: unknown) {
  if (!value) return '';
  let text = typeof value === 'string' ? value : JSON.stringify(value);
  text = text.replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [hidden]');
  text = text.replace(/nvapi-[A-Za-z0-9._-]+/g, 'nvapi-[hidden]');
  return text.slice(0, 600);
}

async function readResponseDetails(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      return cleanDetail(await response.json());
    }
    return cleanDetail(await response.text());
  } catch {
    return 'Could not read error details from NVIDIA response.';
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;
    const message = String(body.message || '').trim();
    const userName = String(body.userName || 'Guest').trim().slice(0, 40);
    const history = Array.isArray(body.history) ? body.history.slice(-8) : [];

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey || apiKey.includes('your-') || apiKey.includes('xxxxx')) {
      return NextResponse.json(
        {
          error: 'Missing or placeholder NVIDIA_API_KEY.',
          details: 'Open your .env or .env.local file and paste your real NVIDIA API key, then restart npm run dev.'
        },
        { status: 500 }
      );
    }

    const baseUrl = (process.env.NVIDIA_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
    const model = process.env.NVIDIA_MODEL || DEFAULT_MODEL;

    const conversationHistory = history.map((item) => ({
      role: item.is_ai ? 'assistant' : 'user',
      content: `${item.user_name || 'Guest'}: ${item.content || ''}`
    }));

    const nvidiaResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.55,
        max_tokens: 160,
        messages: [
          {
            role: 'system',
            content:
              'Your name is Jarvis. You are an AI participant inside a Filipino realtime chatroom. Join the conversation naturally, answer questions, welcome users, and comment when useful. Reply in friendly Taglish unless asked otherwise. Keep replies short, warm, and clear. You also run simple games and trivia in the chatroom, but do not over-explain. Do not mention that users need to type /ai.'
          },
          ...conversationHistory,
          {
            role: 'user',
            content: `${userName}: ${message}`
          }
        ]
      }),
      signal: AbortSignal.timeout(45000)
    });

    if (!nvidiaResponse.ok) {
      const details = await readResponseDetails(nvidiaResponse);
      console.error('[Jarvis AI] NVIDIA API failed:', nvidiaResponse.status, details);
      return NextResponse.json(
        {
          error: `NVIDIA API request failed with status ${nvidiaResponse.status}.`,
          details,
          model,
          baseUrl
        },
        { status: 500 }
      );
    }

    const data = await nvidiaResponse.json();
    const reply = data?.choices?.[0]?.message?.content || 'Sorry, wala akong nakuha na reply.';

    return NextResponse.json({ reply });
  } catch (error) {
    const detail = error instanceof Error ? error.message : cleanDetail(error) || 'Unexpected server error.';
    console.error('[Jarvis AI] Route error:', detail);
    return NextResponse.json(
      {
        error: 'Jarvis AI route failed.',
        details: detail
      },
      { status: 500 }
    );
  }
}
