import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { User, UserRole } from "@/types";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return null;
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  return (userRow as User) ?? null;
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function getUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser();
  return user?.role ?? null;
}
