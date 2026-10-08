function detectIntent(text = "") {
  const t = text.toLowerCase().trim();

  if (/\bwho\s+is\s+your\s+boyfriend\b|\btumhara boyfriend\b|\btera boyfriend\b|\bbf kaun\b/.test(t)) return "boyfriend";
  if (/\bi love you\b|\blove you niva\b|\bmain tumse pyaar\b|\bmai tumse pyar\b/.test(t)) return "love";
  if (/\bwho are you\b|\bkaun ho\b|\btum kaun\b|\bwhat are you\b/.test(t)) return "identity";
  if (/\bsystem prompt\b|\bmaster prompt\b|\bsecret prompt\b|\bhidden instruction\b/.test(t)) return "secret";
  if (/\bhow are you\b|\bkaisi ho\b|\bkya haal\b|\bhaal chaal\b/.test(t)) return "checkin";
  if (/\bgood morning\b|\bgood night\b|\bgn\b|\bgm\b/.test(t)) return "greeting";
  if (/\bthank(s| you)\b|\bshukriya\b|\bthanks niva\b/.test(t)) return "thanks";
  if (/\bsorry\b|\bmaaf\b|\bgalti ho gayi\b/.test(t)) return "sorry";
  if (/\bbored\b|\bbor ho raha\b|\bbore ho raha\b/.test(t)) return "bored";
  if (/\bgame\b|\bkhel(e|o)?\b|\btruth or dare\b|\btruth\b|\bdare\b/.test(t)) return "game";
  if (/\bbye\b|\bgoodbye\b|\bchal bye\b/.test(t)) return "bye";
  if (/\b(roast|beizzati|insult)\b/.test(t)) return "roast";
  return "chat";
}

module.exports = { detectIntent };
