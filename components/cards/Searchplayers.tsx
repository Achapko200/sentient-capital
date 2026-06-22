// ─── components/cards/SearchPlayers.tsx ──────────────────────────────────────
"use client";

import { useState, useEffect, useRef } from "react";
import type { Player }                  from "@/lib/cardTypes";

type Props = { onSelect: (player: Player) => void };

export default function SearchPlayers({ onSelect }: Props) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/cards/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.players ?? []);
        setOpen(true);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          type="text"
          placeholder="Search any MLB player..."
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-blue-400 shadow-sm"
        />
        <span className="absolute left-3.5 top-3.5 text-gray-400">🔍</span>
        {loading && <span className="absolute right-3.5 top-3 text-gray-400 text-xs animate-spin">⏳</span>}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
          {results.map(player => (
            <button
              key={player.id}
              onClick={() => { onSelect(player); setQuery(""); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
            >
              <img src={player.cardImage} alt={player.name}
                className="w-8 h-8 rounded-full object-cover bg-gray-100" />
              <div>
                <p className="text-gray-900 font-bold text-sm">{player.name}</p>
                <p className="text-gray-400 text-xs">{player.team} · {player.position}</p>
              </div>
              <span className="ml-auto text-gray-300 text-xs">{player.cardName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}