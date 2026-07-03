# Realtime Chatroom Jarvis v15.2

Messenger-style realtime chatroom gamit ang Next.js, Vercel, Supabase Realtime, NVIDIA AI, at Jarvis-hosted Bingo.

## New in v15.2

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
- Jarvis browser speech now prefers a male Tagalog/Filipino voice when available.
- Jarvis fallback speech uses `fil-PH`, slower rate, and lower pitch for a more male Tagalog-style delivery.
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
git add app/page.tsx app/globals.css app/api/livekit-token/route.ts package.json README.md
git commit -m "Add player multi card Bingo options"
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
