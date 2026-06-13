export const marketNews = [
  "NVDA faces increased regulatory scrutiny",
  "AI sector volatility rises 15%",
  "Fed signals potential rate cuts",
  "Institutional inflows into tech accelerate",
];

export function getRandomNews() {
  return marketNews[Math.floor(Math.random() * marketNews.length)];
}