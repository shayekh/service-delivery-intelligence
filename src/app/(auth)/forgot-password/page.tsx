import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-8 shadow-xl">
        <ForgotPasswordForm />
      </div>
    </AuthShell>
  );
}
