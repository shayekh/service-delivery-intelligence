"use server";

import { createProject } from "@/lib/db";
import type { CreateProjectInput, Project } from "@/types";

export async function createProjectAction(
  input: CreateProjectInput
): Promise<Project> {
  return createProject(input);
}
