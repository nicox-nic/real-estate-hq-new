import * as React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

interface AISuggestionCardProps {
  title: string;
  body: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}

/**
 * Marks AI-generated suggestions clearly per the PRD's transparency principle.
 * Soft gold accent to signal AI without making it look like a CTA banner.
 */
export function AISuggestionCard({
  title,
  body,
  primaryAction,
  secondaryAction,
  className,
}: AISuggestionCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gold/30 bg-gold-soft/30 p-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-gold/15 text-gold-deep shrink-0">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-gold-deep">
            AI Suggestion
          </div>
          <div className="mt-0.5 text-sm font-semibold text-ink">{title}</div>
          <div className="mt-1 text-sm text-ink-muted leading-relaxed">
            {body}
          </div>
          {(primaryAction || secondaryAction) && (
            <div className="mt-3 flex items-center gap-2">
              {primaryAction}
              {secondaryAction}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
