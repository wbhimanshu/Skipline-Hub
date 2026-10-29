import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Clock3,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  Landmark,
  FlaskConical,
  BriefcaseBusiness,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cookies } from "next/headers";
import { CATEGORIES, categoryLabel, listCentres } from "@/lib/centres";
import { LANG_COOKIE, normalizeLang, t } from "@/lib/i18n";
import { CentreMap } from "@/components/centre-map";
import { LocationButton } from "@/components/location-button";
import { Reveal } from "@/components/reveal";
import { ConfidenceBadge, EmptyState, InlineNotice } from "@/components/ui";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Find a service centre",
  description:
    "Compare live queues, estimated waiting times and bookable slots at hospitals, diagnostic centres, banks and government offices.",
};

const categoryIcons: Record<string, LucideIcon> = {
  hospital: Stethoscope,
  diagnostic: FlaskConical,
  bank: Landmark,
  government: Building2,
  clinic: Stethoscope,
  service: Wrench,
};

type Search = {
  q?: string;
  category?: string;
  sort?: string;
  lat?: string;
  lng?: string;
};

function hrefWith(current: Search, patch: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...patch })) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/centres?${query}` : "/centres";
}

export default async function CentresPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const query = await searchParams;
  const jar = await cookies();
  const lang = normalizeLang(jar.get(LANG_COOKIE)?.value);
  const lat = Number(query.lat);
  const lng = Number(query.lng);
  const centres = listCentres({
    query: query.q,
    category: query.category,
    sort: query.sort,
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
  });
  const openCount = centres.filter((centre) => centre.isOpen).length;
  const points = centres.map((centre) => ({
    id: centre.id,
    slug: centre.slug,
    name: centre.name,
    category: centre.category,
    address: centre.address,
    city: centre.city,
    lat: centre.lat,
    lng: centre.lng,
    wait: centre.prediction.minutes,
    isOpen: centre.isOpen,
  }));

  return (
    <div className="container-shell py-10 sm:py-14">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="eyebrow">
            <MapPin className="h-3.5 w-3.5" />
            Pune · {centres.length} approved centres
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {t(lang, "findCentre")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
            Compare honest waiting estimates before you leave. Join a live queue or reserve a slot,
            then track your turn from your phone.
          </p>
        </div>
        <LocationButton />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form action="/centres" method="get" className="glass-panel flex flex-col gap-2 p-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              name="q"
              defaultValue={query.q ?? ""}
              placeholder="Search hospital, bank, area or service…"
              className="input input-icon border-transparent bg-transparent focus:bg-transparent"
              aria-label="Search centres"
            />
          </div>
          {query.category ? <input type="hidden" name="category" value={query.category} /> : null}
          {query.lat ? <input type="hidden" name="lat" value={query.lat} /> : null}
          {query.lng ? <input type="hidden" name="lng" value={query.lng} /> : null}
          {query.sort ? <input type="hidden" name="sort" value={query.sort} /> : null}
          <button type="submit" className="btn-primary shrink-0">
            Search
          </button>
        </form>

        <form action="/centres" method="get" className="glass-panel flex items-center gap-2 p-2">
          {query.q ? <input type="hidden" name="q" value={query.q} /> : null}
          {query.category ? <input type="hidden" name="category" value={query.category} /> : null}
          {query.lat ? <input type="hidden" name="lat" value={query.lat} /> : null}
          {query.lng ? <input type="hidden" name="lng" value={query.lng} /> : null}
          <SlidersHorizontal className="ml-2 h-4 w-4 shrink-0 text-slate-500" />
          <select
            name="sort"
            defaultValue={query.sort ?? "wait"}
            className="input border-transparent bg-transparent text-xs focus:bg-transparent"
            aria-label="Sort centres"
          >
            <option value="wait">Shortest estimated wait</option>
            <option value="distance">Nearest first</option>
            <option value="name">Name A–Z</option>
          </select>
          <button type="submit" className="btn-secondary btn-sm shrink-0">
            Sort
          </button>
        </form>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <Link
          href={hrefWith(query, { category: undefined })}
          className={cn(
            "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
            !query.category || query.category === "all"
              ? "border-brand-400/40 bg-brand-500/15 text-brand-100"
              : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white",
          )}
        >
          All centres
        </Link>
        {CATEGORIES.map((category) => (
          <Link
            key={category.value}
            href={hrefWith(query, { category: category.value })}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
              query.category === category.value
                ? "border-brand-400/40 bg-brand-500/15 text-brand-100"
                : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white",
            )}
          >
            {category.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          {openCount} open now
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-brand-300" />
          Estimates from completed visits
        </span>
      </div>

      {points.length > 0 ? (
        <div className="mt-7">
          <CentreMap points={points} />
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 xl:grid-cols-2">
        {centres.map((centre, index) => {
          const Icon = categoryIcons[centre.category] ?? BriefcaseBusiness;
          return (
            <Reveal key={centre.id} delay={Math.min(index * 55, 220)}>
              <Link
                href={`/centres/${centre.slug}`}
                className="glass-panel glass-hover group flex h-full flex-col p-5 sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-brand-400/20 bg-brand-500/10 text-brand-200">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-base font-semibold text-white group-hover:text-brand-200">
                        {centre.name}
                      </h2>
                      <span
                        className={cn(
                          "badge",
                          centre.isOpen
                            ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                            : "border-white/10 bg-white/[0.04] text-slate-400",
                        )}
                      >
                        {centre.isOpen ? "Open now" : "Closed"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{categoryLabel(centre.category)}</p>
                    <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-slate-400">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                      {centre.address}, {centre.city}
                      {centre.distanceKm != null ? ` · ${centre.distanceKm} km away` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-2xl font-bold text-white">
                      {centre.prediction.minutes}
                      <span className="ml-1 text-xs font-medium text-slate-500">min</span>
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">estimated</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  {centre.serviceList.slice(0, 4).map((service) => (
                    <span key={service} className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-2 py-1 text-[10px] text-slate-400">
                      {service}
                    </span>
                  ))}
                  {centre.serviceList.length > 4 ? (
                    <span className="px-1 py-1 text-[10px] text-slate-600">+{centre.serviceList.length - 4}</span>
                  ) : null}
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    {centre.open_time}–{centre.close_time}
                    <ConfidenceBadge confidence={centre.prediction.confidence} />
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-300 group-hover:text-brand-200">
                    View & join
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>

      {centres.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Search}
            title="No centres match that search"
            description="Try a different area, service or category. New approved organisations appear here automatically."
            action={
              <Link href="/centres" className="btn-secondary">
                Clear filters
              </Link>
            }
          />
        </div>
      ) : null}

      <div className="mt-8">
        <InlineNotice tone="info" title="Estimates are guidance, not guarantees">
          Queue priority can change when staff approve urgent or accessibility needs. We show a range
          and confidence level so you can plan realistically.
        </InlineNotice>
      </div>
    </div>
  );
}
