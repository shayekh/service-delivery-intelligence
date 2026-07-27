"use server";

import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { generateInviteLink } from "@/lib/invite";
import { markPasswordSet } from "@/lib/db";
import { sendInviteEmail } from "@/lib/email";
import type { UserRole } from "@/types";

const ROLE_LABELS: Record<UserRole, "Product Manager" | "Tech Lead"> = {
  product_manager: "Product Manager",
  tech_lead: "Tech Lead",
};

// Public action (no session — the whole point is the user is locked out).
// Always resolves silently, whether or not the email matches an invited
// user, so this endpoint can't be used to check who has an account.
export async function resendInviteAction(email: string): Promise<void> {
  const admin = createAdminSupabaseClient();

  const { data: userRow } = await admin
    .from("users")
    .select("full_name, role")
    .eq("email", email)
    .maybeSingle();

  if (!userRow) return;

  try {
    const { actionLink } = await generateInviteLink(email);
    await sendInviteEmail({
      to: email,
      recipientName: userRow.full_name,
      role: ROLE_LABELS[userRow.role as UserRole],
      actionLink,
    });
  } catch (err) {
    console.error("[resendInviteAction] Could not resend invite:", err);
  }
}

// Called from the client immediately after supabase.auth.updateUser({
// password }) succeeds. Uses the admin client since this runs right after
// a brand-new session is established and shouldn't depend on RLS write
// policies for a one-off system field.
export async function markPasswordSetAction(userId: string): Promise<void> {
  await markPasswordSet(userId);
}
