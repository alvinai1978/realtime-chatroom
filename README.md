# RIPPLE Jarvis Realtime Chatroom - v15.11 ElevenLabs Buffered TTS Debug Fix

This update changes `/api/tts` from ElevenLabs streaming proxy mode to a buffered MP3 conversion mode for better Vercel and LG webOS compatibility. It also adds debug mode so POST errors return clear JSON instead of a silent 502.

Debug test:

```powershell
curl.exe -i -X POST "https://YOUR-PRODUCTION-DOMAIN/api/tts?debug=1" -H "Content-Type: application/json" -d "{\"text\":\"Call number one. B, twelve.\",\"debug\":true}"
```

Normal MP3 test:

```powershell
Invoke-WebRequest `
  -Uri "https://YOUR-PRODUCTION-DOMAIN/api/tts" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"text":"Call number one. B, twelve."}' `
  -OutFile eleven-test.mp3
Start-Process .\eleven-test.mp3
```

---

# Realtime Chatroom Jarvis v15.10

Messenger-style realtime chatroom gamit ang Next.js, Vercel, Supabase Realtime, NVIDIA AI, Jarvis-hosted Bingo, MP3 music, and webOS TV-safe voice playback.


## New in v15.10 - ElevenLabs Strict Voice Fix

- Jarvis Voice now forces server MP3 / ElevenLabs voice mode on all devices.
- Removed silent browser `speechSynthesis` fallback during cloud TTS mode.
- If ElevenLabs is not configured or fails, the app shows `ElevenLabs not active` instead of playing normal browser TTS.
- Added `GET /api/tts` diagnostics. It returns whether `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` are present without exposing the actual secrets.
- The TTS route adds `x-ripple-tts-provider: elevenlabs` on successful MP3 responses.

### ElevenLabs diagnostic test

After deploy, open this in the browser:

```text
https://YOUR-APP.vercel.app/api/tts
```

It should show:

```json
{
  "provider": "elevenlabs",
  "configured": true,
  "hasApiKey": true,
  "hasVoiceId": true
}
```

If `configured` is false, re-add the Vercel environment variables and redeploy.

## New in v15.9 - webOS TV TTS Compatibility

- Added webOS TV detection for LG TV browsers / WebAppManager / Smart TV user agents.
- Added **webOS TV audio mode** so Jarvis can read Bingo calls without depending only on `window.speechSynthesis`.
- Added `app/api/tts/route.ts`, a server-side TTS bridge that returns MP3 audio for TV playback.
- The TTS bridge uses ElevenLabs when these Vercel env vars are configured:
  - `ELEVENLABS_API_KEY`
  - `ELEVENLABS_VOICE_ID`
  - optional: `ELEVENLABS_MODEL_ID=eleven_multilingual_v2`
- Added optional static MP3 voice-pack support at:
  - `public/voices/bingo-en/b-1.mp3` through `public/voices/bingo-en/o-75.mp3`
- On webOS mode, the app uses one shared audio element for voice/music to avoid LG TV audio conflicts.
- When Jarvis speaks a called number, background music pauses/ducks, then resumes after the voice.
- If ElevenLabs env vars are missing and no MP3 voice pack exists, the app shows a clear status message instead of silently failing.

### v15.9 Vercel env for cloud TTS

```powershell
vercel env add ELEVENLABS_API_KEY production
vercel env add ELEVENLABS_VOICE_ID production
vercel env add ELEVENLABS_MODEL_ID production
```

Recommended model value:

```env
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
```

Then redeploy:

```powershell
vercel --prod
```

### Optional MP3 voice pack naming

```text
public/voices/bingo-en/b-1.mp3 ... b-15.mp3
public/voices/bingo-en/i-16.mp3 ... i-30.mp3
public/voices/bingo-en/n-31.mp3 ... n-45.mp3
public/voices/bingo-en/g-46.mp3 ... g-60.mp3
public/voices/bingo-en/o-61.mp3 ... o-75.mp3
```

## New in v15.8

- Added optional MP3 background music while Bingo is running.
- New **Bingo Music / Play Music** button in the chat topbar and BingoTV.
- Ripple admin gets a **Choose MP3** button inside the Sound Control Panel for quick local testing.
- Default deployed music file path is `public/bingo-music.mp3`. Add your own MP3 there, then deploy.
- Added separate `music` volume slider. Default background music volume is low so Jarvis called numbers remain clear.
- Music automatically ducks lower while Jarvis reads a called number, then returns to the selected music volume.
- Music pauses when no Bingo round is active and resumes when the next round starts if Music is enabled.

### How to add your MP3 permanently

Put your MP3 here:

```text
D:\realtime-chatroom\public\bingo-music.mp3
```

Then deploy:

```powershell
git add public/bingo-music.mp3 app/page.tsx app/globals.css README.md
git commit -m "Add Bingo background music"
git push
vercel --prod
```

## New in v15.7

- Full Ripple-only Admin Control Panel.
- Admin buttons: Start Bingo, End Bingo, Reset Calls, Reset Scores display, Kick User, Mute/Unmute User, Clear Chat, and View Winners.
- Bingo Round Settings before start:
  - call speed: 5 sec / 8 sec / 10 sec
  - number of patterns: 1 / 2 / 3
  - prize name
  - winner limit
  - allow/disallow late joiners
- Bingo History / Winner Records with name, round ID, pattern won, time, +50 score, and Jarvis verification result.
- Player Card Viewer for Ripple admin.
- Anti-cheat protections:
  - users cannot mark numbers that Jarvis has not called
  - late joiners can be locked out
  - invalid BINGO claims are reported to admin/BingoTV
  - users cannot claim if they are not eligible or not joined
- BingoTV QR code for players to scan and join.
- Sound Control Panel for new call, winner, invalid claim, confetti, and countdown sounds.
- Round countdown animation before Bingo starts.
- Animated Bingo number draw machine on BingoTV.
- User Profile + Avatar + profile color.
- Jarvis Voice button with browser speech output for Jarvis messages and Bingo calls.
- Jarvis browser speech now uses English-style Bingo call reading.
- Jarvis fallback speech uses `en-US`, steady rate, and lower pitch for a clearer English-style delivery.
- LiveKit voice-room token endpoint at `app/api/livekit-token/route.ts`.
- LiveKit credentials stay server-side in environment variables; never place API secret in browser code.

- Player multi-card options:
  - users can choose 1 to 4 Bingo cards maximum
  - mobile layout shows 2 cards per row for a compact view
  - users can use random cards, same-card mode, or choose a preferred card family
  - card layouts can be changed before the first Bingo call only to prevent cheating
- More colorful B-I-N-G-O card headers per column.

## Admin Login

Use this exact display name:

```text
Ripple
```

Admin password:

```text
rip123
```

Only verified Ripple can see the BingoTV and admin controls.

## Local setup

Create `.env.local` or `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

NVIDIA_API_KEY=your-nvidia-api-key
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=meta/llama-3.1-8b-instruct

LIVEKIT_URL=wss://your-livekit-project.livekit.cloud
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
```

Run:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Deploy

```bash
git add app/page.tsx app/globals.css app/api/livekit-token/route.ts app/api/tts/route.ts package.json tsconfig.json README.md public/voices/bingo-en/PUT_CALL_MP3_HERE.txt
git commit -m "Add webOS TV-safe Jarvis TTS"
git push
vercel --prod
```

## Notes

This version keeps using the existing `messages`, `user_scores`, and `score_events` setup. Some admin actions are stored as event messages for realtime sync and audit history.


## v14.1 BingoTV QR Placement

- Moved the BingoTV QR code to the right-side panel under the Winner Verification Report.
- The QR card now auto-fits inside the fixed 75-inch TV layout.


## v14.2

- Fixed BingoTV QR code visibility under the Winner Verification Report.
- Enlarged the QR code and prevented the Smart TV layout from clipping it.
- Updated QR generation size for sharper scanning on TV screens.

## v14.3 Mobile Controls + Date/Time Update

- Chat message meta now shows full non-military date/time format, for example: `Alvin -Friday 07/3/26 - 5:33pm`.
- On mobile, the Bingo button is moved to the top quick-action bar.
- Added mobile Profile button with Profile + Avatar controls and Users list in a separate panel.
- Added mobile Invite button with QR code in a separate panel.
- Mobile joined view hides the old sidebar content so the chat screen has more space.


## v14.4 Jarvis User-Requested Bingo

- Any normal user can ask Jarvis to start a Bingo game even when Ripple admin is not online.
- Users can type requests like `Jarvis start bingo`, `start bingo`, `pa start ng bingo`, or press **Ask Jarvis to Start Bingo** in the Bingo panel.
- Jarvis starts a default community round with 3 winning patterns, 8-second calls, 1 winner limit, and late joiners locked until the next round.
- Ripple admin controls remain protected by the Ripple password gate; only Ripple can use admin tools, reset controls, BingoTV button, kick/mute, and settings.

## v14.6 Player Ready Setup Phase

- Players can join a Bingo round, configure their cards, then press **Ready** before Jarvis calls the first number.
- Jarvis waits during setup phase and does not draw the first Bingo number until joined players are ready.
- Once a player presses Ready, that player's card setup locks for anti-cheat protection.
- Card settings are still limited to a maximum of 4 cards, with 2 cards per row on mobile.

## v14.7 Called Numbers Fix

- Fixed duplicate called numbers caused by multiple connected clients trying to post the same Bingo call at the same time.
- Bingo call event keys are now deterministic per round and call index, so duplicate calls are skipped by the existing unique event protection.
- The called numbers display now removes duplicate numbers from older rounds/messages while preserving the official call order.
- BingoTV wording was clarified: Latest Call was renamed into clearer labels such as Current Drawn Number, Recent Called Numbers, and Call Count.

## v14.8 Center Star + Admin Pattern Selection

- The center Bingo card square now displays a star symbol: `★` instead of the word `FREE`.
- Ripple can choose the exact winning patterns before starting an admin Bingo round.
- If Ripple leaves the pattern picker empty, Jarvis randomly chooses the required number of patterns.
- Added 10 more pattern options: Top Row, Middle Row, Bottom Row, Left Column, Center Column, Right Column, Letter V, Letter N, Letter U, and Letter Z.
- Player/requested Jarvis community rounds can still auto-pick patterns when no admin selection is used.

## v14.9 Pattern Sync + Star Center Hard Fix

- Fixed admin-selected pattern syncing by storing exact pattern keys inside the Bingo start event.
- If Ripple selects Letter Z, player screens and BingoTV will now read the exact `letter_z` pattern key instead of falling back to a random pattern such as Cross.
- Hard-fixed the Bingo card center value so generated cards use the actual `★` symbol instead of storing or rendering `FREE`.
- Existing old Bingo rounds may still show their old pattern data; start a fresh Bingo round after deploying this update.


## v15.0 Pattern Sync Hard Fix

- Fixed admin-selected pattern mismatch between Ripple admin, players, BingoTV, and verification.
- Exact selected patterns now override random fill. If Ripple selects only Letter Z, the round uses only Letter Z.
- Added machine-readable `[PATTERN_KEYS: ...]` metadata to Bingo start events so every device reads the same official pattern keys.
- Kept center card value as `★` for all generated player cards and admin preview cards.
- Start a fresh new Bingo round after deploy so old round data does not keep the previous pattern list.


## v15.2 Jarvis Male Tagalog Voice

- Jarvis Voice now searches the browser speech voices for Filipino/Tagalog/Philippines voices first, then male-sounding voice names as fallback.
- If the exact Filipino male voice is not installed on the device/TV browser, the app uses `fil-PH` language with lower pitch and slower rate to keep the delivery closer to a male Tagalog accent.
- On some Smart TVs and phones, available voices depend on the device/browser voice packs. Install or enable Filipino/Tagalog voice packs when available for best result.

## Jarvis Voice / LiveKit Notes

- Click **Jarvis Voice** or **Enable Sounds** on BingoTV to allow browser audio.
- Browser autoplay rules require a user click before speech/audio starts.
- The included LiveKit token route prepares the app for a LiveKit voice room. A separate LiveKit Agent/TTS worker can join the same room later for true server-side Jarvis voice.
- The current app also uses browser SpeechSynthesis so Jarvis can speak immediately on the device where voice is enabled.
- Keep `LIVEKIT_API_SECRET` only in `.env.local` and Vercel Environment Variables. Do not commit or paste it in client files.

## v15.3 Real LiveKit Jarvis Voice Agent

This update adds a separate `jarvis-voice-agent/` worker. The browser connects to LiveKit and subscribes to remote agent audio, while the agent itself speaks Jarvis/Bingo messages using LiveKit Agents + LiveKit Inference TTS.

Files added:

```text
jarvis-voice-agent/package.json
jarvis-voice-agent/src/agent.ts
jarvis-voice-agent/.env.example
jarvis-voice-agent/README.md
```

Run the voice agent separately:

```powershell
cd D:\realtime-chatroom\jarvis-voice-agent
npm install
copy .env.example .env
notepad .env
npm run connect
```

Then open the app or BingoTV and click `Jarvis Voice` once to allow audio playback.

## v15.4 Jarvis Tagalog Agent Speech Fix

The `jarvis-voice-agent` now rewrites Jarvis/Bingo messages into Tagalog/Taglish before speaking through LiveKit TTS. Bingo calls are spoken in Filipino style, for example: `Bi, labing dalawa. Ulitin ko, Bi, labing dalawa.` Countdown, winner reports, invalid claims, and Bingo start/end messages are also converted to Tagalog-friendly speech.

Set this in `jarvis-voice-agent/.env`:

```env
JARVIS_FORCE_TAGALOG=true
```


## v15.5 Voice Agent Env Fix

- The Jarvis voice agent now passes LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET directly into WorkerOptions.
- Added clearer missing-env error messages for the local voice agent.
- Fixed TypeScript typing in jarvis-voice-agent/src/agent.ts so the agent folder can build separately.

Run the agent from the correct folder:

```powershell
cd D:\realtime-chatroom\jarvis-voice-agent
npm install
npm run connect
```


## v15.6 Browser Voice Called Numbers Fix

- LiveKit voice is no longer forced for Bingo speech because browser/device audio is more reliable for the current setup.
- The **Jarvis Voice** button now activates local browser speech and keeps reading every official Bingo called number.
- Bingo calls are spoken in Tagalog style, for example: `Tawag bilang isa. Bi, labing dalawa. Ulitin ko, Bi, labing dalawa.`
- When voice is enabled during an active round, Jarvis also reads the latest called number so the host/player can confirm audio is working.
- The optional `jarvis-voice-agent/` folder may remain in the project, but it is no longer required for called-number speech.


## v15.7 English Voice Called Numbers

- Changed Jarvis browser voice from Tagalog-style to English-style Bingo reading.
- Example call: `Call number one. B, twelve. I repeat, B, twelve. Mark it if it is on your card.`
- Countdown, Bingo start, reset calls, winner, and invalid claim voice lines are now English-friendly.
- Browser voice now prefers English voices when available and falls back to `en-US`.

## v15.12 Tagalog Bingo Jokes + Wait-for-Voice Calls

- Bingo voice lines are now Tagalog/Taglish.
- Every Bingo called number includes a short Pinoy Bingo joke from Jarvis.
- Jarvis waits for the current voice line/joke to finish before the next called number is posted.
- Background music still ducks while Jarvis speaks.
- ElevenLabs/cloud TTS remains the preferred voice output, with MP3 voice pack support still available.

Example voice line:

> Tawag bilang isa. B, labing dalawa. Ulitin ko, B, labing dalawa. Markahan kung nasa card ninyo. Relax lang mga ka-Bingo, hindi ito exam, pero bawal mangopya ng card ng katabi.
