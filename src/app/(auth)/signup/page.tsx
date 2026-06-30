import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { SignupForm } from "@/components/auth/SignupForm";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <AuthShell>
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-8 shadow-xl">
        <AuthTabs active="signup" />
        <SignupForm />
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-[#4C9AFF] hover:underline">
            Login
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
