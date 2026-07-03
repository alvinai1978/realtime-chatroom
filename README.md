# Realtime Chatroom Jarvis v14.5

Messenger-style realtime chatroom gamit ang Next.js, Vercel, Supabase Realtime, NVIDIA AI, at Jarvis-hosted Bingo.

## New in v14.5

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
git add app/page.tsx app/globals.css README.md
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
