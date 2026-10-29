"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  CheckCircle2,
  Loader2,
  RotateCcw,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { useToast } from "@/components/providers";
import { cn } from "@/lib/utils";

type Action = "approve" | "reject" | "suspend" | "restore";

export function AdminOrgActions({
  id,
  name,
  status,
}: {
  id: string;
  name: string;
  status: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [pending, setPending] = useState<Action | null>(null);
  const [dialog, setDialog] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(action: Action, note = "") {
    setPending(action);
    setError(null);
    const response = await fetch(`/api/admin/organisations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason: note || undefined }),
    });
    const data = await response.json();
    setPending(null);
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not update organisation.");
      return;
    }
    setDialog(null);
    setReason("");
    push("success", `${name} is now ${data.status}.`, "Organisation updated");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {status === "pending" ? (
          <>
            <button
              type="button"
              onClick={() => submit("approve")}
              disabled={pending !== null}
              className="btn btn-sm border border-emerald-400/25 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
            >
              {pending === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Approve
            </button>
            <button
              type="button"
              onClick={() => {
                setDialog("reject");
                setReason("");
                setError(null);
              }}
              className="btn btn-sm border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white"
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject
            </button>
          </>
        ) : null}
        {status === "approved" ? (
          <button
            type="button"
            onClick={() => {
              setDialog("suspend");
              setReason("");
              setError(null);
            }}
            className="btn-danger btn-sm"
          >
            <Ban className="h-3.5 w-3.5" />
            Suspend
          </button>
        ) : null}
        {status === "suspended" || status === "rejected" ? (
          <button
            type="button"
            onClick={() => submit("restore")}
            disabled={pending !== null}
            className="btn btn-sm border border-cyan-400/25 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20"
          >
            {pending === "restore" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            Restore
          </button>
        ) : null}
        {status === "pending" ? (
          <span className="badge-amber">
            <ShieldCheck className="h-3 w-3" />
            Review
          </span>
        ) : null}
      </div>

      {dialog ? (
        <div className="fixed inset-0 z-[90] grid place-items-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm"
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
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-rose-400/25 bg-rose-500/10 text-rose-200">
              <Ban className="h-5 w-5" />
            </span>
            <h2 className="mt-4 font-display text-lg font-semibold text-white">
              {dialog === "reject" ? "Reject application" : "Suspend organisation"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {dialog === "reject"
                ? `${name} will not appear publicly. The owner receives the reason and can contact support.`
                : `${name} will be hidden from customers and queue operations will be blocked immediately.`}
            </p>
            <div className="mt-4">
              <label htmlFor="org-reason" className="label">Reason (required)</label>
              <textarea
                id="org-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                maxLength={500}
                className="input resize-none text-sm"
                placeholder="Explain the decision for the audit record and owner notification."
              />
            </div>
            {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setDialog(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => submit(dialog, reason)}
                disabled={pending !== null}
                className={cn("flex-1", dialog === "reject" ? "btn-danger" : "btn-primary")}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
