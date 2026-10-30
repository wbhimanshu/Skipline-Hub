import Image from "next/image";
import Link from "next/link";
import { ArrowUp } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="relative mt-10 overflow-hidden border-t border-brand-500/10 bg-ink-800/40">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/50 to-transparent" />
      <div className="container-shell grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="group inline-flex" aria-label="Skipline Hub home">
            <Image
              src="/logo-lockup-dark.png"
              alt="Skipline Hub"
              width={879}
              height={483}
              className="h-16 w-auto transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
            Smarter queues, fairer service. Find, join, track and complete visits
            without losing your day to a waiting room.
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/[0.06] px-3 py-1 text-[11px] font-medium text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Privacy-first · No emergency care gated by payment
          </p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Product</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
            <li><Link className="transition hover:text-white" href="/centres">Find centres</Link></li>
            <li><Link className="transition hover:text-white" href="/#features">Features</Link></li>
            <li><Link className="transition hover:text-white" href="/#how-it-works">How it works</Link></li>
            <li><Link className="transition hover:text-white" href="/dashboard">Customer dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Partners</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
            <li><Link className="transition hover:text-white" href="/login/organization">Organisation sign in</Link></li>
            <li><Link className="transition hover:text-white" href="/register/organization">List your centre</Link></li>
            <li><Link className="transition hover:text-white" href="/login/admin">Administration</Link></li>
            <li><Link className="transition hover:text-white" href="/#fairness">Fairness policy</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Trust</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
            <li><span className="text-slate-400">Emergency:</span> always call local services</li>
            <li>Estimates are indicative, not guarantees</li>
            <li>Role-based access on every action</li>
            <li>Audit logs for sensitive operations</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/[0.05]">
        <div className="container-shell flex flex-col items-center justify-between gap-3 py-5 text-xs text-slate-600 sm:flex-row">
          <p>© {new Date().getFullYear()} Skipline Hub. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <p className="hidden sm:block">Less waiting. More living.</p>
            <a
              href="#main-content"
              className="group inline-flex items-center gap-1.5 font-medium text-slate-500 transition-colors duration-300 hover:text-brand-700"
            >
              Back to top
              <ArrowUp className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
