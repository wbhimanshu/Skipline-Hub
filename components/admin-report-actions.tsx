"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, Loader2, X } from "lucide-react";
import { useToast } from "@/components/providers";

export function AdminReportActions({
  id,
  subject,
  status,
}: {
  id: string;
  subject: string;
  status: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [pending, setPending] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"reviewing" | "resolved" | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(next: "reviewing" | "resolved", value = "") {
    setPending(next);
    setError(null);
    const response = await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next, note: value || undefined }),
    });
    const data = await response.json();
    setPending(null);
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not update report.");
      return;
    }
    setDialog(null);
    setNote("");
    push("success", `"${subject}" marked ${next}.`, "Report updated");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {status === "open" ? (
          <button
            type="button"
            onClick={() => submit("reviewing")}
            disabled={pending !== null}
            className="btn btn-sm border border-cyan-400/25 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20"
          >
            {pending === "reviewing" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
            Start review
          </button>
        ) : null}
        {status !== "resolved" ? (
          <button
            type="button"
            onClick={() => {
              setDialog("resolved");
              setNote("");
              setError(null);
            }}
            className="btn btn-sm border border-emerald-400/25 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Resolve
          </button>
        ) : null}
      </div>

      {dialog ? (
        <div className="fixed inset-0 z-[90] grid place-items-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-ink-950/75 backdrop-blur-sm"
            onClick={() => setDialog(null)}
            aria-label="Close dialog"
          />
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-ink-900 p-6 shadow-panel">
            <button
              type="button"
              onClick={() => setDialog(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-400/25 bg-emerald-500/10 text-emerald-200">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <h2 className="mt-4 font-display text-lg font-semibold text-white">Resolve report</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              The reporting customer receives your resolution note. Keep it factual and avoid sharing
              private information about other users.
            </p>
            <div className="mt-4">
              <label htmlFor="report-note" className="label">Resolution note</label>
              <textarea
                id="report-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                maxLength={1000}
                className="input resize-none text-sm"
                placeholder="Summarise the action taken."
              />
            </div>
            {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setDialog(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => submit("resolved", note)}
                disabled={pending !== null}
                className="btn-primary flex-1"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Mark resolved
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
