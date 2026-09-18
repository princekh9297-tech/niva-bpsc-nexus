import http from "http";
import "dotenv/config";

import {
  Telegraf,
  Markup
} from "telegraf";

import {
  getUser,
  updateUser,
  addAttempt,
  getStats,
  getRevisionQuestion
} from "./storage.js";

import {
  askNiva,
  evaluateMainsAnswer
} from "./niva.js";

import {
  getQuestion
} from "./quiz.js";

import {
  ROASTS
} from "./personality.js";


// ============================================================
// BOT
// ============================================================

const bot =
  new Telegraf(
    process.env.TELEGRAM_BOT_TOKEN
  );


// ============================================================
// ADMIN
// ============================================================

const adminIds =
  new Set(
    (process.env.ADMIN_IDS || "")
      .split(",")
      .map(x => x.trim())
      .filter(Boolean)
  );


// ============================================================
// SESSIONS
// ============================================================

const sessions = new Map();


// ============================================================
// ADMIN CHECK
// ============================================================

const isAdmin =
  id => adminIds.has(String(id));


// ============================================================
// TELEGRAM NATIVE MENU
// ============================================================

const nativeMenuCommands = [

  {
    command: "ask",
    description: "🧠 Ask NIVA"
  },

  {
    command: "practice",
    description: "🎯 Practice MCQs"
  },

  {
    command: "currentaffairs",
    description: "📰 Current Affairs"
  },

  {
    command: "mains",
    description: "✍️ Mains Answer"
  },

  {
    command: "study",
    description: "📚 Study Room"
  },

  {
    command: "daily",
    description: "🔥 Daily Challenge"
  },

  {
    command: "progress",
    description: "📊 My Progress"
  },

  {
    command: "revision",
    description: "🧠 Revision Bank"
  },

  {
    command: "roast",
    description: "😏 Roast Level"
  },

  {
    command: "settings",
    description: "⚙️ Settings"
  },

  {
    command: "start",
    description: "🏠 Start NIVA"
  }

];


// ============================================================
// WELCOME
// ============================================================

function welcome(name) {

  return `✦ N I V A ✦
BPSC Nexus Tutor

Namaste, ${name}! 👋

Main NIVA hoon — concept samjhaungi, PYQ traps pakdaungi, revision karwaungi… aur zarurat padi toh thoda roast bhi. 😏

Aaj padhai karni hai ya excuses ka viva dena hai? 😂`;
}


// ============================================================
// CHECK GROUP
// ============================================================

function isGroup(ctx) {

  return (
    ctx.chat?.type === "group" ||
    ctx.chat?.type === "supergroup"
  );
}


// ============================================================
// CHECK WHETHER NIVA WAS MENTIONED
// ============================================================

function isNivaMentioned(ctx) {

  const message =
    ctx.message;

  if (!message) {
    return false;
  }

  const text =
    message.text ||
    message.caption ||
    "";

  const entities =
    message.entities ||
    message.caption_entities ||
    [];


  // ----------------------------------------------------------
  // Telegram @mention / text_mention
  // ----------------------------------------------------------

  for (const entity of entities) {

    if (
      entity.type === "mention"
    ) {

      const mention =
        text.substring(
          entity.offset,
          entity.offset + entity.length
        );

      if (
        mention
          .toLowerCase()
          .includes("niva")
      ) {
        return true;
      }
    }


    if (
      entity.type === "text_mention"
    ) {

      if (
        entity.user &&
        entity.user.id === bot.botInfo?.id
      ) {

        return true;

      }
    }

  }


  // ----------------------------------------------------------
  // Plain "NIVA" mention
  // ----------------------------------------------------------

  return /\bniva\b/i.test(text);
}


// ============================================================
// CHECK WHETHER MESSAGE REPLIES TO NIVA
// ============================================================

function isReplyToNiva(ctx) {

  const reply =
    ctx.message?.reply_to_message;

  if (!reply) {
    return false;
  }

  return (
    reply.from?.id ===
    bot.botInfo?.id
  );
}


// ============================================================
// GROUP MESSAGE IS RELEVANT
// ============================================================

function shouldNivaReplyInGroup(ctx) {

  return (
    isNivaMentioned(ctx) ||
    isReplyToNiva(ctx)
  );
}


// ============================================================
// START
// ============================================================

bot.start(async ctx => {

  try {

    const u =
      await getUser(
        ctx.from.id,
        ctx.from.first_name ||
        "Aspirant"
      );

    await ctx.reply(
      welcome(u.name)
    );

  } catch (error) {

    console.error(
      "START error:",
      error
    );

    await ctx.reply(
      "NIVA ka welcome system thoda confuse ho gaya 😅\n\n" +
      "Ek baar /start dobara bhejo."
    );
  }

});


// ============================================================
// ADMIN
// ============================================================

bot.command(
  "admin",
  async ctx => {

    if (!isAdmin(ctx.from.id)) {

      return ctx.reply(
        "Access denied."
      );

    }

    return ctx.reply(
      "NIVA Commands\n\n" +

      "/start - Start NIVA\n" +
      "/ask - Ask NIVA\n" +
      "/practice - Practice MCQs\n" +
      "/currentaffairs - Current Affairs\n" +
      "/mains - Mains Answer\n" +
      "/study - Study Room\n" +
      "/daily - Daily Challenge\n" +
      "/progress - Progress\n" +
      "/revision - Revision Bank\n" +
      "/roast - Roast level\n" +
      "/settings - Settings"
    );

  }
);


// ============================================================
// ASK
// ============================================================

bot.command(
  "ask",
  ctx => {

    sessions.set(
      ctx.from.id,
      {
        mode: "ask"
      }
    );

    ctx.reply(
      "🧠 Bolo. NIVA sun rahi hai.\n\n" +
      "Concept, PYQ, doubt, current affairs—jo hai bhejo."
    );

  }
);


// ============================================================
// PRACTICE
// ============================================================

bot.command(
  "practice",
  ctx => {

    startQuiz(ctx);

  }
);


// ============================================================
// CURRENT AFFAIRS
// ============================================================

bot.command(
  "currentaffairs",
  ctx => {

    ctx.reply(
      "📰 CURRENT AFFAIRS\n\n" +
      "Yearly CA\n" +
      "Monthly CA\n" +
      "Bihar CA\n\n" +
      "CA question bank integration will be connected here."
    );

  }
);


// ============================================================
// MAINS
// ============================================================

bot.command(
  "mains",
  ctx => {

    sessions.set(
      ctx.from.id,
      {
        mode: "mains"
      }
    );

    ctx.reply(
      "✍️ MAINS MODE\n\n" +

      "Apna handwritten BPSC/UPSC Mains answer ka clear photo bhejo. 📸\n\n" +

      "NIVA check karegi:\n" +
      "• Content\n" +
      "• Structure\n" +
      "• Analysis\n" +
      "• Examples\n" +
      "• Conclusion\n" +
      "• Presentation\n" +
      "• Word count\n\n" +

      "Poora answer clear frame mein bhejna."
    );

  }
);


// ============================================================
// STUDY
// ============================================================

bot.command(
  "study",
  ctx => {

    sessions.set(
      ctx.from.id,
      {
        mode: "ask"
      }
    );

    ctx.reply(
      "📚 STUDY ROOM\n\n" +

      "Polity • History • Geography • Economy • Science • " +
      "Bihar Special • Current Affairs\n\n" +

      "Topic bhejo. NIVA samjhaungi."
    );

  }
);


// ============================================================
// DAILY
// ============================================================

bot.command(
  "daily",
  ctx => {

    ctx.reply(
      "🔥 DAILY CHALLENGE\n\n" +
      "5 questions.\n" +
      "One topic.\n" +
      "Zero excuses. 😏\n\n" +
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

  }
);


// ============================================================
// PROGRESS
// ============================================================

bot.command(
  "progress",
  async ctx => {

    try {

      const s =
        await getStats(
          ctx.from.id
        );

      await ctx.reply(
        `📊 YOUR NIVA REPORT

Questions: ${s.questions}
Correct: ${s.correct}
Accuracy: ${s.accuracy}%
Revision Bank: ${s.mistakes.length}

${
  s.questions
    ? "Consistency rakho. Accuracy ko next level le jaana hai. 🔥"
    : "Abhi dashboard khaali hai. Ek question toh karo, boss. 😏"
}`
      );

    } catch (error) {

      console.error(
        "Progress error:",
        error
      );

      ctx.reply(
        "Progress load nahi ho paaya."
      );

    }

  }
);


// ============================================================
// REVISION
// ============================================================

bot.command(
  "revision",
  async ctx => {

    try {

      const q =
        await getRevisionQuestion(
          ctx.from.id
        );

      if (!q) {

        return ctx.reply(
          "🧠 Revision Bank abhi khaali hai.\n\n" +
          "Pehle kuch MCQs galat bhi hone do. 😏"
        );

      }

      sessions.set(
        ctx.from.id,
        {
          mode: "quiz",
          q
        }
      );

      const buttons =
        q.options.map(
          (x, i) => [

            Markup.button.callback(
              `${String.fromCharCode(65 + i)}. ${x}`,
              `ans:${i}`
            )

          ]
        );

      await ctx.reply(
        `🧠 REVISION BANK\n\n${q.question}`,
        Markup.inlineKeyboard(
          buttons
        )
      );

    } catch (error) {

      console.error(
        "Revision error:",
        error
      );

      ctx.reply(
        "Revision Bank load nahi ho paaya."
      );

    }

  }
);


// ============================================================
// ROAST
// ============================================================

bot.command(
  "roast",
  ctx => {

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

  }
);


// ============================================================
// SETTINGS
// ============================================================

bot.command(
  "settings",
  ctx => {

    ctx.reply(
      "⚙️ SETTINGS\n\n" +
      "Use /roast to change NIVA's roast level."
    );

  }
);


// ============================================================
// GROUP PHOTO
// ============================================================

bot.on(
  "photo",
  async ctx => {

    if (
      isGroup(ctx) &&
      !shouldNivaReplyInGroup(ctx)
    ) {
      return;
    }

    const id =
      ctx.from.id;

    const session =
      sessions.get(id);


    try {

      const u =
        await getUser(
          id,
          ctx.from.first_name ||
          "Aspirant"
        );


      // In groups, photo must explicitly trigger NIVA.
      // In private chats, /mains activates image evaluation.

      if (
        session?.mode !== "mains" &&
        isGroup(ctx)
      ) {

        await ctx.reply(
          "📸 Haan, photo dekh rahi hoon. 😄\n\n" +
          "Agar ye Mains answer hai, /mains likho aur photo bhejo."
        );

        return;
      }


      if (
        session?.mode !== "mains"
      ) {

        await ctx.reply(
          "📸 Agar ye handwritten Mains answer hai, pehle /mains bhejo."
        );

        return;
      }


      await ctx.sendChatAction(
        "typing"
      );


      const photos =
        ctx.message.photo;


      const photo =
        photos[
          photos.length - 1
        ];


      const fileLink =
        await ctx.telegram.getFileLink(
          photo.file_id
        );


      const imageResponse =
        await fetch(
          fileLink.href
        );


      if (
        !imageResponse.ok
      ) {

        throw new Error(
          "Could not download Telegram image."
        );

      }


      const imageBuffer =
        Buffer.from(
          await imageResponse.arrayBuffer()
        );


      const imageBase64 =
        imageBuffer.toString(
          "base64"
        );


      await ctx.reply(
        "📸 Answer mil gaya.\n\n" +
        "NIVA handwriting padh rahi hoon aur answer evaluate kar rahi hoon... ✍️🧠"
      );


      const evaluation =
        await evaluateMainsAnswer({

          userId: id,

          name: u.name,

          imageBase64,

          mimeType: "image/jpeg"

        });


      sessions.delete(id);


      if (isGroup(ctx)) {

        await ctx.reply(
          evaluation,
          {
            reply_to_message_id:
              ctx.message.message_id
          }
        );

      } else {

        await ctx.reply(
          evaluation
        );

      }


    } catch (error) {

      console.error(
        "Mains image error:",
        error
      );


      await ctx.reply(
        "📸 Answer image read karne mein problem aa gayi.\n\n" +
        "Clear photo aur proper lighting ke saath dobara bhejo."
      );

    }

  }
);


// ============================================================
// NORMAL TEXT
// ============================================================

bot.on(
  "text",
  async ctx => {

    const id =
      ctx.from.id;

    const text =
      ctx.message.text.trim();


    // --------------------------------------------------------
    // GROUP FILTER
    // --------------------------------------------------------

    if (isGroup(ctx)) {

      // NIVA stays completely silent unless:
      // 1. @NIVA is mentioned
      // 2. "NIVA" is written
      // 3. User replies to NIVA's message

      if (
        !shouldNivaReplyInGroup(ctx)
      ) {
        return;
      }

    }


    const session =
      sessions.get(id);


    try {

      const u =
        await getUser(
          id,
          ctx.from.first_name ||
          "Aspirant"
        );


      // ------------------------------------------------------
      // MAINS TEXT
      // ------------------------------------------------------

      if (
        session?.mode === "mains"
      ) {

        const replyText =
          "✍️ Mains mode active hai.\n\n" +
          "Handwritten answer ka clear photo bhejo. 📸";


        if (isGroup(ctx)) {

          await ctx.reply(
            replyText,
            {
              reply_to_message_id:
                ctx.message.message_id
            }
          );

        } else {

          await ctx.reply(
            replyText
          );

        }

        return;
      }


      // ------------------------------------------------------
      // ASK / NORMAL AI
      // ------------------------------------------------------

      if (
        session?.mode === "ask" ||
        !session
      ) {

        await ctx.sendChatAction(
          "typing"
        );


        const answer =
          await askNiva({

            userId: id,

            name: u.name,

            message: text,

            mode: "teacher"

          });


        // ----------------------------------------------------
        // PRIVATE CHAT
        // ----------------------------------------------------

        if (!isGroup(ctx)) {

          await ctx.reply(
            answer
          );

          return;
        }


        // ----------------------------------------------------
        // GROUP
        // ----------------------------------------------------

        await ctx.reply(
          answer,
          {
            reply_to_message_id:
              ctx.message.message_id
          }
        );


        return;
      }


    } catch (error) {

      console.error(
        "NIVA AI error:",
        error
      );


      const errorMessage =
        "NIVA ka backend thoda chai break par chala gaya 😭\n\n" +
        "Thodi der baad try karo.";


      if (isGroup(ctx)) {

        await ctx.reply(
          errorMessage,
          {
            reply_to_message_id:
              ctx.message.message_id
          }
        );

      } else {

        await ctx.reply(
          errorMessage
        );

      }

    }

  }
);


// ============================================================
// DAILY QUIZ
// ============================================================

bot.action(
  "quiz:start",
  async ctx => {

    await ctx.answerCbQuery();

    await startQuiz(ctx);

  }
);


// ============================================================
// ROAST CALLBACK
// ============================================================

bot.action(
  /^roast:(friendly|savage|unleashed)$/,
  async ctx => {

    try {

      const level =
        ctx.match[1];


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


    } catch (error) {

      console.error(
        "Roast update error:",
        error
      );

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

    const q =
      await getQuestion();


    if (!q) {

      return ctx.reply(
        "🎯 Quiz database abhi connected nahi hai.\n\n" +
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


    const buttons =
      q.options.map(
        (x, i) => [

          Markup.button.callback(
            `${String.fromCharCode(65 + i)}. ${x}`,
            `ans:${i}`
          )

        ]
      );


    await ctx.reply(
      `🎯 ${q.subject} — ${q.topic}\n\n${q.q}`,

      Markup.inlineKeyboard(
        buttons
      )
    );


  } catch (error) {

    console.error(
      "Quiz start error:",
      error
    );


    ctx.reply(
      "Quiz start nahi ho paaya. Thodi der baad try karo."
    );

  }

}


// ============================================================
// QUIZ ANSWER
// ============================================================

bot.action(
  /^ans:(\d)$/,
  async ctx => {

    try {

      const session =
        sessions.get(
          ctx.from.id
        );


      if (!session?.q) {

        return ctx.answerCbQuery(
          "Quiz expired. Start again."
        );

      }


      const choice =
        Number(
          ctx.match[1]
        );


      const q =
        session.q;


      const correct =
        choice === q.answer;


      const u =
        await addAttempt(
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
          `✅ Correct!\n\n` +
          `${q.explanation}`;

      } else {

        const roastLevel =
          u.roast_level ||
          "friendly";


        const roastList =
          ROASTS[
            roastLevel
          ] ||
          ROASTS.friendly;


        const roast =
          roastList[
            Math.floor(
              Math.random() *
              roastList.length
            )
          ];


        msg =
          `❌ Not correct.\n\n` +
          `${roast}\n\n` +

          `Correct answer: ` +
          `${String.fromCharCode(
            65 + q.answer
          )}. ` +
          `${q.options[q.answer]}\n\n` +

          `${q.explanation}`;

      }


      sessions.delete(
        ctx.from.id
      );


      await ctx.reply(
        msg +
        `\n\n📊 Accuracy: ${
          u.questions
            ? (
                100 *
                u.correct /
                u.questions
              ).toFixed(1)
            : 0
        }%`
      );


    } catch (error) {

      console.error(
        "Quiz answer error:",
        error
      );


      ctx.reply(
        "Answer save karne mein problem aa gayi. 😅"
      );

    }

  }
);


// ============================================================
// GLOBAL ERROR
// ============================================================

bot.catch(
  error => {

    console.error(
      "NIVA error:",
      error
    );

  }
);


// ============================================================
// START BOT
// ============================================================

async function startBot() {

  try {

    // Native Telegram menu.
    // Commands can be scoped separately for private/group chats.
    await bot.telegram.setMyCommands(
      nativeMenuCommands,
      {
        type: "all_private_chats"
      }
    );


    await bot.telegram.setMyCommands(
      [
        {
          command: "start",
          description: "🏠 Start NIVA"
        },
        {
          command: "ask",
          description: "🧠 Ask NIVA"
        },
        {
          command: "practice",
          description: "🎯 Practice MCQs"
        },
        {
          command: "mains",
          description: "✍️ Mains Answer"
        },
        {
          command: "daily",
          description: "🔥 Daily Challenge"
        },
        {
          command: "progress",
          description: "📊 My Progress"
        },
        {
          command: "revision",
          description: "🧠 Revision Bank"
        }
      ],
      {
        type: "all_group_chats"
      }
    );


    console.log(
      "NIVA native menu configured."
    );


  } catch (error) {

    console.error(
      "Telegram menu setup error:",
      error
    );

  }


  bot.launch();


  console.log(
    "NIVA is online."
  );

}


startBot();


// ============================================================
// SHUTDOWN
// ============================================================

process.once(
  "SIGINT",
  () =>
    bot.stop("SIGINT")
);

process.once(
  "SIGTERM",
  () =>
    bot.stop("SIGTERM")
);


// ============================================================
// RENDER HEALTH SERVER
// ============================================================

const PORT =
  process.env.PORT ||
  3000;


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
