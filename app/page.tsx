export default function Home() {
  return (
    <main style={{
      backgroundColor: "#0b0f17",
      color: "#e5e7eb",
      minHeight: "100vh",
      padding: "40px",
      fontFamily: "ui-sans-serif, system-ui"
    }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700 }}>
          🧠 Sentient Portfolio OS
        </h1>
        <p style={{ color: "#94a3b8" }}>
          Autonomous AI Hedge Fund Simulation Engine
        </p>
      </div>

      {/* GRID */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 20
      }}>

        {/* PORTFOLIO PANEL */}
        <div style={{
          background: "#111827",
          padding: 20,
          borderRadius: 12,
          border: "1px solid #1f2937"
        }}>
          <h2 style={{ marginBottom: 10 }}>📊 Portfolio Allocation</h2>

          <p>NVDA — 35%</p>
          <p>MSFT — 25%</p>
          <p>AAPL — 20%</p>
          <p>CASH — 20%</p>
        </div>

        {/* AI BRAIN PANEL */}
        <div style={{
          background: "#111827",
          padding: 20,
          borderRadius: 12,
          border: "1px solid #1f2937"
        }}>
          <h2 style={{ marginBottom: 10 }}>🧠 AI Brain</h2>

          <p style={{ color: "#60a5fa" }}>
            Analyst: Tech sector momentum remains strong.
          </p>

          <p style={{ color: "#fbbf24" }}>
            Risk: NVDA exposure is elevated.
          </p>

          <p style={{ color: "#34d399" }}>
            Decision: Reduce NVDA by 10%, rotate into MSFT.
          </p>
        </div>

        {/* MARKET FEED */}
        <div style={{
          background: "#111827",
          padding: 20,
          borderRadius: 12,
          border: "1px solid #1f2937"
        }}>
          <h2 style={{ marginBottom: 10 }}>📰 Market Feed</h2>

          <p>• NVDA beats earnings expectations</p>
          <p>• Fed signals possible rate cuts</p>
          <p>• AI sector volatility increases</p>
        </div>

        {/* CONTROL PANEL */}
        <div style={{
          background: "#111827",
          padding: 20,
          borderRadius: 12,
          border: "1px solid #1f2937"
        }}>
          <h2 style={{ marginBottom: 10 }}>⚙️ Control Center</h2>

          <button style={{
            padding: "10px 15px",
            marginRight: 10,
            borderRadius: 8,
            border: "none",
            background: "#3b82f6",
            color: "white"
          }}>
            Run Analysis
          </button>

          <button style={{
            padding: "10px 15px",
            borderRadius: 8,
            border: "1px solid #374151",
            background: "transparent",
            color: "#e5e7eb"
          }}>
            Inject Market Shock
          </button>
        </div>

      </div>
    </main>
  );
}