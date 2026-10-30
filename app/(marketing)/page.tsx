import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Languages,
  MapPin,
  Navigation,
  QrCode,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { one } from "@/lib/db";
import { normalizeLang, t, LANG_COOKIE } from "@/lib/i18n";
import { CountUp } from "@/components/count-up";
import { Reveal } from "@/components/reveal";
import { TiltCard } from "@/components/tilt-card";
import { SectionHeading } from "@/components/ui";
import {
  AlertScene,
  AnalyticsScene,
  CrowdedWaitingRoomScene,
  EmergencyScene,
  FairQueueScene,
  HindiVoiceScene,
  MapCompareScene,
  PredictionScene,
  SmoothServiceScene,
  StepFindIllo,
  StepJoinIllo,
  StepServedIllo,
  StepTrackIllo,
  TicketScene,
} from "@/components/illustrations";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const jar = await cookies();
  const lang = normalizeLang(jar.get(LANG_COOKIE)?.value);

  const orgs = await one<{ c: number }>(
    "SELECT COUNT(*) AS c FROM organizations WHERE status = 'approved'",
  );
  const completed = await one<{ c: number }>(
    "SELECT COUNT(*) AS c FROM tickets WHERE status = 'completed'",
  );
  const avgWait = await one<{ v: number | null }>(
    `SELECT AVG(EXTRACT(EPOCH FROM (completed_at::timestamptz - checked_in_at::timestamptz)) / 60) AS v
     FROM tickets WHERE status = 'completed' AND completed_at IS NOT NULL
       AND checked_in_at IS NOT NULL AND completed_at >= ?`,
    new Date(Date.now() - 30 * 86_400_000).toISOString(),
  );
  const activeNow = await one<{ c: number }>(
    "SELECT COUNT(*) AS c FROM tickets WHERE status IN ('waiting','serving')",
  );

  const avgWaitValue = avgWait?.v ? Math.round(Number(avgWait.v)) : null;

  const features = [
    {
      icon: Clock3,
      title: "Smart waiting-time prediction",
      body: "A transparent estimate built from queue length, active counters and real historical service durations — shown as a range with a confidence level.",
      scene: <PredictionScene className="h-full w-full" />,
      span: "lg:col-span-7",
      badge: "Range + confidence",
    },
    {
      icon: Bell,
      title: "Turn alerts that reach you",
      body: "In-app and browser notifications when your turn approaches, with a fallback when notifications are not permitted.",
      scene: <AlertScene className="h-full w-full" />,
      span: "lg:col-span-5",
      badge: "In-app + browser",
    },
    {
      icon: MapPin,
      title: "Compare centres on the map",
      body: "See distance, service categories and estimated waits together. Location unavailable? The comparison list always works.",
      scene: <MapCompareScene className="h-full w-full" />,
      span: "lg:col-span-5",
      badge: "OpenStreetMap + list fallback",
    },
    {
      icon: QrCode,
      title: "One-tap virtual tickets",
      body: "Take a unique digital token or book an available slot. Show a signed QR at check-in and track status in real time.",
      scene: <TicketScene className="h-full w-full" />,
      span: "lg:col-span-7",
      badge: "Signed QR verification",
    },
    {
      icon: Languages,
      title: "Hindi & voice assistance",
      body: "Switch between English and Hindi. Search by voice in browsers that support it, with accessible text alternatives.",
      scene: <HindiVoiceScene className="h-full w-full" />,
      span: "lg:col-span-4",
      badge: "en / हिंदी",
    },
    {
      icon: BarChart3,
      title: "Real operational analytics",
      body: "Daily visitors, peak hours, completion rates and wait trends from actual records. Forecasts appear only when enough data exists.",
      scene: <AnalyticsScene className="h-full w-full" />,
      span: "lg:col-span-4",
      badge: "Recorded data only",
    },
    {
      icon: Scale,
      title: "Fair queue & priority",
      body: "Everyone sees queue order. Priority is staff-verified for senior citizens, accessibility needs and medical triage — never purchased.",
      scene: <FairQueueScene className="h-full w-full" />,
      span: "lg:col-span-4",
      badge: "Audited priority changes",
    },
  ];

  const steps = [
    { icon: Navigation, title: t(lang, "stepFind"), body: t(lang, "stepFindText"), scene: <StepFindIllo className="h-full w-full" /> },
    { icon: CalendarClock, title: t(lang, "stepJoin"), body: t(lang, "stepJoinText"), scene: <StepJoinIllo className="h-full w-full" /> },
    { icon: Bell, title: t(lang, "stepTrack"), body: t(lang, "stepTrackText"), scene: <StepTrackIllo className="h-full w-full" /> },
    { icon: CheckCircle2, title: t(lang, "stepServed"), body: t(lang, "stepServedText"), scene: <StepServedIllo className="h-full w-full" /> },
  ];

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid-faint grid-overlay opacity-40" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-500/10 via-transparent to-transparent" />
        <div className="orb left-1/4 top-[-8rem] h-96 w-96 bg-brand-300/50 blur-3xl" />
        <div className="orb right-1/4 top-1/3 h-80 w-80 bg-cyan-400/30 blur-3xl" />
        <div className="orb left-1/2 bottom-[-6rem] h-72 w-72 -translate-x-1/2 bg-brand-100/20 blur-3xl" />
        <div className="container-shell relative pb-20 pt-20 sm:pb-32 sm:pt-28">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <Reveal>
                <span className="eyebrow">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t(lang, "heroBadge")}
                </span>
              </Reveal>
              <Reveal delay={60}>
                <h1 className="mt-6 max-w-2xl font-display text-[2.9rem] font-bold leading-[1.0] tracking-[-0.04em] text-white sm:text-6xl xl:text-[4.6rem] drop-shadow-[0_2px_24px_rgba(99,102,241,0.35)]">
                  {t(lang, "heroTitle1")}{" "}
                  <span className="text-gradient-brand">{t(lang, "heroTitle2")}</span>
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
                  {t(lang, "heroSub")}
                </p>
              </Reveal>
              <Reveal delay={180}>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link href="/centres" className="btn-primary px-5 py-3 text-[15px]">
                    <MapPin className="h-4 w-4" />
                    {t(lang, "heroCta")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="#how-it-works" className="btn-secondary px-5 py-3 text-[15px]">
                    {t(lang, "heroSecondary")}
                  </Link>
                </div>
              </Reveal>
              <Reveal delay={240}>
                <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                    Email-verified accounts
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-cyan-300" />
                    Role-secured dashboards
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <HeartPulse className="h-3.5 w-3.5 text-rose-300" />
                    Emergency care never payment-gated
                  </span>
                </div>
                <p className="mt-4 max-w-lg text-[11px] leading-relaxed text-slate-600">
                  {t(lang, "trustNote")}
                </p>
              </Reveal>
            </div>

            <Reveal delay={160} className="relative">
              <div className="relative mx-auto max-w-[560px]">
                <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-tr from-brand-300/60 via-cyan-400/30 to-brand-100/40 blur-3xl" />
                <div className="relative animate-float-slow overflow-hidden rounded-[2rem] border border-brand-300/60 bg-ink-900 shadow-[0_30px_80px_-20px_rgba(99,102,241,0.45)]">
                  <Image
                    src="/queue-hero.jpeg"
                    alt="People waiting comfortably while their turns are managed on a phone"
                    width={1511}
                    height={1041}
                    priority
                    sizes="(max-width: 1024px) 100vw, 560px"
                    className="h-auto w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-900/10 via-transparent to-transparent" />
                </div>
                <div className="absolute -left-4 bottom-8 hidden rounded-2xl border border-white/10 bg-ink-900 px-4 py-3 shadow-panel sm:block">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Average wait shared</p>
                  <p className="mt-1 font-display text-xl font-bold text-white">
                    {avgWaitValue !== null ? `${avgWaitValue} min` : "—"}
                  </p>
                  <p className="text-[10px] text-slate-500">last 30 days · recorded visits</p>
                </div>
                <div className="absolute -right-3 top-10 hidden items-center gap-2.5 rounded-2xl border border-emerald-400/20 bg-ink-900 px-4 py-3 shadow-panel sm:flex">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white">{activeNow?.c ?? 0} in queues now</p>
                    <p className="text-[10px] text-slate-500">across partner centres</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={120}>
            <div className="mt-16 grid gap-3 rounded-3xl border border-white/10 bg-ink-900 p-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { value: `${orgs?.c ?? 0}`, label: "Partner service centres" },
                { value: `${completed?.c ?? 0}`, label: "Recorded service visits" },
                { value: avgWaitValue !== null ? `${avgWaitValue} min` : "—", label: "Average wait, last 30 days" },
                { value: "7", label: "Purpose-built queue features" },
              ].map((item, index) => (
                <div
                  key={item.label}
                    className="rounded-2xl border border-brand-500/10 bg-ink-850/70 px-5 py-4"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <p className="font-display text-2xl font-bold text-white">{item.value}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.1em] text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section relative border-t border-brand-500/10">
        <div className="container-shell grid items-center gap-12 lg:grid-cols-2">
          <Reveal className="order-2 lg:order-1">
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-rose-500/[0.07] blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-panel">
                <CrowdedWaitingRoomScene className="h-auto w-full" />
              </div>
            </div>
          </Reveal>
          <Reveal className="order-1 lg:order-2" delay={80}>
            <span className="eyebrow border-rose-400/25 bg-rose-500/10 text-rose-200">
              <AlertTriangle className="h-3.5 w-3.5" />
              The problem
            </span>
            <h2 className="section-heading mt-5">{t(lang, "problemTitle")}</h2>
            <p className="section-copy">{t(lang, "problemSub")}</p>
            <div className="mt-8 space-y-3">
              {[
                ["No visibility", "You cannot see how crowded a centre is before you travel."],
                ["No reliable estimate", "Waiting rooms give no signal about when your turn will come."],
                ["Wasted hours", "People miss work, school and family time simply waiting."],
              ].map(([title, body]) => (
                <div key={title} className="flex gap-3 rounded-2xl border border-brand-500/10 bg-white/[0.025] p-4">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-rose-500/10 text-rose-300">
                    <Clock3 className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section relative border-t border-brand-500/10">
        <div className="container-shell grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <span className="eyebrow border-emerald-400/25 bg-emerald-500/10 text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" />
              The solution
            </span>
            <h2 className="section-heading mt-5">{t(lang, "solutionTitle")}</h2>
            <p className="section-copy">{t(lang, "solutionSub")}</p>
            <ul className="mt-8 space-y-4">
              {[
                ["Compare before you travel", "See estimated waits, distance, categories and availability across centres."],
                ["Join from anywhere", "Take a virtual token or reserve a slot that actually exists in the centre's records."],
                ["Know when to return", "Live position, turn alerts and honest delay communication — no false guarantees."],
                ["Fair by design", "Transparent ordering, staff-verified priority and a reviewable cancellation policy."],
              ].map(([title, body]) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-400">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/centres" className="btn-outline-brand mt-8">
              Explore service centres
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
          <Reveal delay={80}>
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-emerald-500/[0.06] blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-panel">
                <SmoothServiceScene className="h-auto w-full" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="features" className="section relative border-t border-brand-500/10">
        <div className="container-shell">
          <Reveal>
            <SectionHeading
              eyebrow={t(lang, "features")}
              title={t(lang, "featuresTitle")}
              description={t(lang, "featuresSub")}
              center
            />
          </Reveal>
          <div className="mt-12 grid gap-4 lg:grid-cols-12">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Reveal key={feature.title} delay={index * 45} className={feature.span}>
                  <article className="glass-panel glass-hover group flex h-full flex-col overflow-hidden">
                    <div className="relative h-48 overflow-hidden border-b border-brand-500/10 sm:h-52">
                      <div className="absolute inset-0 scale-[1.02] transition duration-500 group-hover:scale-[1.06]">
                        {feature.scene}
                      </div>
                      <span className="absolute left-4 top-4 rounded-full border border-white/10 bg-ink-950 px-2.5 py-1 text-[10px] font-medium text-slate-300">
                        {feature.badge}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-lg border border-brand-400/20 bg-brand-500/10 text-brand-200">
                          <Icon className="h-4 w-4" />
                        </span>
                        <h3 className="font-display text-base font-semibold text-white">{feature.title}</h3>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-slate-400">{feature.body}</p>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section relative border-t border-brand-500/10">
        <div className="container-shell">
          <Reveal>
            <SectionHeading
              eyebrow={t(lang, "navHow")}
              title={t(lang, "howTitle")}
              description={t(lang, "howSub")}
              center
            />
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Reveal key={step.title} delay={index * 70}>
                  <div className="glass-panel glass-hover relative h-full overflow-hidden">
                    <div className="relative h-40 overflow-hidden border-b border-brand-500/10">
                      {step.scene}
                      <span className="absolute left-3 top-3 grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-ink-950 text-[11px] font-bold text-white">
                        0{index + 1}
                      </span>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-cyan-300" />
                        <h3 className="font-display text-base font-semibold text-white">{step.title}</h3>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.body}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section relative border-t border-brand-500/10">
        <div className="container-shell grid items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
          <Reveal>
            <span className="eyebrow border-rose-400/25 bg-rose-500/10 text-rose-200">
              <HeartPulse className="h-3.5 w-3.5" />
              Emergency priority, handled responsibly
            </span>
            <h2 className="section-heading mt-5">Urgency is assessed by people, never by payment.</h2>
            <p className="section-copy">
              At supported healthcare centres, patients can request emergency triage from
              an active token. Authorised medical staff review the request, and every
              decision is logged. Life-threatening situations are always directed to local
              emergency services immediately.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-rose-400/15 bg-rose-500/[0.04] p-4">
                <p className="text-sm font-semibold text-rose-100">Call 108 first</p>
                <p className="mt-1 text-xs leading-relaxed text-rose-200/70">
                  For life-threatening symptoms, do not wait for an app approval.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.04] p-4">
                <p className="text-sm font-semibold text-emerald-100">Never payment-gated</p>
                <p className="mt-1 text-xs leading-relaxed text-emerald-200/70">
                  Emergency triage cannot be bought, skipped or influenced by payment.
                </p>
              </div>
            </div>
            <Link href="/centres?category=hospital" className="btn-secondary mt-7">
              View supported hospitals
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
          <Reveal delay={80}>
            <div className="overflow-hidden rounded-3xl border border-rose-400/15 shadow-panel">
              <EmergencyScene className="h-auto w-full" />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section relative border-t border-brand-500/10">
        <div className="container-shell">
          <Reveal>
            <SectionHeading
              eyebrow="Three secure portals"
              title="One platform. The right view for everyone."
              description="Customers see their own journey. Organisations see their operations. Administrators see the health and fairness of the whole platform."
              center
            />
          </Reveal>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {[
              {
                icon: Users,
                title: t(lang, "userPortal"),
                body: t(lang, "userPortalDesc"),
                href: "/login/user",
                tone: "from-brand-500/15",
                image: <TicketScene className="h-auto w-full" />,
              },
              {
                icon: Building2,
                title: t(lang, "orgPortal"),
                body: t(lang, "orgPortalDesc"),
                href: "/login/organization",
                tone: "from-cyan-500/15",
                image: <AnalyticsScene className="h-auto w-full" />,
              },
              {
                icon: ShieldCheck,
                title: t(lang, "adminPortal"),
                body: t(lang, "adminPortalDesc"),
                href: "/login/admin",
                tone: "from-emerald-500/15",
                image: <FairQueueScene className="h-auto w-full" />,
              },
            ].map((role, index) => {
              const Icon = role.icon;
              return (
                <Reveal key={role.title} delay={index * 70}>
                  <Link
                    href={role.href}
                    className="group glass-panel glass-hover flex h-full flex-col overflow-hidden"
                  >
                    <div className="relative h-36 overflow-hidden border-b border-brand-500/10">
                      <div className={`absolute inset-0 bg-gradient-to-br ${role.tone} to-transparent`} />
                      <div className="absolute inset-0 opacity-80 transition group-hover:opacity-100">{role.image}</div>
                      <span className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-ink-950 text-white">
                        <Icon className="h-4 w-4" />
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="font-display text-lg font-semibold text-white">{role.title}</h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{role.body}</p>
                      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-200">
                        {t(lang, "continueAs")}
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container-shell">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] border border-brand-400/20 bg-gradient-to-br from-brand-500/[0.18] via-ink-900 to-cyan-500/[0.08] px-6 py-12 text-center shadow-panel sm:px-12">
              <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-brand-500/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
              <span className="eyebrow relative">Ready when you are</span>
              <h2 className="relative mx-auto mt-5 max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Reclaim your day from the waiting room.
              </h2>
              <p className="relative mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Create a free customer account, find a partner centre and manage your
                visit from your phone. Organisations can apply to join in minutes.
              </p>
              <div className="relative mt-7 flex flex-wrap justify-center gap-3">
                <Link href="/register" className="btn-primary px-5 py-3">
                  Create an account
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/register/organization" className="btn-secondary px-5 py-3">
                  List your organisation
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
