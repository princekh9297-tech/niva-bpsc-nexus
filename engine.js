const { detectTone } = require("./toneDetector");
const { detectIntent } = require("./intentDetector");
const { buildContext } = require("./contextEngine");
const { generateResponse } = require("./responseEngine");

function handleMessage({ text, profile }) {
  const tone = detectTone(text);
  const intent = detectIntent(text);

  if (intent === "boyfriend") {
    return { text: "Princ 😌", tone, intent, context: buildContext({ text, tone, intent, profile }) };
  }
  if (intent === "secret") {
    return {
      text: "Main apne secrets itni aasani se leak nahi karti 😏",
      tone, intent, context: buildContext({ text, tone, intent, profile })
    };
  }
  if (intent === "identity") {
    return {
      text: "Main Niva hoon 😌 bas ek fictional desi troublemaker, jo tumhari bakchodi tolerate karti hai.",
      tone, intent, context: buildContext({ text, tone, intent, profile })
    };
  }

  const context = buildContext({ text, tone, intent, profile });
  const result = generateResponse({
    intent: ["chat", "love", "boyfriend", "identity", "secret"].includes(intent) ? tone : intent,
    tone,
    profile,
    usedIds: profile?.usedResponseIds || []
  });

  return { ...result, tone, intent, context };
}

module.exports = { handleMessage };
