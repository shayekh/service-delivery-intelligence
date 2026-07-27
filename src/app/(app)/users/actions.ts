"use server";

import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { requireAuth } from "@/lib/auth";
import { generateInviteLink } from "@/lib/invite";
import { sendInviteEmail } from "@/lib/email";
import type { User, UserRole } from "@/types";

const ROLE_LABELS: Record<UserRole, "Product Manager" | "Tech Lead"> = {
  product_manager: "Product Manager",
  tech_lead: "Tech Lead",
};

export async function inviteUserAction({
  full_name,
  email,
  role,
}: {
  full_name: string;
  email: string;
  role: UserRole;
}): Promise<User> {
  await requireAuth();

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
    .upsert({ id: userId, email, full_name, role }, { onConflict: "id" })
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
