"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MailCheck,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
} from "lucide-react";
import { useLanguage, useToast } from "@/components/providers";
import { AddressPicker } from "@/components/address-picker";
import { cn } from "@/lib/utils";

type FieldErrors = Record<string, string>;
type ApiResponse = {
  ok?: boolean;
  error?: string;
  fields?: FieldErrors;
  code?: string;
  redirect?: string;
  message?: string;
  devLink?: string;
  loginPath?: string;
  email?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function readResponse(res: Response): Promise<ApiResponse> {
  try {
    return (await res.json()) as ApiResponse;
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && !error ? <p className="mt-1.5 text-[11px] text-slate-500">{hint}</p> : null}
      {error ? (
        <p className="field-error" role="alert">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

function InputWithIcon({
  icon: Icon,
  right,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: typeof Mail;
  right?: ReactNode;
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        {...props}
        className={cn("input input-icon", Boolean(right) && "pr-11", className)}
      />
      {right ? <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{right}</div> : null}
    </div>
  );
}

function PasswordField({
  id,
  value,
  onChange,
  label,
  error,
  autoComplete = "current-password",
  hint,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  error?: string;
  autoComplete?: string;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint}>
      <InputWithIcon
        icon={Lock}
        id={id}
        name={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        required
        right={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      />
    </Field>
  );
}

function ServerError({ message }: { message: string }) {
  return (
    <div
      className="flex gap-2.5 rounded-xl border border-rose-400/25 bg-rose-500/[0.08] p-3 text-sm text-rose-200"
      role="alert"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}

function SuccessPanel({
  title,
  message,
  devLink,
  children,
}: {
  title: string;
  message: string;
  devLink?: string;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.05] px-5 py-7 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full border border-emerald-400/25 bg-emerald-500/10 text-emerald-300">
          <MailCheck className="h-5 w-5" />
        </span>
        <h2 className="mt-4 font-display text-lg font-semibold text-white">{title}</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">{message}</p>
      </div>
      {devLink ? (
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/[0.06] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200">
            Development email preview
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-cyan-100/70">
            SMTP is not configured, so the action link is shown here and written to{" "}
            <code className="rounded bg-brand-500/10 px-1 py-0.5">data/outbox.log</code>. Disable
            with <code className="rounded bg-brand-500/10 px-1 py-0.5">SHOW_DEV_EMAIL_LINKS=false</code>.
          </p>
          <a href={devLink} className="btn-secondary mt-3 w-full !text-xs">
            Open verification link
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function LoginForm({
  role,
  initialNotice,
  nextHref,
}: {
  role: "user" | "org" | "admin";
  initialNotice?: string;
  nextHref?: string;
}) {
  const { t } = useLanguage();
  const { push } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [devLink, setDevLink] = useState("");
  const [resending, setResending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!email.trim()) nextErrors.email = "Email is required.";
    else if (!emailPattern.test(email.trim())) nextErrors.email = t("invalidEmail");
    if (!password) nextErrors.password = "Password is required.";
    setErrors(nextErrors);
    setServerError("");
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember, expectedRole: role }),
      });
      const data = await readResponse(res);
      if (!res.ok) {
        setServerError(data.error || "Unable to sign in.");
        if (data.fields) setErrors(data.fields);
        if (data.code === "unverified") setNeedsVerification(true);
        return;
      }
      push("success", "Signed in successfully.", `Welcome back`);
      router.push(nextHref || data.redirect || "/dashboard");
      router.refresh();
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!email) {
      setErrors((prev) => ({ ...prev, email: "Enter your email to resend the link." }));
      return;
    }
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await readResponse(res);
      if (data.devLink) setDevLink(data.devLink);
      push("info", data.message || "If the account needs verification, a link has been sent.");
    } catch {
      push("error", "Could not resend the verification email.");
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {initialNotice ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] p-3 text-sm text-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          {initialNotice}
        </div>
      ) : null}
      {serverError ? <ServerError message={serverError} /> : null}

      <Field label={t("email")} htmlFor="email" error={errors.email}>
        <InputWithIcon
          icon={Mail}
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          aria-invalid={Boolean(errors.email)}
          required
        />
      </Field>

      <PasswordField
        id="password"
        value={password}
        onChange={setPassword}
        label={t("password")}
        error={errors.password}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-ink-900 text-brand-500 focus:ring-brand-500/40"
          />
          {t("remember")}
        </label>
        <Link href="/forgot-password" className="text-xs font-medium text-brand-300 hover:text-brand-200">
          {t("forgot")}
        </Link>
      </div>

      {needsVerification ? (
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/[0.06] p-3">
          <p className="text-xs leading-relaxed text-amber-100">
            Your email is not verified yet. Resend the verification link to continue.
          </p>
          <button
            type="button"
            onClick={resend}
            disabled={resending}
            className="btn-secondary mt-2.5 w-full !py-2 !text-xs"
          >
            {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MailCheck className="h-3.5 w-3.5" />}
            Resend verification email
          </button>
          {devLink ? (
            <a href={devLink} className="mt-2 block text-center text-[11px] font-medium text-cyan-300 underline">
              Open development verification link
            </a>
          ) : null}
        </div>
      ) : null}

      <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        {loading ? "Signing inâ€¦" : t("signIn")}
      </button>

      {role !== "admin" ? (
        <div className="space-y-3 border-t border-white/[0.07] pt-4 text-center text-xs text-slate-500">
          {role === "user" ? (
            <p>
              {t("noAccount")}{" "}
              <Link href="/register" className="font-semibold text-brand-300 hover:text-brand-200">
                {t("createAccount")}
              </Link>
            </p>
          ) : (
            <p>
              New organisation?{" "}
              <Link href="/register/organization" className="font-semibold text-brand-300 hover:text-brand-200">
                {t("applyOrg")}
              </Link>
            </p>
          )}
        </div>
      ) : (
        <p className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-center text-[11px] leading-relaxed text-slate-500">
          {t("adminNote")}
        </p>
      )}
    </form>
  );
}

export function RegisterForm() {
  const { t } = useLanguage();
  const { push } = useToast();
  const router = useRouter();
  const [values, setValues] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ devLink?: string; emailDelivered?: boolean } | null>(null);
  const [resending, setResending] = useState(false);

  const strength = useMemo(() => {
    let score = 0;
    if (values.password.length >= 8) score += 1;
    if (/[A-Z]/.test(values.password) && /[a-z]/.test(values.password)) score += 1;
    if (/[0-9]/.test(values.password)) score += 1;
    if (/[^A-Za-z0-9]/.test(values.password)) score += 1;
    return score;
  }, [values.password]);

  function update(key: keyof typeof values, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next: FieldErrors = {};
    if (values.name.trim().length < 2) next.name = "Please enter your full name.";
    if (!emailPattern.test(values.email.trim())) next.email = t("invalidEmail");
    if (values.password.length < 8) next.password = "Use at least 8 characters.";
    else if (!/[A-Z]/.test(values.password) || !/[a-z]/.test(values.password) || !/[0-9]/.test(values.password)) {
      next.password = "Include uppercase, lowercase and a number.";
    }
    if (values.confirm !== values.password) next.confirm = "Passwords do not match.";
    setErrors(next);
    setServerError("");
    if (Object.keys(next).length > 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      });
      const data = await readResponse(res);
      if (!res.ok) {
        setServerError(data.error || "Could not create your account.");
        if (data.fields) setErrors(data.fields);
        return;
      }
      setSuccess({ devLink: data.devLink, emailDelivered: undefined });
      push("success", "Account created. Please verify your email.");
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });
      const data = await readResponse(res);
      if (data.devLink) setSuccess((prev) => ({ ...prev, devLink: data.devLink }));
      push("info", data.message || "Verification email sent.");
    } finally {
      setResending(false);
    }
  }

  if (success) {
    return (
      <SuccessPanel
        title="Verify your email to activate your account"
        message={`We sent a verification link to ${values.email}. It expires in 24 hours. You cannot sign in until your email is verified.`}
        devLink={success.devLink}
      >
        <button type="button" onClick={resend} disabled={resending} className="btn-secondary w-full">
          {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
          Resend verification email
        </button>
        <Link href="/login/user" className="btn-ghost w-full">
          Go to sign in
        </Link>
      </SuccessPanel>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {serverError ? <ServerError message={serverError} /> : null}
      <Field label={t("fullName")} htmlFor="name" error={errors.name}>
        <InputWithIcon
          icon={User}
          id="name"
          name="name"
          autoComplete="name"
          value={values.name}
          onChange={(event) => update("name", event.target.value)}
          placeholder="Aarav Sharma"
          aria-invalid={Boolean(errors.name)}
          required
        />
      </Field>
      <Field label={t("email")} htmlFor="register-email" error={errors.email}>
        <InputWithIcon
          icon={Mail}
          id="register-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={values.email}
          onChange={(event) => update("email", event.target.value)}
          placeholder="you@example.com"
          aria-invalid={Boolean(errors.email)}
          required
        />
      </Field>
      <PasswordField
        id="register-password"
        value={values.password}
        onChange={(value) => update("password", value)}
        label={t("password")}
        error={errors.password}
        autoComplete="new-password"
        hint={t("passwordHint")}
      />
      <div className="flex gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition",
              i < strength
                ? strength <= 2
                  ? "bg-amber-400/70"
                  : "bg-emerald-400/80"
                : "bg-white/10",
            )}
          />
        ))}
      </div>
      <PasswordField
        id="confirm-password"
        value={values.confirm}
        onChange={(value) => update("confirm", value)}
        label={t("confirmPassword")}
        error={errors.confirm}
        autoComplete="new-password"
      />
      <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        {loading ? "Creating accountâ€¦" : t("createAccount")}
      </button>
      <p className="text-center text-xs text-slate-500">
        {t("alreadyAccount")}{" "}
        <Link href="/login/user" className="font-semibold text-brand-300 hover:text-brand-200">
          {t("signIn")}
        </Link>
      </p>
    </form>
  );
}

export function OrgRegisterForm() {
  const { push } = useToast();
  const router = useRouter();
  const [values, setValues] = useState({
    orgName: "",
    category: "hospital",
    description: "",
    address: "",
    city: "Bhopal",
    state: "Madhya Pradesh",
    pincode: "",
    phone: "",
    lat: "23.2599",
    lng: "77.4126",
    openTime: "09:00",
    closeTime: "18:00",
    services: "",
    ownerName: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ devLink?: string } | null>(null);

  function update(key: keyof typeof values, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next: FieldErrors = {};
    if (values.orgName.trim().length < 3) next.orgName = "Enter the organisation name.";
    if (values.description.trim().length < 20) next.description = "Please add at least 20 characters.";
    if (values.address.trim().length < 5) next.address = "Enter the street address.";
    if (!values.city.trim()) next.city = "City is required.";
    if (values.pincode.trim().length < 4) next.pincode = "Enter a valid pincode.";
    if (values.phone.trim().length < 7) next.phone = "Enter a contact number.";
    if (values.openTime >= values.closeTime) next.closeTime = "Closing time must be later than opening time.";
    if (values.ownerName.trim().length < 2) next.ownerName = "Enter the owner's full name.";
    if (!emailPattern.test(values.email.trim())) next.email = "Enter a valid email address.";
    if (values.password.length < 8) next.password = "Use at least 8 characters.";
    else if (!/[A-Z]/.test(values.password) || !/[a-z]/.test(values.password) || !/[0-9]/.test(values.password)) {
      next.password = "Include uppercase, lowercase and a number.";
    }
    if (values.confirm !== values.password) next.confirm = "Passwords do not match.";
    const lat = Number(values.lat);
    const lng = Number(values.lng);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) next.lat = "Latitude must be between -90 and 90.";
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) next.lng = "Longitude must be between -180 and 180.";
    setErrors(next);
    setServerError("");
    if (Object.keys(next).length > 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          lat,
          lng,
        }),
      });
      const data = await readResponse(res);
      if (!res.ok) {
        setServerError(data.error || "Could not submit the application.");
        if (data.fields) setErrors(data.fields);
        return;
      }
      setSuccess({ devLink: data.devLink });
      push("success", "Application submitted for review.");
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <SuccessPanel
        title="Application submitted"
        message="Verify your email to activate the owner account. After verification, our platform team reviews the organisation details. You can sign in to see the review status, but queue management is enabled only after approval."
        devLink={success.devLink}
      >
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/[0.05] p-3 text-xs leading-relaxed text-amber-100">
          Organisations are not activated automatically. Approval protects customers and
          keeps queue data trustworthy.
        </div>
        <Link href="/login/organization" className="btn-secondary w-full">
          Go to organisation sign in
        </Link>
      </SuccessPanel>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      {serverError ? <ServerError message={serverError} /> : null}

      <div className="space-y-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-200">
          <Building2 className="h-3.5 w-3.5" /> Organisation details
        </p>
        <Field label="Organisation name" htmlFor="orgName" error={errors.orgName}>
          <InputWithIcon
            icon={Building2}
            id="orgName"
            value={values.orgName}
            onChange={(event) => update("orgName", event.target.value)}
            placeholder="Sunrise Multispeciality Hospital"
            aria-invalid={Boolean(errors.orgName)}
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" htmlFor="category" error={errors.category}>
            <select
              id="category"
              className="input"
              value={values.category}
              onChange={(event) => update("category", event.target.value)}
            >
              <option value="hospital">Hospital</option>
              <option value="clinic">Clinic</option>
              <option value="diagnostic">Diagnostic centre</option>
              <option value="bank">Bank</option>
              <option value="government">Government office</option>
              <option value="service">Service centre</option>
            </select>
          </Field>
          <Field label="Services offered" htmlFor="services" error={errors.services}>
            <input
              id="services"
              className="input"
              value={values.services}
              onChange={(event) => update("services", event.target.value)}
              placeholder="General Medicine, Pathology, Loans"
              maxLength={300}
            />
          </Field>
        </div>
        <Field label="Short description" htmlFor="description" error={errors.description} hint="Shown to customers on your centre listing.">
          <textarea
            id="description"
            className="input min-h-[88px] resize-y"
            value={values.description}
            onChange={(event) => update("description", event.target.value)}
            placeholder="What services does your organisation provide, and what should customers expect?"
            maxLength={1200}
            aria-invalid={Boolean(errors.description)}
            required
          />
        </Field>
      </div>

      <div className="space-y-4 border-t border-white/[0.07] pt-5">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200">
          <MapPin className="h-3.5 w-3.5" /> Location & hours
        </p>
        <AddressPicker
          values={{
            address: values.address,
            city: values.city,
            state: values.state,
            pincode: values.pincode,
            lat: values.lat,
            lng: values.lng,
          }}
          errors={errors}
          onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact phone" htmlFor="phone" error={errors.phone}>
            <InputWithIcon
              icon={Phone}
              id="phone"
              value={values.phone}
              onChange={(event) => update("phone", event.target.value)}
              placeholder="+91 20 4000 0000"
              aria-invalid={Boolean(errors.phone)}
              required
            />
          </Field>
          <Field label="Opening / closing time" htmlFor="openTime" error={errors.closeTime}>
            <div className="flex items-center gap-2">
              <input
                id="openTime"
                type="time"
                className="input"
                value={values.openTime}
                onChange={(event) => update("openTime", event.target.value)}
                aria-label="Opening time"
                required
              />
              <span className="text-slate-500">to</span>
              <input
                type="time"
                className="input"
                value={values.closeTime}
                onChange={(event) => update("closeTime", event.target.value)}
                aria-label="Closing time"
                required
              />
            </div>
          </Field>
        </div>
      </div>

      <div className="space-y-4 border-t border-white/[0.07] pt-5">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200">
          <ShieldCheck className="h-3.5 w-3.5" /> Owner account
        </p>
        <Field label="Owner / manager name" htmlFor="ownerName" error={errors.ownerName}>
          <InputWithIcon
            icon={User}
            id="ownerName"
            value={values.ownerName}
            onChange={(event) => update("ownerName", event.target.value)}
            placeholder="Dr. Kavita Deshmukh"
            aria-invalid={Boolean(errors.ownerName)}
            required
          />
        </Field>
        <Field label="Work email" htmlFor="org-email" error={errors.email}>
          <InputWithIcon
            icon={Mail}
            id="org-email"
            type="email"
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="admin@yourorganisation.com"
            aria-invalid={Boolean(errors.email)}
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordField
            id="org-password"
            value={values.password}
            onChange={(value) => update("password", value)}
            label="Password"
            error={errors.password}
            autoComplete="new-password"
          />
          <PasswordField
            id="org-confirm"
            value={values.confirm}
            onChange={(value) => update("confirm", value)}
            label="Confirm password"
            error={errors.confirm}
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className="rounded-xl border border-amber-400/15 bg-amber-500/[0.04] p-3 text-[11px] leading-relaxed text-amber-100/80">
        By applying you confirm that you are authorised to represent this organisation.
        Applications are reviewed manually; approval is not automatic and can take time.
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
        {loading ? "Submitting applicationâ€¦" : "Submit organisation application"}
      </button>
      <p className="text-center text-xs text-slate-500">
        Already registered?{" "}
        <Link href="/login/organization" className="font-semibold text-brand-300 hover:text-brand-200">
          Sign in
        </Link>
      </p>
      <button type="button" onClick={() => router.push("/login")} className="btn-ghost w-full !text-xs">
        Back to portal selection
      </button>
    </form>
  );
}

export function ForgotForm() {
  const { t } = useLanguage();
  const { push } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!emailPattern.test(email.trim())) {
      setError(t("invalidEmail"));
      return;
    }
    setError("");
    setServerError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await readResponse(res);
      if (!res.ok) {
        setServerError(data.error || "Could not send the reset email.");
        return;
      }
      setDevLink(data.devLink || "");
      setSent(true);
      push("success", "If an account exists, a reset link has been sent.");
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <SuccessPanel
        title="Check your inbox"
        message={`If an account exists for ${email}, a password reset link will arrive shortly. The link expires in 60 minutes.`}
        devLink={devLink}
      >
        <Link href="/login" className="btn-ghost w-full">
          Back to sign in
        </Link>
      </SuccessPanel>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {serverError ? <ServerError message={serverError} /> : null}
      <Field label={t("email")} htmlFor="forgot-email" error={error}>
        <InputWithIcon
          icon={Mail}
          id="forgot-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          aria-invalid={Boolean(error)}
          required
        />
      </Field>
      <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
        {loading ? "Sendingâ€¦" : "Send reset link"}
      </button>
      <Link href="/login" className="btn-ghost w-full">
        Back to sign in
      </Link>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const { push } = useToast();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next: FieldErrors = {};
    if (password.length < 8) next.password = "Use at least 8 characters.";
    else if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      next.password = "Include uppercase, lowercase and a number.";
    }
    if (confirm !== password) next.confirm = "Passwords do not match.";
    if (!token) next.form = "Reset token is missing from the link.";
    setErrors(next);
    setServerError("");
    if (Object.keys(next).length > 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await readResponse(res);
      if (!res.ok) {
        setServerError(data.error || "Could not reset the password.");
        return;
      }
      push("success", "Password updated. Please sign in.");
      router.push("/login/user?reset=1");
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {serverError ? <ServerError message={serverError} /> : null}
      {errors.form ? <ServerError message={errors.form} /> : null}
      <PasswordField
        id="new-password"
        value={password}
        onChange={setPassword}
        label="New password"
        error={errors.password}
        autoComplete="new-password"
        hint="At least 8 characters with uppercase, lowercase and a number."
      />
      <PasswordField
        id="reset-confirm"
        value={confirm}
        onChange={setConfirm}
        label="Confirm new password"
        error={errors.confirm}
        autoComplete="new-password"
      />
      <button type="submit" disabled={loading || !token} className="btn-primary w-full !py-3">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        {loading ? "Updatingâ€¦" : "Update password"}
      </button>
      <Link href="/login" className="btn-ghost w-full">
        Back to sign in
      </Link>
    </form>
  );
}

export function VerifyEmailPanel({ token }: { token: string }) {
  const { push } = useToast();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [redirect, setRedirect] = useState("/dashboard");
  const [devLink, setDevLink] = useState("");

  async function verify() {
    if (!token) {
      setStatus("error");
      setMessage("This verification link is missing its token. Request a new link from the sign-in page.");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await readResponse(res);
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Verification failed.");
        return;
      }
      setStatus("done");
      setMessage(data.message || "Email verified.");
      setRedirect(data.redirect || data.loginPath || "/dashboard");
      push("success", "Email verified. Welcome to Skipline Hub.");
      window.setTimeout(() => {
        router.push(data.redirect || data.loginPath || "/dashboard");
        router.refresh();
      }, 1200);
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <div className="space-y-4 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-emerald-400/25 bg-emerald-500/10 text-emerald-300">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <p className="text-sm text-slate-300">{message}</p>
        <p className="text-xs text-slate-500">Redirecting to your workspaceâ€¦</p>
        <Link href={redirect} className="btn-primary w-full">
          Continue
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {status === "error" ? (
        <ServerError message={message} />
      ) : (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm leading-relaxed text-slate-400">
          Click the button below to confirm your email and activate your Skipline Hub
          account. For safety, verification links expire after 24 hours.
        </div>
      )}
      <button
        type="button"
        onClick={verify}
        disabled={status === "loading"}
        className="btn-primary w-full !py-3"
      >
        {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
        {status === "loading" ? "Verifyingâ€¦" : "Verify my email"}
      </button>
      <Link href="/login" className="btn-ghost w-full">
        Back to sign in
      </Link>
      {devLink ? <a href={devLink}>{devLink}</a> : null}
    </div>
  );
}

export function ResendVerificationForm({ initialEmail = "" }: { initialEmail?: string }) {
  const { push } = useToast();
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [devLink, setDevLink] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!emailPattern.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await readResponse(res);
      setDevLink(data.devLink || "");
      setSent(true);
      push("info", data.message || "Verification email sent.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Email address" htmlFor="resend-email" error={error}>
        <InputWithIcon
          icon={Mail}
          id="resend-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
        />
      </Field>
      {sent ? (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] p-3 text-xs leading-relaxed text-emerald-100">
          If this account needs verification, a fresh link has been sent. Check spam too.
          {devLink ? (
            <a href={devLink} className="mt-2 block font-semibold text-cyan-300 underline">
              Open development verification link
            </a>
          ) : null}
        </div>
      ) : null}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
        {loading ? "Sendingâ€¦" : "Resend verification email"}
      </button>
      <Link href="/login" className="btn-ghost w-full">
        Back to sign in
      </Link>
    </form>
  );
}

