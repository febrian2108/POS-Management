"use client";

import { useActionState } from "react";

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
    <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">{title}</h1>
      <form action={formAction} className="mt-6 space-y-4">
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" name="email" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" name="password" required />
        </div>
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Memproses..." : "Login"}
        </Button>
      </form>
    </div>
  );
}
