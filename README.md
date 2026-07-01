# Realtime Chatroom: Vercel + Supabase + NVIDIA AI

Ito ay demo realtime chatroom gamit ang:

- Next.js App Router for Vercel hosting
- Supabase Postgres + Realtime for live messages
- NVIDIA NIM/OpenAI-compatible Chat Completions endpoint for optional AI replies

## Features

- Realtime public chatroom
- Guest display name saved in browser localStorage
- Online presence count
- `/ai your question` command para magtanong sa NVIDIA AI
- Mobile-friendly UI

## 1. Create Supabase project

1. Go to Supabase and create a new project.
2. Open **SQL Editor**.
3. Paste and run `supabase/schema.sql`.
4. Go to **Project Settings > API** and copy:
   - Project URL
   - anon public key

## 2. Create local env file

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NVIDIA_API_KEY=your-nvidia-api-key
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=meta/llama-3.1-70b-instruct
```

## 3. Run locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## 4. Deploy to Vercel

1. Push this folder to GitHub.
2. Import the repo in Vercel.
3. Add the same environment variables in **Vercel Project Settings > Environment Variables**.
4. Deploy.

## Usage

Normal chat:

```text
Hello everyone!
```

Ask AI:

```text
/ai gumawa ka ng short marketing caption para sa laundry POS system
```

## Important security note

The Supabase SQL policies here are for demo only. Anyone with the anon key can read and insert messages. For production, add real authentication and stricter RLS policies.
