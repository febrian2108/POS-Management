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
        tone === "default" && "bg-gray-100 text-gray-700",
        tone === "warning" && "bg-amber-100 text-amber-700",
        tone === "success" && "bg-emerald-100 text-emerald-700",
        className
      )}
      {...props}
    />
  );
}
