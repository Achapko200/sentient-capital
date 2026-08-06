"use client";

import { useEffect, useState, useRef } from "react";

type NewsItem = { headline: string; link: string };

export default function NewsTicker() {
  const [news,    setNews]    = useState<NewsItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/cards/news")
      .then(r => r.json())
      .then(d => setNews(d.news ?? []))
      .catch(() => {});
  }, []);

  if (news.length === 0) return null;

  return (
    <div className="w-full overflow-hidden"
      style={{ backgroundColor: "#111111", borderBottom: "1px solid #1a1a1a" }}>
      <div className="flex items-center">
        {/* Label */}
        <div className="shrink-0 flex items-center gap-1.5 px-3 py-2"
          style={{ borderRight: "1px solid #1a1a1a" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-black" style={{ color: "#00c278" }}>MLB</span>
        </div>

        {/* Scrolling ticker */}
        <div className="flex-1 overflow-x-auto scrollbar-hide" ref={scrollRef}>
          <div className="flex gap-6 px-4 py-2 whitespace-nowrap">
            {news.map((item, i) => (
              <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
                className="text-xs transition hover:opacity-80 shrink-0"
                style={{ color: "#cccccc" }}>
                <span style={{ color: "#555" }}>·</span> {item.headline}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
