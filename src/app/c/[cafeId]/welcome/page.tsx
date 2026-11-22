"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function GuestIdentityPage() {
  const params = useParams<{ cafeId: string }>();
  const router = useRouter();
  const cafeId = params.cafeId || "roastery-co";

  const [alias, setAlias] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [existingAlias, setExistingAlias] = useState<string | null>(null);
  const [hasActiveVisit, setHasActiveVisit] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("/api/session")
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (data.authenticated && data.user?.alias) {
          setExistingAlias(data.user.alias);
          setAlias(data.user.alias);
          setHasActiveVisit(
            Boolean(data.activeVisit && data.activeVisit.cafeId === cafeId)
          );
        }
      })
      .catch(() => {
        // Safe to proceed with fresh guest session
      })
      .finally(() => {
        if (mounted) setCheckingSession(false);
      });
    return () => {
      mounted = false;
    };
  }, [cafeId]);

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = alias.trim();
    if (!trimmed) {
      setError("Please enter a first name or display alias to continue.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start your guest session.");
        return;
      }
      router.push(`/visit/setup?cafeId=${encodeURIComponent(cafeId)}`);
    } catch {
      setError("Network error while creating your session. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-between px-4 py-8 sm:px-6">
      <header className="flex items-center justify-between">
        <Link
          href={`/c/${cafeId}`}
          className="inline-flex items-center gap-1.5 rounded-pill px-3 py-2 text-sm font-medium text-quiet-stone transition-colors hover:bg-oat-milk hover:text-espresso"
        >
          <span className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          Back
        </Link>
        <span className="text-xs font-medium text-quiet-stone">
          Step 1 of 4 · Guest session
        </span>
      </header>

      <section className="my-8 rounded-panel border border-border-subtle bg-porcelain p-6 shadow-ceramic sm:p-8">
        <h1 className="font-display text-2xl font-semibold text-espresso sm:text-3xl">
          What should we call you today?
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-quiet-stone">
          Use a first name or casual alias for this visit. No account or
          password required—your guest session stays active if you reload the
          page.
        </p>

        {!checkingSession && hasActiveVisit && existingAlias && (
          <div className="mt-5 rounded-card border border-border-subtle bg-flow-bg p-4 text-sm text-flow-text">
            <p className="font-semibold">
              Active visit found for {existingAlias}
            </p>
            <div className="mt-2">
              <Link
                href="/visit/today"
                className="font-semibold underline underline-offset-4"
              >
                Return to Today
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleContinue} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="alias"
              className="block text-sm font-semibold text-espresso"
            >
              Display alias
            </label>
            <input
              id="alias"
              type="text"
              maxLength={32}
              autoComplete="given-name"
              placeholder="e.g., Alex"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="mt-2 h-12 w-full rounded-field border border-border-subtle bg-fresh-milk px-4 text-base text-espresso placeholder:text-quiet-stone/60 focus:border-focus-ring focus:outline-none"
            />
            <p className="mt-2 text-xs text-quiet-stone">
              Your alias stays private and is only shown to another guest if you
              both explicitly accept a 1:1 connection or join a confirmed
              Coffee Circle.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-field bg-error-bg px-4 py-3 text-sm text-error-text"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-espresso px-6 text-sm font-semibold text-warm-cream transition-colors hover:bg-espresso-hover disabled:opacity-60"
          >
            <span>{loading ? "Starting session..." : "Continue"}</span>
            <span className="material-symbols-outlined text-[18px]">
              arrow_forward
            </span>
          </button>
        </form>
      </section>

      <div />
    </main>
  );
}
