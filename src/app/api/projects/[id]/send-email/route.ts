import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { getAnalysisResult, getProjectById } from "@/lib/db";
import { sendReportEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(v: unknown): v is string {
  return typeof v === "string" && EMAIL_RE.test(v.trim());
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = await getProjectById(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  if (project.status !== "ready") {
    return NextResponse.json(
      { error: "Report is not ready to send." },
      { status: 400 }
    );
  }

  if (!project.pdf_url) {
    return NextResponse.json(
      { error: "PDF has not been generated yet." },
      { status: 400 }
    );
  }

  // Parse body — fall back to project.recipient_emails if omitted
  let recipients: string[] = project.recipient_emails ?? [];
  try {
    const body = await request.json();
    if (Array.isArray(body.recipients)) {
      recipients = body.recipients;
    }
  } catch {
    // no body or invalid JSON — use project defaults
  }

  // Validate recipients
  if (recipients.length === 0) {
    return NextResponse.json(
      { error: "At least one recipient email is required." },
      { status: 400 }
    );
  }
  const invalid = recipients.filter((r) => !isValidEmail(r));
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `Invalid email address(es): ${invalid.join(", ")}` },
      { status: 400 }
    );
  }

  const analysisResult = await getAnalysisResult(id);
  if (!analysisResult) {
    return NextResponse.json(
      { error: "Analysis data not found." },
      { status: 500 }
    );
  }
  const analysis = analysisResult.analysis;

  try {
    await sendReportEmail({
      project,
      analysis,
      recipients,
    });
  } catch (err) {
    console.error("send-email route: sendReportEmail failed:", err);
    return NextResponse.json(
      { error: "Failed to send email. Please try again." },
      { status: 500 }
    );
  }

  // Record manual send timestamp — does not change status or email_sent_at (reserved for scheduler)
  const admin = createAdminSupabaseClient();
  await admin
    .from("projects")
    .update({ manual_email_sent_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}
