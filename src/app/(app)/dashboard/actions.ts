"use server";

import { createProject, getUserById } from "@/lib/db";
import { sendAssignmentEmail } from "@/lib/email";
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
