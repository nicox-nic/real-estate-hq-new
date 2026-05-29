"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Stepper, FileUploadRow, UploadedFileShape } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { SCHEMAS_BY_ROLE } from "@/lib/registrationSchemas";
import type { UserRole } from "@/lib/types";

const ONBOARDING_STEPS = ["Role", "Basics", "Documents", "Review"];

/**
 * Prototype file picker — opens a hidden file input, but we only capture
 * the file's metadata for visual feedback. No upload happens, no bytes leave
 * the browser. This is intentional: the PRD requires the document UX to
 * feel real, but no backend exists yet.
 */
function usePrototypeFilePicker(
  onPick: (meta: UploadedFileShape) => void,
): () => void {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const input = document.createElement("input");
    input.type = "file";
    input.style.display = "none";
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      const ext = file.name.split(".").pop()?.toUpperCase() ?? "FILE";
      onPick({ name: file.name, sizeBytes: file.size, format: ext });
      input.value = "";
    });
    document.body.appendChild(input);
    inputRef.current = input;
    return () => {
      if (input.parentNode) input.parentNode.removeChild(input);
      inputRef.current = null;
    };
  }, [onPick]);

  return React.useCallback(() => inputRef.current?.click(), []);
}

function DocumentRow({
  id,
  label,
  description,
  required,
  acceptHint,
  initial,
}: {
  id: string;
  label: string;
  description?: string;
  required: boolean;
  acceptHint?: string;
  initial?: UploadedFileShape | null;
}) {
  const [file, setFile] = React.useState<UploadedFileShape | null>(initial ?? null);
  const pick = usePrototypeFilePicker((meta) => setFile(meta));

  // Demo seed file if user wants to skip (prototype shortcut)
  const seedDemoFile = () =>
    setFile({
      name: `${id}-sample.pdf`,
      sizeBytes: 1_280_000,
      format: "PDF",
    });

  return (
    <div className="space-y-2">
      <FileUploadRow
        label={label}
        description={description}
        required={required}
        file={file}
        onPick={pick}
        onClear={() => setFile(null)}
        acceptHint={acceptHint}
      />
      {!file ? (
        <button
          type="button"
          onClick={seedDemoFile}
          className="text-xs text-ink-subtle hover:text-gold-deep underline-offset-4 hover:underline"
        >
          Use sample document (prototype shortcut)
        </button>
      ) : null}
    </div>
  );
}

export default function UploadDocumentsPage() {
  return (
    <React.Suspense fallback={null}>
      <UploadDocumentsContent />
    </React.Suspense>
  );
}

function UploadDocumentsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const roleParam = (params.get("role") as UserRole | null) ?? "Agent";
  const schema = SCHEMAS_BY_ROLE[roleParam] ?? SCHEMAS_BY_ROLE.Agent;

  return (
    <div>
      <Stepper steps={ONBOARDING_STEPS} current={3} className="mb-5" />
      <h1 className="font-display text-3xl font-semibold text-ink text-balance">
        Upload your documents
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        We use these to verify your account. Documents are reviewed within 1–2
        business days.
      </p>

      <div className="mt-8 space-y-4">
        {schema.documents.map((doc) => (
          <DocumentRow
            key={doc.id}
            id={doc.id}
            label={doc.label}
            description={doc.description}
            required={doc.required}
            acceptHint={doc.acceptHint}
          />
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={() =>
            router.push(`/auth/register/${schema.role.toLowerCase()}`)
          }
        >
          Back
        </Button>
        <Button
          type="button"
          variant="gold"
          size="lg"
          onClick={() =>
            router.push(
              `/auth/pending?status=${encodeURIComponent("Pending Verification")}`,
            )
          }
        >
          Submit for verification
        </Button>
      </div>
    </div>
  );
}
