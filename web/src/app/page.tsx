import { createClient } from "@/lib/supabase/server";
import GuestLanding from "@/components/GuestLanding";
import LoggedInHome from "@/components/LoggedInHome";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <GuestLanding />;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, avatar_emoji")
    .eq("id", user.id)
    .single();

  const { data: session } = await supabase
    .from("assessment_sessions")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <LoggedInHome
      fullName={profile?.full_name ?? null}
      sessionStatus={session?.status ?? null}
      isAdmin={profile?.role === "admin"}
      avatarEmoji={profile?.avatar_emoji ?? null}
    />
  );
}
