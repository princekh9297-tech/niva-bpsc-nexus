import OpenAI from "openai";
import { NIVA_SYSTEM } from "./personality.js";
import { getStats } from "./storage.js";

const client = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

export async function askNiva({userId, name, message, mode="teacher"}) {
  const stats = getStats(userId);
  const context = `
Student name: ${name}
Questions attempted: ${stats.questions}
Accuracy: ${stats.accuracy}%
Roast level: ${stats.roastLevel}
Mode: ${mode}
`;
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5.6",
    instructions: NIVA_SYSTEM + "\n" + context,
    input: message
  });
  return response.output_text?.trim() || "Hmm, mujhe is baar answer generate karne mein problem hui. Ek baar phir bhejo.";
}
