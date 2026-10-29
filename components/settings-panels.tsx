"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  FileWarning,
  KeyRound,
  Languages,
  Loader2,
  Save,
  ShieldAlert,
  Type,
} from "lucide-react";
import { useLanguage, useToast } from "@/components/providers";
import { InlineNotice } from "@/components/ui";
import { cn } from "@/lib/utils";

async function sendJson(url: string, method: string, body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { ok: response.ok, data: await response.json() };
}

export function ProfileForm({
  name,
  email,
  phone,
}: {
  name: string;
  email: string;
  phone: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [values, setValues] = useState({ name, phone });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await sendJson("/api/profile", "PATCH", values);
    setPending(false);
    if (!result.ok || !result.data.ok) {
      setError(result.data.error || "Could not save your profile.");
      return;
    }
    push("success", "Your profile has been updated.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="profile-name" className="label">Full name</label>
        <input
          id="profile-name"
          value={values.name}
          onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
          className="input"
          minLength={2}
          maxLength={80}
          required
        />
      </div>
      <div>
        <label htmlFor="profile-email" className="label">Email</label>
        <input id="profile-email" value={email} readOnly className="input opacity-60" />
        <p className="mt-1 text-[11px] text-slate-600">Contact support to change the email on your account.</p>
      </div>
      <div>
        <label htmlFor="profile-phone" className="label">Phone number</label>
        <input
          id="profile-phone"
          value={values.phone}
          onChange={(event) => setValues((prev) => ({ ...prev, phone: event.target.value }))}
          className="input"
          maxLength={24}
          placeholder="+91 98765 43210"
        />
      </div>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save profile
      </button>
    </form>
  );
}

export function PreferencesPanel() {
  const { lang, largeText, setLang, setLargeText } = useLanguage();
  return (
    <div className="space-y-5">
      <div>
        <p className="label flex items-center gap-1.5">
          <Languages className="h-3.5 w-3.5" />
          Language
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setLang("en")}
            className={cn(
              "rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
              lang === "en"
                ? "border-brand-400/40 bg-brand-500/15 text-white"
                : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white",
            )}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLang("hi")}
            className={cn(
              "rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
              lang === "hi"
                ? "border-brand-400/40 bg-brand-500/15 text-white"
                : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white",
            )}
          >
            हिन्दी
          </button>
        </div>
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
        <input
          type="checkbox"
          checked={largeText}
          onChange={(event) => setLargeText(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-white/20 bg-ink-900 text-brand-500 focus:ring-brand-500"
        />
        <span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <Type className="h-3.5 w-3.5" />
            Larger text
          </span>
          <span className="mt-1 block text-[11px] text-slate-500">
            Increases base text size across dashboards and the public site.
          </span>
        </span>
      </label>
    </div>
  );
}

export function AppealForm({
  restrictionId,
  existingStatus,
}: {
  restrictionId: string;
  existingStatus: string | null;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (existingStatus) {
    return (
      <InlineNotice tone={existingStatus === "accepted" ? "success" : existingStatus === "rejected" ? "danger" : "info"} title={`Appeal ${existingStatus}`}>
        {existingStatus === "pending"
          ? "Your appeal is with the platform team. You will be notified when a decision is made."
          : existingStatus === "accepted"
            ? "Your appeal was accepted. The booking limit has been reviewed."
            : "Your appeal was reviewed and declined. You can contact support if you have new evidence."}
      </InlineNotice>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await sendJson("/api/appeals", "POST", { restrictionId, message });
    setPending(false);
    if (!result.ok || !result.data.ok) {
      setError(result.data.error || "Could not submit appeal.");
      return;
    }
    push("success", "Your appeal has been submitted for review.", "Appeal received");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-xs leading-relaxed text-slate-400">
        If the cancellation was caused by a medical emergency, centre closure or system issue, explain
        what happened. Platform reviewers can reverse an unfair restriction.
      </p>
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={4}
        minLength={20}
        maxLength={2000}
        required
        className="input resize-none text-sm"
        placeholder="Explain your situation with any relevant details…"
      />
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        Submit appeal
      </button>
    </form>
  );
}

export function ReportForm({ orgs }: { orgs: Array<{ id: string; name: string }> }) {
  const { push } = useToast();
  const [values, setValues] = useState({ subject: "", message: "", orgId: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await sendJson("/api/reports", "POST", {
      ...values,
      orgId: values.orgId || null,
    });
    setPending(false);
    if (!result.ok || !result.data.ok) {
      setError(result.data.error || "Could not submit report.");
      return;
    }
    setSent(true);
    setValues({ subject: "", message: "", orgId: "" });
    push("success", "Your report has been sent to the platform team.", "Report submitted");
  }

  if (sent) {
    return (
      <InlineNotice tone="success" title="Report received">
        We will review the issue and take action if platform rules were broken.
      </InlineNotice>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label htmlFor="report-org" className="label">Centre (optional)</label>
        <select
          id="report-org"
          value={values.orgId}
          onChange={(event) => setValues((prev) => ({ ...prev, orgId: event.target.value }))}
          className="input text-sm"
        >
          <option value="">Platform-wide issue</option>
          {orgs.map((org) => (
            <option key={org.id} value={org.id}>{org.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="report-subject" className="label">Subject</label>
        <input
          id="report-subject"
          value={values.subject}
          onChange={(event) => setValues((prev) => ({ ...prev, subject: event.target.value }))}
          className="input text-sm"
          minLength={3}
          maxLength={140}
          required
          placeholder="Short summary"
        />
      </div>
      <div>
        <label htmlFor="report-message" className="label">What happened?</label>
        <textarea
          id="report-message"
          value={values.message}
          onChange={(event) => setValues((prev) => ({ ...prev, message: event.target.value }))}
          rows={4}
          minLength={10}
          maxLength={2000}
          required
          className="input resize-none text-sm"
          placeholder="Include what happened, when, and what outcome you expected…"
        />
      </div>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
      <button type="submit" disabled={pending} className="btn-secondary">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileWarning className="h-4 w-4" />}
        Submit report
      </button>
    </form>
  );
}

export function PasswordResetButton({ email }: { email: string }) {
  const { push } = useToast();
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function request() {
    setPending(true);
    const result = await sendJson("/api/auth/forgot-password", "POST", { email });
    setPending(false);
    if (!result.ok) {
      push("error", "Could not send a reset link. Please try again.");
      return;
    }
    setSent(true);
    push("success", "If the account exists, a reset link has been sent.", "Check your email");
  }

  return (
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-400">
        <KeyRound className="h-4 w-4" />
      </span>
      <div className="flex-1">
        <p className="text-xs font-semibold text-slate-200">Password</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          Send a secure, single-use reset link to {email}. All active sessions are revoked after reset.
        </p>
        <button type="button" onClick={request} disabled={pending || sent} className="btn-secondary btn-sm mt-3">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldAlert className="h-3.5 w-3.5" />}
          {sent ? "Reset link sent" : "Send reset link"}
        </button>
      </div>
    </div>
  );
}
