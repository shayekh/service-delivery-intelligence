"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Settings as SettingsIcon, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

const ROLE_LABELS = {
  product_manager: "Product Manager",
  tech_lead: "Tech Lead",
} as const;

const NAV_ITEMS = [
  { href: "/dashboard", label: "Projects", icon: LayoutDashboard },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-slate-900 text-white">
      <div className="px-6 py-5 text-sm font-semibold leading-tight tracking-wide">
        Service Delivery<br />Intelligence
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </nav>

      <div className="border-t border-slate-800 px-4 py-4">
        <p className="truncate text-sm font-medium text-white">
          {user.full_name}
        </p>
        <span
          className={cn(
            "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
            user.role === "product_manager"
              ? "bg-blue-600 text-white"
              : "bg-slate-700 text-slate-200"
          )}
        >
          {ROLE_LABELS[user.role]}
        </span>
      </div>
    </aside>
  );
}
