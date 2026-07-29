"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Settings as SettingsIcon,
  LogOut,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { cn, getInitials } from "@/lib/utils";
import type { User } from "@/types";

const COLLAPSED_STORAGE_KEY = "sdi-sidebar-collapsed";

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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(COLLAPSED_STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
      return next;
    });
    setShowProfile(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col overflow-visible bg-slate-900 text-white transition-[width] duration-200",
        collapsed ? "w-[68px]" : "w-60"
      )}
    >
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-8 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-md transition-colors hover:text-slate-800"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      <div className="flex items-center px-4 py-5">
        {collapsed ? (
          <span className="mx-auto text-sm font-semibold">SDI</span>
        ) : (
          <div className="text-sm font-semibold leading-tight tracking-wide">
            Service Delivery
            <br />
            Intelligence
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 pt-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
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
            <div className="absolute inset-x-3 bottom-[calc(100%+0.5rem)] z-20 w-56 rounded-md bg-white p-4 shadow-lg">
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
        <div
          className={cn(
            "relative z-20 flex w-full items-center gap-3 px-4 py-4",
            collapsed && "flex-col gap-3 px-2"
          )}
        >
          <button
            type="button"
            onClick={() => setShowProfile((v) => !v)}
            className={cn("min-w-0 flex-1 text-left", collapsed && "flex-none")}
            title={collapsed ? user.full_name : undefined}
          >
            {collapsed ? (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
                {getInitials(user.full_name)}
              </span>
            ) : (
              <>
                <p className="truncate text-sm font-medium text-white">{user.full_name}</p>
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
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
