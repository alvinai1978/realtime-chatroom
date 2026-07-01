# Realtime Chatroom with Jarvis V11

Next.js + Supabase Realtime + NVIDIA AI chatroom with Messenger-style UI, Jarvis games, trivia, join/left notifications, all-time scoring, top-score confetti, and anti-dummy participant rules.

## V11 update

Added:

- Required participant name before the message box can be used.
- No more automatic `Guest` name for first-time users.
- Duplicate online names are automatically renamed with suffixes like `Juan 1`, `Juan 2`, `Juan 3`.
- Reserved names are blocked: `Jarvis`, `System`, `Guest`, `Admin`, `Administrator`, and `Moderator`.
- Anti-dummy rules and actions card in the sidebar.
- Join/left activity still appears in the chat for visibility.
- User list click now highlights the participant only; sending is locked to the confirmed logged-in name to reduce impersonation.

## Previous features included

- Messenger-style UI.
- User list with scrollbar.
- Unique username colors.
- Jarvis automatic chat replies.
- Jarvis game every 2 minutes.
- Jarvis reveals answer after 1 minute if nobody answers correctly.
- Random trivia every 5 minutes.
- Welcome message for newly joined users.
- Join/left notifications.
- Score system for first correct answer.
- Persistent all-time scoreboard using Supabase.
- Confetti when there is a new or higher top score.

## Important Supabase step

If you already ran the V9/V10 `repair.sql`, no new SQL is required for V11.

If your scoreboard is not working yet, run this in Supabase SQL Editor:

```sql
-- copy and run supabase/repair.sql
```

The repair script safely adds or updates:

- `messages` table columns for Jarvis events
- `user_scores` table
- `score_events` table
- `award_score_once()` function
- scoreboard read policy
- realtime publication for messages and user scores

Safe ito kahit existing na yung old tables mo.

## Local run

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment variables

Create `.env.local` or `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

NVIDIA_API_KEY=your-nvidia-api-key
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=meta/llama-3.1-8b-instruct
```

Do not upload `.env.local` or `.env` to GitHub.

## Updating existing project

Replace these from the ZIP:

- `app/`
- `README.md`

Optional lang palitan ang `supabase/` kung updated ka na sa V9/V10 SQL.

Do not delete:

- `.env`
- `.env.local`
- `.git/`
- `node_modules/`

Then restart:

```powershell
CTRL + C
npm run dev
```

## Deploy update

After testing locally:

```powershell
git add .
git commit -m "Add required names and anti-dummy rules"
git push
```

Vercel will redeploy automatically if connected to GitHub.
