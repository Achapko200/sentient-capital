export function getSMA(prices: number[], period: number) {
  const slice = prices.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / slice.length;
}

export function getTrend(prices: number[]) {
  if (prices.length < 10) return "NEUTRAL";

  const sma5 = getSMA(prices, 5);
  const sma20 = getSMA(prices, 10);

  if (sma5 > sma20) return "UP";
  if (sma5 < sma20) return "DOWN";
  return "NEUTRAL";
}