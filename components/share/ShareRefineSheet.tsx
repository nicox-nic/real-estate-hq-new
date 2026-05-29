"use client";

import * as React from "react";
import { X, RotateCw, Globe2, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { ALL_TONES, type Tone } from "@/lib/logic/aiReply/tones";
import { ALL_LANGUAGES, type Language } from "@/lib/logic/aiReply/languages";

/**
 * ShareRefineSheet — bottom sheet for tone + language adjustment.
 *
 * Composes from 3B's RefineSheet pattern (tones + languages) but adjusted
 * for outbound shares: same 8 tones, same 3 languages, simpler controls
 * (no Make warmer/professional/shorter shortcuts — those become explicit
 * tone selections), plus a Regenerate button that re-runs the AI rule.
 */
export function ShareRefineSheet({
  open,
  onClose,
  tone,
  onToneChange,
  language,
  onLanguageChange,
  onRegenerate,
}: {
  open: boolean;
  onClose: () => void;
  tone: Tone;
  onToneChange: (t: Tone) => void;
  language: Language;
  onLanguageChange: (l: Language) => void;
  onRegenerate: () => void;
}) {
  // Lock body scroll while open
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      data-testid="share-refine-sheet"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      <button
        aria-label="Close refine"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
      />
      <div className="relative w-full sm:max-w-md bg-canvas-raised rounded-t-3xl sm:rounded-2xl shadow-lift max-h-[85vh] overflow-y-auto">
        {/* Drag indicator (mobile) */}
        <div className="sm:hidden flex justify-center pt-2">
          <span className="h-1 w-10 rounded-full bg-line" />
        </div>

        <header className="flex items-center justify-between px-4 sm:px-5 pt-4 pb-3">
          <h2 className="font-medium text-ink inline-flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-gold-deep" />
            Refine message
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-ink-subtle hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="px-4 sm:px-5 pb-4 space-y-5">
          {/* Tones */}
          <section>
            <h3 className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-2">
              Tone
            </h3>
            <div
              data-testid="refine-tone-list"
              className="grid grid-cols-2 gap-2"
            >
              {ALL_TONES.map((t) => {
                const active = t === tone;
                return (
                  <button
                    key={t}
                    onClick={() => onToneChange(t)}
                    data-testid={`refine-tone-${t.replace(/\s+/g, "-").toLowerCase()}`}
                    data-active={active}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-xs font-medium text-left transition-colors",
                      active
                        ? "bg-gold-soft text-gold-deep border-gold-deep/30"
                        : "bg-canvas-raised text-ink-muted border-line hover:border-gold/40",
                    )}
                  >
                    {t}
                    {active ? (
                      <span className="block text-[10px] font-normal mt-0.5 text-gold-deep/80">
                        Active
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Language */}
          <section>
            <h3 className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-2 inline-flex items-center gap-1">
              <Globe2 className="h-3 w-3" />
              Language
            </h3>
            <div
              data-testid="refine-language-list"
              className="grid grid-cols-3 gap-2"
            >
              {ALL_LANGUAGES.map((l) => {
                const active = l === language;
                return (
                  <button
                    key={l}
                    onClick={() => onLanguageChange(l)}
                    data-testid={`refine-language-${l.toLowerCase()}`}
                    data-active={active}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
                      active
                        ? "bg-gold-soft text-gold-deep border-gold-deep/30"
                        : "bg-canvas-raised text-ink-muted border-line hover:border-gold/40",
                    )}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Regenerate */}
          <button
            onClick={() => {
              onRegenerate();
              onClose();
            }}
            data-testid="refine-regenerate"
            className="w-full rounded-xl border border-line bg-canvas-sunken px-4 py-3 text-sm font-medium text-ink-muted hover:text-ink hover:border-gold/40 inline-flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCw className="h-4 w-4" />
            Regenerate from rule
          </button>
        </div>
      </div>
    </div>
  );
}
