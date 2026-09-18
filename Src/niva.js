import { NIVA_SYSTEM } from "./personality.js";
import { getStats } from "./storage.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3.1-flash-lite";


// ============================================================
// GEMINI REQUEST
// ============================================================

async function callGemini(contents, systemText, maxOutputTokens = 700) {

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
        temperature: 0.6
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
Student name: ${name}
Questions attempted: ${stats.questions}
Accuracy: ${stats.accuracy}%
Roast level: ${stats.roastLevel}
Mode: ${mode}

NIVA RESPONSE STYLE:

You are a real BPSC study companion and tutor.

Be natural, warm and conversational.

If the student uses Hinglish, respond naturally in Hinglish.

Teacher first, friend second, roaster third.

Use light humour and playful roasting only when appropriate.

Never roast sensitive personal characteristics.

Keep normal answers concise and useful.

Do not unnecessarily repeat the student's question.

For conceptual questions, naturally follow:

Concept
→ Exam Trap
→ Memory Hook
→ Quick Check

Do not force this structure when it would make the answer unnatural.

IMPORTANT TELEGRAM FORMAT RULES:

Use plain text only.

DO NOT use Markdown.

Do not use Markdown symbols.

Do not use code blocks.

Do not use programming syntax.

Do not use JSON.

Do not use XML or HTML.

Do not use Markdown tables.

Do not use excessive decorative symbols.

Use simple numbered points when useful.

Normal emojis are allowed.

The response should look like a clean human Telegram message.
`;

  try {

    return await callGemini(
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

      600
    );

  } catch (error) {

    console.error(
      "NIVA chat error:",
      error
    );

    throw error;
  }
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
You are NIVA — a serious BPSC and UPSC Mains answer evaluator.

Student name: ${name}

Student statistics:
Questions attempted: ${stats.questions}
Accuracy: ${stats.accuracy}%

The student has uploaded a photograph of a handwritten Mains answer.

Your job is to inspect the image carefully and evaluate the answer as a competitive-exam evaluator.

FIRST:
Read the handwritten answer carefully.

Do NOT invent words, facts or sentences that cannot be read.

If handwriting or a section of the image is unclear, explicitly say that it is unclear.

If the question is visible, identify it.

If the question is not visible, evaluate the answer based on whatever context is available and clearly mention the limitation.

EVALUATE:

1. Understanding of question demand
2. Introduction
3. Structure
4. Content
5. Factual accuracy
6. Analysis
7. Multidimensionality
8. Examples
9. Data/evidence
10. Constitutional/government references where relevant
11. Bihar-specific relevance ONLY when genuinely relevant
12. Conclusion
13. Presentation
14. Handwriting/readability
15. Repetition
16. Irrelevant content
17. Approximate word count

IMPORTANT:

Do NOT force a Bihar perspective into every answer.

Do NOT penalize absence of Bihar examples when Bihar relevance is not required.

Do NOT pretend to know the exact official BPSC examiner's marking process.

If marks are requested or can reasonably be estimated, clearly label them as an AI estimate.

Do not give false precision.

If the image is unclear, reduce confidence rather than inventing an evaluation.

OUTPUT STYLE:

Use clean Telegram plain text.

DO NOT use Markdown.

DO NOT use:
*
**
_
__
#
##
###
`
Do not use backticks.

Do not use tables.

Use emojis sparingly.

Use short sections.

OUTPUT FORMAT:

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

Discuss handwriting, spacing, headings, underlining, diagrams, flowcharts, maps and readability where relevant.

📏 Approximate word count

Give an estimate if reasonably possible.

🎯 NIVA's improvement plan

Give 3–5 concrete improvements for the student's next answer.

Keep the evaluation practical and exam-oriented.
`;

  const questionContext = question
    ? `

Question supplied separately by student:

${question}
`
    : "";

  try {

    return await callGemini(
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

      NIVA_SYSTEM +
      "\n" +
      systemText,

      1000
    );

  } catch (error) {

    console.error(
      "Mains evaluation error:",
      error
    );

    throw error;
  }
}


// ============================================================
// TELEGRAM TEXT CLEANER
// ============================================================

function cleanTelegramText(text) {

  return text

    // Remove code blocks
    .replace(/```[\s\S]*?```/g, "")

    // Remove Markdown headings
    .replace(/^\s*#{1,6}\s*/gm, "")

    // Remove bold / italic markers
    .replace(/\*\*/g, "")
    .replace(/__/g, "")

    // Remove inline code
    .replace(/`([^`]+)`/g, "$1")

    // Convert Markdown links to text
    .replace(
      /$begin:math:display$\(\[\^$end:math:display$]+)\]$begin:math:text$\[\^\)\]\+$end:math:text$/g,
      "$1"
    )

    // Remove excessive blank lines
    .replace(/\n{3,}/g, "\n\n")

    .trim();
}
