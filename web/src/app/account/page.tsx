import Link from "next/link";
import { redirect } from "next/navigation";
import AccountForm from "@/components/AccountForm";
import { getAccountOptions } from "@/lib/account/getAccountOptions";
import { createClient } from "@/lib/supabase/server";
import { withBasePath } from "@/lib/supabase/client";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(withBasePath("/login"));
  }

  const [{ data: profile }, options] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, class_id, advisor_id, avatar_emoji")
      .eq("id", user.id)
      .single(),
    getAccountOptions(supabase),
  ]);

  const displayName = profile?.full_name?.trim() || user.email || "Your account";

  return (
    <div className="page-shell py-10 sm:py-12">
      <div className="page-content animate-fade-in mx-auto">
        <AccountForm
          userId={user.id}
          email={profile?.email ?? user.email ?? ""}
          fullName={profile?.full_name ?? ""}
          displayName={displayName}
          classId={profile?.class_id ?? null}
          advisorId={profile?.advisor_id ?? null}
          avatarEmoji={profile?.avatar_emoji ?? null}
          classes={options.classes}
          advisors={options.advisors}
        />

        <p className="mt-8 text-center text-[15px] text-muted">
          <Link href={withBasePath("/")} className="font-medium text-primary">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
