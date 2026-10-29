import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/auth-forms";
import { SmoothServiceScene } from "@/components/illustrations";

export const metadata = { title: "Create a customer account" };

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your customer account"
      subtitle="One account for every centre you visit. Verify your email, then join queues, book slots and track your turn."
      illustration={<SmoothServiceScene className="h-auto w-full" />}
      sideTitle="A calmer way to be served"
      sidePoints={[
        "No waiting-room guesswork — see an honest estimate before you travel",
        "Digital tokens with signed QR check-in",
        "Cancellation policy shown before you commit",
        "Priority support is human-verified, never purchased",
      ]}
      backHref="/login"
      backLabel="Back to sign in"
    >
      <RegisterForm />
    </AuthShell>
  );
}
