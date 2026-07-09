import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProjectById } from "@/lib/db";
import { generateReportPdf } from "@/lib/pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await getProjectById(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const isAssigned = project.assigned_pm === user.id || project.assigned_tl === user.id;
  const isReady = project.status === "ready" || project.status === "sent";
  if (!isAssigned && !isReady) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isReady) {
    return NextResponse.json({ error: "Report is not ready yet" }, { status: 409 });
  }

  // If PDF was already generated at analysis time, serve it directly
  if (project.pdf_url) {
    return NextResponse.json({ url: project.pdf_url });
  }

  // Fallback: PDF generation failed at analysis time — generate now
  try {
    const url = await generateReportPdf(id);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("PDF generation API route failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PDF generation failed" },
      { status: 500 }
    );
  }
}
