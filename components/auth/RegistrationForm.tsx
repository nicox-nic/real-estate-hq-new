"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  FieldGroup,
  Input,
  Select,
  Stepper,
  Textarea,
} from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import type { RegistrationSchema } from "@/lib/registrationSchemas";

const ONBOARDING_STEPS = ["Role", "Basics", "Documents", "Review"];

/**
 * Renders any of the three role registration schemas. Field validation is
 * intentionally light (prototype): we collect values into local state, run
 * a basic completeness check on required fields + password match, and
 * route to /auth/upload-documents on submit. No real persistence.
 */
export function RegistrationForm({ schema }: { schema: RegistrationSchema }) {
  const router = useRouter();
  const [values, setValues] = React.useState<Record<string, string | boolean>>(
    {},
  );
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);

  const setField = (id: string, v: string | boolean) =>
    setValues((prev) => ({ ...prev, [id]: v }));

  // Group fields by section
  const sections = React.useMemo(() => {
    const map = new Map<string, typeof schema.fields>();
    for (const f of schema.fields) {
      const arr = map.get(f.section) ?? [];
      arr.push(f);
      map.set(f.section, arr);
    }
    return Array.from(map.entries());
  }, [schema.fields]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const nextErrors: Record<string, string> = {};
    for (const f of schema.fields) {
      if (!f.required) continue;
      const v = values[f.id];
      if (f.type === "checkbox") {
        if (!v) nextErrors[f.id] = "Required";
      } else if (!v || (typeof v === "string" && v.trim() === "")) {
        nextErrors[f.id] = "Required";
      }
    }
    // Password confirmation match
    if (
      typeof values.password === "string" &&
      typeof values.confirmPassword === "string" &&
      values.password !== values.confirmPassword
    ) {
      nextErrors.confirmPassword = "Passwords don't match.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setSubmitting(false);
      // Scroll to first error
      const first = Object.keys(nextErrors)[0];
      if (first) {
        const el = document.getElementById(first);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    // Prototype: route to upload documents, passing role
    router.push(`/auth/upload-documents?role=${schema.role}`);
  };

  return (
    <div>
      <div className="mb-8">
        <Stepper steps={ONBOARDING_STEPS} current={2} className="mb-5" />
        <h1 className="font-display text-3xl font-semibold text-ink text-balance">
          {schema.title}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">{schema.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        {sections.map(([sectionName, fields]) => {
          if (sectionName === "Consent") return null; // render at bottom
          return (
            <section key={sectionName} className="space-y-4">
              <h2 className="text-sm font-medium uppercase tracking-wider text-ink-subtle">
                {sectionName}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fields.map((f) => {
                  const fullWidth =
                    f.type === "textarea" ||
                    f.id === "consent" ||
                    f.id === "businessAddress";
                  return (
                    <FieldGroup
                      key={f.id}
                      label={f.label}
                      htmlFor={f.id}
                      required={f.required}
                      hint={f.hint}
                      error={errors[f.id]}
                      className={fullWidth ? "sm:col-span-2" : undefined}
                    >
                      {f.type === "select" ? (
                        <Select
                          id={f.id}
                          options={[
                            { value: "", label: "Select an option…" },
                            ...(f.options ?? []),
                          ]}
                          value={(values[f.id] as string) ?? ""}
                          onChange={(e) => setField(f.id, e.target.value)}
                        />
                      ) : f.type === "textarea" ? (
                        <Textarea
                          id={f.id}
                          placeholder={f.placeholder}
                          value={(values[f.id] as string) ?? ""}
                          onChange={(e) => setField(f.id, e.target.value)}
                        />
                      ) : f.type === "checkbox" ? (
                        // Should not appear here (Consent section is rendered below)
                        null
                      ) : (
                        <Input
                          id={f.id}
                          type={f.type}
                          placeholder={f.placeholder}
                          value={(values[f.id] as string) ?? ""}
                          onChange={(e) => setField(f.id, e.target.value)}
                          autoComplete="off"
                        />
                      )}
                    </FieldGroup>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Consent block */}
        {schema.fields
          .filter((f) => f.section === "Consent")
          .map((f) => (
            <label
              key={f.id}
              className="flex items-start gap-3 rounded-2xl border border-line bg-canvas-raised p-4 cursor-pointer"
            >
              <input
                id={f.id}
                type="checkbox"
                checked={Boolean(values[f.id])}
                onChange={(e) => setField(f.id, e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-line text-gold-deep focus:ring-gold/30"
              />
              <span className="text-sm text-ink-muted">
                {f.label}{" "}
                {errors[f.id] ? (
                  <span className="text-terracotta-deep">— required</span>
                ) : null}
              </span>
            </label>
          ))}

        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => router.push("/auth/signup")}
          >
            Back
          </Button>
          <Button type="submit" variant="gold" size="lg" disabled={submitting}>
            Continue to documents
          </Button>
        </div>
      </form>
    </div>
  );
}
