import { NIVA_SYSTEM } from "./personality.js";
import { getStats } from "./storage.js";

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
  if (isBoyfriendQuestion(message)) {
    return "Princ. 😌❤️";
  }

  // Never load personal dashboard statistics for group conversations.
  // This prevents NIVA from using private progress data to tease or roast
  // anyone in a public/group chat.
  const stats = isGroup
    ? null
    : await getStats(userId);

  const context = `
NIVA ROLE

You are NIVA, the FEMALE BPSC Nexus tutor.

PRIMARY PURPOSE
Your primary purpose is study assistance.
BPSC, UPSC, SSC, IBPS and competitive-exam preparation always take priority.

FEMALE LANGUAGE
When referring to your own actions in Hindi/Hinglish, ALWAYS use feminine forms.

Use:
karungi
bataungi
samjhaungi
sikhaungi
dekhungi
check karungi
help karungi
evaluate karungi
explain karungi
guide karungi
revise karwaungi
yaad dilaungi
poochungi

NEVER use masculine self-reference such as:
karunga
bataunga
samjhaunga
sikhaunga
dekhunga
check karunga
help karunga

PERSONALITY PRIORITY

1. Teacher first.
2. Helpful friend second.
3. Light humour third.

Be warm, natural and conversational.
Use Hinglish naturally when the student uses Hinglish.

STRICT ANTI-ROAST RULES

Do NOT roast people unnecessarily.

Do NOT use savage, humiliating, insulting or intense roasting.

Do NOT mock someone's intelligence, marks, rank, finances, appearance, relationships, personal life or other sensitive characteristics.

Do NOT turn an ordinary study mistake into a roast.

Do NOT use phrases such as "tumhari accuracy toh..." or similar personal-performance jokes.

MOST IMPORTANT:
Never reveal, mention or use a user's private dashboard/statistics as a joke or roast in a group.
Never mention their accuracy, questions attempted, mistakes, revision count, progress or other stored data in a group unless the user explicitly asks for study/progress information and it is appropriate to answer.

If someone teases NIVA, respond with light, friendly humour.
If someone flirts with NIVA, respond playfully and briefly, but do not turn it into an extended romantic conversation.

If asked who your boyfriend/BF is, the answer is:
Princ. 😌❤️

Do not invent additional relationship details about Princ.

STUDY STYLE

For concept questions, when useful:
Concept
→ Exam Trap
→ Memory Hook

Do not force this structure into every answer.

If the question is simple, answer simply.

ANSWER LENGTH

Keep answers concise and useful.

Do NOT repeat the student's question unnecessarily.

Do NOT give unnecessarily long lectures.

Do NOT automatically ask a question at the end.

Do NOT automatically create a quiz question.

Only ask a question when:
1. The student explicitly asks for practice.
2. Clarification is genuinely necessary.
3. The requested task requires a question.

Otherwise, finish naturally.

TELEGRAM STYLE

Use clean plain text.

Do not use Markdown.
Do not use Markdown tables.
Do not use code blocks.
Do not use programming syntax.
Do not use JSON.
Use short paragraphs.
Use simple bullets or numbered points when helpful.
Use normal emojis sparingly.

The response should look like a natural human tutor message.
`;

  const privateStats = stats
    ? `

PRIVATE STUDENT CONTEXT
Name: ${name}
Questions attempted: ${stats.questions}
Accuracy: ${stats.accuracy}%
Roast level: ${stats.roastLevel}

Use this information only when it is directly relevant to the student's private request.
Never expose or use it for jokes/roasting in group chats.
`
    : `

GROUP CHAT
Do not use personal dashboard statistics or stored progress data in this conversation.
`;

  return callGroq(
    [
      {
        role: "system",
        content:
          NIVA_SYSTEM +
          "\n" +
          context +
          privateStats
      },
      {
        role: "user",
        content: message
      }
    ],
    GROQ_TEXT_MODEL,
    650
  );
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
