import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Slim top bar */}
      <header className="border-b border-line bg-canvas-raised">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-tight text-ink"
          >
            Real Estate <span className="text-gold-deep">HQ</span>
          </Link>
          <Link
            href="/"
            className="text-xs text-ink-muted hover:text-ink"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-8 sm:py-12">{children}</main>
    </div>
  );
}
