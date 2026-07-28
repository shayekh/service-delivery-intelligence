// One-time seed script for the hardcoded admin account (admin@sdi.com).
//
// admin@sdi.com is a dummy, non-deliverable address used only as a login
// identifier — it will never receive real mail. The /forgot-password flow
// must never be relied on for this account; if the password is lost,
// re-run this script (it will print instructions) or reset it directly
// from the Supabase dashboard.
//
// Usage: node scripts/seed-admin.mjs
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, read
// from .env.local in the project root (same variables the app itself uses).

import { readFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "admin@sdi.com";
const ADMIN_FULL_NAME = "Admin";

function loadEnvLocal() {
  const path = new URL("../.env.local", import.meta.url);
  if (!existsSync(path)) return;
  const contents = readFileSync(path, "utf8");
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

function generatePassword() {
  // 24 random bytes -> base64url, trimmed to a clean 24-character password.
  return randomBytes(24).toString("base64url").slice(0, 24);
}

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (checked .env.local and process env)."
    );
    process.exit(1);
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existingRow } = await admin
    .from("users")
    .select("id, email, password_set_at")
    .eq("email", ADMIN_EMAIL)
    .maybeSingle();

  if (existingRow) {
    console.log(`Admin account already exists (${ADMIN_EMAIL}, id: ${existingRow.id}).`);
    console.log(
      "To reset the password, use the Supabase dashboard (Authentication > Users) rather than re-running this script."
    );
    // Backfill password_set_at for accounts seeded before this script set it
    // — its password was set at creation time (createUser with a password),
    // so it should never show as "Pending" in the Users table.
    if (!existingRow.password_set_at) {
      await admin
        .from("users")
        .update({ password_set_at: new Date().toISOString() })
        .eq("id", existingRow.id);
      console.log("Backfilled password_set_at so it no longer shows as Pending.");
    }
    return;
  }

  const password = generatePassword();

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    console.error("Failed to create admin auth user:", authError?.message);
    process.exit(1);
  }

  const { error: insertError } = await admin.from("users").insert({
    id: authData.user.id,
    email: ADMIN_EMAIL,
    full_name: ADMIN_FULL_NAME,
    role: "admin",
    password_set_at: new Date().toISOString(),
  });

  if (insertError) {
    console.error("Auth user created but failed to insert users row:", insertError.message);
    console.error(`Auth user id was ${authData.user.id} — clean up manually in the Supabase dashboard if retrying.`);
    process.exit(1);
  }

  console.log("Admin account created successfully.");
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${password}`);
  console.log(
    "\nSave this password now — it is not stored anywhere else. This account's email is a dummy address, so /forgot-password will never work for it."
  );
}

main();
