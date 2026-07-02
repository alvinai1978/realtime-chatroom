# Realtime Chatroom Jarvis v13.2

Messenger-style realtime chatroom gamit ang Next.js, Vercel, Supabase Realtime, at NVIDIA AI.

## New in v13.2

- Mas compatible sa cellphone at tablet.
- Mas malaking visible chat area para mas maraming messages ang kita.
- Fixed/stable ang message box sa baba ng chat panel.
- Scrollable pa rin ang user list kapag dumami ang participants.
- Hindi na paulit-ulit agad ang game questions ni Jarvis.
- Mas marami nang question bank si Jarvis.
- Fixed duplicate Jarvis AI reply issue.
- Added Jarvis-hosted Bingo mode with auto-hidden side card drawer.
- Bingo pauses Jarvis trivia and question games while active.
- Jarvis announces 3 winning patterns, calls 75-ball Bingo numbers, and verifies BINGO claims.
- Verified Bingo winner gets +50 score automatically.
- Added Leave Bingo button for users who want to exit the current Bingo card.
- Added Chatroom Logout button to clear the current participant session.
- Added Bingo mark color options with translucent marks so card numbers remain visible.

## Features

- Required participant name bago makapag-chat.
- Duplicate names auto-add 1, 2, 3, and so on.
- Reserved names like Jarvis, System, Guest, Admin are blocked.
- Jarvis automatically joins the conversation.
- Jarvis asks games every 2 minutes and reveals the answer after 1 minute.
- Jarvis posts random trivia every 5 minutes.
- User score system with all-time top score.
- Confetti celebration for top scorer.
- Join and left notifications.
- Optional Bingo participation with generated B-I-N-G-O cards, translucent custom-color marks, called-number board, Leave Bingo, and BINGO claim verification.

## Supabase

Run this in Supabase SQL Editor if hindi mo pa na-run ang latest database update:

```text
supabase/repair.sql
```

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

## Deploy to Vercel

Push to GitHub, then redeploy in Vercel. Make sure the same environment variables are added in Vercel Project Settings.
