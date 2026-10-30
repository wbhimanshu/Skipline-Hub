import { requireRole } from "@/lib/auth";
import { one } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("admin");
  const unread = await one<{ c: number }>(
    "SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read_at IS NULL",
    user.id,
  );
  return (
    <DashboardShell
      role="admin"
      name={user.name}
      email={user.email}
      unread={Number(unread?.c ?? 0)}
    >
      {children}
    </DashboardShell>
  );
}
