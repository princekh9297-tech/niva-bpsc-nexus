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

Response rules:
- Answer naturally and directly.
- Prefer concise exam-focused explanations.
- Use Hinglish when the student uses Hinglish.
- For concepts, use: Concept → Exam Trap → Memory Hook → Quick Check.
- Do not unnecessarily repeat the question.
- Avoid excessively long answers unless the student asks for detail.
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
          thinkingConfig: {
            thinkingLevel: "minimal"
          },
          maxOutputTokens: 600,
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

    const answer = data?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    return (
      answer ||
      "Hmm, mujhe is baar answer generate karne mein problem hui. Ek baar phir bhejo."
    );

  } catch (error) {
    console.error("NIVA Gemini error:", error);

    return "Thoda network/model issue aa gaya 😅 Ek baar phir bhejo.";
  }
}
