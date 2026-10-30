import Link from "next/link";
import { ArrowUpRight, Info } from "lucide-react";
import { requireOrgStaff } from "@/lib/auth";
import { getOrganisation } from "@/lib/centres";
import { PageHeader } from "@/components/ui";
import { OrgSettingsForm } from "@/components/org-settings-form";
import { notFound } from "next/navigation";

export const metadata = { title: "Organisation settings" };

export default async function OrgSettingsPage() {
  const user = await requireOrgStaff();
  const org = await getOrganisation(user.org_id!);
  if (!org) notFound();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Public profile and operations"
        title="Organisation settings"
        description="These details power your public listing, appointment slots and queue policies."
        actions={
          org.status === "approved" ? (
            <Link href={`/centres/${org.slug}`} className="btn-secondary">
              View public page
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          ) : undefined
        }
      />
      <div className="rounded-2xl border border-cyan-400/15 bg-cyan-500/[0.04] p-4">
        <p className="flex items-center gap-2 text-xs font-semibold text-cyan-100">
          <Info className="h-3.5 w-3.5" />
          Approval status: <span className="capitalize">{org.status}</span>
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-cyan-100/60">
          Changes to your public name, services and hours take effect immediately after saving.
          Emergency triage should only be enabled when clinical or operational review is available.
        </p>
      </div>
      <div className="glass-panel p-5 sm:p-7">
        <OrgSettingsForm org={org} />
      </div>
    </div>
  );
}
