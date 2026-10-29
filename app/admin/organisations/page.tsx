import Link from "next/link";
import { Building2, Clock3, MapPin, Mail, Ticket, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { adminOrganisations } from "@/lib/admin";
import { categoryLabel } from "@/lib/centres";
import { PageHeader } from "@/components/ui";
import { AdminOrgActions } from "@/components/admin-org-actions";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Organisations" };

const TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "suspended", label: "Suspended" },
  { value: "rejected", label: "Rejected" },
];

function statusClass(status: string) {
  if (status === "approved") return "badge-green";
  if (status === "pending") return "badge-amber";
  if (status === "suspended") return "badge-rose";
  return "badge-slate";
}

export default async function AdminOrganisationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("admin");
  const params = await searchParams;
  const status = TABS.some((tab) => tab.value === params.status) ? params.status! : "all";
  const all = adminOrganisations("all");
  const organisations = status === "all" ? all : all.filter((org) => org.status === status);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Directory moderation"
        title="Organisations"
        description="Approve new centres, review public information and suspend accounts that break platform policy."
      />

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((tab) => {
          const count = tab.value === "all" ? all.length : all.filter((org) => org.status === tab.value).length;
          const active = status === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value === "all" ? "/admin/organisations" : `/admin/organisations?status=${tab.value}`}
              className={
                active
                  ? "btn btn-sm border border-brand-400/30 bg-brand-500/15 text-brand-700"
                  : "btn btn-sm border border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-white"
              }
            >
              {tab.label}
              <span className="rounded-full bg-white/10 px-1.5 text-[10px]">{count}</span>
            </Link>
          );
        })}
      </div>

      {organisations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
          <Building2 className="mx-auto h-6 w-6 text-slate-600" />
          <p className="mt-3 text-sm font-semibold text-white">No organisations in this view</p>
          <p className="mt-1 text-xs text-slate-500">New applications will appear here for review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {organisations.map((org) => (
            <div key={org.id} className="glass-panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-semibold text-white">{org.name}</h2>
                    <span className={statusClass(org.status)}>{org.status}</span>
                    <span className="badge-slate">{categoryLabel(org.category)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {org.city} · created {formatDateTime(org.created_at)}
                    {org.approved_at ? ` · approved ${formatDateTime(org.approved_at)}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{org.email}</span>
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{org.staff_count} staff</span>
                    <span className="inline-flex items-center gap-1"><Ticket className="h-3 w-3" />{org.ticket_count} tokens</span>
                  </div>
                  {org.status_reason ? (
                    <p className="mt-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px] text-slate-400">
                      <Clock3 className="mr-1 inline h-3 w-3" />
                      {org.status_reason}
                    </p>
                  ) : null}
                </div>
                <AdminOrgActions id={org.id} name={org.name} status={org.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-white/[0.05] pt-3 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {org.city}
                </span>
                <span>Owner: {org.owner_name || "Not linked"}{org.owner_email ? ` · ${org.owner_email}` : ""}</span>
                {org.status === "approved" ? (
                  <Link href={`/centres/${org.slug}`} className="ml-auto font-semibold text-brand-300">
                    View public listing
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
