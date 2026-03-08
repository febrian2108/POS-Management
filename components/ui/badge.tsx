import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "warning" | "success";
};

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        tone === "default" && "bg-[var(--primary-soft)] text-[var(--foreground)]",
        tone === "warning" && "bg-[color-mix(in_oklab,#f59e0b_25%,transparent)] text-amber-900",
        tone === "success" && "bg-[color-mix(in_oklab,#10b981_22%,transparent)] text-emerald-900",
        className
      )}
      {...props}
    />
  );
}
