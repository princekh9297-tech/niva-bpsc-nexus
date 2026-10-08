# NIVA v3 migration

## What changed
- Added `src/niva-core.js`: deterministic local personality/chat engine.
- Normal short interactions are handled without an LLM API call.
- Added modes: study, roast, fun, love, flirt, mature, caring, strict, random.
- Added intensity: soft, normal, bold, intense.
- Added local anti-repetition memory for recent responses.
- Added `/mode` and `/intensity` commands.
- Added Supabase profile fields: `niva_mode`, `niva_level`, `niva_mood`.
- Existing quiz, attempts, revision bank, progress, admin, group trigger and Mains evaluator are retained.
- Complex academic requests still fall through to the existing Groq text layer.
- Mains image evaluation remains AI/vision powered.

## Supabase
Run the new `supabase_schema.sql` once. It uses `ADD COLUMN IF NOT EXISTS`, so it is safe for an existing `profiles` table.

## Render
The supplied Render configuration has been aligned with the variables actually used by the current source:
- `TELEGRAM_BOT_TOKEN`
- `GROQ_API_KEY`
- `GROQ_TEXT_MODEL`
- `GROQ_VISION_MODEL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_IDS`

Keep secret values in Render environment variables, not in GitHub.

## Adult/mature mode
`mature` is an opt-in private-chat personality mode for non-explicit adult romance/flirting. It is blocked in group chats by the core engine. It does not replace or bypass the study/academic fallback.

## Commands
- `/mode` — show modes
- `/mode love`
- `/mode flirt`
- `/mode mature`
- `/mode study`
- `/intensity` — show intensity levels
- `/intensity bold`
