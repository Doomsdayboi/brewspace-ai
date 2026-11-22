"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { VisitMode } from "@/lib/types";

interface VisitShellProps {
  cafeName: string;
  mode: VisitMode;
  seatId?: string | null;
  children: React.ReactNode;
}

const MODE_LABELS: Record<VisitMode, { text: string; classes: string }> = {
  PLANNING: { text: "Planning", classes: "bg-oat-milk text-espresso" },
  FOCUSING: { text: "Focusing", classes: "bg-flow-bg text-flow-text" },
  AVAILABLE: { text: "Available", classes: "bg-connect-bg text-connect-text" },
  IN_CONNECTION: {
    text: "In 1:1 Meetup",
    classes: "bg-connect-bg text-connect-text",
  },
  IN_CIRCLE: {
    text: "In Coffee Circle",
    classes: "bg-circles-bg text-circles-text",
  },
  ENDED: { text: "Visit Ended", classes: "bg-oat-milk text-quiet-stone" },
};

const TABS = [
  { href: "/visit/today", label: "Today", icon: "home" },
  { href: "/visit/space", label: "My Space", icon: "event_seat" },
  { href: "/visit/connect", label: "Connect", icon: "handshake" },
  { href: "/visit/circles", label: "Circles", icon: "diversity_3" },
];

export function VisitShell({
  cafeName,
  mode,
  seatId,
  children,
}: VisitShellProps) {
  const pathname = usePathname();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [asking, setAsking] = useState(false);
  const [messages, setMessages] = useState<
    Array<{
      role: "user" | "assistant";
      text: string;
      actions?: Array<{ label: string; href: string }>;
    }>
  >([
    {
      role: "assistant",
      text: "Ask me about quiet seats, focus time, 1:1 Connect, or Coffee Circles. Nothing is booked or shared unless you confirm it.",
    },
  ]);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || asking) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setPrompt("");
    setAsking(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text:
              data.error ||
              "I couldn't respond right now, but you can use My Space, Connect, and Circles directly.",
          },
        ]);
        return;
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply, actions: data.actions },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Network hiccup—please use the tabs directly or try again.",
        },
      ]);
    } finally {
      setAsking(false);
    }
  }

  const badge = MODE_LABELS[mode] ?? MODE_LABELS.PLANNING;

  return (
    <div className="min-h-screen bg-warm-cream pb-24 lg:pb-12">
      {/* Top contextual header (IA §4.1 — Staff Console strictly excluded from customer nav) */}
      <header className="sticky top-0 z-30 border-b border-border-subtle bg-warm-cream/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/visit/today" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-espresso text-warm-cream">
              <span className="material-symbols-outlined text-[18px]">
                local_cafe
              </span>
            </span>
            <div>
              <p className="font-display text-base font-semibold leading-none text-espresso">
                BrewSpace
              </p>
              <p className="mt-0.5 text-xs text-quiet-stone">
                {cafeName}
                {seatId ? ` · Seat ${seatId}` : ""}
              </p>
            </div>
          </Link>

          {/* Desktop nav tabs */}
          <nav
            aria-label="Desktop navigation"
            className="hidden items-center gap-1 lg:flex"
          >
            {TABS.map((tab) => {
              const active = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`rounded-pill px-4 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-espresso text-warm-cream"
                      : "text-quiet-stone hover:bg-oat-milk hover:text-espresso"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <span
              className={`hidden rounded-pill px-3 py-1 text-xs font-semibold sm:inline-flex ${badge.classes}`}
            >
              {badge.text}
            </span>
            <button
              type="button"
              onClick={() => setAssistantOpen(true)}
              className="inline-flex h-10 items-center gap-1.5 rounded-pill border border-border-subtle bg-oat-milk px-3.5 text-xs font-semibold text-espresso transition-colors hover:bg-surface-container-highest"
            >
              <span className="material-symbols-outlined text-[16px]">
                auto_awesome
              </span>
              <span className="hidden sm:inline">Ask BrewSpace</span>
            </button>
            <Link
              href="/visit/settings"
              aria-label="Visit settings and privacy"
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                pathname === "/visit/settings"
                  ? "bg-espresso text-warm-cream"
                  : "text-quiet-stone hover:bg-oat-milk hover:text-espresso"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>

      {/* Mobile bottom 4-tab navigation (IA §4.1) */}
      <nav
        aria-label="Primary navigation"
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-border-subtle bg-porcelain/95 backdrop-blur lg:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-4 px-2 py-2 text-center text-xs font-semibold">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-field py-1.5 transition-colors ${
                  active ? "bg-oat-milk text-espresso" : "text-quiet-stone"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* G01: Persistent Contextual Ask BrewSpace Sheet */}
      {assistantOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Ask BrewSpace assistant"
          className="fixed inset-0 z-50 flex items-end justify-center bg-espresso/40 sm:items-center sm:p-4"
        >
          <div className="flex max-h-[82vh] w-full max-w-lg flex-col rounded-t-panel border border-border-subtle bg-porcelain shadow-ceramic sm:rounded-panel">
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-espresso">
                  Ask BrewSpace
                </h2>
                <p className="text-xs text-quiet-stone">
                  For your visit at {cafeName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssistantOpen(false)}
                aria-label="Close assistant"
                className="flex h-9 w-9 items-center justify-center rounded-full text-quiet-stone hover:bg-oat-milk hover:text-espresso"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`rounded-card p-3.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "ml-8 bg-espresso text-warm-cream"
                      : "mr-4 border border-border-subtle bg-oat-milk/70 text-espresso"
                  }`}
                >
                  <p>{m.text}</p>
                  {m.actions && m.actions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.actions.map((act) => (
                        <Link
                          key={act.href}
                          href={act.href}
                          onClick={() => setAssistantOpen(false)}
                          className="inline-flex items-center rounded-pill bg-porcelain px-3 py-1.5 text-xs font-semibold text-espresso ring-1 ring-border-subtle hover:bg-fresh-milk"
                        >
                          {act.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <form
              onSubmit={handleAsk}
              className="flex items-center gap-2 border-t border-border-subtle p-4"
            >
              <input
                type="text"
                maxLength={400}
                placeholder="Ask about quiet seats, focus, Connect, or Circles..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="h-12 flex-1 rounded-field border border-border-subtle bg-fresh-milk px-3.5 text-sm text-espresso focus:border-focus-ring focus:outline-none"
              />
              <button
                type="submit"
                disabled={asking}
                className="inline-flex h-12 items-center justify-center rounded-pill bg-espresso px-5 text-sm font-semibold text-warm-cream hover:bg-espresso-hover disabled:opacity-60"
              >
                {asking ? "..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
