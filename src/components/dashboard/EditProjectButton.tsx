"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { NewProjectModal } from "@/components/NewProjectModal";
import type { Project, User } from "@/types";

export function EditProjectButton({
  project,
  pmUsers,
  tlUsers,
  currentUserId,
}: {
  project: Project;
  pmUsers: User[];
  tlUsers: User[];
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
        title="Edit project"
      >
        <Pencil className="h-4 w-4" />
      </button>

      <NewProjectModal
        open={open}
        onClose={() => setOpen(false)}
        pmUsers={pmUsers}
        tlUsers={tlUsers}
        currentUserId={currentUserId}
        project={project}
      />
    </>
  );
}
