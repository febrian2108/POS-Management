"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

type FileImportFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  loadingText: string;
  accept?: string;
  inputName?: string;
};

export function FileImportForm({
  action,
  submitLabel,
  loadingText,
  accept = ".xlsx,.xls,.csv",
  inputName = "file"
}: FileImportFormProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState("");

  function clearSelectedFile() {
    if (!inputRef.current) return;
    inputRef.current.value = "";
    setFileName("");
  }

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <div className="min-w-[240px]">
        <p className="mb-1 text-xs text-[var(--muted)]">Pilih file import</p>
        <div className="relative">
          <Input
            ref={inputRef}
            type="file"
            name={inputName}
            accept={accept}
            required
            onChange={(event) =>
              setFileName(event.target.files?.[0]?.name?.trim() ?? "")
            }
          />
          {fileName ? (
            <button
              type="button"
              onClick={clearSelectedFile}
              aria-label="Hapus file terpilih"
              className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card-solid)] text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
        {fileName ? <p className="mt-1 text-xs text-[var(--muted)]">{fileName}</p> : null}
      </div>
      <SubmitButton loadingText={loadingText}>{submitLabel}</SubmitButton>
    </form>
  );
}
