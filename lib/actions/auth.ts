"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

type ActionState = { error?: string; success?: string };

export async function ownerLoginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  const dbUser = await prisma.user.findUnique({ where: { id: data.user.id } });
  if (!dbUser || !dbUser.isActive || dbUser.role !== "OWNER") {
    await supabase.auth.signOut();
    return { error: "Akun owner tidak aktif atau tidak valid." };
  }

  if (data.user.app_metadata?.role !== "OWNER") {
    await supabase.auth.signOut();
    return { error: "Akun ini bukan owner." };
  }

  redirect("/admin/dashboard");
}

export async function workerLoginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  const dbUser = await prisma.user.findUnique({ where: { id: data.user.id } });
  if (!dbUser || !dbUser.isActive || dbUser.role !== "WORKER") {
    await supabase.auth.signOut();
    return { error: "Akun worker tidak aktif atau sudah dihapus." };
  }

  if (data.user.app_metadata?.role !== "WORKER") {
    await supabase.auth.signOut();
    return { error: "Akun ini bukan worker." };
  }

  redirect("/pos");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
