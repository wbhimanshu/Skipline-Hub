import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight, Building2, ShieldCheck, Users } from "lucide-react";
import { LANG_COOKIE, normalizeLang, t } from "@/lib/i18n";
import {
  AdminLoginScene,
  OrgLoginScene,
  UserLoginScene,
} from "@/components/illustrations";
import { Reveal } from "@/components/reveal";

export const metadata = { title: "Sign in" };

export default async function LoginRolePage() {
  const jar = await cookies();
  const lang = normalizeLang(jar.get(LANG_COOKIE)?.value);

  const roles = [
    {
      key: "user",
      href: "/login/user",
      title: t(lang, "userPortal"),
      description: t(lang, "userPortalDesc"),
      icon: Users,
      image: <UserLoginScene className="h-auto w-full" />,
      tone: "from-brand-500/20",
      points: ["See your live token and position", "Turn alerts and bookings", "Hindi and voice support"],
    },
    {
      key: "org",
      href: "/login/organization",
      title: t(lang, "orgPortal"),
      description: t(lang, "orgPortalDesc"),
      icon: Building2,
      image: <OrgLoginScene className="h-auto w-full" />,
      tone: "from-cyan-500/20",
      points: ["Call next and manage counters", "Approved emergency triage", "Operational analytics"],
    },
    {
      key: "admin",
      href: "/login/admin",
      title: t(lang, "adminPortal"),
      description: t(lang, "adminPortalDesc"),
      icon: ShieldCheck,
      image: <AdminLoginScene className="h-auto w-full" />,
      tone: "from-emerald-500/20",
      points: ["Approve organisations", "Review appeals and reports", "Full audit trail"],
    },
  ];

  return (
    <div className="container-shell py-14 sm:py-20">
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure role-based access
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {t(lang, "roleSelect")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
            {t(lang, "roleSelectSub")}
          </p>
        </div>
      </Reveal>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {roles.map((role, index) => {
          const Icon = role.icon;
          return (
            <Reveal key={role.key} delay={index * 80}>
              <div className="group glass-panel flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-glow">
                <div className="relative h-44 overflow-hidden border-b border-white/[0.06] sm:h-48">
                  <div className={`absolute inset-0 bg-gradient-to-br ${role.tone} to-transparent opacity-60`} />
                  <div className="absolute inset-0 transition duration-500 group-hover:scale-[1.04]">{role.image}</div>
                  <span className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-ink-950 text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="font-display text-lg font-semibold text-white">{role.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{role.description}</p>
                  <ul className="mt-4 flex-1 space-y-2">
                    {role.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-xs text-slate-500">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <Link href={role.href} className="btn-primary mt-6 w-full">
                    {t(lang, "continueAs")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>

      <div className="mt-10 flex flex-col items-center gap-2 text-center text-xs text-slate-500">
        <p>
          New customer?{" "}
          <Link href="/register" className="font-semibold text-brand-300 hover:text-brand-200">
            Create a free account
          </Link>
        </p>
        <p>
          Service provider?{" "}
          <Link href="/register/organization" className="font-semibold text-brand-300 hover:text-brand-200">
            Apply to list your organisation
          </Link>
        </p>
      </div>
    </div>
  );
}
