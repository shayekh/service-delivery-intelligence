import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { getAnalysisResultAdmin } from "@/lib/db";
import { sendReportEmail } from "@/lib/email";
import type { Project, Settings } from "@/types";

function isScheduledOn(settings: Settings, date: Date): boolean {
  const dayOfMonth = date.getUTCDate();

  if (dayOfMonth !== settings.send_on_day) return false;

  if (settings.delivery_cadence === "quarterly") {
    const month = date.getUTCMonth(); // 0-indexed: 0=Jan, 3=Apr, 6=Jul, 9=Oct
    return month === 0 || month === 3 || month === 6 || month === 9;
  }

  return true; // monthly — day already matched
}

function resolveDate(request: NextRequest): Date {
  // Simulation is only available when ALLOW_DATE_SIMULATION=true AND not in production.
  // Both gates must pass — NODE_ENV alone isn't enough because it can be misconfigured.
  const simulationAllowed =
    process.env.ALLOW_DATE_SIMULATION === "true" &&
    process.env.NODE_ENV !== "production";

  if (simulationAllowed) {
    const param = request.nextUrl.searchParams.get("simulate_date");
    if (param) {
      const parsed = new Date(`${param}T00:00:00.000Z`);
      if (!isNaN(parsed.getTime())) {
        console.log("[DEV] Simulating date:", param);
        return parsed;
      }
    }
  }

  return new Date();
}

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const today = resolveDate(request);

  const admin = createAdminSupabaseClient();

  // Load settings
  const { data: settingsData, error: settingsError } = await admin
    .from("settings")
    .select("*")
    .limit(1)
    .single();

  if (settingsError || !settingsData) {
    console.error("[cron] Failed to load settings:", settingsError);
    return NextResponse.json({ error: "Failed to load settings." }, { status: 500 });
  }

  const settings = settingsData as Settings;

  if (!isScheduledOn(settings, today)) {
    console.log(
      `[cron] Not a scheduled send day (cadence=${settings.delivery_cadence}, send_on_day=${settings.send_on_day}, today=${today.toISOString().slice(0, 10)}). Skipping.`
    );
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (settings.recipient_emails.length === 0) {
    console.log("[cron] No distribution emails configured. Skipping.");
    return NextResponse.json({ ok: true, skipped: true, reason: "no_recipients" });
  }

  // Fetch all ready projects
  const { data: projects, error: projectsError } = await admin
    .from("projects")
    .select("*")
    .eq("status", "ready");

  if (projectsError) {
    console.error("[cron] Failed to fetch projects:", projectsError);
    return NextResponse.json({ error: "Failed to fetch projects." }, { status: 500 });
  }

  const readyProjects = (projects ?? []) as Project[];
  console.log(`[cron] Found ${readyProjects.length} ready project(s) to send.`);

  const results: { projectId: string; success: boolean; error?: string }[] = [];

  for (const project of readyProjects) {
    try {
      const analysis = await getAnalysisResultAdmin(project.id);
      if (!analysis) {
        results.push({ projectId: project.id, success: false, error: "No analysis found." });
        continue;
      }

      await sendReportEmail({
        project,
        analysis,
        recipients: settings.recipient_emails,
      });

      // Only flip status to 'sent' if email was actually sent (SEND_EMAIL=True)
      if (process.env.SEND_EMAIL === "True") {
        await admin
          .from("projects")
          .update({ status: "sent", email_sent_at: new Date().toISOString() })
          .eq("id", project.id);
      }

      results.push({ projectId: project.id, success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[cron] Failed to send for project ${project.id}:`, message);
      results.push({ projectId: project.id, success: false, error: message });
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  console.log(`[cron] Done. Succeeded: ${succeeded}, Failed: ${failed}`);

  return NextResponse.json({ ok: true, results });
}
