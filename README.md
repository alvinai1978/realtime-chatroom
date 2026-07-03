# Realtime Chatroom Jarvis v13.3

Messenger-style realtime chatroom gamit ang Next.js, Vercel, Supabase Realtime, at NVIDIA AI.

## New in v13.3

- Added admin-only **BingoTV** button for **Ripple**.
- BingoTV opens a separate monitor/Smart TV screen using `?bingoTV=1`.
- BingoTV shows full-screen round details: current call, Bingo Call #, 3 winning patterns, master called-number board, eligible players, and winner verification report.
- Added sound effect when Jarvis calls a new Bingo number.
- Added sound effect when confetti/top-score celebration appears.
- Users cannot see the BingoTV button; only the admin name `Ripple` can access it from the chatroom UI.
- Start Bingo is admin-controlled by Ripple.

## Existing v13.2 Features

- Jarvis-hosted Bingo mode with auto-hidden side card drawer.
- Bingo pauses Jarvis trivia and question games while active.
- Jarvis announces 3 winning patterns, calls 75-ball Bingo numbers, and verifies BINGO claims.
- Verified Bingo winner gets +50 score automatically.
- Latecomers cannot join an already-started Bingo round.
- Leave Bingo button for users who want to exit the current Bingo card.
- Chatroom Logout button to clear the current participant session.
- Bingo mark color options with translucent marks so card numbers remain visible.

## Core Features

- Required participant name bago makapag-chat.
- Duplicate names auto-add 1, 2, 3, and so on.
- Reserved names like Jarvis, System, Guest, Admin are blocked.
- Jarvis automatically joins the conversation.
- Jarvis asks games every 2 minutes and reveals the answer after 1 minute.
- Jarvis posts random trivia every 5 minutes.
- User score system with all-time top score.
- Confetti celebration for top scorer.
- Join and left notifications.

## BingoTV Usage

1. Login sa chatroom using the exact admin name:

```text
Ripple
```

2. Start Bingo from the Bingo drawer.
3. Click the **BingoTV** button in the chatroom top bar.
4. A separate BingoTV screen opens for another monitor or Smart TV.
5. On the TV screen, click **Enable Sounds** if the browser blocks autoplay audio.
6. Click **Fullscreen** for TV display.

Note: Browser autoplay rules may block sounds until someone clicks the page. The Enable Sounds button unlocks the audio context.

## Supabase

Run this in Supabase SQL Editor if hindi mo pa na-run ang latest database update:

```text
supabase/repair.sql
```

No new table is required for v13.3. BingoTV reads the existing `messages`, `user_scores`, and Realtime events.

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

Manual deploy option:

```bash
vercel --prod
```
