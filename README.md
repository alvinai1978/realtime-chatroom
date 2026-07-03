# Realtime Chatroom Jarvis v13.6

Messenger-style realtime chatroom gamit ang Next.js, Vercel, Supabase Realtime, NVIDIA AI, and Jarvis-hosted Bingo.

## New in v13.6

- BingoTV layout redesigned to match a 75-inch Smart TV monitor view.
- BingoTV now fits the whole 16:9 screen without page scrollbar on TV/desktop resolutions.
- Layout is split into: left host/title/patterns/stats, center latest calls/master board, and right animated current call/winner verification report.
- Current Bingo call remains colorful and animated.
- Master board, 3 patterns, latest calls, eligible players, call count, and winner report stay visible at the same time.

## Admin

- Admin name: `Ripple`
- Admin password: `rip123`
- Only verified Ripple can see BingoTV and admin controls.

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
git commit -m "Improve BingoTV 75 inch monitor layout"
git push
vercel --prod
```
