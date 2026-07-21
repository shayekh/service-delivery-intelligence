import { Resend } from "resend";
import type { AnalysisJson, Project } from "@/types";

const STATUS_COLOR: Record<string, string> = {
  Green: "#16a34a",
  Amber: "#d97706",
  Red: "#dc2626",
};

function statusBadgeHtml(status: string): string {
  const color = STATUS_COLOR[status] ?? "#6b7280";
  return `<span style="display:inline-block;background:${color};color:#fff;font-size:11px;font-weight:700;padding:2px 10px;border-radius:999px;">${status}</span>`;
}

function buildEmailHtml(
  project: Project,
  analysis: AnalysisJson,
  recipients: string[]
): string {
  const meta = analysis.report_meta;
  const s1 = analysis.section_synthesis.s1_executive_summary;
  const ai = analysis.ai_generated;

  const overallStatus = s1?.overall_status ?? meta.pm_status;
  const pmStatus = meta.pm_status;
  const tlStatus = meta.tl_status;
  const statusAligned = meta.status_aligned;

  const highlights = s1?.highlights ?? "";
  const nextQuarter = s1?.next_quarter_preview ?? "";

  // Collect management attention items as action list
  const actionItems = (ai.s13_management_attention ?? [])
    .filter((i) => i.urgency === "High")
    .map(
      (i) =>
        `<li style="margin-bottom:6px;"><strong>${i.item}</strong> — ${i.explanation}</li>`
    )
    .join("");

  const statusSection = statusAligned
    ? `<p><strong>Overall Status:</strong> ${statusBadgeHtml(overallStatus)}</p>`
    : `<p>
        <strong>PM Status:</strong> ${statusBadgeHtml(pmStatus)}&nbsp;&nbsp;
        <strong>TL Status:</strong> ${statusBadgeHtml(tlStatus)}
        <br><span style="font-size:12px;color:#b45309;margin-top:4px;display:inline-block;">
          ⚠ PM and Tech Lead have different status assessments — see report for details.
        </span>
       </p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${project.review_cadence === "monthly" ? "Monthly" : "Quarterly"} Service Delivery Report — ${project.project_name}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header banner -->
          <tr>
            <td style="background:#0f172a;padding:28px 36px;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.08em;color:#94a3b8;text-transform:uppercase;">
                SELISE Digital Platforms
              </p>
              <h1 style="margin:6px 0 0;font-size:20px;font-weight:700;color:#ffffff;line-height:1.3;">
                ${project.review_cadence === "monthly" ? "Monthly" : "Quarterly"} Service Delivery Report
              </h1>
              <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">
                ${project.project_name} &middot; ${project.quarter}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;">
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">
                Dear Stakeholder,
              </p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#334155;">
                Please find attached the <strong>${project.quarter} Service Delivery Report</strong>
                for <strong>${project.project_name}</strong>, prepared by ${meta.prepared_by}.
                This report provides a comprehensive view of delivery performance, achievements,
                and priorities for the period.
              </p>

              <!-- Quick Summary heading -->
              <h2 style="margin:0 0 16px;font-size:15px;font-weight:700;color:#0f172a;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">
                Quick Summary
              </h2>

              ${statusSection}

              <p style="margin:20px 0 6px;font-size:13px;font-weight:700;color:#0f172a;">
                Key Highlights
              </p>
              <p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:#475569;">
                ${highlights || "See the full report for highlights."}
              </p>

              <p style="margin:20px 0 6px;font-size:13px;font-weight:700;color:#0f172a;">
                Focus Next Quarter
              </p>
              <p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:#475569;">
                ${nextQuarter || "See the full report for next quarter priorities."}
              </p>

              ${
                actionItems
                  ? `<p style="margin:20px 0 6px;font-size:13px;font-weight:700;color:#0f172a;">
                       Action Required
                     </p>
                     <ul style="margin:0 0 20px;padding-left:20px;font-size:13px;line-height:1.6;color:#475569;">
                       ${actionItems}
                     </ul>`
                  : ""
              }

              <!-- PDF note -->
              <div style="margin:24px 0 0;padding:14px 18px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
                <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">
                  📎 The full PDF report is attached to this email. It contains all 15 sections
                  including cross-analysis, lessons learned, and management attention items.
                </p>
              </div>

              <p style="margin:28px 0 0;font-size:14px;line-height:1.6;color:#334155;">
                Please reach out if you have any questions or would like to discuss the findings.
              </p>
              <p style="margin:8px 0 0;font-size:14px;color:#334155;">
                Regards,<br />
                <strong>SELISE Digital Platforms</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 36px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                This report was generated by Service Delivery Intelligence &middot;
                ${meta.date_generated} &middot;
                Sent to ${recipients.length} recipient${recipients.length !== 1 ? "s" : ""}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildAssignmentEmailHtml({
  recipientName,
  role,
  projectName,
  customerName,
  quarter,
}: {
  recipientName: string;
  role: "Product Manager" | "Tech Lead";
  projectName: string;
  customerName: string;
  quarter: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You've been assigned to ${projectName}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header banner -->
          <tr>
            <td style="background:#0f172a;padding:28px 36px;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.08em;color:#94a3b8;text-transform:uppercase;">
                SELISE Digital Platforms
              </p>
              <h1 style="margin:6px 0 0;font-size:20px;font-weight:700;color:#ffffff;line-height:1.3;">
                New Project Assignment
              </h1>
              <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">
                ${projectName} &middot; ${quarter}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;">
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">
                Hi ${recipientName},
              </p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#334155;">
                You've been assigned as <strong>${role}</strong> for <strong>${projectName}</strong>
                (${customerName}, ${quarter}) in Service Delivery Intelligence.
              </p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#334155;">
                Please log in and complete your review questionnaire for this project when ready.
              </p>
              <p style="margin:28px 0 0;font-size:14px;line-height:1.6;color:#334155;">
                Regards,<br />
                <strong>SELISE Digital Platforms</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 36px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                This notification was generated by Service Delivery Intelligence
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendAssignmentEmail({
  to,
  recipientName,
  role,
  projectName,
  customerName,
  quarter,
}: {
  to: string;
  recipientName: string;
  role: "Product Manager" | "Tech Lead";
  projectName: string;
  customerName: string;
  quarter: string;
}): Promise<void> {
  if (process.env.SEND_EMAIL !== "True") {
    console.log(`[email] SEND_EMAIL is not True — skipping assignment email to: ${to}`);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const subject = `You've been assigned to ${projectName} (${quarter})`;
  const html = buildAssignmentEmailHtml({ recipientName, role, projectName, customerName, quarter });

  const { error } = await resend.emails.send({
    from: process.env.SENDER_EMAIL ?? "reviews@selise.ch",
    to: [to],
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

export async function sendReportEmail({
  project,
  analysis,
  recipients,
}: {
  project: Project;
  analysis: AnalysisJson;
  recipients: string[];
}): Promise<void> {
  if (process.env.SEND_EMAIL !== "True") {
    console.log(
      `[email] SEND_EMAIL is not True — skipping send to: ${recipients.join(", ")}`
    );
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const cadenceLabel = project.review_cadence === "monthly" ? "Monthly" : "Quarterly";
  const subject = `${cadenceLabel} Service Delivery Report — ${project.project_name} | ${project.quarter}`;
  const html = buildEmailHtml(project, analysis, recipients);

  // Fetch PDF bytes for attachment
  let attachments: { filename: string; content: Buffer }[] = [];
  if (project.pdf_url) {
    try {
      const res = await fetch(project.pdf_url);
      if (res.ok) {
        const bytes = await res.arrayBuffer();
        attachments = [
          {
            filename: `${project.project_name}_${project.quarter}_Report.pdf`.replace(/\s+/g, "_"),
            content: Buffer.from(bytes),
          },
        ];
      }
    } catch (err) {
      console.warn("[email] Could not fetch PDF for attachment:", err);
    }
  }

  const { error } = await resend.emails.send({
    from: process.env.SENDER_EMAIL ?? "reviews@selise.ch",
    to: recipients,
    subject,
    html,
    attachments,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
