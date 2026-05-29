import { Sparkles, FileText, Paperclip, Check } from "lucide-react";
import type { ConversationMessage, PropertyFile } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * Message bubble — three variants:
 *   - buyer: left-aligned, bg-canvas-sunken, inbound voice
 *   - agent: right-aligned, bg-sage-soft, outbound
 *   - ai (draft): right-aligned, bg-gold-soft, marked "AI draft · ready to send"
 *
 * Sent messages that originated from an AI suggestion still render as
 * "agent" (it IS the agent's voice once sent), with a small sparkle marker
 * indicating AI assistance. This is the Option Z echo: the AI's hand is
 * visible without taking over the row.
 *
 * Attachments render as small chips below the bubble.
 */
export function MessageBubble({
  message,
  buyerName,
  attachedFiles,
}: {
  message: ConversationMessage;
  buyerName: string;
  /** Files looked up by ID from message.attachmentIds */
  attachedFiles?: PropertyFile[];
}) {
  const isBuyer = message.sender === "buyer";
  const isAIDraft = message.sender === "ai" && message.isDraft;

  const align = isBuyer ? "items-start" : "items-end";
  const justify = isBuyer ? "justify-start" : "justify-end";

  const bubbleClasses = cn(
    "max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
    isAIDraft
      ? "bg-gold-soft/40 border border-gold/30"
      : isBuyer
        ? "bg-canvas-sunken text-ink"
        : "bg-sage-soft text-sage-deep",
  );

  return (
    <li className={cn("flex flex-col gap-1", align)}>
      <div className={cn("flex w-full", justify)}>
        <div className={bubbleClasses}>
          {isAIDraft ? (
            <div className="text-[10px] uppercase tracking-wider text-gold-deep font-medium mb-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI draft · ready to send
            </div>
          ) : null}
          {!isBuyer && message.tone ? (
            <div className="text-[10px] text-sage-deep/70 font-medium mb-1 inline-flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" />
              {message.tone}
              {message.language && message.language !== "English"
                ? ` · ${message.language}`
                : ""}
            </div>
          ) : null}
          <div className="whitespace-pre-line text-ink">{message.body}</div>

          {/* Attachments inline */}
          {attachedFiles && attachedFiles.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {attachedFiles.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center gap-2 text-xs px-2 py-1 rounded-lg bg-canvas-raised/60 border border-line"
                >
                  <FileText className="h-3.5 w-3.5 text-ink-muted shrink-0" />
                  <span className="text-ink truncate">{f.name}</span>
                  <span className="text-ink-subtle text-[10px] shrink-0">
                    {f.format.toUpperCase()}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {/* Meta row below bubble */}
      <div
        className={cn(
          "text-[10px] text-ink-subtle px-1 flex items-center gap-1.5",
          isBuyer ? "self-start" : "self-end",
        )}
      >
        <span>{isBuyer ? buyerName : "You"}</span>
        <span>·</span>
        <span>
          {new Date(message.sentAt).toLocaleString("en-PH", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
        {!isBuyer && !isAIDraft ? (
          <>
            <span>·</span>
            <Check className="h-3 w-3 text-sage-deep" />
          </>
        ) : null}
        {!isBuyer && message.attachmentIds &&
        message.attachmentIds.length > 0 ? (
          <>
            <span>·</span>
            <Paperclip className="h-2.5 w-2.5" />
            <span>{message.attachmentIds.length}</span>
          </>
        ) : null}
      </div>
    </li>
  );
}
