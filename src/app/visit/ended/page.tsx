import Link from "next/link";

export default function VisitEndedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
      <div className="w-full rounded-panel border border-border-subtle bg-porcelain p-8 shadow-ceramic">
        <span className="material-symbols-outlined text-4xl text-flow-text">
          local_cafe
        </span>
        <h1 className="mt-3 font-display text-3xl font-semibold text-espresso">
          Your visit has ended
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-quiet-stone">
          You have been removed from active discovery and any seat holds have
          been released. Thanks for spending time at BrewSpace.
        </p>
        <Link
          href="/c/roastery-co"
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-pill bg-espresso px-6 text-sm font-semibold text-warm-cream hover:bg-espresso-hover"
        >
          Start a new visit
        </Link>
      </div>
    </main>
  );
}
