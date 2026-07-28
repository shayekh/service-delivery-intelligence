import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <AuthShell>
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800/80 p-8 shadow-2xl backdrop-blur">
        <h2 className="text-lg font-semibold text-white">Welcome back</h2>
        <p className="mb-6 text-sm text-slate-400">
          Sign in to view your latest review.
        </p>
        <LoginForm />
      </div>
    </AuthShell>
  );
}
