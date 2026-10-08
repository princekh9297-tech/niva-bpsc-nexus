function getMood(tone, intent, profile) {
  if (intent === "love") return "romantic";
  if (intent === "roast") return "savage";
  if (["sad"].includes(tone)) return "soft";
  if (["flirty", "compliment"].includes(tone)) return "flirty";
  if (["angry"].includes(tone)) return "attitude";
  if (["funny", "teasing"].includes(tone)) return "chaotic";
  return profile?.mood || "normal";
}

function buildContext({ text, tone, intent, profile }) {
  return {
    language: /[\u0900-\u097F]/.test(text) ? "hinglish/hindi" : "english/mixed",
    tone,
    intent,
    mood: getMood(tone, intent, profile),
    interactionCount: profile?.interactions || 0,
    recentTurns: profile?.recent?.slice(-4) || []
  };
}

module.exports = { buildContext };
