import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "danger";
};

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition",
        variant === "default" &&
          "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90",
        variant === "outline" &&
          "border border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-gray-50",
        variant === "danger" && "bg-[var(--danger)] text-white hover:opacity-90",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}
