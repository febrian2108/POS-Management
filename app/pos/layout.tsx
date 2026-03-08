import { WorkerShell } from "@/components/layouts/worker-shell";
import { requireWorker } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function PosLayout({ children }: { children: React.ReactNode }) {
  const worker = await requireWorker();

  if (!worker.workerProfile) {
    return <main className="p-6">Akun worker belum di-assign ke cabang.</main>;
  }

  return (
    <WorkerShell workerName={worker.fullName} branchName={worker.workerProfile.branch.name}>
      {children}
    </WorkerShell>
  );
}
