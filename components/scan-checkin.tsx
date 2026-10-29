"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Loader2,
  QrCode,
  ScanLine,
} from "lucide-react";
import { useToast } from "@/components/providers";
import { StatusBadge, PriorityBadge } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

type ScannedTicket = {
  id: string;
  token_no: string;
  status: string;
  priority: string;
  kind: string;
  user_name: string;
  scheduled_for: string | null;
  org_name: string;
};

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
};

export function ScanCheckin() {
  const { push } = useToast();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<ScannedTicket | null>(null);
  const [checkIn, setCheckIn] = useState(true);
  const [camera, setCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const busyRef = useRef(false);

  const supported =
    typeof window !== "undefined" &&
    "BarcodeDetector" in window &&
    typeof navigator.mediaDevices?.getUserMedia === "function";

  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function lookup(value: string) {
    if (!value.trim()) {
      setError("Enter or scan a token first.");
      return;
    }
    setPending(true);
    setError(null);
    setTicket(null);
    const response = await fetch("/api/org/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: value.trim(), checkIn }),
    });
    const data = await response.json();
    setPending(false);
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not verify this token.");
      return;
    }
    setTicket(data.ticket);
    push(
      "success",
      data.checkedIn
        ? "Token verified and checked into the live queue."
        : "Token verified.",
      "Valid Skipline token",
    );
    setCode("");
  }

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const Ctor = (window as unknown as {
        BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike;
      }).BarcodeDetector;
      detectorRef.current = Ctor ? new Ctor({ formats: ["qr_code"] }) : null;
      setCamera(true);

      timerRef.current = window.setInterval(async () => {
        if (!detectorRef.current || !videoRef.current || busyRef.current) return;
        try {
          const results = await detectorRef.current.detect(videoRef.current);
          const raw = results[0]?.rawValue;
          if (raw) {
            busyRef.current = true;
            stopCamera();
            await lookup(raw);
            busyRef.current = false;
          }
        } catch {
          // Keep scanning; transient decode failures are expected.
        }
      }, 700);
    } catch {
      setError("Camera access was denied. You can still enter the token manually.");
      stopCamera();
    }
  }

  function stopCamera() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamera(false);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="glass-panel p-5 sm:p-7">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-200">
            <QrCode className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-white">Verify a token</h2>
            <p className="text-[11px] text-slate-500">Scan the customer QR or type today&apos;s token number.</p>
          </div>
        </div>

        <div className="mt-5">
          {camera ? (
            <div className="relative overflow-hidden rounded-2xl border border-cyan-400/25 bg-brand-900">
              <video ref={videoRef} muted playsInline className="aspect-video w-full object-cover" />
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="h-40 w-40 rounded-2xl border-2 border-cyan-300/80 shadow-[0_0_0_9999px_rgba(6,10,24,0.55)]" />
              </div>
              <button type="button" onClick={stopCamera} className="btn-danger btn-sm absolute bottom-3 right-3">
                <CameraOff className="h-3.5 w-3.5" />
                Stop camera
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startCamera}
              disabled={!supported}
              className="btn-secondary w-full justify-center py-6"
            >
              <Camera className="h-5 w-5" />
              {supported ? "Open camera scanner" : "Camera scanning unavailable in this browser"}
            </button>
          )}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            lookup(code);
          }}
          className="mt-5 space-y-3"
        >
          <div>
            <label htmlFor="scan-code" className="label">Token number or QR payload</label>
            <input
              id="scan-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="input font-mono text-sm"
              placeholder="e.g. S-015"
              autoComplete="off"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={checkIn}
              onChange={(event) => setCheckIn(event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-ink-900 text-cyan-500 focus:ring-cyan-500"
            />
            Check appointment into the live queue on scan
          </label>
          {error ? <p className="text-xs text-rose-300">{error}</p> : null}
          <button type="submit" disabled={pending} className="btn-primary w-full justify-center">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
            Verify token
          </button>
        </form>
      </div>

      <div>
        {ticket ? (
          <div className="glass-panel border-emerald-400/25 p-5">
            <div className="flex items-center gap-2 text-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              <p className="text-xs font-semibold">Token verified</p>
            </div>
            <p className="mt-4 font-display text-4xl font-bold tracking-tight text-white">{ticket.token_no}</p>
            <p className="mt-1 text-xs text-slate-400">{ticket.user_name}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <span className="badge-slate capitalize">{ticket.kind}</span>
            </div>
            {ticket.scheduled_for ? (
              <p className="mt-3 text-[11px] text-slate-500">
                Appointment: {formatDateTime(ticket.scheduled_for)}
              </p>
            ) : null}
            <div className="mt-5 grid gap-2">
              <Link href="/org/queue" className="btn-secondary justify-center">
                Open live queue
              </Link>
              <Link href={`/org/appointments`} className="btn-ghost justify-center text-xs">
                View appointments
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
            <ScanLine className="mx-auto h-6 w-6 text-slate-600" />
            <p className="mt-3 text-sm font-semibold text-white">Awaiting a scan</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
              Verified tokens display customer, priority and appointment details here. QR codes are
              signed and expire after 24 hours.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
