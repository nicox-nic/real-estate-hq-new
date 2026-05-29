"use client";

import * as React from "react";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/** Label for a form field */
export function Label({
  htmlFor,
  required,
  children,
  className,
}: {
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "block text-xs font-medium text-ink-muted uppercase tracking-wider mb-1.5",
        className,
      )}
    >
      {children}
      {required ? <span className="text-terracotta ml-1">*</span> : null}
    </label>
  );
}

/** Wrapper that pairs a label + input + optional hint/error */
export function FieldGroup({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {hint && !error ? (
        <p className="text-xs text-ink-subtle">{hint}</p>
      ) : null}
      {error ? <p className="text-xs text-terracotta-deep">{error}</p> : null}
    </div>
  );
}

/** Text input */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "block w-full h-11 rounded-xl border border-line bg-canvas-raised px-3.5 text-sm text-ink",
      "placeholder:text-ink-subtle",
      "focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30",
      "disabled:bg-canvas-sunken disabled:cursor-not-allowed",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

/** Select input */
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }
>(({ className, options, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "block w-full h-11 rounded-xl border border-line bg-canvas-raised px-3 text-sm text-ink",
      "focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30",
      className,
    )}
    {...props}
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
));
Select.displayName = "Select";

/** Textarea */
export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={3}
    className={cn(
      "block w-full rounded-xl border border-line bg-canvas-raised px-3.5 py-2.5 text-sm text-ink",
      "placeholder:text-ink-subtle",
      "focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

/** File upload row — prototype-only UX. No real upload; renders the visual feedback. */
export interface UploadedFileShape {
  name: string;
  sizeBytes: number;
  format: string;
}

export function FileUploadRow({
  label,
  description,
  required,
  file,
  onPick,
  onClear,
  acceptHint,
}: {
  label: string;
  description?: string;
  required?: boolean;
  file?: UploadedFileShape | null;
  onPick: () => void;
  onClear: () => void;
  acceptHint?: string;
}) {
  const fmt = (b: number) => {
    if (b > 1_000_000) return `${(b / 1_000_000).toFixed(1)} MB`;
    if (b > 1_000) return `${(b / 1_000).toFixed(0)} KB`;
    return `${b} B`;
  };
  const isImage =
    file && /^(JPG|JPEG|PNG|WEBP)$/i.test(file.format);

  return (
    <div className="rounded-2xl border border-line bg-canvas-raised p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-ink">
            {label}
            {required ? <span className="text-terracotta ml-1">*</span> : null}
          </div>
          {description ? (
            <div className="text-xs text-ink-muted mt-0.5">{description}</div>
          ) : null}
        </div>
      </div>
      {file ? (
        <div className="flex items-center gap-3 rounded-xl bg-canvas-sunken px-3 py-2.5">
          <div className="h-9 w-9 rounded-lg bg-gold-soft text-gold-deep flex items-center justify-center shrink-0">
            {isImage ? (
              <ImageIcon className="h-4 w-4" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-ink truncate">
              {file.name}
            </div>
            <div className="text-xs text-ink-subtle">
              {file.format} · {fmt(file.sizeBytes)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-ink-subtle hover:text-terracotta-deep p-1"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onPick}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-canvas-sunken/50 py-4 text-sm text-ink-muted",
            "hover:border-gold hover:text-gold-deep transition-colors",
          )}
        >
          <Upload className="h-4 w-4" />
          <span>Choose file</span>
          {acceptHint ? (
            <span className="text-xs text-ink-subtle">· {acceptHint}</span>
          ) : null}
        </button>
      )}
    </div>
  );
}

/** Stepper for the multi-step onboarding flows. */
export function Stepper({
  steps,
  current,
  className,
}: {
  steps: string[];
  current: number; // 1-indexed
  className?: string;
}) {
  return (
    <ol
      className={cn(
        "flex items-center gap-2 text-xs font-medium",
        className,
      )}
    >
      {steps.map((s, i) => {
        const idx = i + 1;
        const active = idx === current;
        const done = idx < current;
        return (
          <li
            key={s}
            className="flex items-center gap-2"
          >
            <span
              className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center text-[10px] border",
                active &&
                  "bg-ink text-ink-inverse border-ink",
                done &&
                  "bg-sage text-ink-inverse border-sage",
                !active && !done && "bg-canvas-raised text-ink-muted border-line",
              )}
            >
              {done ? "✓" : idx}
            </span>
            <span
              className={cn(
                "hidden sm:inline",
                active ? "text-ink" : "text-ink-subtle",
              )}
            >
              {s}
            </span>
            {idx < steps.length ? (
              <span className="h-px w-4 sm:w-6 bg-line shrink-0" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
