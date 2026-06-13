// ─── app/agents/page.tsx ─────────────────────────────────────────────────────

import AgentPanel    from "@/components/AgentPanel";
import InsightsPanel from "@/components/InsightsPanel";
import ExecutionLog  from "@/components/ExecutionLog";

export default function AgentsPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-1">AI Agents</h1>
        <p className="text-slate-400">Autonomous investment committee — live deliberation.</p>
      </div>

      <AgentPanel />

      <div className="grid grid-cols-2 gap-6">
        <InsightsPanel />
        <ExecutionLog />
      </div>
    </div>
  );
}
