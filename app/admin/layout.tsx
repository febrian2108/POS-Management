import { AdminShell } from "@/components/layouts/admin-shell";
import { requireOwner } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireOwner();
  return <AdminShell>{children}</AdminShell>;
}
