"use client";

import { useState, useEffect, useRef } from "react";
import { supabase }                     from "@/lib/supabase";

type Message = { role: "user" | "assistant"; content: string };
type Chat    = { id: string; title: string; updated_at: string };

export default function AIAssistant({ players }: { players: { name: string; id: string }[] }) {
  const [chats,        setChats]        = useState<Chat[]>([]);
  const [chatId,       setChatId]       = useState<string | null>(null);
  const [messages,     setMessages]     = useState<Message[]>([]);
  const [input,        setInput]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [userId,       setUserId]       = useState<string | null>(null);
  const [showSidebar,  setShowSidebar]  = useState(typeof window !== "undefined" && window.innerWidth > 640);
  const [loadingChats, setLoadingChats] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoadingChats(true);
    fetch(`/api/cards/chats?userId=${userId}`)
      .then(r => r.json())
      .then(d => setChats(d.chats ?? []))
      .finally(() => setLoadingChats(false));
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateTitle = (content: string) =>
    content.slice(0, 40) + (content.length > 40 ? "..." : "");

  const loadChat = async (id: string) => {
    const { data } = await supabase
      .from("ai_chats")
      .select("messages")
      .eq("id", id)
      .single();
    if (data) {
      setMessages(data.messages ?? []);
      setChatId(id);
    }
  };

  const newChat = () => {
    setChatId(null);
    setMessages([]);
    setInput("");
  };

  const deleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch("/api/cards/chats", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: "delete", userId, chatId: id }),
    });
    setChats(prev => prev.filter(c => c.id !== id));
    if (chatId === id) newChat();
  };

  const send = async () => {
    if (!input.trim() || loading || !userId) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages      = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res  = await fetch("/api/cards/ai-chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: newMessages, players }),
      });
      const data = await res.json();
      const assistantMsg: Message = { role: "assistant", content: data.reply ?? "Sorry, try again." };
      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);

      if (chatId) {
        await fetch("/api/cards/chats", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ action: "update", userId, chatId, messages: finalMessages, title: chats.find(c => c.id === chatId)?.title ?? generateTitle(userMsg.content) }),
        });
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, updated_at: new Date().toISOString() } : c));
      } else {
        const title = generateTitle(userMsg.content);
        const cRes  = await fetch("/api/cards/chats", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ action: "create", userId, title, messages: finalMessages }),
        });
        const cData = await cRes.json();
        if (cData.chat) { setChatId(cData.chat.id); setChats(prev => [cData.chat, ...prev]); }
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const groupChats = () => {
    const today     = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const week      = new Date(today); week.setDate(today.getDate() - 7);
    const groups: { label: string; chats: Chat[] }[] = [
      { label: "Today",       chats: [] },
      { label: "Yesterday",   chats: [] },
      { label: "Last 7 days", chats: [] },
      { label: "Older",       chats: [] },
    ];
    chats.forEach(chat => {
      const d = new Date(chat.updated_at);
      if (d.toDateString() === today.toDateString())          groups[0].chats.push(chat);
      else if (d.toDateString() === yesterday.toDateString()) groups[1].chats.push(chat);
      else if (d > week)                                      groups[2].chats.push(chat);
      else                                                    groups[3].chats.push(chat);
    });
    return groups.filter(g => g.chats.length > 0);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex h-[500px] md:h-[600px]">

      {/* Sidebar */}
      {showSidebar && window.innerWidth > 640 || showSidebar && (
        <div className="w-48 md:w-56 border-r border-gray-100 flex flex-col shrink-0 bg-gray-50/50">
          <div className="p-3 border-b border-gray-100">
            <button onClick={newChat}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-200 transition text-sm text-gray-700 font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {loadingChats ? (
              <div className="space-y-2 px-3">
                {[1,2,3].map(i => <div key={i} className="h-8 bg-gray-200 rounded-lg animate-pulse" />)}
              </div>
            ) : chats.length === 0 ? (
              <p className="text-xs text-gray-400 text-center mt-4 px-3">No chats yet</p>
            ) : (
              groupChats().map(group => (
                <div key={group.label} className="mb-2">
                  <p className="text-xs text-gray-400 font-medium px-3 py-1">{group.label}</p>
                  {group.chats.map(chat => (
                    <div key={chat.id} onClick={() => loadChat(chat.id)}
                      className={`group flex items-center gap-2 px-3 py-2 mx-1 rounded-lg cursor-pointer transition ${
                        chatId === chat.id ? "bg-white shadow-sm border border-gray-200" : "hover:bg-gray-100"
                      }`}>
                      <p className="text-xs text-gray-700 truncate flex-1">{chat.title}</p>
                      <button onClick={e => deleteChat(chat.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition shrink-0">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
          <button onClick={() => setShowSidebar(v => !v)} className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1">
            <h3 className="text-gray-900 font-bold text-sm">Card Tracker Assistant</h3>
            <p className="text-gray-400 text-xs">Powered by Llama 3.1</p>
          </div>
          <button onClick={newChat} className="text-gray-400 hover:text-gray-600 transition" title="New chat">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <div className="w-2 h-2 rounded-full bg-green-400" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
                🤖
              </div>
              <div className="text-center">
                <p className="text-gray-900 font-bold text-sm">Card Tracker Assistant</p>
                <p className="text-gray-400 text-xs mt-1">Ask me anything about baseball card trading</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-xs">
                {["Which cards should I buy right now?","Explain the order book","How do I redeem a card?","What affects card prices?"].map(s => (
                  <button key={s} onClick={() => { setInput(s); setTimeout(send, 50); }}
                    className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5"
                  style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
                  🤖
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-800 rounded-bl-sm"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0"
                style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
                🤖
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="flex gap-2">
            <input type="text" value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Ask about card trading..."
              className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            <button onClick={send} disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
