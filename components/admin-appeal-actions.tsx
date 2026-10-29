"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, X, XCircle } from "lucide-react";
import { useToast } from "@/components/providers";

export function AdminAppealActions({
  id,
  name,
  restrictionReason,
}: {
  id: string;
  name: string;
  restrictionReason: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [dialog, setDialog] = useState<"accepted" | "rejected" | null>(null);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!dialog) return;
    if (note.trim().length < 3) {
      setError("Add a short decision note.");
      return;
    }
    setPending(true);
    setError(null);
    const response = await fetch(`/api/admin/appeals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: dialog, note }),
    });
    const data = await response.json();
    setPending(false);
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not review appeal.");
      return;
    }
    setDialog(null);
    setNote("");
    push("success", `Appeal ${dialog}.`, "Appeal reviewed");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => {
            setDialog("accepted");
            setNote("");
            setError(null);
          }}
          className="btn btn-sm border border-emerald-400/25 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Accept
        </button>
        <button
          type="button"
          onClick={() => {
            setDialog("rejected");
            setNote("");
            setError(null);
          }}
          className="btn btn-sm border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white"
        >
          <XCircle className="h-3.5 w-3.5" />
          Reject
        </button>
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
            <span
              className={
                dialog === "accepted"
                  ? "grid h-10 w-10 place-items-center rounded-xl border border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                  : "grid h-10 w-10 place-items-center rounded-xl border border-rose-400/25 bg-rose-500/10 text-rose-200"
              }
            >
              {dialog === "accepted" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            </span>
            <h2 className="mt-4 font-display text-lg font-semibold text-white">
              {dialog === "accepted" ? "Accept appeal" : "Reject appeal"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {dialog === "accepted"
                ? `This lifts the booking restriction for ${name} and reverses the active restriction.`
                : `The restriction remains in place for ${name}. Your note is shared with the customer.`}
            </p>
            <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[11px] text-slate-500">
              Restriction: {restrictionReason}
            </div>
            <div className="mt-4">
              <label htmlFor="appeal-note" className="label">Decision note</label>
              <textarea
                id="appeal-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                maxLength={500}
                className="input resize-none text-sm"
              />
            </div>
            {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setDialog(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={pending}
                className={dialog === "accepted" ? "btn-primary flex-1" : "btn-danger flex-1"}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : dialog === "accepted" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
