import { AppShell } from "@/components/layout/AppShell";
import { DEMO_REALTOR_ID, seedUsers } from "@/lib/data";

export default function RealtorDashboardPage() {
  const user = seedUsers.find((u) => u.id === DEMO_REALTOR_ID);
  return (
    <AppShell
      role="Realtor"
      userName={user?.fullName ?? "Demo Realtor"}
      userSubtitle={user?.companyName ?? "Realtor"}
    >
      <div className="rounded-2xl border border-dashed border-line bg-canvas-raised p-8 text-center">
        <div className="font-display text-2xl font-semibold text-ink mb-2">
          Realtor Network Dashboard
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
