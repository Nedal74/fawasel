import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grain relative flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="grid-field pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <p className="label relative">ERROR 404</p>
      <h1 className="display relative text-[clamp(3rem,12vw,8rem)]">
        <span className="accent-text">LOST SIGNAL</span>
      </h1>
      <p className="relative max-w-md text-sm text-muted">
        This route does not exist, or the page was unpublished from the dashboard.
      </p>
      <Link
        href="/"
        className="btn-shine relative rounded-full btn-accent px-7 py-3.5 text-xs font-medium uppercase tracking-[0.18em]"
      >
        Back home
      </Link>
    </main>
  );
}
