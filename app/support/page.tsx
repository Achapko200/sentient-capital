import type { Metadata } from "next";
import SupportRequestForm from "@/components/SupportRequestForm";

export const metadata: Metadata = {
  title: "Help & Support | Card Tracker",
  description: "Get help with your Card Tracker account, subscriptions, market data, and card trades.",
};

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "anna.chapko.2004@gmail.com";

const TOPICS = [
  {
    title: "Account & sign-in",
    description: "Trouble accessing your account, connecting a wallet, or updating account settings?",
  },
  {
    title: "Plans & billing",
    description: "Questions about a subscription, a charge, a cancellation, or plan features?",
  },
  {
    title: "Prices & card data",
    description: "Report a price, listing, player detail, or chart that looks incorrect. Include the card and the date you noticed it.",
  },
  {
    title: "Orders & shipping",
    description: "Need help with a card order, vault status, shipment, or redemption? Include your order details, but never send payment-card or wallet recovery secrets.",
  },
];

const FAQS = [
  {
    question: "Are eBay prices completed sale prices?",
    answer: "No. Card Tracker's eBay Browse API results are active seller asking prices. They are not completed-sale prices, and an asking price does not guarantee a card will sell for that amount.",
  },
  {
    question: "Why does a card show no price or price history?",
    answer: "A card can remain visible even when there is no recent matching PSA 10 listing or enough dated observations to draw a history chart. We avoid filling missing history with estimated prices.",
  },
  {
    question: "What do BUY, HOLD, and SELL signals mean?",
    answer: "They are rule-based indicators derived from available player and market data. They are informational, can be limited when data is missing, and are not predictions or financial advice.",
  },
  {
    question: "What should I include when contacting support?",
    answer: "Include the email on your account, the affected card or order, what you expected to happen, what happened instead, and the approximate time. Never include passwords, private keys, seed phrases, or full payment-card details.",
  },
];

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-gray-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-4xl">
        <nav className="mb-8 flex items-center justify-between">
          <a href="/app" className="flex items-center gap-2 text-sm font-bold text-gray-300 transition hover:text-white">
            <span aria-hidden="true">⚾</span> Card Tracker
          </a>
          <a href="/app" className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 transition hover:border-gray-500 hover:text-white">
            Back to app
          </a>
        </nav>

        <section className="rounded-3xl border border-gray-800 bg-gray-900/70 p-6 shadow-2xl sm:p-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Card Tracker support</p>
          <h1 className="text-3xl font-black sm:text-4xl">How can we help?</h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-gray-400">
            Get help with your account, billing, card data, or orders. Send us the details and we’ll have the context we need to investigate.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Card Tracker support request")}`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
          >
            Email support <span aria-hidden="true">↗</span>
          </a>
          <p className="mt-2 text-xs text-gray-500">{SUPPORT_EMAIL}</p>
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-xl font-black">Choose a topic</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {TOPICS.map(topic => (
              <div key={topic.title} className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
                <h3 className="font-bold">{topic.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{topic.description}</p>
              </div>
            ))}
          </div>
        </section>

        <SupportRequestForm />

        <section className="mt-10">
          <h2 className="mb-4 text-xl font-black">Common questions</h2>
          <div className="divide-y divide-gray-800 overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
            {FAQS.map(faq => (
              <details key={faq.question} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold marker:hidden">
                  {faq.question}
                  <span className="text-blue-400 transition group-open:rotate-45" aria-hidden="true">＋</span>
                </summary>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-400">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-gray-600">
          Card Tracker data and signals are informational and not financial advice.
        </p>
      </div>
    </main>
  );
}
