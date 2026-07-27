"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { inviteUserAction } from "@/app/(app)/users/actions";
import type { UserRole } from "@/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "product_manager", label: "Product Manager" },
  { value: "tech_lead", label: "Tech Lead" },
];

interface FormErrors {
  fullName?: string;
  email?: string;
  role?: string;
  form?: string;
}

export function AddUserModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setFullName("");
    setEmail("");
    setRole(null);
    setErrors({});
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};
    if (!fullName.trim()) nextErrors.fullName = "Name is required.";
    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!role) nextErrors.role = "Select a role.";
    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      await inviteUserAction({
        full_name: fullName.trim(),
        email: email.trim(),
        role: role!,
      });

      resetForm();
      onClose();
      router.refresh();
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : "Could not add user.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ease-in-out",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={handleClose}
      />

      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-[480px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Add User</h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          id="add-user-form"
          onSubmit={handleSubmit}
          className="flex-1 space-y-4 overflow-y-auto px-6 py-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane.doe@selise.ch"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    role === option.value
                      ? "bg-blue-600 text-white"
                      : "border border-slate-300 text-slate-600"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role}</p>
            )}
          </div>

          {errors.form && (
            <p className="text-sm text-red-600">{errors.form}</p>
          )}
        </form>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-user-form"
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600/90 disabled:opacity-60"
          >
            {isSubmitting ? "Adding..." : "Add User"}
          </button>
        </div>
      </div>
    </>
  );
}
