"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AddUserButton } from "@/components/users/AddUserButton";
import { UsersTable, ROLE_LABELS } from "@/components/users/UsersTable";
import type { User, UserWithStatus } from "@/types";

export function UsersView({
  users,
  currentUser,
}: {
  users: UserWithStatus[];
  currentUser: User;
}) {
  const [query, setQuery] = useState("");

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) =>
      [user.full_name, user.email, user.business_unit ?? "", ROLE_LABELS[user.role]]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [users, query]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <AddUserButton />
      </div>

      {filteredUsers.length > 0 ? (
        <UsersTable users={filteredUsers} currentUser={currentUser} />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-slate-400">
          {users.length === 0 ? "No users yet." : "No users match your search."}
        </div>
      )}
    </div>
  );
}
