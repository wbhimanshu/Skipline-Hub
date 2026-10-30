import { Scale, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { fairnessSettings } from "@/lib/admin";
import { PageHeader } from "@/components/ui";
import { AdminSettingsForm } from "@/components/admin-settings-form";

export const metadata = { title: "Fairness settings" };

export default async function AdminSettingsPage() {
  await requireRole("admin");
  const settings = await fairnessSettings();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform policy"
        title="Fairness settings"
        description="Tune the cancellation policy that protects queue access without penalising genuine medical need."
        actions={
          <span className="badge-green">
            <ShieldCheck className="h-3 w-3" />
            Appeals always available
          </span>
        }
      />
      <div className="glass-panel p-5 sm:p-7">
        <AdminSettingsForm initial={settings} />
      </div>
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
        <p className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <Scale className="h-3.5 w-3.5 text-emerald-300" />
          Current policy summary
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
          A customer who reaches {settings.thresholdCount} late cancellations within {settings.windowDays} days
          is limited from new bookings for {settings.restrictionDays} days. Medical emergencies, verified
          centre closures and platform outages never count. Customers can appeal the decision, and
          administrators can lift limits at any time.
        </p>
      </div>
    </div>
  );
}
