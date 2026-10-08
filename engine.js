import { detectTone, detectIntent } from "./toneDetector.js";
import { POOLS } from "./responses.js";
import { getUser, saveUser } from "./storage.js";

const modes = new Set(["auto", "fun", "roast", "love", "flirt", "mature", "caring", "strict", "random"]);
const intensities = new Set(["soft", "normal", "bold", "intense"]);
const used = new Map();

// Expand the compact local bank into thousands of deterministic local variants.
// No network/API calls are involved.
const localStyleVariants = [
  "", " 😌", " 👀", " 😏", " 😂", " 😭", " 🤭", " 😈", " ❤️", " 🫂",
  " ✨", " 🙄", " 🥹", " 😎", " 😭😂", " 😏👀", " 😌✨", " 😂🤦",
  " 👀😏", " 😈😏", " ❤️😌", " 🫶", " 😭🫂", " 🤭😏", " 🙃", " :)",
  " ;) ", " :P", " xD", " hehe", " lol", " arre yaar", " accha ji", " oho"
];

function expandedPool(pool) {
  const out = [];
  const seen = new Set();
  const localOpeners = [
    "Arey", "Oho", "Accha ji", "Haan ji", "Hmm", "Oye", "Ji huzoor",
    "Arre wah", "Haan bolo", "Sun", "Theek hai", "Acha"
  ];

  for (const base of pool) {
    const clean = base.trim();
    if (!seen.has(clean)) { seen.add(clean); out.push(clean); }
    for (const opener of localOpeners) {
      for (const ending of localStyleVariants) {
        const variant = `${opener}, ${clean}${ending}`.replace(/\s+/g, " ").trim();
        if (!seen.has(variant)) {
          seen.add(variant);
          out.push(variant);
        }
        if (out.length >= 1200) return out;
      }
    }
  }
  return out;
}

const EXPANDED_POOLS = Object.fromEntries(
  Object.entries(POOLS).map(([tone, pool]) => [tone, expandedPool(pool)])
);

const modeTone = {
  fun: "funny",
  roast: "roast",
  love: "romantic",
  flirt: "flirty",
  mature: "mature",
  caring: "caring",
  strict: "serious"
};

function pick(pool, key, intensity = "normal") {
  const history = used.get(key) || [];
  const fresh = pool.filter(x => !history.includes(x));
  const candidates = fresh.length ? fresh : pool.slice(-Math.min(pool.length, 120));
  let answer = candidates[Math.floor(Math.random() * candidates.length)];

  // Intensity changes delivery without requiring an AI call.
  if (intensity === "soft") answer = soften(answer);
  if (intensity === "bold") answer = boldify(answer);
  if (intensity === "intense") answer = intensify(answer);

  const nextHistory = [...history, answer].slice(-14);
  used.set(key, nextHistory);
  return answer;
}

function soften(text) {
  if (/[😏👀🔥]/.test(text)) return text.replaceAll("😏", "😌").replaceAll("🔥", "✨");
  return text;
}

function boldify(text) {
  if (text.endsWith(".")) return text.slice(0, -1) + " 😏";
  return text;
}

function intensify(text) {
  if (text.includes("😂")) return text.replace("😂", "😂😏");
  if (text.includes("😌")) return text.replace("😌", "😌👀");
  if (text.includes("👀")) return text.replace("👀", "👀😏");
  return text + " 👀";
}

function nameMentioned(text) {
  return /(?:^|\s)@niva(?:\b|$)/i.test(text) || /\bniva\b/i.test(text);
}

export function shouldReply(text, isGroup, repliedToNiva) {
  if (!isGroup) return true;
  return nameMentioned(text) || repliedToNiva;
}

function contextualReply(text) {
  const t = text.trim().toLowerCase();
  if (/^(thanks|thank you|thx|ty)\b/.test(t)) return "Haan haan, formalities chhodo 😌";
  if (/\b(good night|gn)\b/.test(t)) return "Good night ji 😌 kal phir pareshaan karna. 🌙";
  if (/\b(good morning|gm)\b/.test(t)) return "Good morning ji ☀️ aaj kya kand karne ka plan hai?";
  if (/\b(how are you|how r u|kaisi ho|kaise ho)\b/.test(t)) return "Main mast 😌 tum batao, aaj ka mood kaisa hai?";
  return null;
}

export async function respond({ id, name, text, isGroup }) {
  const user = await getUser(id, name);
  const tone = detectTone(text);
  const intent = detectIntent(text);

  if (intent === "boyfriend") return "Princ. 😌❤️";
  if (intent === "identity") return "Main NIVA hoon 😌 tumhari desi bakchodi department ki permanent employee. 😂";

  const contextual = contextualReply(text);
  if (contextual) return contextual;

  let effectiveTone = tone;
  if (user.mode !== "auto") {
    if (user.mode === "random") {
      const options = ["casual", "funny", "teasing", "flirty", "romantic", "caring", "roast", "mature"];
      effectiveTone = options[Math.floor(Math.random() * options.length)];
    } else if (modeTone[user.mode]) {
      effectiveTone = modeTone[user.mode];
    }
  }

  const pool = EXPANDED_POOLS[effectiveTone] || EXPANDED_POOLS.casual;
  const intensity = intensities.has(user.intensity) ? user.intensity : "normal";
  const answer = pick(pool, `${id}:${effectiveTone}`, intensity);

  const recent = [
    ...(user.recent || []),
    { in: text.slice(0, 300), out: answer, tone: effectiveTone, at: Date.now() }
  ].slice(-20);

  await saveUser(id, {
    name,
    tone: effectiveTone,
    mood: effectiveTone,
    recent,
    interactions: (user.interactions || 0) + 1
  });

  return answer;
}

export async function setMode(id, mode) {
  if (!modes.has(mode)) return false;
  await saveUser(id, { mode });
  return true;
}

export async function setIntensity(id, intensity) {
  if (!intensities.has(intensity)) return false;
  await saveUser(id, { intensity });
  return true;
}
