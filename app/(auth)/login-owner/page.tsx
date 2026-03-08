import { LoginForm } from "@/components/auth/login-form";
import { ownerLoginAction } from "@/lib/actions/auth";

export default function LoginOwnerPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <LoginForm title="Login Owner" action={ownerLoginAction} />
    </main>
  );
}
