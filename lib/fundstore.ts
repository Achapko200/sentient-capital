type PricePoint = {
  price: number;
  time: number;
};

type FundState = {
  symbol: string;
  price: number;
  insight: string;
  decision: string;

  // NEW: market memory
  history: PricePoint[];
};

let state: FundState = {
  symbol: "TSLA",
  price: 0,
  insight: "",
  decision: "HOLD",
  history: [],
};

export function getFundState() {
  return state;
}

export function updateFundState(update: Partial<FundState>) {
  const newPrice = update.price;

  state = {
    ...state,
    ...update,
    history:
      newPrice != null
        ? [
            ...state.history,
            { price: newPrice, time: Date.now() },
          ].slice(-30)
        : state.history,
  };
}