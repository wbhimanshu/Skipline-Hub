import { requireOrgStaff } from "@/lib/auth";
import { one } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireOrgStaff();
  const unread = await one<{ c: number }>(
    "SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read_at IS NULL",
    user.id,
  );
  return (
    <DashboardShell
      role="org"
      name={user.name}
      email={user.email}
      orgName={user.org_name}
      orgStatus={user.org_status}
      unread={Number(unread?.c ?? 0)}
    >
      {children}
    </DashboardShell>
  );
}
