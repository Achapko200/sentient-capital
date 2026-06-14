"use client";

// ─── components/cards/NewsTickerCard.tsx ──────────────────────────────────────

import { useEffect, useState } from "react";

type NewsItem = { headline: string; link: string };

export default function NewsTickerCard() {
  const [news,    setNews]    = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch("/api/cards/news");
        const json = await res.json();
        setNews(json.news ?? []);
      } catch {
        setNews([]);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 10 * 60 * 1000); // refresh every 10 min
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0b0f19] border border-gray-800 rounded-xl p-5">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-white font-semibold">MLB News</h3>
          <p className="text-gray-500 text-xs">via ESPN — affects card values</p>
        </div>
        <div className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs">Live</div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      ) : news.length === 0 ? (
        <p className="text-gray-600 text-sm">No news available</p>
      ) : (
        <ul className="space-y-3">
          {news.map((item, i) => (
            <li key={i} className="flex gap-2 items-start">
              <span className="text-blue-500 mt-0.5 shrink-0">→</span>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 text-sm hover:text-white transition leading-snug"
              >
                {item.headline}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
