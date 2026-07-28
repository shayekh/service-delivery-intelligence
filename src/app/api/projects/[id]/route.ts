import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { getCurrentUser } from "@/lib/auth";
import { getProjectById } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = await getProjectById(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: "Only an admin can delete a project." },
      { status: 403 }
    );
  }

  const admin = createAdminSupabaseClient();

  // Guard: reject if either side has actually submitted (submitted_at IS NOT NULL).
  // A draft row (auto-saved but not submitted) does not block deletion.
  const [pmResult, tlResult] = await Promise.all([
    admin
      .from("pm_answers")
      .select("submitted_at")
      .eq("project_id", id)
      .not("submitted_at", "is", null)
      .maybeSingle(),
    admin
      .from("tl_answers")
      .select("submitted_at")
      .eq("project_id", id)
      .not("submitted_at", "is", null)
      .maybeSingle(),
  ]);

  if (pmResult.data || tlResult.data) {
    return NextResponse.json(
      { error: "Cannot delete a project with existing submissions." },
      { status: 400 }
    );
  }

  // Delete any unsubmitted draft answer rows first to avoid FK constraint issues.
  await Promise.all([
    admin.from("pm_answers").delete().eq("project_id", id),
    admin.from("tl_answers").delete().eq("project_id", id),
  ]);

  const { error } = await admin.from("projects").delete().eq("id", id);

  if (error) {
    console.error("DELETE /api/projects/[id]:", error);
    return NextResponse.json(
      { error: "Failed to delete project." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
