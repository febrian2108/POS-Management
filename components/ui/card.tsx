import * as React from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "surface rounded-2xl border border-[var(--border)] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]",
        className
      )}
      {...props}
    />
  );
}
