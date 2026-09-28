"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";

type Props = {
  role: "user" | "assistant";
  content: string;
  variant?: "panel" | "floating";
};

export default function ChatMessage({ role, content, variant = "panel" }: Props) {
  const isUser = role === "user";
  const floating = variant === "floating";
  const [copied, setCopied] = useState(false);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div
          className={`flex shrink-0 items-center justify-center rounded-full text-sm ${floating ? "mt-0.5 h-7 w-7" : "mt-0.5 h-7 w-7"}`}
          style={{ background: floating ? "linear-gradient(135deg, #1a1a2e, #2563eb)" : "linear-gradient(135deg, #2563eb, #7c3aed)" }}
          aria-hidden="true"
        >
          {floating ? "⚾" : "✦"}
        </div>
      )}
      <div className={`group min-w-0 max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words ${
        isUser
          ? `text-white ${floating ? "rounded-br-sm" : "rounded-br-sm bg-blue-600"}`
          : `text-gray-800 ${floating ? "rounded-tl-sm border border-gray-100 bg-white shadow-sm" : "rounded-bl-sm bg-gray-100"}`
      }`} style={isUser && floating ? { background: "linear-gradient(135deg, #2563eb, #7c3aed)" } : undefined}>
        <div className={`chat-markdown ${isUser ? "chat-markdown-user" : ""}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>,
              h1: ({ children }) => <h1 className="mb-2 mt-3 text-lg font-bold first:mt-0">{children}</h1>,
              h2: ({ children }) => <h2 className="mb-2 mt-3 text-base font-bold first:mt-0">{children}</h2>,
              h3: ({ children }) => <h3 className="mb-1.5 mt-3 font-bold first:mt-0">{children}</h3>,
              ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
              ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
              li: ({ children }) => <li className="pl-0.5">{children}</li>,
              strong: ({ children }) => <strong className="font-bold">{children}</strong>,
              blockquote: ({ children }) => <blockquote className="my-2 border-l-2 border-blue-400 pl-3 text-gray-600">{children}</blockquote>,
              table: ({ children }) => <div className="my-2 overflow-x-auto"><table className="w-full border-collapse text-left text-xs">{children}</table></div>,
              th: ({ children }) => <th className="border-b border-gray-300 px-2 py-1.5 font-bold">{children}</th>,
              td: ({ children }) => <td className="border-b border-gray-200 px-2 py-1.5 align-top">{children}</td>,
              a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-2 decoration-blue-400">{children}</a>,
              code: ({ children, className }) => className
                ? <code className="block overflow-x-auto rounded-lg bg-gray-900 p-3 font-mono text-xs text-gray-100">{children}</code>
                : <code className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.9em]">{children}</code>,
              hr: () => <hr className="my-3 border-gray-300" />,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
          {!isUser && content && (
            <div className="mt-2 flex justify-end">
              <button onClick={copyMessage} type="button" aria-label="Copy assistant response"
                className="rounded px-1.5 py-0.5 text-[10px] text-gray-500 transition hover:bg-black/5 hover:text-gray-800">
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          )}
      </div>
    </div>
  );
}
