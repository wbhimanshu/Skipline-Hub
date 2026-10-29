import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResendVerificationForm } from "@/components/auth/auth-forms";
import { AlertScene } from "@/components/illustrations";

export const metadata = { title: "Verify your email to continue" };

export default function VerifyPendingPage() {
  return (
    <AuthShell
      title="One quick step to activate your account"
      subtitle="Your email is not verified yet. Request a fresh verification link below, then open it to activate your account."
      illustration={<AlertScene className="h-auto w-full" />}
      sideTitle="Didn't get the email?"
      sidePoints={[
        "Check your spam or promotions folder",
        "Links expire after 24 hours — request a new one if needed",
        "Contact your organisation admin if you use a managed inbox",
      ]}
      backHref="/login"
      backLabel="Back to sign in"
    >
      <ResendVerificationForm />
      <p className="mt-4 text-center text-xs text-slate-500">
        Already verified?{" "}
        <Link href="/login" className="font-semibold text-brand-300 hover:text-brand-200">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
