"use client";

import { useActionState } from "react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ActionState = { error?: string; success?: string };

type LoginAction = (
  state: ActionState,
  formData: FormData
) => Promise<ActionState>;

const initialState: ActionState = {};

export function LoginForm({ title, action }: { title: string; action: LoginAction }) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="surface w-full max-w-md rounded-3xl border border-[var(--border)] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Secure Access</p>
          <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
        </div>
        <ThemeToggle />
      </div>

      <form action={formAction} className="mt-7 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" name="email" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" name="password" required />
        </div>
        {state?.error ? <p className="text-sm text-[var(--danger)]">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Memproses..." : "Login"}
        </Button>
      </form>
    </div>
  );
}
