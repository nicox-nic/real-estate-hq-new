"use client";

import * as React from "react";
import {
  X,
  ChevronRight,
  Camera,
  FileText,
  Layout,
  Calculator,
  ListChecks,
  CreditCard,
  MapPin,
  Folder,
  UploadCloud,
  Search,
  Sparkles,
  Check,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type {
  PropertyFile,
  FileCategory,
  FileFormat,
  Lead,
  Listing,
} from "@/lib/types";
import {
  recommendFilesFor,
  type FileRecommendationResult,
} from "@/lib/logic/aiFileRecommendation";

/**
 * AttachFilesSheet — three-stage bottom sheet matching the mockup
 * (Real_Estate_HQ_Organizer_mockup.png bottom row).
 *
 * Stages:
 *   1. categories — list of 9 PRD attachment categories (8 data categories
 *      + Upload New). User taps a category to advance.
 *   2. select — file picker within the selected category, with All/PDF/
 *      Images/Docs/Links tabs and search. Multi-select with checkmarks.
 *      Footer shows "N files selected (X MB)" + "Add Files" button.
 *   3. selected — review summary of all currently attached files across
 *      categories, with a yellow tip card and a "Done" button.
 *
 * AI Recommendation (per Session 5A's ratified routing decision) lives
 * INSIDE this sheet at stage 1 — a banner at the top of the category list
 * surfaces the recommended files with an "Apply" affordance. No separate
 * Share Listing sidebar.
 */

export interface AttachFilesSheetProps {
  open: boolean;
  onClose: () => void;
  /** All files for the current listing. */
  availableFiles: PropertyFile[];
  /** Currently selected file IDs (the staged selection). */
  selectedFileIds: string[];
  /** Commit callback when user taps Done in the selected stage or Add Files
   *  in the select stage. */
  onCommit: (fileIds: string[]) => void;
  /** Context for the AI recommendation engine. */
  lead: Lead | undefined;
  listing: Listing;
}

const CATEGORY_TILES: Array<{
  category: FileCategory | "Upload";
  label: string;
  subtitle: string;
  Icon: LucideIcon;
  iconClass: string;
}> = [
  {
    category: "Photos",
    label: "Photos",
    subtitle: "Property photos and images",
    Icon: Camera,
    iconClass: "bg-sage-soft text-sage-deep",
  },
  {
    category: "Brochures",
    label: "Brochures",
    subtitle: "Property brochures and flyers",
    Icon: FileText,
    iconClass: "bg-terracotta-soft text-terracotta-deep",
  },
  {
    category: "Floor Plans",
    label: "Floor Plans",
    subtitle: "Unit layouts and floor plans",
    Icon: Layout,
    iconClass: "bg-gold-soft text-gold-deep",
  },
  {
    category: "Computations",
    label: "Computations",
    subtitle: "Sample computations and payments",
    Icon: Calculator,
    iconClass: "bg-navy-soft text-navy",
  },
  {
    category: "Price List",
    label: "Price List",
    subtitle: "Price list and inventory",
    Icon: ListChecks,
    iconClass: "bg-sage-soft text-sage-deep",
  },
  {
    category: "Payment Terms",
    label: "Payment Terms",
    subtitle: "Payment terms and options",
    Icon: CreditCard,
    iconClass: "bg-gold-soft text-gold-deep",
  },
  {
    category: "Location Map",
    label: "Location Map",
    subtitle: "Location maps and directions",
    Icon: MapPin,
    iconClass: "bg-terracotta-soft text-terracotta-deep",
  },
  {
    category: "Requirements",
    label: "Requirements",
    subtitle: "Documents and requirements",
    Icon: Folder,
    iconClass: "bg-navy-soft text-navy",
  },
  {
    category: "Upload",
    label: "Upload New File",
    subtitle: "Choose file from your device",
    Icon: UploadCloud,
    iconClass: "bg-canvas-sunken text-ink-muted",
  },
];

type Stage = "categories" | "select" | "selected";
type FormatTab = "All" | "PDF" | "Images" | "Docs" | "Links";

export function AttachFilesSheet({
  open,
  onClose,
  availableFiles,
  selectedFileIds,
  onCommit,
  lead,
  listing,
}: AttachFilesSheetProps) {
  const [stage, setStage] = React.useState<Stage>("categories");
  const [activeCategory, setActiveCategory] =
    React.useState<FileCategory | null>(null);
  // Staged selection — diverges from props.selectedFileIds while editing
  const [stagedIds, setStagedIds] = React.useState<string[]>(selectedFileIds);
  const [formatTab, setFormatTab] = React.useState<FormatTab>("All");
  const [search, setSearch] = React.useState<string>("");

  // Re-sync staged when sheet opens
  React.useEffect(() => {
    if (open) {
      setStagedIds(selectedFileIds);
      setStage("categories");
      setActiveCategory(null);
      setFormatTab("All");
      setSearch("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Lock body scroll
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // AI recommendation (memoized)
  const recommendation: FileRecommendationResult | null = React.useMemo(() => {
    if (!lead) return null;
    return recommendFilesFor({ lead, listing, availableFiles });
  }, [lead, listing, availableFiles]);

  const applyRecommendation = () => {
    if (!recommendation) return;
    // Union of current staged + recommended
    const union = new Set([...stagedIds, ...recommendation.recommendedFileIds]);
    setStagedIds([...union]);
    // Surface the review stage
    setStage("selected");
  };

  const toggleFile = (fileId: string) => {
    setStagedIds((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId],
    );
  };

  const removeFile = (fileId: string) => {
    setStagedIds((prev) => prev.filter((id) => id !== fileId));
  };

  const handleAddFiles = () => {
    setStage("selected");
  };

  const handleDone = () => {
    onCommit(stagedIds);
    onClose();
  };

  const handleClearAll = () => {
    setStagedIds([]);
  };

  if (!open) return null;

  // Category list (stage 1)
  if (stage === "categories") {
    return (
      <SheetShell
        title="Attach Files"
        onClose={onClose}
        testId="attach-files-sheet-categories"
      >
        {recommendation ? (
          <AIRecommendationBanner
            recommendation={recommendation}
            stagedIds={stagedIds}
            availableFiles={availableFiles}
            onApply={applyRecommendation}
          />
        ) : null}
        <ul
          data-testid="attach-files-category-list"
          data-category-count={CATEGORY_TILES.length}
          className="divide-y divide-line"
        >
          {CATEGORY_TILES.map((tile) => {
            const filesInCategory =
              tile.category === "Upload"
                ? []
                : availableFiles.filter((f) => f.category === tile.category);
            const selectedInCategory = stagedIds.filter((id) =>
              filesInCategory.some((f) => f.id === id),
            ).length;
            return (
              <li
                key={tile.category}
                data-testid={`attach-files-category-tile-${tile.category}`}
              >
                <button
                  onClick={() => {
                    if (tile.category === "Upload") {
                      // Prototype: no actual file picker
                      return;
                    }
                    setActiveCategory(tile.category);
                    setStage("select");
                  }}
                  className="w-full flex items-center gap-3 py-3 px-1 hover:bg-canvas-sunken/40 rounded-lg transition-colors"
                >
                  <span
                    className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                      tile.iconClass,
                    )}
                  >
                    <tile.Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-medium text-ink">
                      {tile.label}
                    </p>
                    <p className="text-xs text-ink-subtle truncate">
                      {tile.subtitle}
                    </p>
                  </div>
                  {selectedInCategory > 0 ? (
                    <span className="text-[10px] font-medium text-sage-deep bg-sage-soft px-1.5 py-0.5 rounded-full">
                      {selectedInCategory} selected
                    </span>
                  ) : null}
                  <ChevronRight className="h-4 w-4 text-ink-subtle" />
                </button>
              </li>
            );
          })}
        </ul>
        {stagedIds.length > 0 ? (
          <div className="mt-4 pt-4 border-t border-line">
            <button
              onClick={() => setStage("selected")}
              data-testid="attach-files-review-selected"
              className="w-full rounded-xl border border-line bg-canvas-sunken px-4 py-3 text-sm font-medium text-ink hover:bg-canvas-raised transition-colors inline-flex items-center justify-center gap-2"
            >
              Review {stagedIds.length} selected{" "}
              {stagedIds.length === 1 ? "file" : "files"}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </SheetShell>
    );
  }

  // File picker (stage 2)
  if (stage === "select" && activeCategory) {
    const filesInCategory = availableFiles.filter(
      (f) => f.category === activeCategory,
    );
    const formatFiltered = filesInCategory.filter((f) =>
      matchesFormat(f, formatTab),
    );
    const searched = search
      ? formatFiltered.filter((f) =>
          f.name.toLowerCase().includes(search.toLowerCase()),
        )
      : formatFiltered;
    const selectedInView = stagedIds.filter((id) =>
      filesInCategory.some((f) => f.id === id),
    );
    const selectedBytes = filesInCategory
      .filter((f) => stagedIds.includes(f.id))
      .reduce((acc, f) => acc + f.sizeBytes, 0);

    return (
      <SheetShell
        title="Select Files"
        onClose={onClose}
        onBack={() => setStage("categories")}
        testId="attach-files-sheet-select"
      >
        {/* Format tabs */}
        <div
          data-testid="select-files-format-tabs"
          className="flex items-center gap-1.5 border-b border-line -mx-4 sm:-mx-5 px-4 sm:px-5 pb-3"
        >
          {(["All", "PDF", "Images", "Docs", "Links"] as FormatTab[]).map(
            (t) => (
              <button
                key={t}
                onClick={() => setFormatTab(t)}
                data-testid={`select-files-format-${t.toLowerCase()}`}
                data-active={formatTab === t}
                className={cn(
                  "px-3 h-8 rounded-full text-xs font-medium border transition-colors",
                  formatTab === t
                    ? "bg-sage-deep text-canvas-raised border-transparent"
                    : "bg-canvas-raised text-ink-muted border-line hover:border-gold/40",
                )}
              >
                {t}
              </button>
            ),
          )}
        </div>

        {/* Search */}
        <div className="my-3">
          <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas-sunken px-3 h-9">
            <Search className="h-4 w-4 text-ink-subtle" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files..."
              className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-subtle focus:outline-none"
              data-testid="select-files-search"
            />
          </div>
        </div>

        {/* File rows */}
        <ul
          data-testid="select-files-list"
          className="space-y-2 max-h-[40vh] overflow-y-auto pr-1"
        >
          {searched.length === 0 ? (
            <li className="text-center text-xs text-ink-subtle py-6">
              No files in this category.
            </li>
          ) : null}
          {searched.map((f) => {
            const isSelected = stagedIds.includes(f.id);
            const isRecommended =
              recommendation?.recommendedFileIds.includes(f.id) ?? false;
            return (
              <li key={f.id}>
                <button
                  onClick={() => toggleFile(f.id)}
                  data-testid={`select-files-row-${f.id}`}
                  data-selected={isSelected}
                  className="w-full flex items-center gap-3 rounded-xl border border-line bg-canvas-raised px-3 py-2.5 hover:border-gold/40 transition-colors text-left"
                >
                  <span
                    className={cn(
                      "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                      isSelected
                        ? "bg-sage-deep border-sage-deep text-canvas-raised"
                        : "bg-canvas-raised border-line",
                    )}
                  >
                    {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
                  </span>
                  <FileIconBadge format={f.format} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">
                      {f.name}
                    </p>
                    <p className="text-[11px] text-ink-subtle">
                      {formatFileSize(f.sizeBytes)} · {f.format}
                    </p>
                  </div>
                  {isRecommended ? (
                    <span className="text-[10px] font-medium text-gold-deep bg-gold-soft px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5">
                      <Sparkles className="h-2.5 w-2.5" />
                      AI
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Footer: selected count + Add Files */}
        <div className="mt-4 pt-3 border-t border-line">
          <p className="text-xs text-ink-muted text-center mb-2">
            {selectedInView.length} files selected in this category (
            {formatFileSize(selectedBytes)})
          </p>
          <button
            onClick={handleAddFiles}
            data-testid="select-files-add-button"
            className="w-full h-11 rounded-xl bg-sage-deep text-canvas-raised text-sm font-medium hover:bg-sage-deep/90 transition-colors inline-flex items-center justify-center gap-2"
          >
            Add Files
          </button>
        </div>
      </SheetShell>
    );
  }

  // Selected review (stage 3)
  const stagedFiles = availableFiles.filter((f) => stagedIds.includes(f.id));
  return (
    <SheetShell
      title={`Selected Files (${stagedFiles.length})`}
      onClose={onClose}
      onBack={() => setStage("categories")}
      headerAction={
        stagedFiles.length > 0 ? (
          <button
            onClick={handleClearAll}
            data-testid="selected-files-clear-all"
            className="text-xs font-medium text-terracotta-deep hover:underline"
          >
            Clear All
          </button>
        ) : undefined
      }
      testId="attach-files-sheet-selected"
    >
      <ul data-testid="selected-files-list" className="space-y-2">
        {stagedFiles.length === 0 ? (
          <li className="text-center text-sm text-ink-subtle py-8">
            No files selected yet. Tap a category to choose files.
          </li>
        ) : null}
        {stagedFiles.map((f) => (
          <li
            key={f.id}
            data-testid={`selected-files-row-${f.id}`}
            className="flex items-center gap-3 rounded-xl border border-line p-2.5"
          >
            <FileIconBadge format={f.format} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink truncate">{f.name}</p>
              <p className="text-[11px] text-ink-subtle">
                {formatFileSize(f.sizeBytes)} · {f.format}
              </p>
            </div>
            <button
              onClick={() => removeFile(f.id)}
              aria-label={`Remove ${f.name}`}
              data-testid={`selected-files-remove-${f.id}`}
              className="h-7 w-7 rounded-full bg-canvas-sunken text-ink-muted hover:text-terracotta-deep flex items-center justify-center"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      {/* Tip card */}
      {stagedFiles.length > 0 ? (
        <div
          data-testid="selected-files-tip"
          className="mt-4 rounded-xl bg-gold-soft/50 border border-gold-deep/15 p-3.5 flex items-start gap-2.5"
        >
          <Lightbulb className="h-5 w-5 text-gold-deep shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-ink">Tip</p>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
              Buyers love it when you send complete information. It helps
              build trust and speeds up their decision.
            </p>
          </div>
        </div>
      ) : null}

      {/* Done */}
      <div className="mt-4 pt-3 border-t border-line">
        <button
          onClick={handleDone}
          data-testid="selected-files-done"
          className="w-full h-11 rounded-xl bg-sage-deep text-canvas-raised text-sm font-medium hover:bg-sage-deep/90 transition-colors inline-flex items-center justify-center gap-2"
        >
          Done
        </button>
      </div>
    </SheetShell>
  );
}

// ============================================================================
// Internal building blocks
// ============================================================================

function SheetShell({
  title,
  onClose,
  onBack,
  headerAction,
  children,
  testId,
}: {
  title: string;
  onClose: () => void;
  onBack?: () => void;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <div
      data-testid={testId}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
      />
      <div className="relative w-full sm:max-w-md bg-canvas-raised rounded-t-3xl sm:rounded-2xl shadow-lift max-h-[88vh] overflow-y-auto">
        <div className="sm:hidden flex justify-center pt-2">
          <span className="h-1 w-10 rounded-full bg-line" />
        </div>
        <header className="flex items-center justify-between px-4 sm:px-5 pt-4 pb-3 sticky top-0 bg-canvas-raised z-10 border-b border-line-soft">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {onBack ? (
              <button
                onClick={onBack}
                aria-label="Back"
                className="text-ink-subtle hover:text-ink"
              >
                <X className="h-4 w-4 rotate-45" />
              </button>
            ) : null}
            <h2 className="font-medium text-ink truncate">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            {headerAction}
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-ink-subtle hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>
        <div className="px-4 sm:px-5 pb-4 pt-3">{children}</div>
      </div>
    </div>
  );
}

function AIRecommendationBanner({
  recommendation,
  stagedIds,
  availableFiles,
  onApply,
}: {
  recommendation: FileRecommendationResult;
  stagedIds: string[];
  availableFiles: PropertyFile[];
  onApply: () => void;
}) {
  const recommendedFiles = availableFiles.filter((f) =>
    recommendation.recommendedFileIds.includes(f.id),
  );
  const alreadyApplied = recommendation.recommendedFileIds.every((id) =>
    stagedIds.includes(id),
  );
  return (
    <div
      data-testid="ai-recommendation-banner"
      data-rule={recommendation.rule}
      className="rounded-xl bg-gold-soft/40 border border-gold-deep/15 p-3 mb-3"
    >
      <div className="flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-gold-deep shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-ink inline-flex items-center gap-1.5">
            AI Recommendation
            <span className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
              · {recommendation.rule}
            </span>
          </p>
          <p className="text-[11px] text-ink-muted mt-0.5">
            {recommendation.ruleDescription}
          </p>
          <ul className="mt-2 flex flex-wrap gap-1">
            {recommendedFiles.map((f) => (
              <li
                key={f.id}
                data-testid={`ai-recommendation-chip-${f.id}`}
                className="text-[10px] font-medium text-gold-deep bg-canvas-raised px-1.5 py-0.5 rounded-full border border-gold-deep/15"
              >
                {f.category}
              </li>
            ))}
          </ul>
        </div>
        {!alreadyApplied && recommendedFiles.length > 0 ? (
          <button
            onClick={onApply}
            data-testid="ai-recommendation-apply"
            className="text-xs font-medium text-gold-deep hover:text-ink whitespace-nowrap"
          >
            Apply →
          </button>
        ) : alreadyApplied ? (
          <span
            data-testid="ai-recommendation-applied"
            className="text-[10px] font-medium text-sage-deep bg-sage-soft px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 whitespace-nowrap"
          >
            <Check className="h-2.5 w-2.5" />
            Applied
          </span>
        ) : null}
      </div>
    </div>
  );
}

function FileIconBadge({ format }: { format: FileFormat }) {
  const fmt = format.toUpperCase();
  const isPDF = fmt === "PDF";
  const isImg = /^(JPG|PNG)$/.test(fmt);
  return (
    <div
      className={cn(
        "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold",
        isPDF
          ? "bg-terracotta-soft text-terracotta-deep"
          : isImg
          ? "bg-navy-soft text-navy"
          : "bg-canvas-sunken text-ink-muted",
      )}
    >
      {fmt.slice(0, 3)}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

function matchesFormat(f: PropertyFile, tab: FormatTab): boolean {
  if (tab === "All") return true;
  if (tab === "PDF") return f.format === "PDF";
  if (tab === "Images") return f.format === "JPG" || f.format === "PNG";
  if (tab === "Docs") return f.format === "DOC" || f.format === "DOCX";
  if (tab === "Links") return f.format === "Link";
  return true;
}
