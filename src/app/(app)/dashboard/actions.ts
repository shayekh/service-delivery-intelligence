"use server";

import {
  createProject,
  deletePmDraft,
  deleteTlDraft,
  getProjectById,
  getUserById,
  updateProject,
} from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendAssignmentEmail } from "@/lib/email";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import type { CreateProjectInput, Project } from "@/types";

export async function createProjectAction(
  input: CreateProjectInput
): Promise<Project> {
  const project = await createProject(input);

  const [pm, tl] = await Promise.all([
    project.assigned_pm ? getUserById(project.assigned_pm) : null,
    project.assigned_tl ? getUserById(project.assigned_tl) : null,
  ]);

  const notifications: Promise<void>[] = [];
  if (pm) {
    notifications.push(
      sendAssignmentEmail({
        to: pm.email,
        recipientName: pm.full_name,
        role: "Product Manager",
        projectName: project.project_name,
        customerName: project.customer_name,
        quarter: project.quarter,
      })
    );
  }
  if (tl) {
    notifications.push(
      sendAssignmentEmail({
        to: tl.email,
        recipientName: tl.full_name,
        role: "Tech Lead",
        projectName: project.project_name,
        customerName: project.customer_name,
        quarter: project.quarter,
      })
    );
  }

  const results = await Promise.allSettled(notifications);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[createProjectAction] Assignment email failed:", result.reason);
    }
  }

  return project;
}

export async function updateProjectAction(
  projectId: string,
  input: CreateProjectInput
): Promise<Project> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Only an admin can edit a project.");
  }

  const existing = await getProjectById(projectId);
  if (!existing) {
    throw new Error("Project not found.");
  }

  const admin = createAdminSupabaseClient();
  const [pmResult, tlResult] = await Promise.all([
    admin
      .from("pm_answers")
      .select("submitted_at")
      .eq("project_id", projectId)
      .not("submitted_at", "is", null)
      .maybeSingle(),
    admin
      .from("tl_answers")
      .select("submitted_at")
      .eq("project_id", projectId)
      .not("submitted_at", "is", null)
      .maybeSingle(),
  ]);

  if (pmResult.data || tlResult.data) {
    throw new Error("Cannot edit a project with existing submissions.");
  }

  const updated = await updateProject(projectId, input);

  const pmChanged = existing.assigned_pm !== updated.assigned_pm;
  const tlChanged = existing.assigned_tl !== updated.assigned_tl;

  const followUps: Promise<void>[] = [];

  if (pmChanged) {
    followUps.push(
      (async () => {
        await deletePmDraft(projectId);
        if (updated.assigned_pm) {
          const pm = await getUserById(updated.assigned_pm);
          if (pm) {
            await sendAssignmentEmail({
              to: pm.email,
              recipientName: pm.full_name,
              role: "Product Manager",
              projectName: updated.project_name,
              customerName: updated.customer_name,
              quarter: updated.quarter,
            });
          }
        }
      })()
    );
  }

  if (tlChanged) {
    followUps.push(
      (async () => {
        await deleteTlDraft(projectId);
        if (updated.assigned_tl) {
          const tl = await getUserById(updated.assigned_tl);
          if (tl) {
            await sendAssignmentEmail({
              to: tl.email,
              recipientName: tl.full_name,
              role: "Tech Lead",
              projectName: updated.project_name,
              customerName: updated.customer_name,
              quarter: updated.quarter,
            });
          }
        }
      })()
    );
  }

  const results = await Promise.allSettled(followUps);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[updateProjectAction] Reassignment follow-up failed:", result.reason);
    }
  }

  return updated;
}
