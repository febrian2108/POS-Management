import { redirect } from "next/navigation";

import { ROLES, type AppRole } from "@/lib/constants/roles";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  return prisma.user.findUnique({
    where: { id: user.id },
    include: {
      workerProfile: {
        include: {
          branch: true
        }
      }
    }
  });
}

export async function requireUser(role?: AppRole) {
  const dbUser = await getCurrentUser();

  if (!dbUser || !dbUser.isActive) {
    if (role === ROLES.WORKER) redirect("/login-worker");
    redirect("/login-owner");
  }

  if (role && dbUser.role !== role) {
    if (dbUser.role === ROLES.WORKER) {
      redirect("/pos");
    }
    redirect("/admin/dashboard");
  }

  return dbUser;
}

export async function requireOwner() {
  return requireUser(ROLES.OWNER);
}

export async function requireWorker() {
  return requireUser(ROLES.WORKER);
}
