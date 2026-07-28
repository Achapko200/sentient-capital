"use client";

import { useState, useRef, useEffect } from "react";
import { supabase }                     from "@/lib/supabase";

type Message = { role: "user" | "assistant"; content: string };

export default function ScoutChat({ players }: { players: { name: string; id: string }[] }) {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const [userId,   setUserId]   = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    if (!input.trim() || loading) return;
    if (msgCount >= 5 && !userId) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "You've reached the free limit. Sign in or upgrade to Pro for unlimited messages."
      }]);
      return;
    }

    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setMsgCount(c => c + 1);

    try {
      const res  = await fetch("/api/cards/ai-chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: newMessages, players }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply ?? "Sorry, try again." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const [showTeaser, setShowTeaser] = useState(false);

  useEffect(() => {
    // Show teaser 3 seconds after page load
    const timer = setTimeout(() => {
      if (!open) setShowTeaser(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []); // only on mount

  useEffect(() => {
    if (open) setShowTeaser(false);
  }, [open]);

  return (
    <>
      {/* Teaser popup */}
      {showTeaser && !open && (
        <div className="fixed bottom-24 right-6 z-50 max-w-[220px] animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-3.5 relative">
            <button onClick={() => setShowTeaser(false)}
              className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 text-xs">✕</button>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">⚾</span>
              <p className="font-black text-gray-900 text-sm">Scout</p>
              <span className="w-2 h-2 bg-green-400 rounded-full" />
            </div>
            <p className="text-gray-600 text-xs leading-relaxed">
              Hey! Need help finding the best cards to buy right now? 👋
            </p>
            <button onClick={() => { setOpen(true); setShowTeaser(false); }}
              className="mt-2 w-full py-1.5 rounded-xl text-xs font-bold text-white transition"
              style={{ background: "linear-gradient(135deg, #1a1a2e, #2563eb)" }}>
              Chat with Scout →
            </button>
            {/* Arrow pointing down */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r border-b border-gray-100 rotate-45" />
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => { setOpen(v => !v); setShowTeaser(false); }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition hover:scale-105"
        style={{ background: "linear-gradient(135deg, #1a1a2e, #2563eb)" }}
      >
        {open ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <div className="relative">
            <span className="text-2xl">⚾</span>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
          </div>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ height: "480px" }}>

          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-3"
            style={{ background: "linear-gradient(135deg, #1a1a2e, #2563eb)" }}>
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg shrink-0">
              ⚾
            </div>
            <div className="flex-1">
              <p className="text-white font-black text-sm">Scout</p>
              <p className="text-blue-200 text-xs">AI Card Trading Assistant</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-300 text-xs">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="flex gap-2 items-start">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0"
                    style={{ background: "linear-gradient(135deg, #1a1a2e, #2563eb)" }}>
                    ⚾
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm border border-gray-100 max-w-[85%]">
                    <p className="text-gray-800 text-sm">Hi! I&apos;m Scout, your AI card trading assistant. Ask me about card values, MLB signals, or trading strategy!</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pl-9">
                  {[
                    "Which cards to buy?",
                    "Best value right now?",
                    "How do signals work?",
                  ].map(s => (
                    <button key={s} onClick={() => { setInput(s); setTimeout(send, 50); }}
                      className="text-xs px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition shadow-sm">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5"
                    style={{ background: "linear-gradient(135deg, #1a1a2e, #2563eb)" }}>
                    ⚾
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "text-white rounded-br-sm"
                    : "bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100"
                }`}
                  style={msg.role === "user" ? { background: "linear-gradient(135deg, #2563eb, #7c3aed)" } : {}}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 items-start">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0"
                  style={{ background: "linear-gradient(135deg, #1a1a2e, #2563eb)" }}>
                  ⚾
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm border border-gray-100">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 bg-white">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Ask Scout anything..."
                className="flex-1 bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
              <button onClick={send} disabled={loading || !input.trim()}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition disabled:opacity-40 shrink-0"
                style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-gray-400 text-xs text-center mt-1.5">Powered by Scout AI · Card Tracker</p>
          </div>
        </div>
      )}
    </>
  );
}
