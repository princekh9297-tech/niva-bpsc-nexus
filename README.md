# NIVA v4 — Desi Fun Chatbot

A Telegram-only, local personality chatbot designed for a small private group.

## Core design

NIVA is tone-first:

1. Trigger gate — private chat, NIVA's name/mention, or reply to NIVA.
2. Tone detection — casual, funny, teasing, roast, flirty, romantic, mature, caring, sad, angry, serious.
3. Intent detection — chat, roast, identity, boyfriend, settings.
4. User context — recent NIVA exchanges and preferences.
5. Response selection — desi response pools + anti-repetition.
6. Reply.

## Modes

auto, fun, roast, love, flirt, mature, caring, strict, random

## Intensity

soft, normal, bold, intense

The local engine does not call Gemini, Groq, OpenAI, or any other AI API.

The mature layer is limited to adult-oriented, romantic, flirtatious and suggestive-but-non-graphic conversation. It is not a graphic sexual-content generator.

## Telegram behavior

In groups, NIVA replies only when her name/mention is used or someone replies directly to one of her messages. In private chats, ordinary messages receive replies.

## Deploy on Render

Build command: `npm install`
Start command: `npm start`

Required environment variable:
`TELEGRAM_BOT_TOKEN`

Optional persistent memory:
`SUPABASE_URL`
`SUPABASE_SERVICE_ROLE_KEY`

Run `supabase_schema.sql` once if using Supabase.
