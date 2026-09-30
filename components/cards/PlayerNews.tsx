"use client";
// Headlines about one player only.
import { useEffect, useState } from "react";

type Article = { title: string; source: string; url: string; publishedAt: string };

function ago(iso: string) {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d}d ago` : new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function PlayerNews({ playerId, playerName }: { playerId: string; playerName: string }) {
  const [articles, setArticles] = useState<Article[] | null>(null);

  useEffect(() => {
    setArticles(null);
    fetch(`/api/cards/player-news?playerId=${playerId}`)
      .then(r => r.json())
      .then(d => setArticles(d.articles ?? []))
      .catch(() => setArticles([]));
  }, [playerId]);

  return (
    <div className="rounded-2xl p-5 mt-4" style={{ backgroundColor: "#05080d", border: "1px solid rgba(255,255,255,0.08)" }}>
      <p className="text-xs font-bold tracking-wider mb-3" style={{ color: "#8A8F98" }}>
        {playerName.toUpperCase()} NEWS
      </p>

      {articles === null && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-10 rounded-lg animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />)}
        </div>
      )}

      {articles?.length === 0 && (
        <p className="text-sm" style={{ color: "#8A8F98" }}>No news about {playerName} in the last 30 days.</p>
      )}

      {articles && articles.length > 0 && (
        <ul className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {articles.map(a => (
            <li key={a.url} className="py-3 first:pt-0 last:pb-0">
              <a href={a.url} target="_blank" rel="noopener noreferrer" className="group block">
                <p className="text-sm font-semibold text-white leading-snug group-hover:underline">{a.title}</p>
                <p className="text-xs mt-1" style={{ color: "#8A8F98" }}>{a.source}{a.source ? " · " : ""}{ago(a.publishedAt)}</p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
