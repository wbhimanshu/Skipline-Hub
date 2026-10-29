import { requireOrgStaff } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ScanCheckin } from "@/components/scan-checkin";

export const metadata = { title: "Scan token" };

export default async function OrgScanPage() {
  await requireOrgStaff();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Arrival desk"
        title="Scan token"
        description="Verify a customer's signed QR code or token number, then check them into today's live queue."
      />
      <ScanCheckin />
    </div>
  );
}
