"use client";

import {
  RefreshCw,
  Heart,
  Briefcase,
  Minus,
  Plus,
  X,
  Languages,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { Tone, Language } from "@/lib/logic/aiReply";

/**
 * Refine bottom sheet — quick transforms over the active AI draft.
 *
 * Each option dispatches a refinement intent up to the parent, which then
 * calls the AI suggester with adjusted parameters (typically a different
 * tone or language). The sheet itself is dumb; the parent owns the state.
 *
 * Refinements per PRD § "AI Recommended Reply":
 *   - Regenerate (re-runs the rule with same inputs — useful after editing
 *     a chip stage in the panel)
 *   - Make warmer       → tone = Friendly Agent
 *   - Make professional → tone = Professional Broker
 *   - Make shorter      → tone = Short Reply
 *   - Make detailed     → tone = Detailed Reply
 *   - Translate to Tagalog → language = Tagalog
 *   - Translate to Cebuano → language = Cebuano
 *   - Back to English   → language = English
 *
 * Tones and refinements are coordinate axes — applying "Make warmer" then
 * "Translate to Cebuano" should leave both signals visible in the output.
 */
export type RefineAction =
  | { kind: "regenerate" }
  | { kind: "set-tone"; tone: Tone }
  | { kind: "set-language"; language: Language };

export function RefineSheet({
  currentTone,
  currentLanguage,
  onAction,
  onClose,
}: {
  currentTone: Tone;
  currentLanguage: Language;
  onAction: (a: RefineAction) => void;
  onClose: () => void;
}) {
  const handle = (a: RefineAction) => {
    onAction(a);
    onClose();
  };

  return (
    <div
      data-testid="refine-sheet"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-canvas-raised rounded-t-3xl sm:rounded-3xl shadow-lift w-full sm:max-w-md"
      >
        <div className="px-4 py-3 border-b border-line flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-ink">
            Refine reply
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-ink-muted hover:text-ink p-1.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="p-2">
          <RefineRow
            icon={<RefreshCw className="h-4 w-4" />}
            label="Regenerate"
            description="Re-run the suggestion with current settings."
            onClick={() => handle({ kind: "regenerate" })}
          />
          <SectionLabel>Tone</SectionLabel>
          <RefineRow
            icon={<Heart className="h-4 w-4" />}
            label="Make warmer"
            description="Friendly Agent voice."
            active={currentTone === "Friendly Agent"}
            onClick={() =>
              handle({ kind: "set-tone", tone: "Friendly Agent" })
            }
          />
          <RefineRow
            icon={<Briefcase className="h-4 w-4" />}
            label="Make professional"
            description="Professional Broker voice."
            active={currentTone === "Professional Broker"}
            onClick={() =>
              handle({ kind: "set-tone", tone: "Professional Broker" })
            }
          />
          <RefineRow
            icon={<Minus className="h-4 w-4" />}
            label="Make shorter"
            description="One-line decisive reply."
            active={currentTone === "Short Reply"}
            onClick={() => handle({ kind: "set-tone", tone: "Short Reply" })}
          />
          <RefineRow
            icon={<Plus className="h-4 w-4" />}
            label="Make detailed"
            description="Multi-paragraph, fuller picture."
            active={currentTone === "Detailed Reply"}
            onClick={() =>
              handle({ kind: "set-tone", tone: "Detailed Reply" })
            }
          />
          <SectionLabel>Language</SectionLabel>
          <RefineRow
            icon={<Languages className="h-4 w-4" />}
            label="English"
            description="Default."
            active={currentLanguage === "English"}
            onClick={() =>
              handle({ kind: "set-language", language: "English" })
            }
          />
          <RefineRow
            icon={<Languages className="h-4 w-4" />}
            label="Translate to Tagalog"
            description="Adds Kumusta / po opener and closer."
            active={currentLanguage === "Tagalog"}
            onClick={() =>
              handle({ kind: "set-language", language: "Tagalog" })
            }
          />
          <RefineRow
            icon={<Languages className="h-4 w-4" />}
            label="Translate to Cebuano"
            description="Adds Maayong opener and Cebuano closer."
            active={currentLanguage === "Cebuano"}
            onClick={() =>
              handle({ kind: "set-language", language: "Cebuano" })
            }
          />
        </ul>
      </div>
    </div>
  );
}

function RefineRow({
  icon,
  label,
  description,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-canvas-sunken transition-colors",
          active && "bg-gold-soft/30",
        )}
      >
        <div
          className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
            active ? "bg-gold-soft text-gold-deep" : "bg-canvas-sunken text-ink-muted",
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "text-sm font-medium",
              active ? "text-ink" : "text-ink",
            )}
          >
            {label}
          </div>
          <div className="text-xs text-ink-muted">{description}</div>
        </div>
        {active ? (
          <span className="text-[10px] uppercase tracking-wider text-gold-deep font-medium shrink-0">
            Active
          </span>
        ) : null}
      </button>
    </li>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <li className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-ink-subtle font-semibold">
      {children}
    </li>
  );
}
