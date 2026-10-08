require("dotenv").config();

const http = require("http");
const { Telegraf } = require("telegraf");
const { handleMessage } = require("./engine");
const { getUser, updateUser, flushNow } = require("./storage");

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_NAME = process.env.BOT_NAME || "Niva";
const PORT = Number(process.env.PORT || 10000);

if (!TOKEN) {
  console.error("Missing TELEGRAM_BOT_TOKEN");
  process.exit(1);
}

const bot = new Telegraf(TOKEN);

function isGroup(ctx) {
  return ["group", "supergroup"].includes(ctx.chat?.type);
}

function normalize(s = "") {
  return String(s).trim();
}

function containsNivaName(text = "") {
  // Word boundary: niva should not trigger inside unrelated words.
  return /(^|[^\p{L}\p{N}_])niva($|[^\p{L}\p{N}_])/iu.test(text);
}

function mentionedBot(ctx, text) {
  const entities = ctx.message?.entities || [];
  const mentionEntity = entities.some(e => e.type === "mention");
  if (mentionEntity && /@niva\b/i.test(text)) return true;
  return containsNivaName(text);
}

function repliedToNiva(ctx) {
  const reply = ctx.message?.reply_to_message;
  const me = ctx.botInfo;
  return Boolean(reply?.from?.id && me?.id && reply.from.id === me.id);
}

function shouldReply(ctx, text) {
  if (!isGroup(ctx)) return true;
  return mentionedBot(ctx, text) || repliedToNiva(ctx);
}

function displayName(from) {
  return from?.first_name || from?.username || "yaar";
}

async function replyWithNiva(ctx, rawText) {
  const text = normalize(rawText);
  if (!text) return;

  const uid = String(ctx.from.id);
  const existing = getUser(uid, { name: displayName(ctx.from) });

  const profile = {
    ...existing,
    name: displayName(ctx.from),
    recent: existing.recentReplies || [],
    usedResponseIds: existing.usedResponseIds || []
  };

  const result = handleMessage({ text, profile });

  const newRecent = [...(existing.recentReplies || []), {
    at: Date.now(),
    user: text.slice(0, 500),
    niva: result.text.slice(0, 500)
  }].slice(-12);

  const newUsed = [...(existing.usedResponseIds || []), result.id].slice(-60);

  updateUser(uid, {
    name: displayName(ctx.from),
    interactions: Number(existing.interactions || 0) + 1,
    recentReplies: newRecent,
    usedResponseIds: newUsed,
    lastTone: result.tone,
    lastIntent: result.intent
  });

  await ctx.reply(result.text, {
    reply_parameters: { message_id: ctx.message.message_id }
  });
}

bot.start(async ctx => {
  await ctx.reply(
    "Hii 😌 Main Niva hoon. Pure bakchodi, gossip, flirting aur random chaos ke liye bani hoon. Group mein mera naam lo, phir dekhte hain 😏"
  );
});

bot.command("niva", async ctx => {
  const text = normalize(ctx.message.text.replace(/^\/niva(?:@\w+)?/i, ""));
  await replyWithNiva(ctx, text || "Oye Niva");
});

bot.command("help", async ctx => {
  await ctx.reply("Group mein mujhe @Niva ya Niva bolke bulao, ya meri message ka reply karo 😌");
});

bot.on("text", async ctx => {
  const text = normalize(ctx.message.text);
  if (!shouldReply(ctx, text)) return;

  // Strip a direct Niva mention/name from the beginning for cleaner intent detection.
  const cleaned = text.replace(/^[@]?(niva)\b[\s,:-]*/iu, "").trim() || text;
  await replyWithNiva(ctx, cleaned);
});

bot.catch((err, ctx) => {
  console.error("NIVA error:", err?.message || err, ctx?.update?.update_id);
});

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true, bot: BOT_NAME, mode: "pure-fun-local" }));
  }
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("NIVA is running.");
});

server.listen(PORT, () => console.log(`Health server listening on ${PORT}`));

bot.launch().then(() => {
  console.log(`${BOT_NAME} started — pure fun local engine, no AI API.`);
});

async function gracefulStop(signal) {
  try {
    await flushNow();
  } catch (err) {
    console.error("NIVA final storage flush warning:", err.message);
  }
  bot.stop(signal);
  process.exit(0);
}

process.once("SIGINT", () => gracefulStop("SIGINT"));
process.once("SIGTERM", () => gracefulStop("SIGTERM"));
