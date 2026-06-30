"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewProjectModal } from "@/components/NewProjectModal";
import type { User } from "@/types";

export function AddProjectButton({
  pmUsers,
  tlUsers,
  currentUserId,
}: {
  pmUsers: User[];
  tlUsers: User[];
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-blue-600 text-white hover:bg-blue-600/90"
      >
        <Plus className="h-4 w-4" />
        Add Project
      </Button>

      <NewProjectModal
        open={open}
        onClose={() => setOpen(false)}
        pmUsers={pmUsers}
        tlUsers={tlUsers}
        currentUserId={currentUserId}
      />
    </>
  );
}
