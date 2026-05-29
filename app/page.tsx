import Link from "next/link";

/**
 * Splash / placeholder home page.
 *
 * Session 1 deliverable: a brand-correct landing that links to the role
 * selector pattern PRD specifies (Agent / Broker / Realtor). The actual
 * dashboards are built in Session 3+.
 */

export default function HomePage() {
  return (
    <main className="min-h-screen bg-canvas">
      <div className="max-w-5xl mx-auto px-6 py-16 lg:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-soft text-gold-deep text-xs font-medium mb-6">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold-deep" />
            Prototype — Session 1 / 9
          </div>

          <h1 className="font-display text-5xl lg:text-6xl font-semibold tracking-tight text-ink text-balance">
            Real Estate <span className="text-gold-deep">HQ</span>
          </h1>

          <p className="mt-4 text-lg text-ink-muted text-balance">
            Your AI-powered real estate sales OS. Close more deals. Earn more.
            All in one platform for agents, brokers, and realtors.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <RoleCard
              role="Agent"
              tagline="Manage leads, listings, and earnings"
              href="/agent"
            />
            <RoleCard
              role="Broker"
              tagline="Lead your team and distribute listings"
              href="/broker"
            />
            <RoleCard
              role="Realtor"
              tagline="Grow your network and oversee performance"
              href="/realtor"
            />
          </div>

          <div className="mt-10 text-xs text-ink-subtle">
            Scaffold ready. Authentication, dashboards, and feature surfaces
            are built across subsequent sessions.
          </div>
        </div>
      </div>
    </main>
  );
}

function RoleCard({
  role,
  tagline,
  href,
}: {
  role: string;
  tagline: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl bg-canvas-raised border border-line p-6 text-left hover:shadow-card hover:border-gold/40 transition-all"
    >
      <div className="font-display text-xl font-semibold text-ink">{role}</div>
      <div className="mt-2 text-sm text-ink-muted">{tagline}</div>
      <div className="mt-4 text-xs text-gold-deep font-medium">
        Enter →
      </div>
    </Link>
  );
}
