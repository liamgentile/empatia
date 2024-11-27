const sentiment = require("sentiment");

export function getEmotionalPolarity(text) {
  const result = sentiment(text);
  return result.score;
}
