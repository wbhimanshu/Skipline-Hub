import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { requireOrgStaff } from "@/lib/auth";
import { orgAnalytics } from "@/lib/analytics";
import { InlineNotice, PageHeader, StatCard } from "@/components/ui";
import {
  ForecastChart,
  HourlyChart,
  VisitorsChart,
  WaitTrendChart,
} from "@/components/analytics-charts";

export const metadata = { title: "Analytics" };

export default async function OrgAnalyticsPage() {
  const user = await requireOrgStaff();
  const data = orgAnalytics(user.org_id!);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Demand intelligence"
        title="Analytics"
        description="Operational insights from recorded visits. Forecasts appear only after enough real history exists."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Visitors today" value={data.summary.visitorsToday} icon={Users} tone="brand" />
        <StatCard label="Completed today" value={data.summary.completedToday} icon={CheckCircle2} tone="emerald" />
        <StatCard
          label="Average wait"
          value={data.summary.avgWaitMinutes != null ? `${data.summary.avgWaitMinutes}m` : "—"}
          icon={Clock3}
          tone="cyan"
          hint="Completed visits · last 30 days"
        />
        <StatCard
          label="Completion rate"
          value={data.summary.completionRate != null ? `${data.summary.completionRate}%` : "—"}
          icon={TrendingUp}
          tone="amber"
          hint={`${data.summary.queueThisMonth} tokens in 30 days`}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-display text-base font-semibold text-white">
                <BarChart3 className="h-4 w-4 text-brand-300" />
                Daily visitors
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">Visitors and completed visits · last 14 days</p>
            </div>
          </div>
          <div className="mt-4">
            <VisitorsChart data={data.daily} />
          </div>
        </div>

        <div className="card">
          <h2 className="font-display text-base font-semibold text-white">Waiting-time trend</h2>
          <p className="mt-1 text-[11px] text-slate-500">Average check-in to completion · last 14 days</p>
          <div className="mt-4">
            <WaitTrendChart data={data.waitTrend} />
          </div>
        </div>

        <div className="card">
          <h2 className="font-display text-base font-semibold text-white">Arrivals by hour</h2>
          <p className="mt-1 text-[11px] text-slate-500">When customers join · last 30 days</p>
          <div className="mt-4">
            <HourlyChart data={data.hourly} />
          </div>
        </div>

        <div className="card">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-white">
            <Sparkles className="h-4 w-4 text-emerald-300" />
            Three-day outlook
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Simple recent-average forecast, not a staffing guarantee.
          </p>
          {data.forecast ? (
            <div className="mt-4">
              <ForecastChart data={data.forecast} />
            </div>
          ) : (
            <div className="mt-4">
              <InlineNotice tone="info" title="Forecast locked until enough history exists">
                We require at least 10 active days and 80 recorded visits before showing a forecast. This
                prevents misleading predictions for new centres.
              </InlineNotice>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="font-display text-base font-semibold text-white">Operational notes</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5">
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Busiest hours</p>
            <p className="mt-1 text-sm font-semibold text-white">{data.busyHours.join(", ") || "Collecting data"}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5">
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Average service</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {data.summary.avgServiceMinutes != null ? `${data.summary.avgServiceMinutes} minutes` : "No completed visits"}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5">
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Cancellations today</p>
            <p className="mt-1 text-sm font-semibold text-white">{data.summary.cancelledToday}</p>
          </div>
        </div>
        {data.summary.avgWaitMinutes == null ? (
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Waiting-time figures need completed visits with valid check-in and completion timestamps.
            Historical estimates may be unavailable until those records exist.
          </p>
        ) : null}
      </div>
    </div>
  );
}
