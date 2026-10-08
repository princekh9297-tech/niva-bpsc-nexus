const groups = {
  greeting: [/\b(hi|hello|hey|hii|hlo|namaste|salam)\b/i, /नमस्ते|हाय|हेलो/i],
  funny: [/😂|🤣|😹|lmao|lol|haha|hahaha|mazak/i],
  teasing: [/\b(pagal|stupid|idiot|chomu|nautanki|drama|bakchod|bakchodi|abe|oye)\b/i, /पागल|नौटंकी|ड्रामा/i],
  angry: [/\b(angry|gussa|hate|shut up|chup|fuck off)\b/i, /गुस्सा|चुप/i],
  sad: [/\b(sad|depressed|low|cry|crying|upset|bad day|hurt)\b/i, /दुखी|उदास|रोना|परेशान/i, /😭|🥺|💔/],
  caring: [/\b(help me|need you|miss you|missed you|lonely|alone)\b/i, /याद|अकेला|अकेली|मदद/i, /🫂|🥹/],
  flirty: [/\b(hot|cute|sexy|beautiful|handsome|kiss|date|crush|flirt|baby|jaan|babe)\b/i, /क्यूट|हॉट|जान|बेबी|चुम्मा|चुंबन/i, /😘|😍|😏|👀|❤️/],
  romantic: [/\b(love you|i love|romantic|girlfriend|boyfriend|wife|husband|marry|shaadi)\b/i, /प्यार|प्रेम|शादी|गर्लफ्रेंड|बॉयफ्रेंड/i, /❤️|💕|💋/],
  mature: [/\b(18\+|adult|mature|nsfw|naughty|dirty talk|turn me on|horny)\b/i, /18\+|एडल्ट|नॉटी/i],
  roast: [/\b(roast me|roast|insult me|be savage|savage me)\b/i, /रोस्ट कर|बेइज्जत कर/i],
  serious: [/\b(seriously|serious|genuinely|important|listen)\b/i, /सीरियस|सच में|जरूरी/i]
};

export function detectTone(text) {
  const hits = [];
  for (const [tone, patterns] of Object.entries(groups)) if (patterns.some(p => p.test(text))) hits.push(tone);
  if (!hits.length) return "casual";
  if (hits.includes("sad")) return "sad";
  if (hits.includes("angry")) return "angry";
  if (hits.includes("mature")) return "mature";
  if (hits.includes("roast")) return "roast";
  if (hits.includes("romantic")) return "romantic";
  if (hits.includes("flirty")) return "flirty";
  if (hits.includes("caring")) return "caring";
  if (hits.includes("teasing")) return "teasing";
  if (hits.includes("funny")) return "funny";
  if (hits.includes("serious")) return "serious";
  return hits[0];
}

export function detectIntent(text) {
  const t = text.toLowerCase();
  if (/who.*(bf|boyfriend)|boyfriend.*who|बॉयफ्रेंड|बॉय फ्रेंड/.test(t)) return "boyfriend";
  if (/\b(name|who are you)\b|तुम कौन|नाम क्या/.test(t)) return "identity";
  if (/\b(roast|savage)\b|रोस्ट/.test(t)) return "roast";
  if (/\b(mode|mood|intensity)\b/.test(t)) return "settings";
  return "chat";
}
