"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StaffLoginPage() {
  const router = useRouter();
  const [accessKey, setAccessKey] = useState("");
  const [role, setRole] = useState<"staff" | "demo_admin">("staff");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessKey, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "You don't have access to this café console.");
        return;
      }
      router.push(
        role === "demo_admin" ? "/demo/roastery-co" : "/staff/roastery-co"
      );
    } catch {
      setError("Could not reach authentication service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-panel border border-border-subtle bg-porcelain p-8 shadow-ceramic">
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-oat-milk px-3 py-1 text-xs font-semibold text-espresso">
          <span className="material-symbols-outlined text-[16px]">
            admin_panel_settings
          </span>
          Restricted Operations Access
        </span>
        <h1 className="mt-3 font-display text-2xl font-semibold text-espresso">
          BrewSpace Staff Console
        </h1>
        <p className="mt-1 text-sm text-quiet-stone">
          Authorized café operators and demo administrators only. Regular guests
          do not have access.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="role-select"
              className="block text-sm font-semibold text-espresso"
            >
              Console role
            </label>
            <select
              id="role-select"
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "staff" | "demo_admin")
              }
              className="mt-2 h-12 w-full rounded-field border border-border-subtle bg-fresh-milk px-3 text-sm text-espresso focus:border-focus-ring focus:outline-none"
            >
              <option value="staff">Café Operator (O01–O03)</option>
              <option value="demo_admin">Demo Administrator (O01–O03 + D01)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="access-key"
              className="block text-sm font-semibold text-espresso"
            >
              Operator access key (Secret Manager)
            </label>
            <input
              id="access-key"
              type="password"
              required
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              placeholder="Enter operator key"
              className="mt-2 h-12 w-full rounded-field border border-border-subtle bg-fresh-milk px-4 text-sm text-espresso focus:border-focus-ring focus:outline-none"
            />
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
            className="inline-flex h-12 w-full items-center justify-center rounded-pill bg-espresso px-6 text-sm font-semibold text-warm-cream hover:bg-espresso-hover disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Sign in to Console"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/c/roastery-co"
            className="text-xs font-semibold text-quiet-stone underline underline-offset-4 hover:text-espresso"
          >
            Return to Guest QR Welcome
          </Link>
        </div>
      </div>
    </main>
  );
}
