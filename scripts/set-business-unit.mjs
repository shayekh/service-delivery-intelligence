// One-time script to bulk-set business_unit for all non-admin users and
// for all existing projects.
//
// Usage: node scripts/set-business-unit.mjs
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, read
// from .env.local in the project root (same variables the app itself uses).

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const BUSINESS_UNIT = "Manufacturing & Engineering (MNE)";

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

  const { data: users, error: usersError } = await admin
    .from("users")
    .update({ business_unit: BUSINESS_UNIT })
    .neq("role", "admin")
    .select("id, full_name, email, role, business_unit");

  if (usersError) {
    console.error("Failed to update users:", usersError.message);
    process.exit(1);
  }

  console.log(`Updated ${users.length} user(s) to business_unit "${BUSINESS_UNIT}":`);
  for (const user of users) {
    console.log(`  - ${user.full_name} <${user.email}> (${user.role})`);
  }

  const { data: projects, error: projectsError } = await admin
    .from("projects")
    .update({ business_unit: BUSINESS_UNIT })
    .not("id", "is", null)
    .select("id, project_name, customer_name, business_unit");

  if (projectsError) {
    console.error("Failed to update projects:", projectsError.message);
    process.exit(1);
  }

  console.log(`Updated ${projects.length} project(s) to business_unit "${BUSINESS_UNIT}":`);
  for (const project of projects) {
    console.log(`  - ${project.project_name} (${project.customer_name})`);
  }
}

main();
