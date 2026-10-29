import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailPanel } from "@/components/auth/auth-forms";
import { TicketScene } from "@/components/illustrations";

export const metadata = { title: "Verify email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <AuthShell
      title="Verify your email"
      subtitle="Email verification protects your account and unlocks sign-in. Verify once, then your workspace is ready."
      illustration={<TicketScene className="h-auto w-full" />}
      sideTitle="Why verification matters"
      sidePoints={[
        "Prevents someone else from registering with your email",
        "Ensures password reset and turn alerts reach the right person",
        "Organisation owners must verify before admin review",
      ]}
      backHref="/login"
      backLabel="Back to sign in"
    >
      <VerifyEmailPanel token={token ?? ""} />
    </AuthShell>
  );
}
