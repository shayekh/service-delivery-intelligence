"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddUserModal } from "@/components/users/AddUserModal";

export function AddUserButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-blue-600 text-white hover:bg-blue-600/90"
      >
        <Plus className="h-4 w-4" />
        Add User
      </Button>

      <AddUserModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
