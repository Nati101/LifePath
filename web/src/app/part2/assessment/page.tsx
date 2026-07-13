import { redirect } from "next/navigation";
import { withBasePath } from "@/lib/supabase/client";

export default function Part2AssessmentPage() {
  // Redirect to first section
  redirect(withBasePath("/part2/assessment/school_setup"));
}
