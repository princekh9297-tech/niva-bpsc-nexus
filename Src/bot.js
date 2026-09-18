import http from "http";
import "dotenv/config";
import { Telegraf, Markup } from "telegraf";
import {
  getUser,
  updateUser,
  addAttempt,
  getStats,
  getRevisionQuestion
} from "./storage.js";
import { askNiva } from "./niva.js";
import { getQuestion } from "./quiz.js";
import { ROASTS } from "./personality.js";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const adminIds = new Set(
  (process.env.ADMIN_IDS || "")
    .split(",")
    .map(x => x.trim())
    .filter(Boolean)
);

const sessions = new Map();

const isAdmin = id => adminIds.has(String(id));


// ============================================================
// TELEGRAM NATIVE MENU
// ============================================================

const nativeMenuCommands = [
  { command: "ask", description: "🧠 Ask NIVA anything" },
  { command: "practice", description: "🎯 Practice MCQs" },
  { command: "currentaffairs", description: "📰 Current Affairs" },
  { command: "mains", description: "✍️ Mains Answer Help" },
  { command: "study", description: "📚 Study Room" },
  { command: "daily", description: "🔥 Daily Challenge" },
  { command: "progress", description: "📊 My Progress" },
  { command: "revision", description: "🧠 Revision Bank" },
  { command: "roast", description: "😏 Choose Roast Level" },
  { command: "settings", description: "⚙️ Settings" },
  { command: "start", description: "🏠 Main / Welcome" }
];


// ============================================================
// WELCOME
// ============================================================

function welcome(name) {
  return `✦ *N I V A* ✦
*BPSC Nexus Tutor*

Namaste, ${name}! 👋

Main NIVA hoon — concept samjhaungi, PYQ traps pakdaungi, revision karwaungi… aur zarurat padi toh thoda roast bhi. 😏

Aaj padhai karni hai ya excuses ka viva dena hai? 😂`;
}


// ============================================================
// START
// ============================================================

bot.start(async ctx => {
  try {
    const u = await getUser(
      ctx.from.id,
      ctx.from.first_name || "Aspirant"
    );

    // No inline keyboard here.
    // Telegram's native ☰ Menu is used instead.
    await ctx.replyWithMarkdown(
      welcome(u.name)
    );

  } catch (e) {
    console.error("START error:", e);

    await ctx.reply(
      "NIVA ka welcome system thoda confuse ho gaya 😅. Ek baar /start dobara bhejo."
    );
  }
});


// ============================================================
// ADMIN
// ============================================================

bot.command("admin", async ctx => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply("Access denied.");
  }

  return ctx.reply(
    "*NIVA Commands*\n\n" +
    "/start - Main menu\n" +
    "/ask - Ask NIVA anything\n" +
    "/practice - Practice MCQs\n" +
    "/currentaffairs - Current Affairs\n" +
    "/mains - Mains\n" +
    "/study - Study Room\n" +
    "/daily - Daily Challenge\n" +
    "/progress - Your progress\n" +
    "/revision - Revision Bank\n" +
    "/roast - Choose roast level\n" +
    "/settings - Settings",
    { parse_mode: "Markdown" }
  );
});


// ============================================================
// ASK NIVA
// ============================================================

bot.command("ask", ctx => {
  sessions.set(ctx.from.id, {
    mode: "ask"
  });

  ctx.reply(
    "🧠 Bolo. NIVA sun rahi hai.\n\n" +
    "Concept, PYQ, doubt, current affairs—jo hai bhejo."
  );
});


// ============================================================
// PRACTICE
// ============================================================

bot.command("practice", ctx => {
  startQuiz(ctx);
});


// ============================================================
// CURRENT AFFAIRS
// ============================================================

bot.command("currentaffairs", ctx => {
  ctx.reply(
    "📰 CURRENT AFFAIRS\n\n" +
    "Current Affairs module is ready for your verified CA dataset.\n\n" +
    "Yearly CA • Monthly CA • Bihar CA\n\n" +
    "Admin can connect the CA question bank here."
  );
});


// ============================================================
// MAINS
// ============================================================

bot.command("mains", ctx => {
  ctx.reply(
    "✍️ MAINS MODE\n\n" +
    "Send a BPSC/UPSC mains answer.\n\n" +
    "NIVA can help with:\n" +
    "• Structure\n" +
    "• Content\n" +
    "• Examples\n" +
    "• Analysis\n" +
    "• Conclusion"
  );
});


// ============================================================
// STUDY ROOM
// ============================================================

bot.command("study", ctx => {
  ctx.reply(
    "📚 STUDY ROOM\n\n" +
    "Polity • History • Geography • Economy • Science • " +
    "Bihar Special • Current Affairs\n\n" +
    "Tell NIVA a subject or topic and she'll teach it."
  );
});


// ============================================================
// DAILY CHALLENGE
// ============================================================

bot.command("daily", ctx => {
  ctx.reply(
    "🔥 DAILY CHALLENGE\n\n" +
    "5 questions. One topic. Zero excuses.\n\n" +
    "Ready?",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "LET'S GO 🔥",
          "quiz:start"
        )
      ]
    ])
  );
});


// ============================================================
// PROGRESS
// ============================================================

bot.command("progress", async ctx => {
  try {
    const s = await getStats(ctx.from.id);

    await ctx.replyWithMarkdown(
      `📊 *YOUR NIVA REPORT*

Questions: *${s.questions}*
Correct: *${s.correct}*
Accuracy: *${s.accuracy}%*
Revision Bank: *${s.mistakes.length}*

${
  s.questions
    ? "Consistency rakho. Accuracy ko next level le jaana hai. 🔥"
    : "Abhi dashboard khaali hai. Ek question toh karo, boss. 😏"
}`
    );

  } catch (e) {
    console.error("Progress error:", e);

    ctx.reply(
      "Progress load nahi ho paaya. Thodi der baad try karo."
    );
  }
});


// ============================================================
// REVISION
// ============================================================

bot.command("revision", async ctx => {
  try {
    const q = await getRevisionQuestion(ctx.from.id);

    if (!q) {
      return ctx.reply(
        "🧠 Revision Bank abhi khaali hai. " +
        "Pehle kuch MCQs galat bhi hone do. 😏"
      );
    }

    sessions.set(ctx.from.id, {
      mode: "quiz",
      q
    });

    const buttons = q.options.map((x, i) => [
      Markup.button.callback(
        `${String.fromCharCode(65 + i)}. ${x}`,
        `ans:${i}`
      )
    ]);

    await ctx.reply(
      `🧠 *REVISION BANK*\n\n${q.question}`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard(buttons)
      }
    );

  } catch (e) {
    console.error("Revision error:", e);

    ctx.reply(
      "Revision Bank load nahi ho paaya. Thodi der baad try karo."
    );
  }
});


// ============================================================
// ROAST
// ============================================================

bot.command("roast", ctx => {
  ctx.reply(
    "🔥 Choose your NIVA roast level:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "🙂 Friendly",
          "roast:friendly"
        )
      ],
      [
        Markup.button.callback(
          "😏 Savage",
          "roast:savage"
        )
      ],
      [
        Markup.button.callback(
          "☠️ NIVA Unleashed",
          "roast:unleashed"
        )
      ]
    ])
  );
});


// ============================================================
// SETTINGS
// ============================================================

bot.command("settings", ctx => {
  ctx.reply(
    "⚙️ SETTINGS\n\n" +
    "Use /roast to change NIVA's roast level."
  );
});


// ============================================================
// AI CHAT
// ============================================================

bot.on("text", async ctx => {
  const id = ctx.from.id;
  const text = ctx.message.text.trim();

  const session = sessions.get(id);

  try {
    const u = await getUser(
      id,
      ctx.from.first_name || "Aspirant"
    );

    if (session?.mode === "ask" || !session) {

      await ctx.sendChatAction("typing");

      const answer = await askNiva({
        userId: id,
        name: u.name,
        message: text,
        mode: "teacher"
      });

      // CLEAN AI RESPONSE
      // No inline menu attached.
      await ctx.reply(answer);

      return;
    }

  } catch (e) {
    console.error("NIVA AI error:", e);

    await ctx.reply(
      "NIVA ka backend thoda chai break par chala gaya 😭.\n" +
      "Thodi der baad try karo."
    );

    return;
  }
});


// ============================================================
// DAILY QUIZ START
// ============================================================

bot.action("quiz:start", async ctx => {
  await ctx.answerCbQuery();

  await startQuiz(ctx);
});


// ============================================================
// ROAST LEVEL CALLBACK
// ============================================================

bot.action(
  /^roast:(friendly|savage|unleashed)$/,
  async ctx => {

    const level = ctx.match[1];

    try {
      await updateUser(
        ctx.from.id,
        {
          roast_level: level
        }
      );

      await ctx.answerCbQuery(
        "Roast mode updated."
      );

      ctx.reply(
        level === "unleashed"
          ? "☠️ NIVA Unleashed activated. Tumne khud choose kiya hai. 😂"
          : `Roast level: ${level}.`
      );

    } catch (e) {
      console.error("Roast update error:", e);

      ctx.reply(
        "Roast level update nahi ho paaya."
      );
    }
  }
);


// ============================================================
// QUIZ ENGINE
// ============================================================

async function startQuiz(ctx) {
  try {

    const q = await getQuestion();

    if (!q) {
      return ctx.reply(
        "🎯 Quiz database abhi connected nahi hai. " +
        "Admin ko question bank import karna hoga."
      );
    }

    sessions.set(
      ctx.from.id,
      {
        mode: "quiz",
        q
      }
    );

    const buttons = q.options.map((x, i) => [
      Markup.button.callback(
        `${String.fromCharCode(65 + i)}. ${x}`,
        `ans:${i}`
      )
    ]);

    await ctx.reply(
      `🎯 *${q.subject} — ${q.topic}*\n\n${q.q}`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard(buttons)
      }
    );

  } catch (e) {
    console.error("Quiz start error:", e);

    ctx.reply(
      "Quiz start nahi ho paaya. Thodi der baad try karo."
    );
  }
}


// ============================================================
// QUIZ ANSWER
// ============================================================

bot.action(/^ans:(\d)$/, async ctx => {

  try {

    const session = sessions.get(ctx.from.id);

    if (!session?.q) {
      return ctx.answerCbQuery(
        "Quiz expired. Start again."
      );
    }

    const choice = Number(ctx.match[1]);

    const q = session.q;

    const correct = choice === q.answer;

    const u = await addAttempt(
      ctx.from.id,
      {
        questionId: q.id,
        topic: q.topic,
        choice,
        correct
      }
    );

    await ctx.answerCbQuery(
      correct
        ? "Correct! 🔥"
        : "Not quite."
    );

    let msg;

    if (correct) {

      msg =
        `✅ *Correct!*\n\n` +
        `${q.explanation}`;

    } else {

      const roastLevel =
        u.roast_level || "friendly";

      const roastList =
        ROASTS[roastLevel] || ROASTS.friendly;

      const roast =
        roastList[
          Math.floor(
            Math.random() * roastList.length
          )
        ];

      msg =
        `❌ *Not correct.*\n\n` +
        `${roast}\n\n` +
        `*Correct answer:* ` +
        `${String.fromCharCode(65 + q.answer)}. ` +
        `${q.options[q.answer]}\n\n` +
        `${q.explanation}`;
    }

    sessions.delete(ctx.from.id);

    // NO MENU AFTER QUIZ
    await ctx.replyWithMarkdown(
      msg +
      `\n\n📊 Accuracy: ${
        u.questions
          ? (100 * u.correct / u.questions).toFixed(1)
          : 0
      }%`
    );

  } catch (e) {

    console.error("Quiz answer error:", e);

    ctx.reply(
      "Answer save karne mein problem aa gayi. 😅"
    );
  }
});


// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

bot.catch(err => {
  console.error("NIVA error:", err);
});


// ============================================================
// START BOT + TELEGRAM MENU
// ============================================================

async function startBot() {

  try {

    // Register commands for Telegram's native ☰ Menu
    await bot.telegram.setMyCommands(
      nativeMenuCommands
    );

    console.log("NIVA native menu configured.");

  } catch (e) {

    console.error(
      "Telegram menu setup error:",
      e
    );
  }

  bot.launch();

  console.log("NIVA is online.");
}

startBot();


// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

process.once(
  "SIGINT",
  () => bot.stop("SIGINT")
);

process.once(
  "SIGTERM",
  () => bot.stop("SIGTERM")
);


// ============================================================
// RENDER HEALTH SERVER
// ============================================================

const PORT =
  process.env.PORT || 3000;

http.createServer(
  (req, res) => {

    res.writeHead(
      200,
      {
        "Content-Type":
          "text/plain"
      }
    );

    res.end(
      "NIVA is online."
    );
  }
).listen(
  PORT,
  "0.0.0.0"
);
