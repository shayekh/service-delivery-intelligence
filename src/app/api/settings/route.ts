import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import type { ReviewCadence } from "@/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_CADENCES: ReviewCadence[] = ["monthly", "quarterly"];

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to load settings." }, { status: 500 });
    
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if ("delivery_cadence" in body) {
    if (!VALID_CADENCES.includes(body.delivery_cadence as ReviewCadence)) {
      return NextResponse.json(
        { error: "delivery_cadence must be 'monthly' or 'quarterly'." },
        { status: 400 }
      );
    }
    patch.delivery_cadence = body.delivery_cadence;
  }

  if ("send_on_day" in body) {
    const day = Number(body.send_on_day);
    if (!Number.isInteger(day) || day < 1 || day > 28) {
      return NextResponse.json(
        { error: "send_on_day must be an integer between 1 and 28." },
        { status: 400 }
      );
    }
    patch.send_on_day = day;
  }

  if ("recipient_emails" in body) {
    if (!Array.isArray(body.recipient_emails)) {
      return NextResponse.json(
        { error: "recipient_emails must be an array." },
        { status: 400 }
      );
    }
    const invalid = (body.recipient_emails as unknown[]).filter(
      (e) => typeof e !== "string" || !EMAIL_RE.test((e as string).trim())
    );
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Invalid email address(es): ${invalid.join(", ")}` },
        { status: 400 }
      );
    }
    patch.recipient_emails = (body.recipient_emails as string[]).map((e) =>
      e.trim()
    );
  }

  const admin = createAdminSupabaseClient();

  const { data: existing, error: fetchError } = await admin
    .from("settings")
    .select("id")
    .limit(1)
    .single();

  if (fetchError || !existing) {
    console.error("Settings fetch error:", fetchError);
    return NextResponse.json({ error: "Failed to load settings row." }, { status: 500 });
  }

  const { data, error } = await admin
    .from("settings")
    .update(patch)
    .eq("id", existing.id)
    .select("*")
    .limit(1)
    .single();

  if (error) {
    // return NextResponse.json({ error: "Failed to save settings." }, { status: 500 });
    console.error("Settings PATCH error:", error);
    return NextResponse.json({ error: "Failed to save settings.", details: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
