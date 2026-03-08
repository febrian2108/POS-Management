import * as React from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 text-sm text-[var(--foreground)]",
        "placeholder:text-[var(--muted)]",
        className
      )}
      {...props}
    />
  );
}
