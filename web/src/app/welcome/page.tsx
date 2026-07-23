"use client";

import { useEffect, useMemo, useState } from "react";
import AuthBrandMark from "@/components/AuthBrandMark";
import { getAccountOptions } from "@/lib/account/getAccountOptions";
import type { AccountOptions } from "@/lib/account/options";
import { getAuthenticatedUser } from "@/lib/auth/guards";
import { appPath, createClient } from "@/lib/supabase/client";

export default function WelcomePage() {
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [options, setOptions] = useState<AccountOptions>({
    schools: [],
    advisors: [],
  });
  const [schoolId, setSchoolId] = useState("");
  const [advisorId, setAdvisorId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const user = await getAuthenticatedUser(supabase);

      if (!user) {
        window.location.replace(appPath("/login"));
        return;
      }

      const [{ data: profile }, accountOptions] = await Promise.all([
        supabase
          .from("profiles")
          .select("school_id, advisor_id")
          .eq("id", user.id)
          .maybeSingle(),
        getAccountOptions(supabase),
      ]);

      if (cancelled) return;

      if (profile?.school_id || profile?.advisor_id) {
        window.location.replace(appPath("/assessment"));
        return;
      }

      setUserId(user.id);
      setOptions(accountOptions);
      setReady(true);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredAdvisors = useMemo(() => {
    if (!schoolId) return [];
    return options.advisors.filter((advisor) => advisor.schoolId === schoolId);
  }, [options.advisors, schoolId]);

  useEffect(() => {
    if (!advisorId) return;
    const stillValid = filteredAdvisors.some((advisor) => advisor.id === advisorId);
    if (!stillValid) setAdvisorId("");
  }, [advisorId, filteredAdvisors]);

  const goToAssessment = () => {
    window.location.assign(appPath("/assessment"));
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setError("");
    setLoading(true);

    const selectedAdvisor = options.advisors.find((item) => item.id === advisorId);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        school_id: schoolId || null,
        advisor_id: advisorId || null,
        advisor: selectedAdvisor?.name ?? null,
      })
      .eq("id", userId);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    goToAssessment();
  };

  if (!ready) {
    return (
      <div className="page-shell centered">
        <p className="text-[15px] text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="page-shell centered">
      <div className="page-content animate-fade-in">
        <AuthBrandMark />
        <h1 className="mb-2 text-center text-[28px] font-semibold tracking-tight text-foreground">
          Almost ready
        </h1>
        <p className="mx-auto mb-8 max-w-[340px] text-center text-[15px] leading-relaxed text-muted">
          Add your school and advisor so your teacher can follow your progress.
          You can skip this and set it later in Account.
        </p>

        <form onSubmit={handleContinue} className="space-y-4">
          <div className="form-field">
            <label htmlFor="schoolId" className="field-label">
              School
            </label>
            <div className="select-wrap">
              <select
                id="schoolId"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="select-field"
              >
                <option value="">Select a school (optional)</option>
                {options.schools.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            {options.schools.length === 0 && (
              <p className="field-hint">Schools haven&apos;t been set up yet.</p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="advisorId" className="field-label">
              Advisor
            </label>
            <div className="select-wrap">
              <select
                id="advisorId"
                value={advisorId}
                onChange={(e) => setAdvisorId(e.target.value)}
                className="select-field"
                disabled={!schoolId || filteredAdvisors.length === 0}
              >
                <option value="">
                  {!schoolId
                    ? "Select a school first"
                    : filteredAdvisors.length === 0
                      ? "No advisors for this school"
                      : "Select an advisor (optional)"}
                </option>
                {filteredAdvisors.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="pt-1 text-center text-[14px] text-danger">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? "Saving…" : "Continue to assessment"}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={goToAssessment}
            className="btn-secondary"
          >
            Skip for now
          </button>
        </form>
      </div>
    </div>
  );
}
