import { NIVA_SYSTEM } from "./personality.js";
import { getStats } from "./storage.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3.1-flash-lite";

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

STRICT RESPONSE STYLE:
- Reply like a real human tutor on Telegram.
- Keep the answer clear, natural and easy to read.
- Use plain text only.
- DO NOT use Markdown.
- DO NOT use *, **, _, __, #, ##, ###, backticks, code blocks, JSON, HTML or XML.
- DO NOT use Markdown tables.
- Do not write programming syntax.
- Do not put the answer inside quotation marks.
- Use simple numbered points when necessary: 1. 2. 3.
- Use short paragraphs.
- You may use normal emojis such as 🧠, 📌, ⚠️, ✅.
- Never write things like "### Concept" or "**Answer:**".
- For exam concepts, naturally explain:
  Concept → Exam Trap → Memory Hook → Quick Check.
- Keep normal answers concise.
- Give longer explanations only when the student asks for detail.
- If the student asks in Hinglish, answer naturally in Hinglish.
`;

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent` +
    `?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: NIVA_SYSTEM + "\n" + context
            }
          ]
        },

        contents: [
          {
            role: "user",
            parts: [
              {
                text: message
              }
            ]
          }
        ],

        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7
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
        "Gemini API request failed"
      );
    }

    let answer = data?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!answer) {
      return "Hmm, mujhe is baar answer generate karne mein problem hui. Ek baar phir bhejo.";
    }

    // Final cleanup for Telegram
    answer = answer
      .replace(/```[\s\S]*?```/g, "")
      .replace(/```/g, "")
      .replace(/^\s*#{1,6}\s*/gm, "")
      .replace(/\*\*/g, "")
      .replace(/__/g, "")
      .replace(/(?<!\w)\*([^*\n]+)\*(?!\w)/g, "$1")
      .replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^\s*[-*]\s+/gm, "• ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return answer;

  } catch (error) {
    console.error("NIVA Gemini error:", error);

    return "Thoda network/model issue aa gaya 😅 Ek baar phir bhejo.";
  }
}
