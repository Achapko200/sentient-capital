"use client";

import { useState } from "react";

const TOPICS = ["Account & sign-in", "Plans & billing", "Prices & card data", "Orders & shipping", "Other"];

export default function SupportRequestForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    setStatus("sending");
    setFeedback("");

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          topic: formData.get("topic"),
          message: formData.get("message"),
          website: formData.get("website"),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "We couldn't send your request. Please try again.");
      setStatus("sent");
      setFeedback(data.message ?? "Your support request was sent.");
      form.reset();
    } catch (error) {
      setStatus("error");
      setFeedback(error instanceof Error ? error.message : "We couldn't send your request. Please try again.");
    }
  }

  const fieldClass = "mt-1.5 w-full rounded-xl border border-gray-700 bg-gray-950 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

  return (
    <form onSubmit={submit} className="mt-8 rounded-3xl border border-gray-800 bg-gray-900/70 p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-black">Send us a message</h2>
        <p className="mt-1 text-sm text-gray-400">We’ll reply to the email address you enter. Please don’t include passwords, payment-card details, seed phrases, or private keys.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-semibold text-gray-300">
          Name <span className="font-normal text-gray-500">(optional)</span>
          <input name="name" type="text" maxLength={100} autoComplete="name" className={fieldClass} placeholder="Your name" />
        </label>
        <label className="text-sm font-semibold text-gray-300">
          Reply email
          <input name="email" type="email" maxLength={254} required autoComplete="email" className={fieldClass} placeholder="you@example.com" />
        </label>
        <label className="text-sm font-semibold text-gray-300 sm:col-span-2">
          Topic
          <select name="topic" required defaultValue="" className={fieldClass}>
            <option value="" disabled>Select a topic</option>
            {TOPICS.map(topic => <option key={topic} value={topic}>{topic}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-gray-300 sm:col-span-2">
          How can we help?
          <textarea name="message" rows={6} minLength={10} maxLength={5000} required className={`${fieldClass} resize-y`} placeholder="Describe what happened, what you expected, and when it occurred. Include a card or order reference if relevant." />
        </label>
      </div>

      <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={status === "sending"}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60">
          {status === "sending" ? "Sending…" : "Send support request"}
        </button>
        {feedback && (
          <p role="status" aria-live="polite" className={`text-sm ${status === "error" ? "text-red-300" : "text-green-300"}`}>
            {feedback}
          </p>
        )}
      </div>
    </form>
  );
}
