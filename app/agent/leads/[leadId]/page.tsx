"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MessageBubble } from "@/components/conversation/MessageBubble";
import { ChannelRibbon } from "@/components/conversation/ChannelRibbon";
import {
  AISuggestedReplyPanel,
  AIReplyPill,
} from "@/components/conversation/AISuggestedReplyPanel";
import { Composer } from "@/components/conversation/Composer";
import {
  RefineSheet,
  type RefineAction,
} from "@/components/conversation/RefineSheet";
import {
  DEMO_AGENT_ID,
  seedLeads,
  seedListings,
  seedPropertyFiles,
  seedUsers,
} from "@/lib/data";
import { badgeVariantForLead } from "@/lib/logic/leadInboxDerivations";
import {
  suggestReply,
  type Tone,
  type Language,
  type SuggestedAction,
} from "@/lib/logic/aiReply";
import {
  sendMessage,
  useConversationThread,
} from "@/lib/conversationStore";

/**
 * Buyer Conversation (#12) — full implementation.
 *
 * Composition:
 *   - Header: back link, buyer hero with channel ribbon + score badge,
 *     View Profile shortcut.
 *   - Thread: scrollable list of message bubbles.
 *   - AI Suggested Reply panel (inline, above composer, dismissable per Q3
 *     decision). Replaced by "AI Reply" pill when dismissed.
 *   - Composer: attachments row, tone selector, language pill, textarea,
 *     attach button, send button.
 *   - Refine sheet: bottom sheet triggered from AI panel's Refine button.
 *   - Attach sheet: bottom sheet triggered from composer's Attach button
 *     (lives in Composer.tsx for cohesion).
 *
 * Mutation flow:
 *   - "Use this" → copies AI suggestion text into composer draft + stages
 *     the AI's suggested files as attachments. Tone/language carry over.
 *   - "Send" → calls sendMessage() which mutates the conversationStore;
 *     useConversationThread re-renders the thread; the new message lands
 *     at the bottom; composer + AI panel reset for the next reply.
 *
 * Note: this is a client component because of the live store + composer
 * state. The Buyer Profile page (3A) remains a server component since it
 * doesn't need live state.
 */
export default function BuyerConversationPage() {
  const params = useParams<{ leadId: string }>();
  const router = useRouter();
  const leadId = params.leadId;

  const lead = React.useMemo(
    () => seedLeads.find((l) => l.id === leadId),
    [leadId],
  );

  // If the lead doesn't exist, push back. (Client-side equivalent of notFound.)
  React.useEffect(() => {
    if (!lead) {
      router.replace("/agent/leads");
    }
  }, [lead, router]);

  const user = seedUsers.find((u) => u.id === DEMO_AGENT_ID);
  const interestedListing = React.useMemo(
    () =>
      lead?.selectedListingIds[0]
        ? seedListings.find((l) => l.id === lead.selectedListingIds[0])
        : undefined,
    [lead],
  );

  const filesForListing = React.useMemo(
    () =>
      interestedListing
        ? seedPropertyFiles.filter((f) => f.listingId === interestedListing.id)
        : [],
    [interestedListing],
  );

  // Live thread
  const thread = useConversationThread(leadId);
  const lastBuyerMsg = React.useMemo(() => {
    for (let i = thread.length - 1; i >= 0; i--) {
      const m = thread[i];
      if (m && m.sender === "buyer") return m;
    }
    return undefined;
  }, [thread]);

  // Composer state
  const [draft, setDraft] = React.useState("");
  const [tone, setTone] = React.useState<Tone>("Friendly Agent");
  const [language, setLanguage] = React.useState<Language>("English");
  const [attachmentIds, setAttachmentIds] = React.useState<string[]>([]);

  // AI panel state
  const [aiDismissed, setAiDismissed] = React.useState(false);
  const [refineOpen, setRefineOpen] = React.useState(false);
  const [selectedActionKinds, setSelectedActionKinds] = React.useState<
    Set<string>
  >(new Set());

  // Compute suggestion deterministically from current inputs.
  const suggestion = React.useMemo(() => {
    if (!lead) return null;
    return suggestReply({
      lead,
      listing: interestedListing,
      files: filesForListing,
      lastBuyerMessage: lastBuyerMsg?.body,
      tone,
      language,
    });
  }, [lead, interestedListing, filesForListing, lastBuyerMsg, tone, language]);

  // -------------------------------------------------------------------
  // Bail out early once we've confirmed lead is missing (effect routes).
  // -------------------------------------------------------------------
  if (!lead || !suggestion) {
    return null;
  }

  // Use this — push AI suggestion into the composer
  const handleUseThis = () => {
    setDraft(suggestion.text);
    // Stage the AI's suggested file attachments
    const ids = suggestion.suggestedActions
      .map((a) => a.attachFileId)
      .filter((id): id is string => !!id);
    setAttachmentIds(Array.from(new Set([...attachmentIds, ...ids])));
  };

  const handleToggleAction = (action: SuggestedAction) => {
    setSelectedActionKinds((prev) => {
      const next = new Set(prev);
      if (next.has(action.kind)) next.delete(action.kind);
      else next.add(action.kind);
      return next;
    });
    // If the action has an attachFileId, toggle that attachment too.
    if (action.attachFileId) {
      setAttachmentIds((prev) =>
        prev.includes(action.attachFileId!)
          ? prev.filter((id) => id !== action.attachFileId)
          : [...prev, action.attachFileId!],
      );
    }
  };

  const handleRefineAction = (a: RefineAction) => {
    switch (a.kind) {
      case "regenerate":
        // No-op when nothing else changed — but resetting the dismissed
        // state and clearing selectedActions gives a fresh feel.
        setSelectedActionKinds(new Set());
        setAiDismissed(false);
        break;
      case "set-tone":
        setTone(a.tone);
        setAiDismissed(false);
        break;
      case "set-language":
        setLanguage(a.language);
        setAiDismissed(false);
        break;
    }
  };

  const handleSend = () => {
    if (!draft.trim()) return;
    sendMessage({
      leadId: lead.id,
      body: draft,
      tone,
      language,
      attachmentIds: attachmentIds.length > 0 ? attachmentIds : undefined,
    });
    // Reset composer for next reply
    setDraft("");
    setAttachmentIds([]);
    setSelectedActionKinds(new Set());
  };

  return (
    <AppShell
      role="Agent"
      userName={user?.fullName ?? "Demo Agent"}
      userSubtitle={user?.companyName ?? "Agent"}
    >
      <div className="space-y-4 pb-4">
        {/* Back link */}
        <Link
          href="/agent/leads"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </Link>

        {/* Header card */}
        <Card surface="raised">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center font-semibold shrink-0">
              {initialsOf(lead.buyer.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-ink">{lead.buyer.name}</span>
                <StatusBadge variant={badgeVariantForLead(lead)}>
                  {lead.seedScoreCategory}
                </StatusBadge>
                <ChannelRibbon source={lead.source} />
              </div>
              {interestedListing ? (
                <div className="text-xs text-ink-muted mt-0.5 truncate">
                  Interested in{" "}
                  <span className="text-ink font-medium">
                    {interestedListing.title}
                  </span>
                </div>
              ) : null}
            </div>
            <Link href={`/agent/leads/${lead.id}/profile`}>
              <Button variant="secondary" size="sm">
                <User className="h-4 w-4" />
                Profile
              </Button>
            </Link>
          </div>
        </Card>

        {/* Thread */}
        <Card>
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
            <span className="text-xs text-ink-subtle">{thread.length} messages</span>
          </CardHeader>
          {thread.length === 0 ? (
            <p className="text-sm text-ink-muted py-6 text-center">
              No messages yet. Use the AI suggestion below or write your first
              reply.
            </p>
          ) : (
            <ol className="space-y-3">
              {thread.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  buyerName={lead.buyer.name}
                  attachedFiles={
                    m.attachmentIds
                      ? seedPropertyFiles.filter((f) =>
                          m.attachmentIds!.includes(f.id),
                        )
                      : undefined
                  }
                />
              ))}
            </ol>
          )}
        </Card>

        {/* AI Suggested Reply — inline above composer */}
        {aiDismissed ? (
          <div className="flex justify-end">
            <AIReplyPill onClick={() => setAiDismissed(false)} />
          </div>
        ) : (
          <AISuggestedReplyPanel
            suggestedText={suggestion.text}
            suggestedActions={suggestion.suggestedActions}
            agentNote={suggestion.agentNote}
            ruleName={suggestion.ruleName}
            onUseThis={handleUseThis}
            onRefine={() => setRefineOpen(true)}
            onDismiss={() => setAiDismissed(true)}
            onToggleAction={handleToggleAction}
            selectedActionKinds={selectedActionKinds}
          />
        )}

        {/* Composer */}
        <Composer
          draft={draft}
          onDraftChange={setDraft}
          tone={tone}
          onToneChange={setTone}
          language={language}
          onLanguageChange={setLanguage}
          attachmentIds={attachmentIds}
          onAttachmentsChange={setAttachmentIds}
          availableFiles={filesForListing}
          onSend={handleSend}
          canSend={draft.trim().length > 0}
        />

        {/* Refine sheet */}
        {refineOpen ? (
          <RefineSheet
            currentTone={tone}
            currentLanguage={language}
            onAction={handleRefineAction}
            onClose={() => setRefineOpen(false)}
          />
        ) : null}

        {/* Footer hint */}
        <div className="text-[11px] text-ink-subtle flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-gold-deep" />
          AI suggestions update as you change tone or language. Refine to fine-tune.
        </div>
      </div>
    </AppShell>
  );
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
