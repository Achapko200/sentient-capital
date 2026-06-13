type LoopState = {
  lastRun: string | null;
  news: string;
  insight: string;
  riskScore: number;
  decision: string;
};

class StateStore {
  private state: LoopState = {
    lastRun: null,
    news: "",
    insight: "",
    riskScore: 0,
    decision: "INITIALIZING",
  };

  get() {
    return this.state;
  }

  update(partial: Partial<LoopState>) {
    this.state = {
      ...this.state,
      ...partial,
    };
  }
}

export const stateStore = new StateStore();