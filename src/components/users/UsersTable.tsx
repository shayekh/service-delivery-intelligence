"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { ColumnHeaderFilter, type FilterOption } from "@/components/ColumnHeaderFilter";
import { EditUserModal } from "@/components/users/EditUserModal";
import { DeleteUserButton } from "@/components/users/DeleteUserButton";
import { BUSINESS_UNITS, type User, type UserWithStatus } from "@/types";

const BUSINESS_UNIT_FALLBACK = "—";

const BUSINESS_UNIT_OPTIONS = BUSINESS_UNITS.map((unit) => ({
  value: unit,
  label: unit,
}));

export const ROLE_LABELS: Record<User["role"], string> = {
  product_manager: "Product Manager",
  tech_lead: "Tech Lead",
  admin: "Admin",
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export function UsersTable({
  users,
  currentUser,
}: {
  users: UserWithStatus[];
  currentUser: User;
}) {
  const isAdmin = currentUser.role === "admin";
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [openColumn, setOpenColumn] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserWithStatus | null>(null);
  const [columnFilters, setColumnFilters] = useState<{
    name: string[];
    email: string[];
    business_unit: string[];
    role: string[];
  }>({ name: [], email: [], business_unit: [], role: [] });

  function setColumnFilter(key: keyof typeof columnFilters, values: string[]) {
    setColumnFilters((prev) => ({ ...prev, [key]: values }));
  }

  const columnOptions = useMemo(() => {
    function uniqueOptions(values: (string | null | undefined)[]): FilterOption[] {
      const unique = Array.from(new Set(values.filter((v): v is string => !!v)));
      return unique.sort().map((v) => ({ value: v, label: v }));
    }

    return {
      name: uniqueOptions(users.map((u) => u.full_name)),
      email: uniqueOptions(users.map((u) => u.email)),
      business_unit: BUSINESS_UNIT_OPTIONS,
      role: Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })),
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesName =
        columnFilters.name.length === 0 || columnFilters.name.includes(user.full_name);
      const matchesEmail =
        columnFilters.email.length === 0 || columnFilters.email.includes(user.email);
      const matchesBusinessUnit =
        columnFilters.business_unit.length === 0 ||
        (user.business_unit ? columnFilters.business_unit.includes(user.business_unit) : false);
      const matchesRole =
        columnFilters.role.length === 0 || columnFilters.role.includes(user.role);
      return matchesName && matchesEmail && matchesBusinessUnit && matchesRole;
    });
  }, [users, columnFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [users, pageSize, columnFilters]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedUsers = useMemo(
    () => filteredUsers.slice((page - 1) * pageSize, page * pageSize),
    [filteredUsers, page, pageSize]
  );

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm" onClick={() => setOpenColumn(null)}>
          <thead className="bg-slate-50">
            <tr>
              <ColumnHeaderFilter
                columnKey="name"
                label="Name"
                options={columnOptions.name}
                selected={columnFilters.name}
                onApply={(v) => setColumnFilter("name", v)}
                openColumn={openColumn}
                setOpenColumn={setOpenColumn}
              />
              <ColumnHeaderFilter
                columnKey="email"
                label="Email"
                options={columnOptions.email}
                selected={columnFilters.email}
                onApply={(v) => setColumnFilter("email", v)}
                openColumn={openColumn}
                setOpenColumn={setOpenColumn}
              />
              <ColumnHeaderFilter
                columnKey="business_unit"
                label="Business Unit"
                options={columnOptions.business_unit}
                selected={columnFilters.business_unit}
                onApply={(v) => setColumnFilter("business_unit", v)}
                openColumn={openColumn}
                setOpenColumn={setOpenColumn}
              />
              <ColumnHeaderFilter
                columnKey="role"
                label="Role"
                options={columnOptions.role}
                selected={columnFilters.role}
                onApply={(v) => setColumnFilter("role", v)}
                openColumn={openColumn}
                setOpenColumn={setOpenColumn}
              />
              {isAdmin && (
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-3 font-medium text-slate-800">{user.full_name}</td>
                <td className="px-6 py-3 text-slate-600">
                  {user.email}
                  {user.is_pending && (
                    <span className="ml-2 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-6 py-3 text-slate-600">
                  {user.business_unit ?? BUSINESS_UNIT_FALLBACK}
                </td>
                <td className="px-6 py-3">
                  <span
                    className={cn(
                      "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                      user.role === "product_manager"
                        ? "bg-blue-100 text-blue-700"
                        : user.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-slate-200 text-slate-700"
                    )}
                  >
                    {ROLE_LABELS[user.role]}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {user.role !== "admin" && (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingUser(user)}
                            className="rounded p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                            title="Edit user"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <DeleteUserButton userId={user.id} userName={user.full_name} />
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500">
              Showing {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, filteredUsers.length)} of {filteredUsers.length}
            </p>
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white py-1 pl-2 pr-6 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium ${
                  n === page
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {editingUser && (
        <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />
      )}
    </div>
  );
}
