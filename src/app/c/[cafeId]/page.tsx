import Link from "next/link";
import { getSessionUser } from "@/lib/auth-server";
import { getActiveVisitForUser, getCafe, listSeats } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CafeWelcomePage({
  params,
}: {
  params: { cafeId: string };
}) {
  const cafe = await getCafe(params.cafeId);

  if (!cafe) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-12 text-center">
        <div className="w-full rounded-panel border border-border-subtle bg-porcelain p-8 shadow-ceramic">
          <span className="material-symbols-outlined mb-3 text-4xl text-error-text">
            location_off
          </span>
          <h1 className="font-display text-2xl font-semibold text-espresso">
            This café link isn&apos;t available
          </h1>
          <p className="mt-3 text-sm text-quiet-stone">
            Please check the QR code on your table or ask a member of the café
            team for help.
          </p>
          <Link
            href="/c/roastery-co"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-pill bg-espresso px-6 text-sm font-semibold text-warm-cream transition-colors hover:bg-espresso-hover"
          >
            Open Roastery &amp; Co. Demo
          </Link>
        </div>
      </main>
    );
  }

  const [seats, sessionUser] = await Promise.all([
    listSeats(cafe.cafeId),
    getSessionUser(),
  ]);
  const availableSeats = seats.filter((s) => s.status === "AVAILABLE").length;
  const activeVisit = sessionUser
    ? await getActiveVisitForUser(sessionUser.userId, cafe.cafeId)
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-between px-4 py-8 sm:px-6">
      {/* Top wordmark */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-espresso text-warm-cream">
            <span className="material-symbols-outlined text-[20px]">
              local_cafe
            </span>
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-espresso">
            BrewSpace
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-flow-bg px-3 py-1 text-xs font-medium text-flow-text">
          <span className="h-1.5 w-1.5 rounded-full bg-flow-text" />
          {availableSeats} seats open now
        </span>
      </header>

      {/* Main welcome card (E01) */}
      <section className="my-8 rounded-panel border border-border-subtle bg-porcelain p-6 shadow-ceramic sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-quiet-stone">
          {cafe.name} · {cafe.neighborhood}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight text-espresso sm:text-4xl">
          Your café. Your space. Your people.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-quiet-stone">
          Tell us what you want from your visit—quiet focus, a comfortable seat
          with power, or an optional conversation afterward. BrewSpace adapts to
          your pace.
        </p>

        {/* Privacy reassurance (IA E01 requirement) */}
        <div className="mt-6 flex items-start gap-3 rounded-card border border-border-subtle bg-oat-milk/70 p-4">
          <span className="material-symbols-outlined mt-0.5 text-[20px] text-flow-text">
            verified_user
          </span>
          <div className="text-sm leading-relaxed text-espresso">
            <p className="font-semibold">Private by default</p>
            <p className="mt-0.5 text-quiet-stone">
              Scanning this QR code does not make you visible to anyone. 1:1
              connections and Coffee Circles stay off unless you explicitly turn
              them on.
            </p>
          </div>
        </div>

        {/* Three capabilities preview */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-card bg-flow-bg p-3.5 text-flow-text">
            <p className="text-xs font-semibold uppercase tracking-wider">
              Café Flow
            </p>
            <p className="mt-1 text-xs leading-relaxed">
              Find a quiet or outlet-ready seat and protect your focus time.
            </p>
          </div>
          <div className="rounded-card bg-connect-bg p-3.5 text-connect-text">
            <p className="text-xs font-semibold uppercase tracking-wider">
              Café Connect
            </p>
            <p className="mt-1 text-xs leading-relaxed">
              Opt-in 1:1 introductions revealed only after both people accept.
            </p>
          </div>
          <div className="rounded-card bg-circles-bg p-3.5 text-circles-text">
            <p className="text-xs font-semibold uppercase tracking-wider">
              Coffee Circles
            </p>
            <p className="mt-1 text-xs leading-relaxed">
              Short 20-minute small-group chats around shared interests.
            </p>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="mt-8 flex flex-col gap-3">
          {activeVisit ? (
            <>
              <Link
                href="/visit/today"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-espresso px-6 text-sm font-semibold text-warm-cream transition-colors hover:bg-espresso-hover"
              >
                <span>Resume my visit as {activeVisit.alias}</span>
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </Link>
              <Link
                href={`/c/${cafe.cafeId}/welcome`}
                className="inline-flex h-12 w-full items-center justify-center rounded-pill border border-border-subtle bg-oat-milk px-6 text-sm font-semibold text-espresso transition-colors hover:bg-surface-container-highest"
              >
                Update alias or plan
              </Link>
            </>
          ) : (
            <Link
              href={`/c/${cafe.cafeId}/welcome`}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-espresso px-6 text-sm font-semibold text-warm-cream transition-colors hover:bg-espresso-hover"
            >
              <span>Start my visit</span>
              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>
            </Link>
          )}
        </div>
      </section>

      <footer className="text-center text-xs text-quiet-stone">
        {cafe.name} · Open {cafe.hours}
      </footer>
    </main>
  );
}
