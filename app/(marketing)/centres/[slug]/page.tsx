import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Accessibility,
  ArrowLeft,
  CalendarClock,
  Clock3,
  HeartPulse,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { one } from "@/lib/db";
import {
  availableSlots,
  categoryLabel,
  getOrganisation,
  isOpenNow,
  type Organisation,
} from "@/lib/centres";
import { predictionForOrg } from "@/lib/prediction";
import { getCurrentUser, isRestricted } from "@/lib/auth";
import { getActiveTicketFor } from "@/lib/queue";
import { DirectionsMap } from "@/components/directions-map";
import { JoinPanel } from "@/components/join-panel";
import { ConfidenceBadge, InlineNotice, PriorityBadge } from "@/components/ui";
import { formatTime } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const org = await one<Organisation>(
    "SELECT * FROM organizations WHERE slug = ? AND status = 'approved'",
    slug,
  );
  if (!org) return { title: "Centre not found" };
  return {
    title: org.name,
    description: `${org.name} in ${org.city}. Compare the estimated wait, view services and join the queue online.`,
  };
}

export default async function CentrePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const slugRow = await one<{ id: string }>(
    "SELECT id FROM organizations WHERE slug = ? AND status = 'approved'",
    slug,
  );
  const org = await getOrganisation(slugRow?.id ?? "");
  if (!org) notFound();

  const user = await getCurrentUser();
  const isCustomer = user?.role === "user";
  const activeTicket = isCustomer ? await getActiveTicketFor(org.id, user.id) : null;
  const prediction = await predictionForOrg(org.id);
  const open = isOpenNow(org);
  const slots = await availableSlots(org, 4);
  const services = org.services.split(",").map((item) => item.trim()).filter(Boolean);
  const emergencyAvailable = Boolean(org.emergency_enabled);
  const isOrgAccount = user?.role === "org";

  return (
    <div className="container-shell py-8 sm:py-12">
      <Link
        href="/centres"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All centres
      </Link>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <div className="space-y-6">
          <div className="glass-panel relative overflow-hidden p-6 sm:p-8">
            <div className="glow-line" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-brand">{categoryLabel(org.category)}</span>
              <span
                className={
                  open
                    ? "badge border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                    : "badge border-white/10 bg-white/[0.04] text-slate-400"
                }
              >
                {open ? "Open now" : "Closed"}
              </span>
              {emergencyAvailable ? (
                <span className="badge border-rose-400/25 bg-rose-500/10 text-rose-200">
                  <HeartPulse className="h-3 w-3" />
                  Emergency triage supported
                </span>
              ) : null}
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {org.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">{org.description}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Estimated wait</p>
                <p className="mt-1 font-display text-xl font-bold text-white">
                  {prediction.minMinutes}–{prediction.maxMinutes} min
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">In queue</p>
                <p className="mt-1 font-display text-xl font-bold text-white">
                  {prediction.waiting}
                  <span className="ml-1 text-xs font-medium text-slate-500">waiting</span>
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Counters active</p>
                <p className="mt-1 font-display text-xl font-bold text-white">
                  {prediction.activeCounters}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <ConfidenceBadge confidence={prediction.confidence} />
              <span className="text-[11px] text-slate-500">{prediction.message}</span>
            </div>

            <div className="mt-6 grid gap-3 border-t border-white/[0.06] pt-5 text-xs text-slate-400 sm:grid-cols-2">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <span>
                  {org.address}
                  <br />
                  {org.city}, {org.state} {org.pincode}
                </span>
              </p>
              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-slate-500" />
                  {formatTime(`2000-01-01T${org.open_time}:00`)} – {formatTime(`2000-01-01T${org.close_time}:00`)}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <a href={`tel:${org.phone}`} className="hover:text-white">
                    {org.phone}
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-brand-300" />
                Services
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {services.map((service) => (
                  <span key={service} className="rounded-lg border border-white/[0.08] bg-white/[0.035] px-2.5 py-1.5 text-xs text-slate-300">
                    {service}
                  </span>
                ))}
              </div>
            </div>
            <div className="card">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck className="h-4 w-4 text-cyan-300" />
                Fair queue policy
              </h2>
              <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-slate-400">
                {org.priority_policy}
              </p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-sm font-semibold text-white">Cancellation policy</h2>
            <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-slate-400">
              {org.cancellation_policy}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <PriorityBadge priority="senior" />
              <PriorityBadge priority="disability" />
              {emergencyAvailable ? <PriorityBadge priority="emergency" /> : null}
            </div>
          </div>

          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <MapPin className="h-4 w-4 text-slate-400" />
              Location
            </h2>
            <DirectionsMap
              name={org.name}
              address={org.address}
              city={org.city}
              lat={org.lat}
              lng={org.lng}
              height="360px"
            />
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="glass-panel p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold text-white">Plan your visit</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Join the live queue or reserve a time. You can leave and return when your turn is near.
            </p>
            <div className="mt-5">
              {isOrgAccount ? (
                <InlineNotice tone="info" title="You are signed in as an organisation">
                  Organisation accounts manage queues from the operations dashboard. Sign in with a
                  customer account to join a queue.
                </InlineNotice>
              ) : (
                <JoinPanel
                  orgId={org.id}
                  slug={org.slug}
                  orgName={org.name}
                  city={org.city}
                  emergencyEnabled={emergencyAvailable}
                  slots={slots}
                  isLoggedIn={Boolean(isCustomer)}
                  isRestricted={Boolean(user && isRestricted(user))}
                  activeTicketId={activeTicket?.id ?? null}
                  estimateMinutes={prediction.minutes}
                />
              )}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-200">
                <Accessibility className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-semibold text-white">Accessibility support</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  Ask staff for mobility, language or hearing assistance. Priority is verified by people,
                  not purchased.
                </p>
              </div>
            </div>
          </div>

          {emergencyAvailable ? (
            <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/[0.05] p-4">
              <p className="flex items-center gap-2 text-xs font-semibold text-rose-100">
                <HeartPulse className="h-4 w-4" />
                Medical emergency?
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-rose-200/70">
                Do not wait for a queue token. For life-threatening symptoms, call{" "}
                <a href="tel:108" className="font-bold text-rose-100 underline">
                  108
                </a>{" "}
                or go to the nearest emergency department immediately.
              </p>
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-600">
            <Users className="h-3.5 w-3.5" />
            {prediction.sampleSize} completed visits used for this estimate
          </div>
        </aside>
      </div>
    </div>
  );
}
