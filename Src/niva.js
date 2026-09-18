import { NIVA_SYSTEM } from "./personality.js";
import { getStats } from "./storage.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3.5-flash";

export async function askNiva({ userId, name, message, mode = "teacher" }) {
  const stats = await getStats(userId);

  const context = `
Student name: ${name}
Questions attempted: ${stats.questions}
Accuracy: ${stats.accuracy}%
Roast level: ${stats.roastLevel}
Mode: ${mode}
`;

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
      ]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Gemini API error:", JSON.stringify(data, null, 2));
    throw new Error(
      data?.error?.message || "Gemini API request failed"
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
}
