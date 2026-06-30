import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <AuthShell>
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-8 shadow-xl">
        <AuthTabs active="login" />
        <LoginForm />
        <p className="mt-6 text-center text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#4C9AFF] hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
