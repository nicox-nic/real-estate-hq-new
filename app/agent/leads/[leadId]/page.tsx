import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  DEMO_AGENT_ID,
  seedConversationMessages,
  seedLeads,
  seedUsers,
} from "@/lib/data";
import { badgeVariantForLead } from "@/lib/logic/leadInboxDerivations";

interface PageProps {
  params: { leadId: string };
}

/**
 * Buyer Conversation — minimal placeholder for walkability.
 *
 * Session 3A scope only requires Dashboard + Inbox + Buyer Profile to be
 * complete; the full conversation thread (with AI suggested reply panel,
 * tone selectors, attachment chips, etc.) is built in Session 3B.
 *
 * This thin version exists so the inbox row tap-target doesn't 404 and the
 * walkthrough path (dashboard → inbox → row tap → "Open profile") works.
 */
export default function BuyerConversationPage({ params }: PageProps) {
  const lead = seedLeads.find((l) => l.id === params.leadId);
  if (!lead) notFound();

  const user = seedUsers.find((u) => u.id === DEMO_AGENT_ID);
  const messages = seedConversationMessages
    .filter((m) => m.leadId === lead.id)
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt));

  return (
    <AppShell
      role="Agent"
      userName={user?.fullName ?? "Demo Agent"}
      userSubtitle={user?.companyName ?? "Agent"}
    >
      <div className="space-y-5">
        <Link
          href="/agent/leads"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </Link>

        <Card surface="raised">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center font-semibold shrink-0">
              {lead.buyer.name
                .split(/\s+/)
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-ink">{lead.buyer.name}</span>
                <StatusBadge variant={badgeVariantForLead(lead)}>
                  {lead.seedScoreCategory}
                </StatusBadge>
              </div>
              <div className="text-xs text-ink-muted mt-0.5">{lead.source}</div>
            </div>
            <Link href={`/agent/leads/${lead.id}/profile`}>
              <Button variant="secondary" size="sm">
                <User className="h-4 w-4" />
                View profile
              </Button>
            </Link>
          </div>
        </Card>

        {/* Messages preview */}
        <Card>
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          {messages.length === 0 ? (
            <p className="text-sm text-ink-muted">No messages yet.</p>
          ) : (
            <ol className="space-y-3">
              {messages.map((m) => {
                const isBuyer = m.sender === "buyer";
                const isAI = m.sender === "ai";
                return (
                  <li
                    key={m.id}
                    className={
                      isBuyer
                        ? "flex justify-start"
                        : "flex justify-end"
                    }
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        isAI
                          ? "bg-gold-soft/40 border border-gold/30"
                          : isBuyer
                            ? "bg-canvas-sunken text-ink"
                            : "bg-sage-soft text-sage-deep"
                      }`}
                    >
                      {isAI ? (
                        <div className="text-[10px] uppercase tracking-wider text-gold-deep font-medium mb-1">
                          AI draft · ready to send
                        </div>
                      ) : null}
                      <div className="text-ink-muted whitespace-pre-line">
                        {m.body}
                      </div>
                      <div className="mt-1 text-[10px] text-ink-subtle">
                        {new Date(m.sentAt).toLocaleString("en-PH", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>

        <div className="rounded-2xl border border-dashed border-line bg-canvas-raised p-6 text-center">
          <p className="text-sm text-ink-muted">
            Full conversation thread with AI Suggested Reply panel, tone
            selector, and attachment composer ships in Session 3B.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
