"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Settings as SettingsIcon, LogOut, Users } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

const ROLE_LABELS = {
  product_manager: "Product Manager",
  tech_lead: "Tech Lead",
  admin: "Admin",
} as const;

const NAV_ITEMS = [
  { href: "/dashboard", label: "Projects", icon: LayoutDashboard },
  { href: "/users", label: "User Management", icon: Users },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [showProfile, setShowProfile] = useState(false);

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

      <div className="relative border-t border-slate-800">
        {showProfile && (
          <>
            <button
              type="button"
              aria-label="Close profile"
              onClick={() => setShowProfile(false)}
              className="fixed inset-0 z-10 cursor-default"
            />
            <div className="absolute inset-x-3 bottom-[calc(100%+0.5rem)] z-20 rounded-md bg-white p-4 shadow-lg">
              <p className="text-sm font-semibold text-slate-800">{user.full_name}</p>
              <span
                className={cn(
                  "mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                  user.role === "product_manager"
                    ? "bg-blue-600 text-white"
                    : user.role === "admin"
                      ? "bg-purple-600 text-white"
                      : "bg-slate-700 text-slate-200"
                )}
              >
                {ROLE_LABELS[user.role]}
              </span>
              <p className="mt-3 truncate text-sm text-slate-500">{user.email}</p>
            </div>
          </>
        )}
        <button
          type="button"
          onClick={() => setShowProfile((v) => !v)}
          className="relative z-20 w-full px-4 py-4 text-left transition-colors hover:bg-slate-800"
        >
          <p className="truncate text-sm font-medium text-white">
            {user.full_name}
          </p>
          <span
            className={cn(
              "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
              user.role === "product_manager"
                ? "bg-blue-600 text-white"
                : user.role === "admin"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-700 text-slate-200"
            )}
          >
            {ROLE_LABELS[user.role]}
          </span>
        </button>
      </div>
    </aside>
  );
}
