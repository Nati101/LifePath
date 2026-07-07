import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withBasePath } from "@/lib/supabase/client";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(
    new URL(withBasePath("/"), process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  );
}
