const TONE_PATTERNS = [
  ["romantic", /(love you|i love you|miss you|pyaar|mohabbat|jaan|baby|darling|date pe|date night|hug me|kiss me)/i],
  ["flirty", /(flirt|hot|gorgeous|beautiful|sexy|cute|crush|attractive|looking good|patakha|haseen|sundar|naughty|shararti)/i],
  ["teasing", /(mazak|mazaak|tease|chhed|chidh|pagal|bakchodi|nautanki|drama|hero|maharaj|janab)/i],
  ["sad", /(sad|dukhi|udaas|lonely|akela|akeli|ro raha|ro rahi|cry|rona|hurt|bura lag)/i],
  ["angry", /(gussa|angry|irritated|annoyed|frustrat|chup|shut up|bakwaas|ghussa)/i],
  ["serious", /(serious|sach bata|honestly|seriously|advice|opinion|problem|issue|kya karu|what should i do)/i],
  ["compliment", /(beautiful|gorgeous|pretty|cute|amazing|awesome|lovely|sweet|sexy|best girl|smart)/i],
  ["funny", /(joke|meme|funny|hasao|hasi|lol|😂|🤣|haha|bakchodi)/i]
];

function detectTone(text = "") {
  for (const [tone, pattern] of TONE_PATTERNS) {
    if (pattern.test(text)) return tone;
  }
  return "normal";
}

module.exports = { detectTone };
