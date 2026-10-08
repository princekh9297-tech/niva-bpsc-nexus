import http from "http";
import "dotenv/config";
import { Telegraf } from "telegraf";
import { getUser } from "./storage.js";
import { respond, shouldReply, setMode, setIntensity } from "./engine.js";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("TELEGRAM_BOT_TOKEN is missing.");
const bot = new Telegraf(token);

function isGroup(ctx) { return ctx.chat?.type === "group" || ctx.chat?.type === "supergroup"; }
function textOf(ctx) { return ctx.message?.text || ctx.message?.caption || ""; }
function mentioned(ctx) {
  const text = textOf(ctx); const entities = ctx.message?.entities || ctx.message?.caption_entities || [];
  for (const e of entities) {
    if (e.type === "mention" && text.slice(e.offset, e.offset + e.length).toLowerCase() === "@niva") return true;
    if (e.type === "text_mention" && e.user?.id === bot.botInfo?.id) return true;
  }
  return /\bniva\b/i.test(text);
}
function repliedToNiva(ctx) { return ctx.message?.reply_to_message?.from?.id === bot.botInfo?.id; }

bot.start(async ctx => {
  const u = await getUser(ctx.from.id, ctx.from.first_name || "yaar");
  await ctx.reply(`✦ N I V A ✦\n\nArey ${u.name} 😌\nMain aa gayi. Ab bolo, kya scene hai? 😂\n\nGroup mein mera naam lo ya meri message ko reply karo — tabhi entry maarungi.`);
});

bot.command("mode", async ctx => {
  const arg = textOf(ctx).split(/\s+/)[1]?.toLowerCase() || "auto";
  const ok = await setMode(ctx.from.id, arg);
  await ctx.reply(ok ? `Mode set: ${arg} 😌` : "Modes: auto, fun, roast, love, flirt, mature, caring, strict, random");
});

bot.command("intensity", async ctx => {
  const arg = textOf(ctx).split(/\s+/)[1]?.toLowerCase() || "normal";
  const ok = await setIntensity(ctx.from.id, arg);
  await ctx.reply(ok ? `Intensity set: ${arg} 😏` : "Intensity: soft, normal, bold, intense");
});

bot.command("niva", ctx => ctx.reply("Haan ji? 😌 Naam liya hai toh bolo."));
bot.command("help", ctx => ctx.reply("NIVA commands:\n/mode auto|fun|roast|love|flirt|mature|caring|strict|random\n/intensity soft|normal|bold|intense\n\nYa bas NIVA ko message mein bula lo. 😌"));

bot.on("text", async ctx => {
  try {
    const text = textOf(ctx).trim(); if (!text) return;
    const group = isGroup(ctx);
    if (!shouldReply(text, group, repliedToNiva(ctx))) return;
    const answer = await respond({ id: ctx.from.id, name: ctx.from.first_name || "yaar", text, isGroup: group });
    await ctx.reply(answer, { reply_to_message_id: ctx.message.message_id });
  } catch (e) {
    console.error("NIVA message error:", e);
    await ctx.reply("Arey ek second 😭 dimaag hang ho gaya. Dobara bulao.");
  }
});

bot.catch(err => console.error("NIVA error:", err));

async function start() {
  await bot.telegram.setMyCommands([
    { command: "start", description: "Start NIVA" },
    { command: "mode", description: "Choose NIVA mode" },
    { command: "intensity", description: "Choose intensity" },
    { command: "help", description: "NIVA help" }
  ]);
  await bot.launch();
  console.log("NIVA v4 is online — local personality engine active.");
}
start();

const PORT = process.env.PORT || 3000;
http.createServer((req,res)=>{ res.writeHead(200,{"Content-Type":"text/plain"}); res.end("NIVA v4 is online."); }).listen(PORT,"0.0.0.0");
process.once("SIGINT",()=>bot.stop("SIGINT"));
process.once("SIGTERM",()=>bot.stop("SIGTERM"));
