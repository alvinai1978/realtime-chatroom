# RIPPLE Jarvis Realtime Chatroom - v15.27 LiveKit Participant Gate Fix

This package switches Jarvis voice back to **LiveKit Agent mode**.

## What changed in v15.27

- **Participant gate fix:** hindi na magsisimula ang voice session hangga't wala pang app/BingoTV participant sa LiveKit room. Ito ang main fix sa repeated `AgentSession is not running`.
- **Bingo-only default:** hindi na babasahin ang trivia/game/random Jarvis messages by default. Bingo events lang para hindi ma-stuck sa non-Bingo message habang naghihintay ng session.
- **No infinite queue loop:** kapag hindi pa rin masalita after retries, ise-skip ang message para hindi paulit-ulit sa same message forever.
- **Session start cleanup:** uses the official AgentSession start flow and waits briefly before greeting/polling.
- Jarvis Voice now connects to the **LiveKit room** instead of using Azure, ElevenLabs, Microsoft browser TTS, or normal browser TTS.
- The included `jarvis-voice-agent/` uses **LiveKit Inference + Cartesia Sonic 3.5**.
- Default language is set to `tl` for Tagalog.
- Default model is `cartesia/sonic-3.5`.
- Default voice ID is set in `.env.example` so you can run immediately and then change later if you find a better LiveKit/Cartesia voice.
- Bingo call format is fixed:
  - First call: `Eto na ang unang numero. N, thirty four, number 34. I repeat, N, thirty four, number 34. [Pinoy Bingo joke]`
  - Regular calls: `The next number is B, eight, number 8. I repeat, B, eight, number 8. [Pinoy Bingo joke]`
  - Last call: `Eto na ang huling numero pang 75 na bola ay B, ten, number 10. I repeat, B, ten, number 10. [Pinoy Bingo joke]`
- The app waits based on the estimated Jarvis speech time before calling the next Bingo number.
- No Azure/ElevenLabs API key is needed for the LiveKit agent TTS path.

## Replace these files

```text
page.tsx                         -> app/page.tsx
globals.css                      -> app/globals.css
README.md                        -> README.md
package.json                     -> package.json
tsconfig.json                    -> tsconfig.json
app/api/livekit-token/route.ts   -> app/api/livekit-token/route.ts
app/api/tts/route.ts             -> app/api/tts/route.ts
public/                          -> public/
scripts/                         -> scripts/
jarvis-voice-agent/              -> jarvis-voice-agent/
```

## Deploy the Next.js app

```powershell
cd D:\realtime-chatroom
npm install
npm run build

git add app/page.tsx app/globals.css app/api/livekit-token/route.ts app/api/tts/route.ts package.json tsconfig.json README.md public scripts jarvis-voice-agent
git commit -m "Fix LiveKit Jarvis session not running loop"
git push
vercel --prod
```

## Required Vercel env for the web app

The app still needs LiveKit token generation:

```powershell
vercel env add LIVEKIT_URL production
vercel env add LIVEKIT_API_KEY production
vercel env add LIVEKIT_API_SECRET production
vercel --prod
```

`LIVEKIT_URL` example:

```text
wss://your-project.livekit.cloud
```

Keep `LIVEKIT_API_SECRET` server-side only.

## Correct run order

```powershell
cd D:\realtime-chatroom\jarvis-voice-agent
npm install
copy .env.example .env
notepad .env
```

Important order:

1. Start the agent first with `npm run connect`.
2. Open app/BingoTV.
3. Click **Jarvis Voice** so the browser joins the LiveKit room.
4. The agent will then start the session and speak.
5. Start Bingo.

The agent now waits for a participant using `ctx.waitForParticipant()`, so it should not spam `AgentSession is not running` before the TV/browser joins.

Fill in:

```env
LIVEKIT_URL=wss://your-livekit-project.livekit.cloud
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key

JARVIS_AGENT_ROOM=main-room
JARVIS_AGENT_POLL_MS=900

JARVIS_TTS_MODEL=cartesia/sonic-3.5
JARVIS_TTS_LANGUAGE=tl
JARVIS_TTS_VOICE_ID=9626c31c-bec5-4cca-baa8-f8ba9e84c8bc
JARVIS_TTS_SPEED=0.95
JARVIS_TTS_VOLUME=1.15
JARVIS_TTS_EMOTION=excited

JARVIS_MAX_TEXT_CHARS=360
JARVIS_SAY_RETRY_COUNT=10
JARVIS_SAY_RETRY_MS=900
JARVIS_AFTER_SPEAK_PAUSE_MS=350
```

Then run:

```powershell
npm run connect
```

Keep that PowerShell window open while Bingo is running.

## Test

1. Open the deployed chatroom or BingoTV.
2. Click **Jarvis Voice**.
3. Make sure the PowerShell window says the agent is registered, connected, and shows `LiveKit Inference TTS options`.
4. Start Bingo.
5. Jarvis should speak through LiveKit, in Tagalog/Taglish style.

## Change voice later

If the default voice does not sound good enough, replace only this value in `jarvis-voice-agent/.env`:

```env
JARVIS_TTS_VOICE_ID=your-better-livekit-cartesia-voice-id
```

Restart the agent:

```powershell
Ctrl + C
npm run connect
```

## Notes

- LiveKit Inference does not require a separate Cartesia API key.
- Usage and limits are handled in your LiveKit Cloud project.
- If you hear no voice, check that:
  - The web app has LiveKit env vars in Vercel production.
  - `jarvis-voice-agent` is running.
  - The `.env` file has Supabase URL/key so the agent can read messages.
  - You clicked **Jarvis Voice** in the app or BingoTV.


## v15.26 troubleshooting

If you see:

```text
Polling skipped: AgentSession is not running
```

v15.26 will keep the speech message in queue and retry instead of losing it. Still use a clean restart when changing env values:

```powershell
Get-Process node | Stop-Process -Force
cd D:\realtime-chatroom\jarvis-voice-agent
npm run connect
```

Wait for `Connect callback received` and `LiveKit Inference TTS options`, then open BingoTV/chatroom and click **Jarvis Voice**.
