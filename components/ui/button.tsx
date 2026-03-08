import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "danger" | "ghost";
  size?: "default" | "sm" | "icon";
};

export function Button({
  className,
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150",
        "disabled:cursor-not-allowed disabled:opacity-60",
        size === "default" && "h-10 px-4 text-sm",
        size === "sm" && "h-9 px-3 text-sm",
        size === "icon" && "h-10 w-10 text-sm",
        variant === "default" &&
          "bg-[var(--primary)] text-[var(--primary-foreground)] hover:brightness-110",
        variant === "outline" &&
          "border border-[var(--border)] bg-[var(--card-solid)] text-[var(--foreground)] hover:bg-[var(--background-elevated)]",
        variant === "danger" && "bg-[var(--danger)] text-white hover:brightness-110",
        variant === "ghost" && "bg-transparent text-[var(--foreground)] hover:bg-[var(--primary-soft)]",
        className
      )}
      {...props}
    />
  );
}
