import { cn } from "@/lib/utils";
import type { User } from "@/types";

export const ROLE_LABELS: Record<User["role"], string> = {
  product_manager: "Product Manager",
  tech_lead: "Tech Lead",
};

export function UsersTable({ users }: { users: User[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-4 py-3 font-medium text-slate-800">{user.full_name}</td>
              <td className="px-4 py-3 text-slate-600">{user.email}</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                    user.role === "product_manager"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-200 text-slate-700"
                  )}
                >
                  {ROLE_LABELS[user.role]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
