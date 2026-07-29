import { requireAuth } from "@/lib/auth";
import { getAllUsers } from "@/lib/db";
import { UsersView } from "@/components/users/UsersView";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const currentUser = await requireAuth();
  const users = await getAllUsers();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Add Product Managers and Tech Leads — they&apos;ll receive an email invite to set up their account.
        </p>
      </div>

      <UsersView users={users} currentUser={currentUser} />
    </div>
  );
}
