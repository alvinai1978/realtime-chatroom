# Realtime Chatroom Jarvis v14

Messenger-style realtime chatroom gamit ang Next.js, Vercel, Supabase Realtime, NVIDIA AI, at Jarvis-hosted Bingo.

## New in v14

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
git commit -m "Add full Bingo admin features"
git push
vercel --prod
```

## Notes

This version keeps using the existing `messages`, `user_scores`, and `score_events` setup. Some admin actions are stored as event messages for realtime sync and audit history.
