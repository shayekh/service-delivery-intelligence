import type { AnalysisCostStats } from "@/lib/db";

function fmt(usd: number) {
  return usd < 0.001 ? "<$0.001" : `$${usd.toFixed(4)}`;
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-800 tabular-nums">{value}</span>
    </div>
  );
}

export function AnalysisCostCard({ stats }: { stats: AnalysisCostStats }) {
  const mostRecentLabel = stats.most_recent_at
    ? new Date(stats.most_recent_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h2 className="mb-1 text-base font-semibold text-slate-800">AI Analysis Cost</h2>
      <p className="mb-5 text-sm text-slate-500">
        Token usage and cost for each analysis run (claude-sonnet-4-6 · $3/MTok in · $15/MTok out).
      </p>

      {stats.total_analyses === 0 ? (
        <p className="text-sm text-slate-400 italic">No analysis runs recorded yet.</p>
      ) : (
        <div>
          <StatRow
            label={`Most recent run${mostRecentLabel ? ` (${mostRecentLabel})` : ""}`}
            value={stats.most_recent_cost_usd != null ? fmt(stats.most_recent_cost_usd) : "—"}
          />
          <StatRow
            label={`Total across ${stats.total_analyses} run${stats.total_analyses !== 1 ? "s" : ""}`}
            value={fmt(stats.total_cost_usd)}
          />
          <StatRow
            label="Average per run"
            value={fmt(stats.average_cost_usd)}
          />
        </div>
      )}
    </div>
  );
}
