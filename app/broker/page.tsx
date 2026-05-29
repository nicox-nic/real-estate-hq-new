import { AppShell } from "@/components/layout/AppShell";
import { DEMO_BROKER_ID, seedUsers } from "@/lib/data";

export default function BrokerDashboardPage() {
  const user = seedUsers.find((u) => u.id === DEMO_BROKER_ID);
  return (
    <AppShell
      role="Broker"
      userName={user?.fullName ?? "Demo Broker"}
      userSubtitle={user?.companyName ?? "Broker"}
    >
      <div className="rounded-2xl border border-dashed border-line bg-canvas-raised p-8 text-center">
        <div className="font-display text-2xl font-semibold text-ink mb-2">
          Broker Command Center
        </div>
        <p className="text-sm text-ink-muted">
          You're signed in as <span className="text-ink font-medium">{user?.fullName}</span>.
        </p>
        <p className="mt-3 text-xs text-ink-subtle">
          Full dashboard builds in Session 7. Auth flow is now walkable end-to-end.
        </p>
      </div>
    </AppShell>
  );
}
