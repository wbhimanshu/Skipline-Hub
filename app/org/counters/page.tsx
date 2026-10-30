import { MonitorSmartphone } from "lucide-react";
import { requireOrgStaff } from "@/lib/auth";
import { orgCounters } from "@/lib/org";
import { PageHeader } from "@/components/ui";
import { CounterManager } from "@/components/counter-manager";

export const metadata = { title: "Counters" };

export default async function OrgCountersPage() {
  const user = await requireOrgStaff();
  const counters = await orgCounters(user.org_id!);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Service points"
        title="Counters"
        description="Open, close and name service counters. Call-next requires an active counter."
        actions={
          <span className="badge-cyan">
            <MonitorSmartphone className="h-3 w-3" />
            {counters.filter((counter) => counter.is_active).length} open
          </span>
        }
      />
      <CounterManager initial={counters} />
    </div>
  );
}
