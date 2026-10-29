import { requireRole } from "@/lib/auth";
import { all } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { NotificationsCenter, type NotificationRow } from "@/components/notifications-center";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireRole("user");
  const notifications = all<NotificationRow>(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100",
    user.id,
  );
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Alerts"
        title="Notifications"
        description="Turn alerts, booking changes and fairness decisions. We only send what affects your visit."
      />
      <NotificationsCenter initial={notifications} />
    </div>
  );
}
