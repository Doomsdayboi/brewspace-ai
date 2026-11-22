"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function DemoSimulatorPage() {
  const params = useParams<{ cafeId: string }>();
  const router = useRouter();
  const cafeId = params.cafeId || "roastery-co";

  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  async function runDemoAction(
    action: "reset" | "accept_pending_matches" | "trigger_table_conflict"
  ) {
    setBusy(true);
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, cafeId }),
      });
      if (res.status === 403 || res.status === 401) {
        router.push("/staff/login");
        return;
      }
      const data = await res.json();
      setLog((prev) => [
        `${new Date().toLocaleTimeString()}: ${data.summary || data.error || "Done"}`,
        ...prev,
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div className="rounded-panel border-2 border-tertiary bg-connect-bg/40 p-6">
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-tertiary px-3 py-1 text-xs font-semibold text-on-tertiary">
          <span className="material-symbols-outlined text-[16px]">science</span>
          DEMO / SIMULATED ENVIRONMENT (D01)
        </span>
        <h1 className="mt-3 font-display text-3xl font-semibold text-espresso">
          Hackathon Demo Simulator
        </h1>
        <p className="mt-1 text-sm text-quiet-stone">
          Reproduce the complete BrewSpace hero journey deterministically:
          reset the 4 consenting test visitors, simulate mutual 1:1 acceptance,
          or trigger a live Coffee Circle table conflict.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => runDemoAction("reset")}
            className="inline-flex h-12 items-center gap-2 rounded-pill bg-espresso px-5 text-sm font-semibold text-warm-cream hover:bg-espresso-hover disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">
              restart_alt
            </span>
            Reset Café &amp; 4 Seeded Visitors
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => runDemoAction("accept_pending_matches")}
            className="inline-flex h-12 items-center gap-2 rounded-pill bg-tertiary px-5 text-sm font-semibold text-on-tertiary disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">
              handshake
            </span>
            Simulate Partner Accepting 1:1 Invite
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => runDemoAction("trigger_table_conflict")}
            className="inline-flex h-12 items-center gap-2 rounded-pill bg-secondary px-5 text-sm font-semibold text-on-secondary disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">
              swap_horiz
            </span>
            Trigger Circle Table Conflict (Journey D)
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-4 text-xs font-semibold">
          <Link
            href={`/staff/${cafeId}`}
            className="text-espresso underline underline-offset-4"
          >
            Open Staff Operations Console
          </Link>
          <Link
            href={`/c/${cafeId}`}
            className="text-espresso underline underline-offset-4"
          >
            Open Guest QR Landing
          </Link>
        </div>
      </div>

      <section className="rounded-panel border border-border-subtle bg-porcelain p-6">
        <h2 className="font-display text-lg font-semibold text-espresso">
          Simulation Output
        </h2>
        {log.length === 0 ? (
          <p className="mt-2 text-sm text-quiet-stone">
            Trigger an action above to see live orchestration results.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-espresso">
            {log.map((entry, idx) => (
              <li
                key={idx}
                className="rounded-field bg-oat-milk/70 px-3.5 py-2.5"
              >
                {entry}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
