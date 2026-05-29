"use client";

import * as React from "react";
import {
  Paperclip,
  Send,
  X,
  FileText,
  Languages,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  ALL_TONES,
  ALL_LANGUAGES,
  type Tone,
  type Language,
} from "@/lib/logic/aiReply";
import type { PropertyFile } from "@/lib/types";

/**
 * Composer block.
 *
 * Stack (top → bottom):
 *   1. Selected attachments row (chips with × to remove)
 *   2. Tone selector chip row (horizontal scroll on mobile) + language pill
 *   3. Textarea
 *   4. Action row: Attach button (left), Send button (right)
 *
 * The composer is a controlled component: the parent owns the draft text,
 * selected tone, language, and attachment IDs. This keeps the AI panel and
 * the composer decoupled — the AI panel can offer suggestions, the composer
 * is the final voice.
 */
export interface ComposerProps {
  draft: string;
  onDraftChange: (s: string) => void;

  tone: Tone;
  onToneChange: (t: Tone) => void;

  language: Language;
  onLanguageChange: (l: Language) => void;

  attachmentIds: string[];
  onAttachmentsChange: (ids: string[]) => void;
  /** Files available for this conversation's interested listing. */
  availableFiles: PropertyFile[];

  onSend: () => void;
  canSend: boolean;
}

export function Composer({
  draft,
  onDraftChange,
  tone,
  onToneChange,
  language,
  onLanguageChange,
  attachmentIds,
  onAttachmentsChange,
  availableFiles,
  onSend,
  canSend,
}: ComposerProps) {
  const [attachSheetOpen, setAttachSheetOpen] = React.useState(false);

  const selectedFiles = availableFiles.filter((f) =>
    attachmentIds.includes(f.id),
  );

  return (
    <div className="rounded-2xl border border-line bg-canvas-raised shadow-soft p-3 space-y-3">
      {/* Attachment chips */}
      {selectedFiles.length > 0 ? (
        <div
          data-testid="composer-attachments"
          data-count={selectedFiles.length}
          className="flex flex-wrap gap-1.5"
        >
          {selectedFiles.map((f) => (
            <span
              key={f.id}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gold-soft/50 border border-gold/30 text-xs"
            >
              <FileText className="h-3 w-3 text-gold-deep" />
              <span className="text-ink truncate max-w-[160px]">{f.name}</span>
              <button
                onClick={() =>
                  onAttachmentsChange(
                    attachmentIds.filter((id) => id !== f.id),
                  )
                }
                aria-label={`Remove ${f.name}`}
                className="text-ink-subtle hover:text-ink"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {/* Tone selector + language pill */}
      <div className="flex items-center gap-2">
        <div
          data-testid="tone-selector"
          className="flex gap-1.5 overflow-x-auto scrollbar-none flex-1 -mx-1 px-1"
        >
          {ALL_TONES.map((t) => {
            const active = t === tone;
            return (
              <button
                key={t}
                onClick={() => onToneChange(t)}
                data-testid={`tone-chip-${slugify(t)}`}
                className={cn(
                  "whitespace-nowrap rounded-full px-2.5 h-7 text-[11px] font-medium border transition-colors shrink-0",
                  active
                    ? "bg-ink text-ink-inverse border-ink"
                    : "bg-canvas-sunken text-ink-muted border-line hover:border-gold/40",
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
        <LanguagePill
          language={language}
          onLanguageChange={onLanguageChange}
        />
      </div>

      {/* Textarea */}
      <textarea
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        placeholder="Write your reply…"
        rows={3}
        className={cn(
          "w-full resize-none rounded-xl border border-line bg-canvas-raised text-sm text-ink placeholder:text-ink-subtle p-3",
          "focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30",
        )}
      />

      {/* Action row */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setAttachSheetOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink px-2 py-1.5 rounded-lg hover:bg-canvas-sunken"
        >
          <Paperclip className="h-4 w-4" />
          Attach
          {attachmentIds.length > 0 ? (
            <span className="text-xs text-gold-deep font-medium">
              {attachmentIds.length}
            </span>
          ) : null}
        </button>
        <Button
          variant="primary"
          size="sm"
          onClick={onSend}
          disabled={!canSend}
          data-testid="composer-send"
        >
          <Send className="h-4 w-4" />
          Send
        </Button>
      </div>

      {/* Attach files bottom sheet */}
      {attachSheetOpen ? (
        <AttachSheet
          availableFiles={availableFiles}
          selectedIds={attachmentIds}
          onChange={onAttachmentsChange}
          onClose={() => setAttachSheetOpen(false)}
        />
      ) : null}
    </div>
  );
}

function LanguagePill({
  language,
  onLanguageChange,
}: {
  language: Language;
  onLanguageChange: (l: Language) => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        data-testid="language-toggle"
        className="inline-flex items-center gap-1 px-2 h-7 rounded-full bg-canvas-sunken text-ink-muted border border-line hover:border-gold/40 text-[11px] font-medium"
      >
        <Languages className="h-3 w-3" />
        {language}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open ? (
        <ul className="absolute right-0 top-8 z-10 rounded-xl border border-line bg-canvas-raised shadow-lift min-w-[120px] overflow-hidden">
          {ALL_LANGUAGES.map((l) => (
            <li key={l}>
              <button
                onClick={() => {
                  onLanguageChange(l);
                  setOpen(false);
                }}
                data-testid={`lang-option-${l}`}
                className={cn(
                  "block w-full text-left px-3 py-2 text-xs hover:bg-canvas-sunken",
                  l === language ? "text-ink font-medium" : "text-ink-muted",
                )}
              >
                {l}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function AttachSheet({
  availableFiles,
  selectedIds,
  onChange,
  onClose,
}: {
  availableFiles: PropertyFile[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
}) {
  const groups = React.useMemo(() => groupByCategory(availableFiles), [
    availableFiles,
  ]);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div
      data-testid="attach-sheet"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-canvas-raised rounded-t-3xl sm:rounded-3xl shadow-lift w-full sm:max-w-md max-h-[80vh] overflow-y-auto"
      >
        <div className="px-4 py-3 border-b border-line flex items-center justify-between sticky top-0 bg-canvas-raised">
          <h3 className="font-display text-lg font-semibold text-ink">
            Attach files
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-ink-muted hover:text-ink p-1.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {Object.entries(groups).length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-6">
              No files available for this listing.
            </p>
          ) : (
            Object.entries(groups).map(([cat, files]) => (
              <div key={cat}>
                <h4 className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium mb-2">
                  {cat}
                </h4>
                <ul className="space-y-1.5">
                  {files.map((f) => {
                    const isSelected = selectedIds.includes(f.id);
                    return (
                      <li key={f.id}>
                        <button
                          onClick={() => toggle(f.id)}
                          className={cn(
                            "w-full flex items-center gap-3 p-2 rounded-xl border transition-colors text-left",
                            isSelected
                              ? "bg-gold-soft/50 border-gold/40"
                              : "bg-canvas-sunken border-line hover:border-gold/40",
                          )}
                        >
                          <div className="h-8 w-8 rounded-lg bg-canvas-raised flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4 text-ink-muted" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-ink truncate">
                              {f.name}
                            </div>
                            <div className="text-[10px] text-ink-subtle uppercase tracking-wider">
                              {f.format} · {f.category}
                              {f.isOfficialDeveloperFile ? " · Official" : ""}
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="h-4 w-4 rounded border-line text-gold-deep focus:ring-gold/30 shrink-0"
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}

          <div className="text-[11px] text-ink-subtle flex items-start gap-1.5 pt-2">
            <Sparkles className="h-3 w-3 text-gold-deep mt-0.5 shrink-0" />
            <span>
              AI suggested attachments above are highlighted; you can still add
              or remove freely.
            </span>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-line bg-canvas-raised sticky bottom-0">
          <Button
            variant="primary"
            size="md"
            onClick={onClose}
            className="w-full"
          >
            Done · {selectedIds.length} selected
          </Button>
        </div>
      </div>
    </div>
  );
}

function groupByCategory(
  files: PropertyFile[],
): Record<string, PropertyFile[]> {
  const groups: Record<string, PropertyFile[]> = {};
  for (const f of files) {
    if (!groups[f.category]) groups[f.category] = [];
    groups[f.category]!.push(f);
  }
  return groups;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
