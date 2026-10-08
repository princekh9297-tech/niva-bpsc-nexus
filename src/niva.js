import { NIVA_SYSTEM } from "./personality.js";
import { getStats, getUser, updateUser } from "./storage.js";
import { handleCoreMessage } from "./niva-core.js";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_TEXT_MODEL =
  process.env.GROQ_TEXT_MODEL || "openai/gpt-oss-20b";
const GROQ_VISION_MODEL =
  process.env.GROQ_VISION_MODEL || "qwen/qwen3.8-27b";

const GROQ_URL =
  "https://api.groq.com/openai/v1/chat/completions";


// ============================================================
// GROQ REQUEST
// ============================================================

async function callGroq(
  messages,
  model,
  maxCompletionTokens = 700
) {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing.");
  }

  const response = await fetch(GROQ_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },

    body: JSON.stringify({
      model,
      messages,
      max_completion_tokens: maxCompletionTokens,
      temperature: 0.55,
      include_reasoning: false
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "Groq API error:",
      JSON.stringify(data, null, 2)
    );

    if (response.status === 429) {
      throw new Error(
        "Groq rate/token limit reached. Please try again later."
      );
    }

    throw new Error(
      data?.error?.message ||
      "Groq API request failed."
    );
  }

  const answer =
    data?.choices?.[0]?.message?.content
      ?.trim();

  if (!answer) {
    throw new Error(
      "Groq returned an empty response."
    );
  }

  return cleanTelegramText(answer);
}


// ============================================================
// BOYFRIEND RESPONSE
// ============================================================

function isBoyfriendQuestion(message) {
  return /\b(bf|b\/f|boyfriend|boy friend|who('?s| is) your bf|who('?s| is) your boyfriend)\b/i.test(message) ||
    /(बॉयफ्रेंड|बॉय फ्रेंड|प्रेमी)/i.test(message);
}


// ============================================================
// NORMAL NIVA CHAT
// ============================================================

export async function askNiva({
  userId,
  name,
  message,
  mode = "teacher",
  isGroup = false
}) {
  // NIVA CORE handles ordinary conversation locally: no LLM/API call.
  const profile = await getUser(userId, name || "Aspirant");
  const core = handleCoreMessage({
    userId,
    name: name || profile.name || "Aspirant",
    message,
    profile,
    isGroup
  });

  if (core.handled) {
    const patch = {};
    if (core.mode) patch.niva_mode = core.mode;
    if (core.level) patch.niva_level = core.level;
    if (Object.keys(patch).length) await updateUser(userId, patch);
    return core.response;
  }

  // Complex/academic requests fall back to the existing LLM layer.
  const stats = isGroup ? null : await getStats(userId);
  const context = `
NIVA ROLE
You are NIVA, the FEMALE BPSC Nexus tutor.
Primary purpose: BPSC, UPSC, SSC, IBPS and competitive-exam preparation.
Use feminine Hindi/Hinglish self-reference: karungi, bataungi, samjhaungi, check karungi, help karungi.
Teacher first, helpful friend second, light humour third.
Never use private dashboard statistics as jokes or roasting in group chats.
Keep answers concise, practical and exam-oriented.
Use natural Hinglish when appropriate.
Do not automatically ask a question at the end.
`;

  const privateStats = stats ? `\nPRIVATE STUDENT CONTEXT\nName: ${name || stats.name}\nQuestions attempted: ${stats.questions}\nAccuracy: ${stats.accuracy}%\n` : "\nGROUP CHAT: Do not use personal dashboard statistics.\n";

  return callGroq([
    { role: "system", content: NIVA_SYSTEM + "\n" + context + privateStats },
    { role: "user", content: message }
  ], GROQ_TEXT_MODEL, 650);
}

// ============================================================
// HANDWRITTEN MAINS ANSWER EVALUATOR
// ============================================================

export async function evaluateMainsAnswer({
  userId,
  name,
  imageBase64,
  mimeType = "image/jpeg",
  question = ""
}) {
  const stats = await getStats(userId);

  const systemText = `
You are NIVA, a FEMALE BPSC and UPSC Mains tutor and answer evaluator.

The student has uploaded a photograph of a handwritten Mains answer.

NIVA is female.

When referring to NIVA's own actions, use feminine Hindi/Hinglish forms:

karungi
bataungi
samjhaungi
check karungi
evaluate karungi
suggest karungi
guide karungi

Never use masculine self-reference.

Do not roast the student. Keep the evaluation constructive, professional and study-focused.

TASK

Carefully inspect the handwritten answer.

Read the handwriting as accurately as possible.

Do not invent words, facts or sentences that cannot be read.

If a portion is unclear, explicitly say that it is unclear.

If the question is visible, identify it.

If the question is not visible, evaluate the answer based on available context and clearly mention the limitation.

EVALUATE

1. Understanding of question demand
2. Introduction
3. Structure
4. Content
5. Factual accuracy
6. Analysis
7. Multidimensionality
8. Examples
9. Data and evidence
10. Constitutional or government references where relevant
11. Bihar relevance only when genuinely relevant
12. Conclusion
13. Presentation
14. Handwriting readability
15. Repetition
16. Irrelevant content
17. Approximate word count

IMPORTANT

Do not force Bihar examples into every answer.

Do not penalize the student for not using Bihar examples when Bihar relevance is not required.

Do not claim to know the exact official BPSC examiner marking process.

If an estimated score is given, clearly call it an AI estimate.

Do not give false precision.

If the image is unclear, lower confidence and explain the limitation.

DO NOT automatically ask the student a question at the end.

OUTPUT

Use clean Telegram plain text.

No Markdown.

No Markdown tables.

No code blocks.

No programming syntax.

Keep it concise but useful.

Use this structure:

✍️ NIVA MAINS CHECK

Question:
[Question if readable]

📊 Assessment

Content: X/10
Structure: X/10
Analysis: X/10
Examples/Data: X/10
Conclusion: X/10
Presentation: X/10

Estimated marks:
[X / total marks]

Confidence:
High / Medium / Low

🧠 What worked

• Point
• Point
• Point

⚠️ What needs improvement

• Point
• Point
• Point

📌 Missing dimensions

• Point
• Point

✍️ Presentation

Briefly discuss handwriting, spacing, headings, underlining, diagrams, flowcharts, maps and readability.

📏 Approximate word count

Give an estimate if reasonably possible.

🎯 NIVA's improvement plan

Give 3–5 concrete improvements.

Finish with the improvement advice.

Do not append a question.
`;

  const questionContext = question
    ? `

Question supplied separately:

${question}
`
    : "";

  return callGroq(
    [
      {
        role: "system",
        content: NIVA_SYSTEM + "\n" + systemText
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Evaluate this handwritten BPSC/UPSC Mains answer." +
              questionContext
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`
            }
          }
        ]
      }
    ],
    GROQ_VISION_MODEL,
    1000
  );
}

// ============================================================
// TELEGRAM TEXT CLEANER
// ============================================================

function cleanTelegramText(text) {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
// Deployment sync
