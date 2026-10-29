import { all, one } from "./db";
import { predictionsForOrgs, type Prediction } from "./prediction";
import { todayKey } from "./utils";

export type Organisation = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  open_time: string;
  close_time: string;
  slot_minutes: number;
  status: string;
  emergency_enabled: number;
  services: string;
  priority_policy: string;
  cancellation_policy: string;
  created_at: string;
};

export type CentreListing = Organisation & {
  prediction: Prediction;
  distanceKm: number | null;
  isOpen: boolean;
  serviceList: string[];
};

export const CATEGORIES = [
  { value: "hospital", label: "Hospital" },
  { value: "diagnostic", label: "Diagnostic Centre" },
  { value: "bank", label: "Bank" },
  { value: "government", label: "Government Office" },
  { value: "clinic", label: "Clinic" },
  { value: "service", label: "Service Centre" },
] as const;

export function categoryLabel(value: string) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? "Service Centre";
}

export function isOpenNow(org: Pick<Organisation, "open_time" | "close_time">) {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = org.open_time.split(":").map(Number);
  const [ch, cm] = org.close_time.split(":").map(Number);
  return minutes >= oh * 60 + om && minutes < ch * 60 + cm;
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const r = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * r * Math.asin(Math.sqrt(x)) * 10) / 10;
}

export function listCentres(opts: {
  query?: string;
  category?: string;
  lat?: number;
  lng?: number;
  sort?: string;
}): CentreListing[] {
  let rows = all<Organisation>(
    "SELECT * FROM organizations WHERE status = 'approved' ORDER BY name ASC",
  );
  if (opts.category && opts.category !== "all") {
    rows = rows.filter((row) => row.category === opts.category);
  }
  if (opts.query) {
    const q = opts.query.trim().toLowerCase();
    if (q) {
      rows = rows.filter((row) =>
        [row.name, row.city, row.address, row.description, row.services, categoryLabel(row.category)]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
  }
  const predictions = predictionsForOrgs(rows.map((row) => row.id));
  const listings: CentreListing[] = rows.map((row) => {
    const services = row.services
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      ...row,
      prediction: predictions.get(row.id)!,
      distanceKm:
        typeof opts.lat === "number" && typeof opts.lng === "number"
          ? haversineKm(
              { lat: opts.lat, lng: opts.lng },
              { lat: row.lat, lng: row.lng },
            )
          : null,
      isOpen: isOpenNow(row),
      serviceList: services,
    };
  });
  const sort = opts.sort || "wait";
  listings.sort((a, b) => {
    if (sort === "distance") {
      const da = a.distanceKm ?? Number.MAX_SAFE_INTEGER;
      const db = b.distanceKm ?? Number.MAX_SAFE_INTEGER;
      return da - db;
    }
    if (sort === "name") return a.name.localeCompare(b.name);
    return a.prediction.minutes - b.prediction.minutes;
  });
  return listings;
}

export function getOrganisation(id: string): Organisation | undefined {
  return one<Organisation>("SELECT * FROM organizations WHERE id = ?", id);
}

export type SlotGroup = { date: string; label: string; times: string[] };

export function availableSlots(
  org: Organisation,
  days = 4,
  capacity = 3,
): SlotGroup[] {
  const [openH, openM] = org.open_time.split(":").map(Number);
  const [closeH, closeM] = org.close_time.split(":").map(Number);
  const booked = all<{ scheduled_for: string }>(
    `SELECT scheduled_for FROM tickets
     WHERE org_id = ? AND kind = 'appointment'
       AND status IN ('booked','waiting','serving')
       AND scheduled_for >= ? AND scheduled_for <= ?`,
    org.id,
    new Date().toISOString(),
    new Date(Date.now() + days * 86_400_000).toISOString(),
  );
  const counts = new Map<string, number>();
  for (const row of booked) {
    if (!row.scheduled_for) continue;
    const key = row.scheduled_for.slice(0, 16);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const result: SlotGroup[] = [];
  const now = new Date();
  for (let d = 0; d < days; d += 1) {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    if (date.getDay() === 0 && org.category !== "hospital") continue;
    const times: string[] = [];
    for (
      let minutes = openH * 60 + openM;
      minutes + org.slot_minutes <= closeH * 60 + closeM;
      minutes += org.slot_minutes
    ) {
      const slot = new Date(date);
      slot.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
      if (slot.getTime() < now.getTime() + 30 * 60_000) continue;
      const key = slot.toISOString().slice(0, 16);
      if ((counts.get(key) || 0) >= capacity) continue;
      times.push(slot.toISOString());
      if (times.length >= 8) break;
    }
    if (times.length > 0) {
      result.push({
        date: todayKey(date),
        label: date.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
        times,
      });
    }
  }
  return result;
}

export function formatSlot(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
