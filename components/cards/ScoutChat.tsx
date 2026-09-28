"use client";

import { useState, useRef, useEffect } from "react";
import { supabase }                     from "@/lib/supabase";
import ChatMessage                      from "@/components/cards/ChatMessage";

type Message = { role: "user" | "assistant"; content: string };

export default function ScoutChat({ players }: { players: { name: string; id: string }[] }) {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [userId,   setUserId]   = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (open && chatRef.current && !chatRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!userId) return;
    try {
      const saved = localStorage.getItem(`scout-chat:${userId}`);
      const parsed = saved ? JSON.parse(saved) : [];
      setMessages(Array.isArray(parsed) ? parsed.slice(-30) : []);
    } catch {
      setMessages([]);
    } finally {
      setHistoryLoaded(true);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || !historyLoaded) return;
    try {
      localStorage.setItem(`scout-chat:${userId}`, JSON.stringify(messages.slice(-30)));
    } catch {}
  }, [historyLoaded, messages, userId]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res  = await fetch("/api/cards/ai-chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${(await (await import("@/lib/supabase")).supabase.auth.getSession()).data.session?.access_token ?? ""}` },
        body:    JSON.stringify({ messages: newMessages, players }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply ?? data.error ?? "Sorry, try again." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const regenerateLast = async () => {
    if (loading || !userId) return;
    const lastUserIndex = messages.map(message => message.role).lastIndexOf("user");
    if (lastUserIndex < 0) return;
    const promptMessages = messages.slice(0, lastUserIndex + 1);
    setMessages(promptMessages);
    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch("/api/cards/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ messages: promptMessages, players }),
      });
      const data = await res.json();
      setMessages([...promptMessages, { role: "assistant", content: data.reply ?? data.error ?? "Please try again." }]);
    } catch {
      setMessages([...promptMessages, { role: "assistant", content: "Could not regenerate. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    if (userId) localStorage.removeItem(`scout-chat:${userId}`);
  };
  const [showTeaser, setShowTeaser] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowTeaser(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const dismissTeaser = () => {
    setShowTeaser(false);
  };

  useEffect(() => {
    if (open) dismissTeaser();
  }, [open]);

  return (
    <div ref={chatRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Teaser popup */}
      {showTeaser && !open && (
        <div className="max-w-[220px] mb-2">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-3.5 relative">
            <button onClick={() => { dismissTeaser(); }}
              className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 text-xs">✕</button>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">⚾</span>
              <p className="font-black text-gray-900 text-sm">Scout</p>
              <span className="w-2 h-2 bg-green-400 rounded-full" />
            </div>
            <p className="text-gray-600 text-xs leading-relaxed">
              Hey! Need help finding the best cards to buy right now? 👋
            </p>
            <button onClick={() => { setOpen(true); dismissTeaser(); }}
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
        <div className="w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden mb-2"
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
            {messages.length > 0 && (
              <button onClick={startNewConversation} title="New conversation" aria-label="Start a new conversation"
                className="rounded-lg px-2 py-1 text-blue-100 transition hover:bg-white/10 hover:text-white">
                ＋
              </button>
            )}
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-blue-300 rounded-full" />
              <span className="text-blue-200 text-xs">On-demand</span>
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
                    <button key={s} onClick={() => send(s)} disabled={!userId || loading}
                      className="text-xs px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition shadow-sm disabled:opacity-50">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className="space-y-1">
                <ChatMessage role={msg.role} content={msg.content} variant="floating" />
                {msg.role === "assistant" && i === messages.length - 1 && (
                  <div className="pl-9">
                    <button onClick={regenerateLast} disabled={loading}
                      className="text-[10px] text-gray-400 transition hover:text-blue-600 disabled:opacity-50">
                      Regenerate
                    </button>
                  </div>
                )}
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
              <textarea
                rows={2}
                maxLength={4000}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={userId ? "Message Scout…" : "Sign in to chat with Scout"}
                disabled={!userId}
                className="flex-1 resize-none bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition disabled:opacity-60"
              />
              <button onClick={() => send()} disabled={loading || !input.trim() || !userId}
                aria-label="Send message"
                className="w-8 h-8 rounded-xl flex items-center justify-center transition disabled:opacity-40 shrink-0 self-end"
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
    </div>
  );
}
