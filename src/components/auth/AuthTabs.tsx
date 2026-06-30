import Link from "next/link";
import { cn } from "@/lib/utils";

export function AuthTabs({ active }: { active: "login" | "signup" }) {
  return (
    <div className="mb-6 grid grid-cols-2 overflow-hidden rounded-md border border-slate-700">
      <Link
        href="/login"
        className={cn(
          "py-2 text-center text-sm font-medium transition-colors",
          active === "login"
            ? "bg-[#0052CC] text-white"
            : "bg-transparent text-slate-300 hover:text-white"
        )}
      >
        Login
      </Link>
      <Link
        href="/signup"
        className={cn(
          "py-2 text-center text-sm font-medium transition-colors",
          active === "signup"
            ? "bg-[#0052CC] text-white"
            : "bg-transparent text-slate-300 hover:text-white"
        )}
      >
        Sign Up
      </Link>
    </div>
  );
}
