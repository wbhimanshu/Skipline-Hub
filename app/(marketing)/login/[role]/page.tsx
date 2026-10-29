import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-forms";
import {
  AdminLoginScene,
  OrgLoginScene,
  UserLoginScene,
} from "@/components/illustrations";

type Role = "user" | "org" | "admin";

const roleConfig: Record<
  Role,
  {
    title: string;
    subtitle: string;
    illustration: React.ReactNode;
    sideTitle: string;
    points: string[];
  }
> = {
  user: {
    title: "Sign in to your care-free day",
    subtitle:
      "Manage tokens, appointments, alerts and your personal queue from one secure dashboard.",
    illustration: <UserLoginScene className="h-auto w-full" />,
    sideTitle: "Everything in one quiet dashboard",
    points: [
      "Live token position, estimated turn and delay updates",
      "Upcoming appointments with check-in and cancellation controls",
      "Language, large text and voice-search accessibility",
      "Emergency guidance always points to local services first",
    ],
  },
  org: {
    title: "Sign in to your operations desk",
    subtitle:
      "Manage live queues, call customers, verify tokens and understand demand at your centre.",
    illustration: <OrgLoginScene className="h-auto w-full" />,
    sideTitle: "Built for frontline teams",
    points: [
      "Conflict-safe call-next and counter management",
      "Staff-verified priority and emergency triage workflow",
      "Visitor, peak-hour and waiting-time analytics from real records",
      "Approval required before customer queues go live",
    ],
  },
  admin: {
    title: "Administrator access",
    subtitle:
      "Review organisation applications, oversee fairness and audit sensitive platform actions.",
    illustration: <AdminLoginScene className="h-auto w-full" />,
    sideTitle: "Server-enforced administration",
    points: [
      "Admin accounts are provisioned, never publicly registered",
      "Every sensitive action is checked server-side",
      "Appeals, restrictions, reports and approvals in one audit trail",
      "No access to another customer's private queue details",
    ],
  },
};

const roleMeta: Record<Role, string> = {
  user: "Customer sign in",
  org: "Organisation sign in",
  admin: "Admin sign in",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ role: string }>;
}): Promise<Metadata> {
  const { role } = await params;
  return { title: role in roleMeta ? roleMeta[role as Role] : "Sign in" };
}

export default async function RoleLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ role: string }>;
  searchParams: Promise<{ reset?: string; next?: string }>;
}) {
  const { role } = await params;
  const query = await searchParams;
  if (role !== "user" && role !== "org" && role !== "admin") notFound();
  const config = roleConfig[role];
  const nextHref =
    query.next &&
    query.next.startsWith("/") &&
    !query.next.startsWith("//")
      ? query.next
      : undefined;
  return (
    <AuthShell
      title={config.title}
      subtitle={config.subtitle}
      illustration={config.illustration}
      sideTitle={config.sideTitle}
      sidePoints={config.points}
      backHref="/login"
      backLabel="Choose a different portal"
    >
      <LoginForm
        role={role}
        nextHref={nextHref}
        initialNotice={query.reset === "1" ? "Password updated. Sign in with your new password." : undefined}
      />
    </AuthShell>
  );
}
