import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotForm } from "@/components/auth/auth-forms";
import { AlertScene } from "@/components/illustrations";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email linked to your account. If it exists, we will send a reset link that expires in 60 minutes."
      illustration={<AlertScene className="h-auto w-full" />}
      sideTitle="Account recovery, done safely"
      sidePoints={[
        "Reset links are single-use and time-limited",
        "All active sessions are revoked after a reset",
        "The response never reveals whether an email is registered",
      ]}
      backHref="/login"
      backLabel="Back to sign in"
    >
      <ForgotForm />
    </AuthShell>
  );
}
