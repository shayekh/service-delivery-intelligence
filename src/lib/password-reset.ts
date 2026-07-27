import { createAdminSupabaseClient } from "@/lib/supabase-admin";

// Always a "recovery" link — unlike generateInviteLink, there's no
// invite-type fallback here since a password reset only ever applies to an
// existing account.
export async function generatePasswordResetLink(
  email: string
): Promise<{ userId: string; actionLink: string }> {
  const admin = createAdminSupabaseClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectTo = `${appUrl}/reset-password`;

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });

  if (linkError || !linkData.user || !linkData.properties?.action_link) {
    throw new Error(linkError?.message ?? "Could not generate password reset link.");
  }

  return { userId: linkData.user.id, actionLink: linkData.properties.action_link };
}
