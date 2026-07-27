import { createAdminSupabaseClient } from "@/lib/supabase-admin";

// generateLink with type "invite" creates the auth user if one doesn't
// already exist. If an orphaned, already-confirmed auth account is left
// over from a previous attempt (or this is a resend of an existing,
// not-yet-activated invite), "invite" is rejected ("already registered")
// — fall back to "recovery", which generates a set-password link for an
// existing user.
export async function generateInviteLink(
  email: string
): Promise<{ userId: string; actionLink: string }> {
  const admin = createAdminSupabaseClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  // Baked into the redirect so it survives even if the token itself has
  // expired by the time it's opened — lets the expired-link page pre-fill
  // "Request new invite" without asking the user to retype their email.
  const redirectTo = `${appUrl}/set-password?email=${encodeURIComponent(email)}`;

  let { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo },
  });

  if (linkError?.message.toLowerCase().includes("already been registered")) {
    ({ data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    }));
  }

  if (linkError || !linkData.user || !linkData.properties?.action_link) {
    throw new Error(linkError?.message ?? "Could not generate invite link.");
  }

  return { userId: linkData.user.id, actionLink: linkData.properties.action_link };
}
