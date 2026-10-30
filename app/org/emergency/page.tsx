import { HeartPulse, PhoneCall, ShieldAlert } from "lucide-react";
import { requireOrgStaff } from "@/lib/auth";
import { orgEmergencyRequests } from "@/lib/org";
import { PageHeader } from "@/components/ui";
import { EmergencyReview } from "@/components/emergency-review";
import { AutoRefresh } from "@/components/auto-refresh";

export const metadata = { title: "Emergency triage" };

export default async function OrgEmergencyPage() {
  const user = await requireOrgStaff();
  const requests = await orgEmergencyRequests(user.org_id!);
  const pending = requests.filter((request) => request.status === "pending").length;

  return (
    <div className="space-y-6">
      <AutoRefresh interval={20000} />
      <PageHeader
        eyebrow="Urgent review"
        title="Emergency triage"
        description="Review patient requests for urgent queue priority. Decisions are audited and notify the customer immediately."
        actions={
          <span className={pending > 0 ? "badge border-rose-400/25 bg-rose-500/10 text-rose-200" : "badge-green"}>
            <HeartPulse className="h-3 w-3" />
            {pending} pending
          </span>
        }
      />

      <div className="rounded-2xl border border-rose-400/25 bg-rose-500/[0.06] p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-rose-100">
          <ShieldAlert className="h-4 w-4" />
          Life-threatening emergencies must not wait for a queue decision
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-rose-200/70">
          Direct anyone with chest pain, breathing difficulty, severe bleeding, stroke symptoms or
          reduced consciousness to local emergency services immediately. Skipline Hub triage supports
          queue fairness; it is not an emergency medical service.
        </p>
        <a href="tel:108" className="btn-danger btn-sm mt-3">
          <PhoneCall className="h-3.5 w-3.5" />
          Emergency services · 108
        </a>
      </div>

      <EmergencyReview requests={requests} />
    </div>
  );
}
