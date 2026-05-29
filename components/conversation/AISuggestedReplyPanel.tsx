"use client";

import { Sparkles, X, Wand2, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { SuggestedAction } from "@/lib/logic/aiReply";

/**
 * Inline AI Suggested Reply panel — sits above the composer.
 *
 * Per session 3B framing (and the PRD's "AI as continuous co-pilot" framing):
 *   - Visible by default at the top of the composer area.
 *   - Dismissable via × — dismissal scoped to the current conversation only.
 *   - When dismissed, replaced by a small "AI Reply" pill that resummons it.
 *
 * Three primary controls per PRD's "show only 3 primary buttons" rule:
 *   - Use this   → primary action (gold) — copies into the composer
 *   - Refine     → opens the bottom-sheet refine menu
 *   - Dismiss    → × icon-only
 *
 * Suggested actions render as small chips below the suggested text.
 * Tapping a chip appends it to the agent's intent (e.g. "+ Book site visit").
 *
 * The agent note (if present) renders in a subdued strip at the bottom of
 * the panel — never inline in the suggested text itself, per PRD's "show
 * internal Agent Note" guidance.
 */
export function AISuggestedReplyPanel({
  suggestedText,
  suggestedActions,
  agentNote,
  ruleName,
  onUseThis,
  onRefine,
  onDismiss,
  onToggleAction,
  selectedActionKinds,
}: {
  suggestedText: string;
  suggestedActions: SuggestedAction[];
  agentNote?: string;
  ruleName: string;
  onUseThis: () => void;
  onRefine: () => void;
  onDismiss: () => void;
  onToggleAction: (action: SuggestedAction) => void;
  /** Which actions the agent has staged from the chip row. */
  selectedActionKinds: Set<string>;
}) {
  return (
    <div
      data-testid="ai-suggested-reply-panel"
      className="rounded-2xl border border-gold/30 bg-gold-soft/30 p-4 shadow-soft"
    >
      <div className="flex items-start gap-2 mb-3">
        <div className="h-7 w-7 rounded-lg bg-gold-soft text-gold-deep flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-gold-deep uppercase tracking-wider">
            AI suggested reply
          </div>
          <div className="text-[10px] text-ink-subtle font-medium">
            rule: {ruleName}
          </div>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss AI suggestion"
          className="text-ink-subtle hover:text-ink p-1 rounded-md hover:bg-canvas-raised/40 shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Suggested text */}
      <div
        data-testid="ai-suggested-text"
        className="text-sm text-ink leading-relaxed whitespace-pre-line bg-canvas-raised/60 rounded-xl px-3 py-2.5 mb-3"
      >
        {suggestedText}
      </div>

      {/* Suggested actions */}
      {suggestedActions.length > 0 ? (
        <div
          data-testid="ai-suggested-actions"
          data-count={suggestedActions.length}
          className="flex flex-wrap gap-1.5 mb-3"
        >
          {suggestedActions.map((a) => {
            const selected = selectedActionKinds.has(a.kind);
            return (
              <button
                key={a.kind}
                onClick={() => onToggleAction(a)}
                data-testid={`ai-action-${a.kind}`}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                  selected
                    ? "bg-sage-soft text-sage-deep border-sage/40"
                    : "bg-canvas-raised/60 text-ink-muted border-line hover:border-gold/40",
                )}
              >
                {selected ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                {a.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Primary controls — 3 per PRD UX rule */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onRefine}>
          <Wand2 className="h-4 w-4" />
          Refine
        </Button>
        <Button variant="gold" size="sm" onClick={onUseThis}>
          Use this
        </Button>
      </div>

      {/* Agent note for sensitive topics */}
      {agentNote ? (
        <div
          data-testid="ai-agent-note"
          className="mt-3 pt-3 border-t border-gold/20 text-[11px] text-ink-muted italic"
        >
          <span className="font-medium text-ink not-italic">Note for you: </span>
          {agentNote}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Replacement pill shown after the agent dismisses the AI panel. Click to
 * resummon.
 */
export function AIReplyPill({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      data-testid="ai-reply-pill"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold-soft/60 text-gold-deep text-xs font-medium border border-gold/30 hover:bg-gold-soft hover:shadow-soft transition-all"
    >
      <Sparkles className="h-3.5 w-3.5" />
      AI Reply
    </button>
  );
}
