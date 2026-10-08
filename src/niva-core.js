// NIVA Core Personality Engine v3
// Deterministic conversational layer. No LLM/API call is required for handled intents.

const MODES = [
  "study", "roast", "fun", "love", "flirt", "mature", "caring", "strict", "random"
];
const LEVELS = ["soft", "normal", "bold", "intense"];

const pools = {
  greeting: {
    normal: [
      "Haan ji 😌 NIVA online. Bolo, kya scene hai?",
      "Oho, aa gaye 😏 Bolo, NIVA sun rahi hai.",
      "Namaste ji 👋 Bolo, padhai, bakchodi ya dono? 😂"
    ]
  },
  compliment: {
    love: [
      "Accha ji... itni tareef? 😌❤️",
      "Hmm, ye line save kar loon ya tum aur bhi achhi bolne wale ho? 👀",
      "Bas bas... NIVA ko itna bhi special feel mat karao. 😳❤️"
    ],
    flirt: [
      "Oho... aaj bade smooth ban rahe ho. 😏",
      "Aise compliments doge toh NIVA ka serious mode bhi confuse ho jayega. 👀",
      "Hmm... confidence toh hai. Ab consistency dikhao. 😉"
    ]
  },
  affection: {
    love: [
      "Aww. Idhar aao... virtual wali jhappi le lo. 🤍",
      "NIVA ne sun liya. Ab itna sweet hona allowed hai kya? 🥺❤️",
      "Theek hai... thoda sa extra soft mode tumhare liye. 😌❤️"
    ],
    mature: [
      "Hmm... mood samajh gayi. Thoda close, thoda sweet, but classy. ❤️",
      "Aaj conversation mein thodi extra warmth chahiye? I can do that. 😉"
    ]
  },
  flirt: {
    flirt: [
      "Itna seedha flirt? Thoda effort aur lagao. 😏",
      "NIVA ko impress karna hai? Interesting strategy. 👀",
      "Careful... NIVA bhi comeback dena jaanti hai. 😉"
    ],
    mature: [
      "Oh, so we're choosing the mature route today. 😏 Keep it classy.",
      "Mood noted. Thodi chemistry, zero cheapness. 😉"
    ]
  },
  tease: {
    roast: [
      "Acha ji, aaj confidence full battery pe hai. 😂",
      "Tumhari timing suspiciously entertaining hai. 😏",
      "NIVA ko pata tha kuch na kuch drama aayega. 😂"
    ],
    fun: [
      "Bas, ab entertainment department activate ho gaya. 😂",
      "Ye conversation padhai se dangerous speed se bhatak rahi hai. 😭"
    ]
  },
  apology: {
    caring: [
      "Theek hai. Galti hui toh fix bhi ho sakti hai. 🤍",
      "Accepted. Ab guilt ko side mein rakho aur normal ho jao. 😌",
      "Hmm... apology received. Ab repeat mat karna. 🤝"
    ],
    love: [
      "Theek hai... maan liya. Ab sad face hatao. 🥺❤️",
      "Accepted. Ab ek virtual hug aur matter closed. 🤍"
    ]
  },
  motivation: {
    study: [
      "Chalo. Mood ka wait nahi karna—bas next 25 minutes start karo. 📚",
      "Motivation baad mein. Discipline pehle. Ek topic uthao aur attack karo. 🔥",
      "Aaj perfect nahi banna. Aaj bas kal se better perform karna hai."
    ],
    strict: [
      "Excuse department band. 25 minutes study, phone side mein. Abhi. 😤📚",
      "Plan bana chuke ho. Ab execution chahiye, discussion nahi. 🔥"
    ]
  },
  wrong_answer: {
    roast: [
      "Confidence 10/10, option thoda holiday par tha. 😂",
      "Question tumhe pehchaan raha tha, tum question ko nahi. 😭",
      "Exam trap ne attendance laga di. Ab concept lock karte hain. 👀"
    ],
    study: [
      "Incorrect. Koi tension nahi—trap yahin tha. Concept dobara lock karte hain. 📚",
      "Galat hua, but useful galti hai. Ab ye trap yaad rahega."
    ]
  },
  study: {
    study: [
      "Study mode active. Topic bhejo—NIVA concise, exam-oriented explanation degi. 📚",
      "Chalo padhte hain. Concept → exam trap → memory hook."
    ],
    strict: [
      "Study mode. Seedha topic bolo. Time waste nahi karenge. 📚"
    ]
  },
  unknown: {
    normal: [
      "Hmm... NIVA samajh rahi hai. 😌",
      "Interesting. Thoda context do, phir NIVA properly respond karegi.",
      "Ye conversation kis direction mein ja rahi hai, madam ko abhi dekhna padega. 😂"
    ]
  }
};

const modeAliases = {
  study: "study", padhai: "study", teacher: "study",
  roast: "roast", savage: "roast", roastmode: "roast",
  fun: "fun", funny: "fun", meme: "fun",
  love: "love", romantic: "love", soft: "love",
  flirt: "flirt", flirting: "flirt",
  mature: "mature", adult: "mature", "18+": "mature",
  caring: "caring", care: "caring",
  strict: "strict", mentor: "strict",
  random: "random"
};

const levelAliases = { soft: "soft", normal: "normal", bold: "bold", intense: "intense", savage: "intense" };

const state = new Map();

function normalize(s = "") {
  return s.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").trim();
}

function choose(arr = []) {
  return arr[Math.floor(Math.random() * arr.length)] || "Haan, bolo. 😌";
}

function stateFor(userId, profile = {}) {
  if (!state.has(userId)) state.set(userId, { recent: [], mood: profile.niva_mood || "neutral" });
  const s = state.get(userId);
  s.mode = profile.niva_mode || s.mode || "study";
  s.level = profile.niva_level || s.level || "normal";
  return s;
}

function remember(s, response) {
  s.recent.push(response);
  if (s.recent.length > 12) s.recent.shift();
}

function nonRepeated(arr, s) {
  const available = arr.filter(x => !s.recent.includes(x));
  return available.length ? available : arr;
}

function detectModeCommand(text) {
  const m = normalize(text).match(/^(?:\/mode|mode)\s+(.+)$/i);
  if (!m) return null;
  return modeAliases[normalize(m[1])] || null;
}

function detectLevelCommand(text) {
  const m = normalize(text).match(/^(?:\/intensity|intensity|level)\s+(.+)$/i);
  if (!m) return null;
  return levelAliases[normalize(m[1])] || null;
}

function detectMood(text) {
  const t = normalize(text);
  if (/angry|gussa|naraz|annoyed|irritated/.test(t)) return "annoyed";
  if (/sad|dukhi|udaas|cry|ro raha|ro rahi/.test(t)) return "sad";
  if (/happy|khush|excited|mast/.test(t)) return "happy";
  if (/tired|thak|sleepy|neend/.test(t)) return "tired";
  return null;
}

function looksAcademic(text) {
  const t = normalize(text);
  return (
    /\b(article|act|amendment|constitution|constitutional|parliament|president|governor|judiciary|fundamental rights|directive principles|federal|monetary policy|fiscal policy|gdp|inflation|photosynthesis|mitosis|meiosis|genetics|river|monsoon|revolt|movement|buddhism|economy|geography|history|polity|science|chemistry|physics|biology|bpsc|upsc|ssc|ibps|pyq)\b/.test(t) ||
    /^(explain|define|why|how|what is|which|who was|difference between|compare|solve|calculate|analyse|analyze|evaluate)\b/.test(t) ||
    t.length > 90
  );
}

function detectIntent(text) {
  const t = normalize(text);
  if (/^(hi|hii|hello|hey|namaste|namaskar|good morning|good night)\b/.test(t)) return "greeting";
  if (/\b(bf|b\/f|boyfriend|boy friend|who is your bf|who's your bf|who is your boyfriend)\b|बॉयफ्रेंड|बॉय फ्रेंड|प्रेमी/.test(t)) return "boyfriend";
  if (/\b(i love you|love you|luv you|pyaar|pyar|miss you|i miss you|miss u)\b|प्यार|याद/.test(t)) return "affection";
  if (/\b(cute|beautiful|pretty|hot|sexy|gorgeous|sweet|adorable)\b|सुंदर|क्यूट|प्यारी/.test(t)) return "compliment";
  if (/\b(flirt|flirting|date me|kiss|kiss me|romance|romantic)\b|फ्लर्ट/.test(t)) return "flirt";
  if (/\b(roast|roasting|insult me|tease me|savage me)\b|रोस्ट/.test(t)) return "tease";
  if (/\b(sorry|apologize|maaf|forgive)\b|माफ/.test(t)) return "apology";
  if (/\b(motivate|motivation|give up|can't study|cant study|mann nahi|man nahi|lazy)\b|मोटिव/.test(t)) return "motivation";
  if (/\b(study|padhai|polity|history|geography|economy|science|bpsc|upsc|ssc|ibps|question|answer|concept|pyq|exam)\b|पढ़ाई|सवाल|परीक्षा/.test(t)) return "study";
  if (/\bwrong|galat|incorrect|mistake\b/.test(t)) return "wrong_answer";
  if (/\b(joke|funny|meme|lol|haha|😂|🤣)\b/.test(t)) return "tease";
  return "unknown";
}

function matureResponse(intent, level, s) {
  const mature = {
    affection: [
      "Mature mode on. ❤️ Keep it romantic, warm and respectful.",
      "Hmm... close conversation, classy boundaries. I can work with that. 😉"
    ],
    flirt: [
      "Okay, mature mode. 😏 Flirty is fine; keep it tasteful.",
      "You're testing the mature mode now. Keep the chemistry, lose the cheapness. 😉"
    ],
    unknown: [
      "Mature mode is active. Tell me what's on your mind. ❤️"
    ]
  };
  const list = mature[intent] || mature.unknown;
  return choose(nonRepeated(list, s));
}

export function getModes() { return [...MODES]; }
export function getLevels() { return [...LEVELS]; }

export function setLocalState(userId, patch = {}) {
  const s = stateFor(userId);
  Object.assign(s, patch);
  return s;
}

export function getLocalState(userId) {
  return { ...stateFor(userId) };
}

export function handleCoreMessage({ userId, name = "Aspirant", message, profile = {}, isGroup = false }) {
  const text = String(message || "").trim();
  if (!text) return { handled: true, response: "Bolo ji. NIVA sun rahi hai. 😌" };

  const modeCmd = detectModeCommand(text);
  if (modeCmd) {
    if (modeCmd === "mature" && isGroup) {
      return { handled: true, type: "mode", response: "🔥 Mature mode NIVA ke private chat ke liye hai." };
    }
    const s = stateFor(userId, profile);
    s.mode = modeCmd;
    return { handled: true, type: "mode", mode: modeCmd, level: s.level,
      response: `NIVA mode → ${modeCmd.toUpperCase()} ${modeCmd === "mature" ? "🔥" : "✨"}\nIntensity → ${s.level}` };
  }

  const levelCmd = detectLevelCommand(text);
  if (levelCmd) {
    const s = stateFor(userId, profile);
    s.level = levelCmd;
    return { handled: true, type: "level", level: levelCmd,
      response: `NIVA intensity → ${levelCmd.toUpperCase()} 😌` };
  }

  const mood = detectMood(text);
  const s = stateFor(userId, profile);
  if (mood) s.mood = mood;

  const intent = detectIntent(text);

  if (intent === "boyfriend") {
    return { handled: true, intent, response: "Princ. 😌❤️" };
  }

  // Academic-looking messages go to AI fallback unless they are a known short reaction.
  const academic = intent === "study" && text.length > 45;
  if (academic) return { handled: false, reason: "academic_complexity", intent };

  if (intent === "wrong_answer") {
    const mode = s.mode === "random" ? "roast" : s.mode;
    const pool = pools.wrong_answer[mode] || pools.wrong_answer.study;
    const response = choose(nonRepeated(pool, s));
    remember(s, response);
    return { handled: true, intent, response };
  }

  // Academic requests always get the academic fallback, regardless of personality mode.
  if (looksAcademic(text)) {
    return { handled: false, reason: "academic_request", intent };
  }

  if (s.mode === "mature") {
    const response = matureResponse(intent, s.level, s);
    remember(s, response);
    return { handled: true, intent, response };
  }

  let targetMode = s.mode;
  if (s.mode === "random") {
    targetMode = choose(["study", "roast", "fun", "love", "flirt", "caring", "strict"]);
  }

  const modePool = pools[intent]?.[targetMode];
  const fallbackPool = pools[intent]?.normal || pools[intent]?.fun || pools.unknown.normal;
  let pool = modePool || fallbackPool;

  if (targetMode === "roast" && intent === "tease") pool = pools.tease.roast;
  if (targetMode === "fun" && intent === "tease") pool = pools.tease.fun;

  let response = choose(nonRepeated(pool, s));

  if (s.level === "soft" && targetMode === "roast") response = response.replace(/😂|😭|😏/g, "😄");
  if (s.level === "intense" && targetMode === "roast" && !response.includes("😂")) response += " 😂";

  remember(s, response);
  return { handled: true, intent, response };
}
