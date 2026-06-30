"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut}>
      {isLoggingOut ? "Logging out..." : "Logout"}
    </Button>
  );
}
