# NIVA 2.0 — BPSC Nexus Tutor

Production-oriented Telegram tutor foundation with Supabase persistence and OpenAI-powered tutoring.

## Setup
1. Create a Telegram bot using @BotFather.
2. Create a Supabase project.
3. Run `supabase_schema.sql` in Supabase SQL Editor.
4. Copy `.env.example` to `.env`.
5. Add BOT_TOKEN, OPENAI_API_KEY, OPENAI_MODEL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_IDS.
6. Run `npm install && npm start`.

## Render
Create a Web Service:
- Build: `npm install`
- Start: `npm start`
- Add the environment variables.

## Question bank
Insert rows into `questions`:
- id
- exam
- subject
- topic
- question
- options (JSON array)
- answer (zero-based integer)
- explanation
- source

Example:
`["Article 14","Article 19","Article 32","Article 44"]`
with `answer = 2`.

## Important
Do not put your Supabase service-role key or Telegram bot token into frontend code or GitHub. Keep them in environment variables.

## NIVA personality
NIVA is a tutor first, friend second, roaster third. Roasting targets mistakes, never personal/sensitive traits. She adapts Hinglish naturally and prioritizes verified exam facts.
