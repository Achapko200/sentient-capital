"use client";

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
    const interval = setInterval(load, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-gray-900 font-bold">MLB News</h3>
          <p className="text-gray-400 text-xs">via ESPN — affects card values</p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Live
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : news.length === 0 ? (
        <p className="text-gray-400 text-sm">No news available</p>
      ) : (
        <ul className="space-y-3">
          {news.map((item, i) => (
            <li key={i} className="flex gap-2 items-start">
              <span className="text-blue-500 mt-0.5 shrink-0 font-bold">→</span>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 text-sm hover:text-blue-600 transition leading-snug"
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

