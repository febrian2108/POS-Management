"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  variant?: "default" | "outline" | "danger" | "ghost";
  size?: "default" | "sm" | "icon";
};

export function SubmitButton({
  children,
  loadingText = "Menyimpan...",
  className,
  variant = "default",
  size = "default"
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className={className} variant={variant} size={size}>
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
