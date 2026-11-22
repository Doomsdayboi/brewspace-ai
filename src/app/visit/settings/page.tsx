"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VisitShell } from "@/components/VisitShell";
import type { Visit } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [interestsInput, setInterestsInput] = useState("");
  const [connectOptIn, setConnectOptIn] = useState(false);
  const [circlesOptIn, setCirclesOptIn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/visit")
      .then((res) => {
        if (res.status === 401) {
          router.push("/c/roastery-co");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data?.visit) {
          router.push("/visit/setup?cafeId=roastery-co");
          return;
        }
        setVisit(data.visit);
        setInterestsInput((data.visit.interests ?? []).join(", "));
        setConnectOptIn(Boolean(data.visit.connectOptIn));
        setCirclesOptIn(Boolean(data.visit.circlesOptIn));
      });
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    const interests = interestsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 8);
    try {
      const res = await fetch("/api/visit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests, connectOptIn, circlesOptIn }),
      });
      const data = await res.json();
      if (res.ok && data.visit) {
        setVisit(data.visit);
        setStatusMsg("Visit preferences and privacy controls updated.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleEndVisit() {
    setSaving(true);
    try {
      const res = await fetch("/api/visit/end", { method: "POST" });
      if (res.ok) {
        router.push("/visit/ended");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!visit) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center p-6 text-sm text-quiet-stone">
        Loading settings...
      </main>
    );
  }

  return (
    <VisitShell
      cafeName={visit.cafeId === "roastery-co" ? "Roastery & Co." : visit.cafeId}
      mode={visit.currentMode}
      seatId={visit.seatId}
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-widest text-quiet-stone">
            Settings &amp; Privacy
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-espresso">
            Manage this visit
          </h1>
        </header>

        {statusMsg && (
          <div
            role="status"
            className="rounded-field bg-success-bg px-4 py-3 text-sm font-medium text-success-text"
          >
            {statusMsg}
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="space-y-5 rounded-panel border border-border-subtle bg-porcelain p-6 shadow-subtle"
        >
          <div>
            <label
              htmlFor="settings-interests"
              className="block text-sm font-semibold text-espresso"
            >
              Interests &amp; topics (comma-separated)
            </label>
            <input
              id="settings-interests"
              type="text"
              value={interestsInput}
              onChange={(e) => setInterestsInput(e.target.value)}
              className="mt-2 h-12 w-full rounded-field border border-border-subtle bg-fresh-milk px-4 text-sm text-espresso focus:border-focus-ring focus:outline-none"
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-espresso">
              Independent discovery permissions
            </p>
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-card border border-border-subtle bg-oat-milk/50 p-4">
              <span className="text-sm text-espresso">
                Allow 1:1 Café Connect suggestions
              </span>
              <input
                type="checkbox"
                checked={connectOptIn}
                onChange={(e) => setConnectOptIn(e.target.checked)}
                className="h-5 w-5 accent-tertiary"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-card border border-border-subtle bg-oat-milk/50 p-4">
              <span className="text-sm text-espresso">
                Allow Coffee Circles group invitations
              </span>
              <input
                type="checkbox"
                checked={circlesOptIn}
                onChange={(e) => setCirclesOptIn(e.target.checked)}
                className="h-5 w-5 accent-espresso"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-12 items-center justify-center rounded-pill bg-espresso px-6 text-sm font-semibold text-warm-cream hover:bg-espresso-hover disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>

        {/* S05: End Visit Confirmation */}
        <section className="rounded-panel border border-border-subtle bg-error-bg/40 p-6">
          <h2 className="font-display text-xl font-semibold text-espresso">
            End your visit
          </h2>
          <p className="mt-1 text-sm text-quiet-stone">
            Ending your visit removes you from live discovery, releases your
            seat claim, and cancels pending invitations.
          </p>
          {!confirmEnd ? (
            <button
              type="button"
              onClick={() => setConfirmEnd(true)}
              className="mt-4 inline-flex h-11 items-center rounded-pill border border-error-text bg-porcelain px-5 text-sm font-semibold text-error-text"
            >
              End visit
            </button>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={handleEndVisit}
                className="inline-flex h-11 items-center rounded-pill bg-error-text px-5 text-sm font-semibold text-white"
              >
                Confirm — End visit now
              </button>
              <button
                type="button"
                onClick={() => setConfirmEnd(false)}
                className="inline-flex h-11 items-center rounded-pill bg-oat-milk px-5 text-sm font-semibold text-espresso"
              >
                Keep my visit active
              </button>
            </div>
          )}
        </section>
      </div>
    </VisitShell>
  );
}
