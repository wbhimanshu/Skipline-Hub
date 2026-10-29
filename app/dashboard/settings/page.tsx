import { CalendarClock, FileWarning, ShieldAlert, SlidersHorizontal, UserRound } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { all, one } from "@/lib/db";
import { cancellationStats, getActiveRestriction } from "@/lib/queue";
import { PageHeader } from "@/components/ui";
import {
  AppealForm,
  PasswordResetButton,
  PreferencesPanel,
  ProfileForm,
  ReportForm,
} from "@/components/settings-panels";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireRole("user");
  const profile = one<{ phone: string }>("SELECT phone FROM users WHERE id = ?", user.id);
  const restriction = getActiveRestriction(user.id);
  const appeal = restriction
    ? one<{ status: string }>(
        "SELECT status FROM appeals WHERE restriction_id = ? ORDER BY created_at DESC LIMIT 1",
        restriction.id,
      )
    : null;
  const reports = all<{ id: string; subject: string; status: string; created_at: string }>(
    "SELECT id, subject, status, created_at FROM reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 5",
    user.id,
  );
  const orgs = all<{ id: string; name: string }>(
    "SELECT id, name FROM organizations WHERE status = 'approved' ORDER BY name",
  );
  const stats = cancellationStats(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Profile, accessibility, fairness appeals and reports. Your data belongs to you."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="card">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-white">
            <UserRound className="h-4 w-4 text-brand-300" />
            Profile
          </h2>
          <div className="mt-5">
            <ProfileForm name={user.name} email={user.email} phone={profile?.phone ?? ""} />
          </div>
        </section>

        <section className="card">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-white">
            <SlidersHorizontal className="h-4 w-4 text-cyan-300" />
            Accessibility
          </h2>
          <div className="mt-5">
            <PreferencesPanel />
          </div>
        </section>

        <section className="card">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-white">
            <ShieldAlert className="h-4 w-4 text-amber-300" />
            Fairness and cancellations
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Late cancellations</p>
              <p className="mt-1 font-display text-xl font-bold text-white">
                {stats.late}/{stats.threshold}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-600">within {stats.windowDays} days</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Booking status</p>
              <p className="mt-1 font-display text-xl font-bold text-white">
                {restriction ? "Limited" : "Normal"}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-600">
                {restriction ? `until ${formatDateTime(restriction.ends_at)}` : "No active limit"}
              </p>
            </div>
          </div>

          <div id="restriction" className="mt-4 scroll-mt-24">
            {restriction ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-amber-400/20 bg-amber-500/[0.05] p-3.5">
                  <p className="text-xs font-semibold text-amber-100">{restriction.reason}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-amber-100/60">{restriction.detail}</p>
                </div>
                <AppealForm restrictionId={restriction.id} existingStatus={appeal?.status ?? null} />
              </div>
            ) : (
              <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
                <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Medical emergencies, centre-side cancellations and system failures never count against you.
                Late cancellations only affect new bookings after repeated occurrences.
              </p>
            )}
          </div>
        </section>

        <section className="card">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-white">
            <FileWarning className="h-4 w-4 text-rose-300" />
            Report an issue
          </h2>
          <div className="mt-5">
            <ReportForm orgs={orgs} />
          </div>
          {reports.length > 0 ? (
            <div className="mt-5 border-t border-white/[0.06] pt-4">
              <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Your recent reports</p>
              <div className="mt-2 space-y-2">
                {reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="truncate text-slate-400">{report.subject}</span>
                    <span className="badge-slate capitalize">{report.status}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="card xl:col-span-2">
          <h2 className="font-display text-base font-semibold text-white">Security</h2>
          <div className="mt-4">
            <PasswordResetButton email={user.email} />
          </div>
        </section>
      </div>
    </div>
  );
}
