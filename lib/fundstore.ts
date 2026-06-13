type FundState = {
  symbol: string;
  price: number;
  insight: string;
  decision: string;
};

let state: FundState = {
  symbol: "TSLA",
  price: 0,
  insight: "",
  decision: "HOLD",
};

export function getFundState() {
  return state;
}

export function updateFundState(update: Partial<FundState>) {
  state = {
    ...state,
    ...update,
  };
}