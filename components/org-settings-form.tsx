"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartPulse, Loader2, Save, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/providers";
import type { Organisation } from "@/lib/centres";

export function OrgSettingsForm({ org }: { org: Organisation }) {
  const router = useRouter();
  const { push } = useToast();
  const [values, setValues] = useState({
    name: org.name,
    description: org.description,
    phone: org.phone,
    email: org.email,
    address: org.address,
    city: org.city,
    openTime: org.open_time,
    closeTime: org.close_time,
    slotMinutes: org.slot_minutes,
    services: org.services,
    priorityPolicy: org.priority_policy,
    cancellationPolicy: org.cancellation_policy,
    emergencyEnabled: Boolean(org.emergency_enabled),
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const response = await fetch("/api/org/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await response.json();
    setPending(false);
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not save settings.");
      return;
    }
    push("success", "Organisation settings saved.", "Settings updated");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="org-name" className="label">Organisation name</label>
          <input id="org-name" value={values.name} onChange={(event) => update("name", event.target.value)} className="input" minLength={3} maxLength={120} required />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="org-description" className="label">Public description</label>
          <textarea id="org-description" value={values.description} onChange={(event) => update("description", event.target.value)} rows={3} className="input resize-none" minLength={20} maxLength={1200} required />
        </div>
        <div>
          <label htmlFor="org-phone" className="label">Phone</label>
          <input id="org-phone" value={values.phone} onChange={(event) => update("phone", event.target.value)} className="input" minLength={7} maxLength={24} required />
        </div>
        <div>
          <label htmlFor="org-email" className="label">Public email</label>
          <input id="org-email" type="email" value={values.email} onChange={(event) => update("email", event.target.value)} className="input" required />
        </div>
        <div>
          <label htmlFor="org-address" className="label">Address</label>
          <input id="org-address" value={values.address} onChange={(event) => update("address", event.target.value)} className="input" minLength={5} maxLength={200} required />
        </div>
        <div>
          <label htmlFor="org-city" className="label">City</label>
          <input id="org-city" value={values.city} onChange={(event) => update("city", event.target.value)} className="input" minLength={2} maxLength={80} required />
        </div>
        <div>
          <label htmlFor="org-open" className="label">Opening time</label>
          <input id="org-open" type="time" value={values.openTime} onChange={(event) => update("openTime", event.target.value)} className="input" required />
        </div>
        <div>
          <label htmlFor="org-close" className="label">Closing time</label>
          <input id="org-close" type="time" value={values.closeTime} onChange={(event) => update("closeTime", event.target.value)} className="input" required />
        </div>
        <div>
          <label htmlFor="org-slot" className="label">Appointment slot length (minutes)</label>
          <select id="org-slot" value={values.slotMinutes} onChange={(event) => update("slotMinutes", Number(event.target.value))} className="input">
            {[10, 15, 20, 30, 45, 60].map((minutes) => (
              <option key={minutes} value={minutes}>{minutes} minutes</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="org-services" className="label">Services (comma separated)</label>
          <input id="org-services" value={values.services} onChange={(event) => update("services", event.target.value)} className="input" maxLength={300} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="org-priority" className="label">Priority policy</label>
          <textarea id="org-priority" value={values.priorityPolicy} onChange={(event) => update("priorityPolicy", event.target.value)} rows={3} className="input resize-none" minLength={10} maxLength={1200} required />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="org-cancel" className="label">Cancellation policy</label>
          <textarea id="org-cancel" value={values.cancellationPolicy} onChange={(event) => update("cancellationPolicy", event.target.value)} rows={3} className="input resize-none" minLength={10} maxLength={1200} required />
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-500/[0.04] p-3.5">
        <input
          type="checkbox"
          checked={values.emergencyEnabled}
          onChange={(event) => update("emergencyEnabled", event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-white/20 bg-ink-900 text-rose-500 focus:ring-rose-500"
        />
        <span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-100">
            <HeartPulse className="h-3.5 w-3.5" />
            Enable emergency triage requests
          </span>
          <span className="mt-1 block text-[11px] leading-relaxed text-rose-200/60">
            Only enable if trained staff can review urgent requests promptly. This never replaces local
            emergency services.
          </span>
        </span>
      </label>

      <div className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[11px] leading-relaxed text-slate-500">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
        Organisation details are public after approval. Changes are recorded in the audit log.
      </div>

      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save settings
      </button>
    </form>
  );
}
