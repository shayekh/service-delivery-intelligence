import { AuthShell } from "@/components/auth/AuthShell";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";

export const dynamic = "force-dynamic";

export default function SetPasswordPage() {
  return (
    <AuthShell>
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-8 shadow-xl">
        <SetPasswordForm />
      </div>
    </AuthShell>
  );
}
