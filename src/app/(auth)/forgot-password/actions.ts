"use server";

import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { generatePasswordResetLink } from "@/lib/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";

// Public action (no session — the user is locked out). Always resolves
// silently, whether or not the email matches an existing user, so this
// endpoint can't be used to check who has an account.
export async function requestPasswordResetAction(email: string): Promise<void> {
  const admin = createAdminSupabaseClient();

  const { data: userRow } = await admin
    .from("users")
    .select("full_name")
    .eq("email", email)
    .maybeSingle();

  if (!userRow) return;

  try {
    const { actionLink } = await generatePasswordResetLink(email);
    await sendPasswordResetEmail({
      to: email,
      recipientName: userRow.full_name,
      actionLink,
    });
  } catch (err) {
    console.error("[requestPasswordResetAction] Could not send reset email:", err);
  }
}
