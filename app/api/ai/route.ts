import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type ChatRequest = {
  message?: string;
  room?: string;
  userName?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;
    const message = String(body.message || '').trim();
    const userName = String(body.userName || 'Guest').trim().slice(0, 40);

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    if (!process.env.NVIDIA_API_KEY) {
      return NextResponse.json(
        { error: 'Missing NVIDIA_API_KEY in environment variables.' },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
    const model = process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct';

    const nvidiaResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 400,
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful AI assistant inside a Filipino realtime chatroom. Reply in friendly Taglish unless the user asks otherwise. Keep answers clear and not too long.'
          },
          {
            role: 'user',
            content: `${userName} asked: ${message}`
          }
        ]
      })
    });

    if (!nvidiaResponse.ok) {
      const errorText = await nvidiaResponse.text();
      return NextResponse.json(
        { error: 'NVIDIA API request failed.', details: errorText },
        { status: nvidiaResponse.status }
      );
    }

    const data = await nvidiaResponse.json();
    const reply = data?.choices?.[0]?.message?.content || 'Sorry, wala akong nakuha na reply.';

    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected server error.' },
      { status: 500 }
    );
  }
}
