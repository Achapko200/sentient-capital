type PricePoint = {
  price: number;
  time: number;
};

type AssetState = {
  symbol: string;
  price: number;
  history: PricePoint[];
  insight: string;
  decision: string;
};

type FundState = {
  assets: Record<string, AssetState>;
};

let state: FundState = {
  assets: {},
};

export function getFundState() {
  return state;
}

export function updateFundState(update: {
  symbol: string;
  price: number;
}) {
  const { symbol, price } = update;

  const existing = state.assets[symbol];

  const newHistory = [
    ...(existing?.history || []),
    { price, time: Date.now() },
  ].slice(-30);

  state = {
    assets: {
      ...state.assets,
      [symbol]: {
        symbol,
        price,
        history: newHistory,
        insight: existing?.insight || "",
        decision: existing?.decision || "HOLD",
      },
    },
  };
}