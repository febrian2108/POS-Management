import { LoginForm } from "@/components/auth/login-form";
import { workerLoginAction } from "@/lib/actions/auth";

export default function LoginWorkerPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <LoginForm title="Login Worker" action={workerLoginAction} />
    </main>
  );
}
