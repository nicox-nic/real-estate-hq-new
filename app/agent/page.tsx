import { AppShell } from "@/components/layout/AppShell";
import { DEMO_AGENT_ID, seedUsers } from "@/lib/data";

export default function AgentDashboardPage() {
  const user = seedUsers.find((u) => u.id === DEMO_AGENT_ID);
  return (
    <AppShell
      role="Agent"
      userName={user?.fullName ?? "Demo Agent"}
      userSubtitle={user?.companyName ?? "Agent"}
    >
      <div className="rounded-2xl border border-dashed border-line bg-canvas-raised p-8 text-center">
        <div className="font-display text-2xl font-semibold text-ink mb-2">
          Agent Dashboard
        </div>
        <p className="text-sm text-ink-muted">
          You're signed in as <span className="text-ink font-medium">{user?.fullName}</span>.
        </p>
        <p className="mt-3 text-xs text-ink-subtle">
          Full dashboard builds in Session 3. Auth flow is now walkable end-to-end.
        </p>
      </div>
    </AppShell>
  );
}
