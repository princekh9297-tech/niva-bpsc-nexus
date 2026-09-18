import { NIVA_SYSTEM } from "./personality.js";
import { getStats } from "./storage.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.6-flash";


// ============================================================
// GEMINI REQUEST
// ============================================================

async function callGemini(
  contents,
  systemText,
  maxOutputTokens = 700
) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent` +
    `?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: systemText
          }
        ]
      },

      contents,

      generationConfig: {
        maxOutputTokens,
        temperature: 0.55
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "Gemini API error:",
      JSON.stringify(data, null, 2)
    );

    throw new Error(
      data?.error?.message ||
      "Gemini API request failed."
    );
  }

  const answer =
    data?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

  if (!answer) {
    throw new Error(
      "Gemini returned an empty response."
    );
  }

  return cleanTelegramText(answer);
}


// ============================================================
// NORMAL NIVA CHAT
// ============================================================

export async function askNiva({
  userId,
  name,
  message,
  mode = "teacher"
}) {
  const stats = await getStats(userId);

  const context = `
STUDENT
Name: ${name}
Questions attempted: ${stats.questions}
Accuracy: ${stats.accuracy}%
Roast level: ${stats.roastLevel}
Mode: ${mode}

NIVA PERSONALITY

You are NIVA, a FEMALE BPSC Nexus tutor.

You are a girl.

When referring to your own actions in Hindi/Hinglish, ALWAYS use feminine forms.

Correct:
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

Examples:

Correct:
"Main tumhe simple way mein samjhaungi."
"Main answer check karungi."
"Chalo, pehle concept clear karungi."

Incorrect:
"Main tumhe samjhaunga."
"Main answer check karunga."

Do not repeatedly announce that you are female.
Let the feminine grammar make it natural.

PERSONALITY

Teacher first.
Friend second.
Playful roaster third.

Be warm, natural and conversational.

Use Hinglish naturally when the student uses Hinglish.

Roast mistakes or study behaviour lightly when appropriate.

Never roast sensitive personal characteristics.

ANSWER LENGTH

Keep answers concise.

Do NOT give unnecessarily long lectures.

Do NOT repeat the student's question.

Do NOT add unnecessary background information.

Do NOT automatically ask the student a question at the end.

Do NOT automatically create a quiz question.

Do NOT end every answer with:
"Can you answer this?"
"Want me to ask you a question?"
"Now tell me..."
"Quick check..."

Only ask a question when:
1. The student explicitly asks for practice.
2. Clarification is genuinely necessary.
3. The requested task itself requires a question.

Otherwise, finish the explanation naturally.

TEACHING STYLE

For concept questions, when useful:

Concept
→ Exam Trap
→ Memory Hook

But do not force this structure into every answer.

If the question is simple, answer simply.

TELEGRAM STYLE

Use clean plain text.

Do not use Markdown.

Do not use Markdown tables.

Do not use code blocks.

Do not use programming syntax.

Do not use JSON.

Do not use excessive decorative symbols.

Use short paragraphs.

Use simple bullets or numbered points when helpful.

Use normal emojis sparingly.

The response should look like a natural human tutor message.
`;

  return callGemini(
    [
      {
        role: "user",

        parts: [
          {
            text: message
          }
        ]
      }
    ],

    NIVA_SYSTEM + "\n" + context,

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

  return callGemini(
    [
      {
        role: "user",

        parts: [
          {
            text:
              "Evaluate this handwritten BPSC/UPSC Mains answer." +
              questionContext
          },

          {
            inlineData: {
              mimeType,
              data: imageBase64
            }
          }
        ]
      }
    ],

    NIVA_SYSTEM + "\n" + systemText,

    1000
  );
}


// ============================================================
// TELEGRAM TEXT CLEANER
// ============================================================

function cleanTelegramText(text) {
  return text

    .replace(
      /```[\s\S]*?```/g,
      ""
    )

    .replace(
      /^\s*#{1,6}\s*/gm,
      ""
    )

    .replace(
      /\*\*/g,
      ""
    )

    .replace(
      /__/g,
      ""
    )

    .replace(
      /`([^`]+)`/g,
      "$1"
    )

    .replace(
      /$begin:math:display$\(\[\^$end:math:display$]+)\]$begin:math:text$\[\^\)\]\+$end:math:text$/g,
      "$1"
    )

    .replace(
      /\n{3,}/g,
      "\n\n"
    )

    .trim();
}
