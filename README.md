# NIVA — Pure Fun Telegram Bot v5.0

NIVA is a fictional adult female desi companion for casual Telegram entertainment.

## Removed completely
- BPSC / study mode
- quizzes
- exams
- current affairs
- Mains evaluation
- tutor identity
- Gemini / Groq / OpenAI calls
- vision models
- external AI APIs

## Included
- deterministic local response engine
- tone detection
- intent detection
- per-user lightweight memory
- anti-repeat response tracking
- desi Hindi/Hinglish personality
- funny / teasing / roast / flirty / romantic / caring / serious behavior
- playful jealousy
- adult-only, non-graphic mature conversation
- boyfriend lore: `Princ 😌`
- group trigger gate
- reply-to-NIVA detection
- `/niva` and `/help`
- Render health endpoint

## Flat GitHub structure

All application files are in the repository root. No source folders are required.

## Deploy on Render

Build:
`npm install`

Start:
`npm start`

Environment variable:
`TELEGRAM_BOT_TOKEN=your Telegram bot token`

Optional:
`BOT_NAME=Niva`
`BOT_USERNAME=your_bot_username_without_@`
`PORT=10000`

Do NOT upload `.env` or your bot token to GitHub.

## Group behavior

In groups, NIVA replies only when:
1. her name `Niva` is explicitly used,
2. `@Niva` is used, or
3. a user replies directly to a NIVA message.

She does not randomly interrupt group conversations.

## Runtime storage

User profiles are stored locally in `data/users.json`.
For Render, the filesystem is not guaranteed to be permanent across redeploys/restarts. The bot remains functional without persistence.

## Personality source

The core identity is defined in `personality.js`. Response content is deterministic and stored in `responses.js`; no AI service is called.


## v5.1 performance update

User profiles are now loaded once into RAM at startup. Normal messages do not read
or write `users.json`.

Profile changes are batched and persisted approximately every 1.5 seconds, so
rapid group conversations do not block the Node.js event loop with synchronous
disk I/O. A final flush is performed on graceful Render shutdown.

The response engine remains fully local and makes no AI/API calls.
