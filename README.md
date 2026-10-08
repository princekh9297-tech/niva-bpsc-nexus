# NIVA v4 — Flat Deploy

AI-free, local, desi Telegram fun chatbot. No Gemini, Groq or OpenAI required.

## Render
Build command: `npm install`
Start command: `npm start`

Required environment variable:
`TELEGRAM_BOT_TOKEN`

Optional Supabase persistence:
`SUPABASE_URL`
`SUPABASE_SERVICE_ROLE_KEY`

If Supabase variables are omitted, NIVA uses in-memory storage and still runs.

## GitHub structure
All application files are in the repository root. No `src` folder is required.

## Commands
`/start`
`/mode auto|fun|roast|love|flirt|mature|caring|strict|random`
`/intensity soft|normal|bold|intense`
`/help`

In groups, NIVA replies when her name is mentioned, she is @mentioned, or a message replies to her.
