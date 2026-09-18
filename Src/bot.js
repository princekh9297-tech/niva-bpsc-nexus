import http from "http";
import "dotenv/config";
import { Telegraf, Markup } from "telegraf";
import { getUser, updateUser, addAttempt, getStats } from "./storage.js";
import { askNiva } from "./niva.js";
import { getQuestion } from "./quiz.js";
import { ROASTS } from "./personality.js";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const adminIds = new Set((process.env.ADMIN_IDS || "").split(",").map(x=>x.trim()).filter(Boolean));
const sessions = new Map();
const isAdmin = id => adminIds.has(String(id));

const menu = Markup.inlineKeyboard([
  [Markup.button.callback("🧠 ASK NIVA","ask"), Markup.button.callback("🎯 PRACTICE","practice")],
  [Markup.button.callback("📰 CURRENT AFFAIRS","ca"), Markup.button.callback("✍️ MAINS","mains")],
  [Markup.button.callback("📚 STUDY ROOM","study"), Markup.button.callback("🔥 DAILY CHALLENGE","daily")],
  [Markup.button.callback("📊 MY PROGRESS","progress"), Markup.button.callback("🧠 REVISION BANK","revision")],
  [Markup.button.callback("⚙️ SETTINGS","settings")]
]);

function welcome(name) {
  return `✦ *N I V A* ✦\n*BPSC Nexus Tutor*\n\nNamaste, ${name}! 👋\n\nMain NIVA hoon — concept samjhaungi, PYQ traps pakdaungi, revision karwaungi… aur zarurat padi toh thoda roast bhi. 😏\n\nAaj padhai karni hai ya excuses ka viva dena hai? 😂`;
}

bot.start(async ctx => {
  const u = await getUser(ctx.from.id, ctx.from.first_name || "Aspirant");
  ctx.replyWithMarkdown(welcome(u.name), menu);
});

bot.command("admin", async ctx => {
  if (!isAdmin(ctx.from.id)) return ctx.reply("Access denied.");
  return ctx.reply(
    "*NIVA Commands*\n\n/start - Main menu\n/ask - Ask NIVA anything\n/practice - Practice MCQs\n/progress - Your progress\n/revision - Revision Bank\n/roast - Choose roast level",
    { parse_mode: "Markdown" }
  );
});

bot.command("ask", ctx => {
  sessions.set(ctx.from.id, {mode:"ask"});
  ctx.reply("🧠 Bolo. NIVA sun rahi hai.\n\nConcept, PYQ, doubt, current affairs—jo hai bhejo.");
});

bot.command("practice", ctx => startQuiz(ctx));

bot.command("progress", async ctx => {
  const s = await getStats(ctx.from.id);
  ctx.replyWithMarkdown(`📊 *YOUR NIVA REPORT*\n\nQuestions: *${s.questions}*\nCorrect: *${s.correct}*\nAccuracy: *${s.accuracy}%*\nRevision Bank: *${s.mistakes.length}*\n\n${s.questions ? "Consistency rakho. Accuracy ko next level le jaana hai. 🔥" : "Abhi dashboard khaali hai. Ek question toh karo, boss. 😏"}`);
});

bot.command("revision", async ctx => { const q=await getRevisionQuestion(ctx.from.id); if(!q) return ctx.reply("🧠 Revision Bank abhi khaali hai. Pehle kuch MCQs galat bhi hone do. 😏"); sessions.set(ctx.from.id,{mode:"quiz",q}); ctx.reply(`🧠 *REVISION BANK*\n\n${q.question}`,{parse_mode:"Markdown",...Markup.inlineKeyboard(q.options.map((x,i)=>[Markup.button.callback(`${String.fromCharCode(65+i)}. ${x}`,`ans:${i}`)]))}); });

bot.command("roast", ctx => {
  ctx.reply("🔥 Choose your NIVA roast level:", Markup.inlineKeyboard([
    [Markup.button.callback("🙂 Friendly","roast:friendly")],
    [Markup.button.callback("😏 Savage","roast:savage")],
    [Markup.button.callback("☠️ NIVA Unleashed","roast:unleashed")]
  ]));
});

bot.on("text", async ctx => {
  const id = ctx.from.id;
  const text = ctx.message.text.trim();
  const session = sessions.get(id);
  const u = await getUser(id, ctx.from.first_name || "Aspirant");

  if (session?.mode === "ask" || !session) {
    try {
      await ctx.sendChatAction("typing");
      const answer = await askNiva({userId:id, name:u.name, message:text, mode:"teacher"});
      await ctx.reply(answer, menu);
    } catch (e) {
      console.error(e);
      ctx.reply("NIVA ka backend thoda chai break par chala gaya 😭. Thodi der baad try karo.");
    }
    return;
  }
});

bot.action("ask", async ctx => {
  await ctx.answerCbQuery();
  sessions.set(ctx.from.id,{mode:"ask"});
  ctx.reply("🧠 *Ask NIVA*\n\nApna doubt bhejo. Main tutor mode mein hoon. 👩‍🏫", {parse_mode:"Markdown"});
});

bot.action("practice", async ctx => { await ctx.answerCbQuery(); startQuiz(ctx); });
bot.action("progress", async ctx => { await ctx.answerCbQuery(); ctx.telegram.sendMessage(ctx.from.id, "Use /progress for your current report."); });
bot.action("daily", async ctx => {
  await ctx.answerCbQuery();
  ctx.reply("🔥 *DAILY CHALLENGE*\n\n5 questions. One topic. Zero excuses.\n\nReady?", Markup.inlineKeyboard([[Markup.button.callback("LET'S GO 🔥","quiz:start")]]));
});
bot.action("quiz:start", async ctx => { await ctx.answerCbQuery(); startQuiz(ctx); });

bot.action(/^roast:(friendly|savage|unleashed)$/, async ctx => {
  const level = ctx.match[1];
  await updateUser(ctx.from.id,{roast_level:level});
  await ctx.answerCbQuery("Roast mode updated.");
  ctx.reply(level==="unleashed" ? "☠️ NIVA Unleashed activated. Tumne khud choose kiya hai. 😂" : `Roast level: ${level}.`);
});

bot.action("settings", async ctx => {
  await ctx.answerCbQuery();
  ctx.reply("⚙️ Settings\n\nUse /roast to change NIVA's roast level.");
});

bot.action("ca", async ctx => { await ctx.answerCbQuery(); ctx.reply("📰 Current Affairs module is ready for your verified CA dataset. Admin can connect your monthly/yearly CA bank here."); });
bot.action("mains", async ctx => { await ctx.answerCbQuery(); ctx.reply("✍️ Send a BPSC/UPSC mains answer and NIVA can evaluate structure, content, examples, analysis and conclusion."); });
bot.action("study", async ctx => { await ctx.answerCbQuery(); ctx.reply("📚 STUDY ROOM\n\nPolity • History • Geography • Economy • Science • Bihar Special • Current Affairs\n\nTell NIVA a subject/topic and she'll teach it."); });
bot.action("revision", async ctx => {
  await ctx.answerCbQuery();
  const s=getStats(ctx.from.id);
  ctx.reply(`🧠 Revision Bank\n\nQuestions saved: ${s.mistakes.length}\n\nYour wrong answers will accumulate here as you use the quiz engine.`);
});

async function startQuiz(ctx) {
  const q=await getQuestion();
  if(!q) return ctx.reply("🎯 Quiz database abhi connected nahi hai. Admin ko question bank import karna hoga.");
  sessions.set(ctx.from.id,{mode:"quiz",q});
  const buttons=q.options.map((x,i)=>[Markup.button.callback(`${String.fromCharCode(65+i)}. ${x}`,`ans:${i}`)]);
  ctx.reply(`🎯 *${q.subject} — ${q.topic}*\n\n${q.q}`, {parse_mode:"Markdown", ...Markup.inlineKeyboard(buttons)});
}

bot.action(/^ans:(\d)$/, async ctx => {
  const session=sessions.get(ctx.from.id);
  if (!session?.q) return ctx.answerCbQuery("Quiz expired. Start again.");
  const choice=Number(ctx.match[1]);
  const q=session.q;
  const correct=choice===q.answer;
  const u=await addAttempt(ctx.from.id,{questionId:q.id,topic:q.topic,choice,correct});
  await ctx.answerCbQuery(correct ? "Correct! 🔥" : "Not quite.");
  let msg=correct
    ? `✅ *Correct!*\n\n${q.explanation}`
    : `❌ *Not correct.*\n\n${ROASTS[u.roast_level||"friendly"][Math.floor(Math.random()*ROASTS[u.roast_level||"friendly"].length)]}\n\n*Correct answer:* ${String.fromCharCode(65+q.answer)}. ${q.options[q.answer]}\n\n${q.explanation}`;
  sessions.delete(ctx.from.id);
  ctx.replyWithMarkdown(msg + `\n\n📊 Accuracy: ${u.questions ? (100*u.correct/u.questions).toFixed(1) : 0}%`, menu);
});

bot.catch(err => console.error("NIVA error:", err));

bot.launch();
console.log("NIVA is online.");
process.once("SIGINT",()=>bot.stop("SIGINT"));
process.once("SIGTERM",()=>bot.stop("SIGTERM"));
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("NIVA is online.");
}).listen(PORT, "0.0.0.0");
