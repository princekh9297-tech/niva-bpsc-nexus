const crypto = require("crypto");
const responses = require("./responses");

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hash(s) {
  return crypto.createHash("sha1").update(s).digest("hex").slice(0, 10);
}

function cleanName(name) {
  return String(name || "").replace(/[^\p{L}\p{N}_ -]/gu, "").trim();
}

function personalize(text, profile) {
  const name = cleanName(profile?.nickname || "");
  if (!name) return text;
  // Light personalization only; avoid forcing names into every reply.
  if (Math.random() > 0.82) return `${name}, ${text}`;
  return text;
}

function generateResponse({ intent, tone, profile, usedIds = [] }) {
  const key = responses[intent] ? intent : (responses[tone] ? tone : "chat");
  const pool = responses[key] || responses.chat;
  const used = new Set(usedIds);
  let candidates = pool.filter((x, i) => !used.has(hash(`${key}:${i}:${x}`)));
  if (!candidates.length) candidates = pool;

  const text = personalize(pick(candidates), profile);
  const idx = pool.indexOf(text);
  const id = hash(`${key}:${idx}:${text}`);
  return { text, id };
}

module.exports = { generateResponse };
