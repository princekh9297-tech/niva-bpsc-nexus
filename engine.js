import { detectTone, detectIntent } from "./toneDetector.js";
import { POOLS } from "./responses.js";
import { getUser, saveUser } from "./storage.js";

const used = new Map();
const modes = new Set(["auto","fun","roast","love","flirt","mature","caring","strict","random"]);

function pick(pool, key) {
  const history = used.get(key) || [];
  const candidates = pool.filter(x => !history.includes(x));
  const list = candidates.length ? candidates : pool;
  const answer = list[Math.floor(Math.random() * list.length)];
  used.set(key, [...history, answer].slice(-8));
  return answer;
}

function nameMentioned(text) { return /\bniva\b/i.test(text) || /@niva\b/i.test(text); }

export function shouldReply(text, isGroup, repliedToNiva) {
  if (!isGroup) return true;
  return nameMentioned(text) || repliedToNiva;
}

export async function respond({ id, name, text, isGroup }) {
  const user = await getUser(id, name);
  const tone = detectTone(text);
  const intent = detectIntent(text);

  if (intent === "boyfriend") return "Princ. 😌❤️";
  if (intent === "identity") return "Main NIVA hoon 😌 tumhari desi bakchodi department ki permanent employee. 😂";

  let effectiveTone = tone;
  if (user.mode !== "auto") {
    const map = { fun:"funny", roast:"roast", love:"romantic", flirt:"flirty", mature:"mature", caring:"caring", strict:"serious", random:null };
    if (user.mode !== "random" && map[user.mode]) effectiveTone = map[user.mode];
    if (user.mode === "random") {
      const options = ["casual","funny","teasing","flirty","romantic","caring","roast"];
      effectiveTone = options[Math.floor(Math.random() * options.length)];
    }
  }

  const pool = POOLS[effectiveTone] || POOLS.casual;
  let answer = pick(pool, `${id}:${effectiveTone}`);

  // Small contextual adjustments without an LLM.
  if (/\b(thanks|thank you|thx|ty)\b/i.test(text)) answer = "Haan haan, formalities chhodo 😌";
  if (/\b(good night|gn)\b/i.test(text)) answer = "Good night ji 😌 kal phir pareshaan karna. 🌙";
  if (/\b(good morning|gm)\b/i.test(text)) answer = "Good morning ji ☀️ aaj kya kand karne ka plan hai?";

  const recent = [...(user.recent || []), { in: text.slice(0, 300), out: answer, tone: effectiveTone, at: Date.now() }].slice(-12);
  await saveUser(id, { name, tone: effectiveTone, recent, interactions: (user.interactions || 0) + 1 });
  return answer;
}

export async function setMode(id, mode) {
  if (!modes.has(mode)) return false;
  await saveUser(id, { mode }); return true;
}

export async function setIntensity(id, intensity) {
  if (!["soft","normal","bold","intense"].includes(intensity)) return false;
  await saveUser(id, { intensity }); return true;
}
