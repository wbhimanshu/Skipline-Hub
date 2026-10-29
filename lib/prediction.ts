import { all, getSetting, one } from "./db";
import { clamp, nowIso } from "./utils";

export type Prediction = {
  orgId: string;
  activeCounters: number;
  waiting: number;
  serving: number;
  avgServiceMinutes: number;
  sampleSize: number;
  minutes: number;
  minMinutes: number;
  maxMinutes: number;
  confidence: "high" | "medium" | "low";
  basis: "historical" | "default";
  message: string;
  updatedAt: string;
};

const DEFAULT_SERVICE_SECONDS = 6 * 60;

export function predictionForOrg(orgId: string): Prediction {
  const counters = one<{ c: number }>(
    "SELECT COUNT(*) AS c FROM counters WHERE org_id = ? AND is_active = 1",
    orgId,
  );
  const queue = one<{ waiting: number; serving: number }>(
    `SELECT
       SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) AS waiting,
       SUM(CASE WHEN status = 'serving' THEN 1 ELSE 0 END) AS serving
     FROM tickets WHERE org_id = ? AND queue_date = date('now','localtime')`,
    orgId,
  );
  const days = Number(getSetting("prediction_history_days", "45"));
  const minSamples = Number(getSetting("prediction_min_samples", "8"));
  const history = one<{ n: number; avg_seconds: number | null }>(
    `SELECT COUNT(*) AS n, AVG(service_seconds) AS avg_seconds
     FROM tickets
     WHERE org_id = ? AND status = 'completed' AND service_seconds IS NOT NULL
       AND completed_at >= ?`,
    orgId,
    new Date(Date.now() - days * 86_400_000).toISOString(),
  );

  const activeCounters = Math.max(0, Number(counters?.c ?? 0));
  const waiting = Math.max(0, Number(queue?.waiting ?? 0));
  const serving = Math.max(0, Number(queue?.serving ?? 0));
  const sampleSize = Number(history?.n ?? 0);
  const avgSeconds =
    sampleSize > 0 && history?.avg_seconds
      ? Number(history.avg_seconds)
      : DEFAULT_SERVICE_SECONDS;
  const avgServiceMinutes = Math.round((avgSeconds / 60) * 10) / 10;
  const throughput = Math.max(1, activeCounters);
  const ahead = waiting + serving;
  const central = (ahead * avgMinutes(avgSeconds)) / throughput;

  const minutes = Math.max(0, Math.round(central));
  const spread =
    sampleSize >= minSamples
      ? Math.max(3, Math.round(central * 0.28))
      : Math.max(6, Math.round(central * 0.5));
  const confidence: Prediction["confidence"] =
    sampleSize >= Math.max(25, minSamples * 3)
      ? "high"
      : sampleSize >= minSamples
        ? "medium"
        : "low";

  return {
    orgId,
    activeCounters,
    waiting,
    serving,
    avgServiceMinutes,
    sampleSize,
    minutes,
    minMinutes: Math.max(0, minutes - spread),
    maxMinutes: minutes + spread,
    confidence,
    basis: sampleSize > 0 ? "historical" : "default",
    message:
      activeCounters === 0
        ? "No service counters are currently active. Estimates may change once counters open."
        : sampleSize >= minSamples
          ? `Based on ${sampleSize} completed visits in the last ${days} days.`
          : "Limited history available — this is a wider, lower-confidence estimate.",
    updatedAt: nowIso(),
  };
}

function avgMinutes(seconds: number) {
  return clamp(seconds / 60, 2, 30);
}

export function predictionsForOrgs(orgIds: string[]) {
  const map = new Map<string, Prediction>();
  for (const id of orgIds) map.set(id, predictionForOrg(id));
  return map;
}

export function queueAheadForTicket(
  orgId: string,
  ticketId: string,
  priority: string,
  createdAt: string,
  status: string,
): number {
  if (status === "serving") return 0;
  const rank = priorityRank(priority);
  const serving = one<{ c: number }>(
    `SELECT COUNT(*) AS c FROM tickets
     WHERE org_id = ? AND queue_date = date('now','localtime') AND status = 'serving'`,
    orgId,
  );
  const waiting = all<{ priority: string; created_at: string; id: string }>(
    `SELECT id, priority, created_at FROM tickets
     WHERE org_id = ? AND queue_date = date('now','localtime')
       AND status = 'waiting' AND id != ?`,
    orgId,
    ticketId,
  );
  let ahead = Number(serving?.c ?? 0);
  for (const row of waiting) {
    const rowRank = priorityRank(row.priority);
    if (rowRank < rank) ahead += 1;
    else if (rowRank === rank && row.created_at < createdAt) ahead += 1;
  }
  return ahead;
}

export function priorityRank(priority: string) {
  switch (priority) {
    case "emergency":
      return 0;
    case "senior":
    case "disability":
      return 1;
    default:
      return 2;
  }
}

export function estimateForAhead(orgId: string, ahead: number) {
  const base = predictionForOrg(orgId);
  const counters = Math.max(1, base.activeCounters);
  const central = (ahead * base.avgServiceMinutes) / counters;
  const minutes = Math.max(0, Math.round(central));
  const spread = base.sampleSize >= 8 ? Math.max(3, Math.round(central * 0.28)) : Math.max(6, Math.round(central * 0.5));
  return {
    minutes,
    minMinutes: Math.max(0, minutes - spread),
    maxMinutes: minutes + spread,
    confidence: base.confidence,
    sampleSize: base.sampleSize,
    basis: base.basis,
  };
}
