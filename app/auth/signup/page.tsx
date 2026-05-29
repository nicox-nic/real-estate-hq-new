"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Building2, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

type Role = "Agent" | "Broker" | "Realtor";

interface RoleOption {
  role: Role;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  highlights: string[];
}

const OPTIONS: RoleOption[] = [
  {
    role: "Agent",
    icon: Briefcase,
    title: "Agent",
    description:
      "I sell properties on behalf of a broker, realtor, or developer.",
    highlights: [
      "Manage leads and conversations",
      "Share listings and book site visits",
      "Track commissions and earnings",
    ],
  },
  {
    role: "Broker",
    icon: Building2,
    title: "Broker",
    description:
      "I lead a team of agents and manage my brokerage's listings.",
    highlights: [
      "Approve and monitor agents",
      "Distribute listings to your team",
      "Track team sales and commissions",
    ],
  },
  {
    role: "Realtor",
    icon: Users,
    title: "Realtor",
    description: "I oversee a network of brokers and agents at scale.",
    highlights: [
      "Manage your full network",
      "Broadcast updates and campaigns",
      "Monitor network-wide performance",
    ],
  },
];

export default function SignupRoleSelect() {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Role | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    const path = `/auth/register/${selected.toLowerCase()}`;
    router.push(path);
  };

  return (
    <div>
      <div className="mb-8">
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gold-soft text-gold-deep text-xs font-medium mb-3">
          Step 1 of 4
        </div>
        <h1 className="font-display text-3xl font-semibold text-ink text-balance">
          What's your role?
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          We'll tailor your account, dashboards, and the documents we need from
          you.
        </p>
      </div>

      <div className="space-y-3">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = selected === opt.role;
          return (
            <button
              key={opt.role}
              type="button"
              onClick={() => setSelected(opt.role)}
              className={cn(
                "w-full text-left rounded-2xl border bg-canvas-raised p-5 transition-all",
                active
                  ? "border-gold shadow-card ring-2 ring-gold/20"
                  : "border-line hover:border-gold/40 hover:shadow-soft",
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                    active
                      ? "bg-gold/15 text-gold-deep"
                      : "bg-canvas-sunken text-ink-muted",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg font-semibold text-ink">
                      {opt.title}
                    </span>
                    {active ? (
                      <span className="text-xs font-medium text-gold-deep">
                        Selected
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 text-sm text-ink-muted">
                    {opt.description}
                  </div>
                  <ul className="mt-3 space-y-1">
                    {opt.highlights.map((h) => (
                      <li
                        key={h}
                        className="text-xs text-ink-muted flex items-center gap-2"
                      >
                        <span className="h-1 w-1 rounded-full bg-gold-deep" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          type="button"
          variant="gold"
          size="lg"
          onClick={handleContinue}
          disabled={!selected}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
