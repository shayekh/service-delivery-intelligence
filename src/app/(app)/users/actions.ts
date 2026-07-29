"use server";

import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { requireAuth } from "@/lib/auth";
import { generateInviteLink } from "@/lib/invite";
import { sendInviteEmail } from "@/lib/email";
import type { User, UserRole } from "@/types";

const ROLE_LABELS: Record<"product_manager" | "tech_lead", "Product Manager" | "Tech Lead"> = {
  product_manager: "Product Manager",
  tech_lead: "Tech Lead",
};

export async function inviteUserAction({
  full_name,
  email,
  role,
  business_unit,
}: {
  full_name: string;
  email: string;
  role: UserRole;
  business_unit: string;
}): Promise<User> {
  await requireAuth();

  // Admin accounts are never created through this invite flow (seeded
  // directly via scripts/seed-admin.mjs).
  if (role === "admin") {
    throw new Error("Admin accounts cannot be created through the invite flow.");
  }

  const admin = createAdminSupabaseClient();

  const { data: existingRow, error: existingError } = await admin
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }
  if (existingRow) {
    throw new Error("A user with this email address already exists.");
  }

  const { userId, actionLink } = await generateInviteLink(email);

  const { data: userRow, error: insertError } = await admin
    .from("users")
    .upsert({ id: userId, email, full_name, role, business_unit }, { onConflict: "id" })
    .select("*")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  await sendInviteEmail({
    to: email,
    recipientName: full_name,
    role: ROLE_LABELS[role],
    actionLink,
  });

  return userRow as User;
}

export async function updateUserAction({
  id,
  full_name,
  role,
  business_unit,
}: {
  id: string;
  full_name: string;
  role: UserRole;
  business_unit: string;
}): Promise<User> {
  const currentUser = await requireAuth();

  if (currentUser.role !== "admin") {
    throw new Error("Only an admin can edit users.");
  }
  if (role === "admin") {
    throw new Error("Users cannot be changed to the admin role.");
  }

  const admin = createAdminSupabaseClient();

  const { data: userRow, error } = await admin
    .from("users")
    .update({ full_name, role, business_unit })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return userRow as User;
}

export async function deleteUserAction({ id }: { id: string }): Promise<void> {
  const currentUser = await requireAuth();

  if (currentUser.role !== "admin") {
    throw new Error("Only an admin can delete users.");
  }
  if (id === currentUser.id) {
    throw new Error("You cannot delete your own account.");
  }

  const admin = createAdminSupabaseClient();

  const { data: targetRow, error: fetchError } = await admin
    .from("users")
    .select("role")
    .eq("id", id)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }
  if (targetRow?.role === "admin") {
    throw new Error("The admin account cannot be deleted.");
  }

  const { count: assignedCount, error: assignedError } = await admin
    .from("projects")
    .select("id", { count: "exact", head: true })
    .or(`assigned_pm.eq.${id},assigned_tl.eq.${id}`);

  if (assignedError) {
    throw new Error(assignedError.message);
  }
  if (assignedCount && assignedCount > 0) {
    throw new Error(
      "This user is assigned as Product Manager or Tech Lead on one or more projects. Reassign those projects before deleting this user."
    );
  }

  const { error: authError } = await admin.auth.admin.deleteUser(id);
  if (authError) {
    throw new Error(authError.message);
  }

  const { error: rowError } = await admin.from("users").delete().eq("id", id);
  if (rowError) {
    throw new Error(rowError.message);
  }
}
