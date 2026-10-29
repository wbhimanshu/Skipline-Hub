import { AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "@/components/auth/auth-forms";
import { UserLoginScene } from "@/components/illustrations";

export const metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Use at least 8 characters with uppercase, lowercase and a number. Signing in again will be required everywhere."
      illustration={<UserLoginScene className="h-auto w-full" />}
      sideTitle="One password. Every visit."
      sidePoints={[
        "Passwords are stored as salted scrypt hashes",
        "Sessions are httpOnly, SameSite cookies",
        "Role permissions are always checked on the server",
      ]}
      backHref="/login"
      backLabel="Back to sign in"
    >
      <ResetForm token={token ?? ""} />
    </AuthShell>
  );
}
