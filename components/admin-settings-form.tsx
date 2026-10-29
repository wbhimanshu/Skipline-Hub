"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Scale } from "lucide-react";
import { useToast } from "@/components/providers";
import type { FairnessSettings } from "@/lib/admin";

export function AdminSettingsForm({ initial }: { initial: FairnessSettings }) {
  const router = useRouter();
  const { push } = useToast();
  const [values, setValues] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: keyof FairnessSettings, value: number) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const response = await fetch("/api/admin/settings", {
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
    push("success", "Fairness rules updated for future cancellations.", "Settings saved");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="threshold" className="label">Late cancellations allowed</label>
          <input
            id="threshold"
            type="number"
            min={2}
            max={10}
            value={values.thresholdCount}
            onChange={(event) => update("thresholdCount", Number(event.target.value))}
            className="input"
          />
          <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
            The count that triggers a temporary limit.
          </p>
        </div>
        <div>
          <label htmlFor="window" className="label">Review window (days)</label>
          <input
            id="window"
            type="number"
            min={7}
            max={180}
            value={values.windowDays}
            onChange={(event) => update("windowDays", Number(event.target.value))}
            className="input"
          />
          <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
            How far back late cancellations are counted.
          </p>
        </div>
        <div>
          <label htmlFor="duration" className="label">Restriction length (days)</label>
          <input
            id="duration"
            type="number"
            min={1}
            max={90}
            value={values.restrictionDays}
            onChange={(event) => update("restrictionDays", Number(event.target.value))}
            className="input"
          />
          <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
            Default duration when a limit is applied.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 text-[11px] leading-relaxed text-slate-500">
        <p className="flex items-center gap-1.5 font-semibold text-slate-300">
          <Scale className="h-3.5 w-3.5" />
          Policy guardrails
        </p>
        <p className="mt-1.5">
          Changes apply to future calculations only; existing restrictions keep their original end dates.
          Medical emergencies, verified centre closures and platform outages are excluded from late
          cancellation counts. Customers can always appeal through Settings.
        </p>
      </div>

      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save fairness rules
      </button>
    </form>
  );
}
