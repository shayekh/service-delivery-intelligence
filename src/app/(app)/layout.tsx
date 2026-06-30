import type { ReactNode } from "react";
import { requireAuth } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
