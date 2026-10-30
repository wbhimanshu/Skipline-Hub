import { all, one } from "./db";
import { todayKey } from "./utils";

function daySeries(days: number) {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(todayKey(d));
  }
  return out;
}

export type OrgAnalytics = {
  summary: {
    visitorsToday: number;
    waitingNow: number;
    servingNow: number;
    completedToday: number;
    cancelledToday: number;
    avgWaitMinutes: number | null;
    avgServiceMinutes: number | null;
    activeCounters: number;
    totalCounters: number;
    queueThisMonth: number;
    completionRate: number | null;
  };
  daily: Array<{ date: string; label: string; visitors: number; completed: number; cancelled: number }>;
  hourly: Array<{ hour: string; visitors: number; avgWait: number }>;
  busyHours: string[];
  forecast: Array<{ label: string; visitors: number }> | null;
  waitTrend: Array<{ date: string; label: string; avgWait: number }>;
};

export async function orgAnalytics(orgId: string): Promise<OrgAnalytics> {
  const today = todayKey();
  const counters = await one<{ total: number; active: number }>(
    `SELECT COUNT(*) AS total, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active
     FROM counters WHERE org_id = ?`,
    orgId,
  );
  const now = await one<{ waiting: number; serving: number }>(
    `SELECT
       SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) AS waiting,
       SUM(CASE WHEN status = 'serving' THEN 1 ELSE 0 END) AS serving
     FROM tickets WHERE org_id = ? AND queue_date = ?`,
    orgId,
    today,
  );
  const todayStats = await one<{
    visitors: number;
    completed: number;
    cancelled: number;
  }>(
    `SELECT
       COUNT(*) AS visitors,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
     FROM tickets WHERE org_id = ? AND queue_date = ?`,
    orgId,
    today,
  );
  const service = await one<{ avg_wait: number | null; avg_service: number | null; n: number }>(
    `SELECT
       AVG(CASE WHEN status = 'completed' AND completed_at IS NOT NULL
                AND checked_in_at IS NOT NULL
           THEN EXTRACT(EPOCH FROM (completed_at::timestamptz - checked_in_at::timestamptz)) / 60 END) AS avg_wait,
       AVG(CASE WHEN status = 'completed' THEN service_seconds END) AS avg_service,
       COUNT(*) AS n
     FROM tickets WHERE org_id = ? AND completed_at >= ?`,
    orgId,
    new Date(Date.now() - 30 * 86_400_000).toISOString(),
  );
  const monthly = await one<{ total: number; completed: number; cancelled: number }>(
    `SELECT COUNT(*) AS total,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
     FROM tickets WHERE org_id = ? AND created_at >= ?`,
    orgId,
    new Date(Date.now() - 30 * 86_400_000).toISOString(),
  );

  const days = daySeries(14);
  const dailyRows = await all<{ d: string; visitors: number; completed: number; cancelled: number }>(
    `SELECT queue_date AS d, COUNT(*) AS visitors,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
     FROM tickets WHERE org_id = ? AND queue_date >= ?
     GROUP BY queue_date`,
    orgId,
    days[0],
  );
  const dailyMap = new Map(dailyRows.map((row) => [row.d, row]));
  const daily = days.map((date) => {
    const row = dailyMap.get(date);
    return {
      date,
      label: new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
      visitors: Number(row?.visitors ?? 0),
      completed: Number(row?.completed ?? 0),
      cancelled: Number(row?.cancelled ?? 0),
    };
  });

  const hourlyRows = await all<{ h: number; visitors: number; avg_wait: number | null }>(
    `SELECT EXTRACT(HOUR FROM created_at::timestamptz)::int AS h, COUNT(*) AS visitors,
       AVG(CASE WHEN status = 'completed' AND completed_at IS NOT NULL AND checked_in_at IS NOT NULL
           THEN EXTRACT(EPOCH FROM (completed_at::timestamptz - checked_in_at::timestamptz)) / 60 END) AS avg_wait
     FROM tickets
     WHERE org_id = ? AND created_at >= ?
     GROUP BY h ORDER BY h`,
    orgId,
    new Date(Date.now() - 30 * 86_400_000).toISOString(),
  );
  const hourlyMap = new Map(hourlyRows.map((row) => [Number(row.h), row]));
  const hourly = Array.from({ length: 24 }, (_, hour) => {
    const row = hourlyMap.get(hour);
    const label = `${hour % 12 === 0 ? 12 : hour % 12}${hour < 12 ? "am" : "pm"}`;
    return {
      hour: label,
      visitors: Number(row?.visitors ?? 0),
      avgWait: row?.avg_wait ? Math.round(Number(row.avg_wait)) : 0,
    };
  });
  const busyHours = [...hourly]
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 3)
    .filter((h) => h.visitors > 0)
    .map((h) => h.hour);

  let forecast: OrgAnalytics["forecast"] = null;
  const activeDays = daily.filter((d) => d.visitors > 0).length;
  const totalHistoric = daily.reduce((acc, d) => acc + d.visitors, 0);
  if (activeDays >= 10 && totalHistoric >= 80) {
    const last4 = daily.slice(-4);
    const avg = last4.reduce((acc, d) => acc + d.visitors, 0) / Math.max(1, last4.length);
    forecast = Array.from({ length: 3 }, (_, index) => {
      const d = new Date();
      d.setDate(d.getDate() + index + 1);
      return {
        label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
        visitors: Math.round(avg),
      };
    });
  }

  const waitRows = await all<{ d: string; avg_wait: number }>(
    `SELECT queue_date AS d,
       AVG(CASE WHEN status = 'completed' AND completed_at IS NOT NULL AND checked_in_at IS NOT NULL
           THEN EXTRACT(EPOCH FROM (completed_at::timestamptz - checked_in_at::timestamptz)) / 60 END) AS avg_wait
     FROM tickets WHERE org_id = ? AND queue_date >= ?
     GROUP BY queue_date ORDER BY queue_date`,
    orgId,
    days[0],
  );
  const waitMap = new Map(waitRows.map((row) => [row.d, Number(row.avg_wait)]));
  const waitTrend = days.map((date) => ({
    date,
    label: new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }),
    avgWait: Math.round(waitMap.get(date) ?? 0),
  }));

  const total = Number(monthly?.total ?? 0);
  const completed = Number(monthly?.completed ?? 0);
  return {
    summary: {
      visitorsToday: Number(todayStats?.visitors ?? 0),
      waitingNow: Number(now?.waiting ?? 0),
      servingNow: Number(now?.serving ?? 0),
      completedToday: Number(todayStats?.completed ?? 0),
      cancelledToday: Number(todayStats?.cancelled ?? 0),
      avgWaitMinutes: service?.avg_wait != null ? Math.round(Number(service.avg_wait)) : null,
      avgServiceMinutes: service?.avg_service != null ? Math.round(Number(service.avg_service) / 60) : null,
      activeCounters: Number(counters?.active ?? 0),
      totalCounters: Number(counters?.total ?? 0),
      queueThisMonth: total,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : null,
    },
    daily,
    hourly,
    busyHours,
    forecast,
    waitTrend,
  };
}

export type AdminAnalytics = {
  users: number;
  customers: number;
  orgStaff: number;
  organisations: number;
  pendingOrganisations: number;
  approvedOrganisations: number;
  ticketsToday: number;
  completedToday: number;
  cancelledToday: number;
  waitingNow: number;
  avgWaitMinutes: number | null;
  openReports: number;
  activeRestrictions: number;
  signups: Array<{ label: string; users: number; organisations: number }>;
  topOrgs: Array<{ name: string; tickets: number; completed: number; avgWait: number | null }>;
};

export async function adminAnalytics(): Promise<AdminAnalytics> {
  const users = await one<{ total: number; customers: number; staff: number }>(
    `SELECT COUNT(*) AS total,
       SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) AS customers,
       SUM(CASE WHEN role = 'org' THEN 1 ELSE 0 END) AS staff
     FROM users WHERE role != 'admin'`,
  );
  const orgs = await one<{ total: number; pending: number; approved: number }>(
    `SELECT COUNT(*) AS total,
       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved
     FROM organizations`,
  );
  const today = todayKey();
  const tickets = await one<{ visitors: number; completed: number; cancelled: number }>(
    `SELECT COUNT(*) AS visitors,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
     FROM tickets WHERE queue_date = ?`,
    today,
  );
  const waiting = await one<{ c: number }>(
    "SELECT COUNT(*) AS c FROM tickets WHERE status = 'waiting'",
  );
  const wait = await one<{ avg_wait: number | null }>(
    `SELECT AVG(EXTRACT(EPOCH FROM (completed_at::timestamptz - checked_in_at::timestamptz)) / 60) AS avg_wait
     FROM tickets
     WHERE status = 'completed' AND completed_at IS NOT NULL AND checked_in_at IS NOT NULL
       AND completed_at >= ?`,
    new Date(Date.now() - 7 * 86_400_000).toISOString(),
  );
  const reports = await one<{ c: number }>(
    "SELECT COUNT(*) AS c FROM reports WHERE status != 'resolved'",
  );
  const restrictions = await one<{ c: number }>(
    "SELECT COUNT(*) AS c FROM restrictions WHERE status = 'active' AND ends_at > ?",
    new Date().toISOString(),
  );

  const days = daySeries(14);
  const signupUsers = await all<{ d: string; c: number }>(
    `SELECT created_at::date::text AS d, COUNT(*) AS c FROM users
     WHERE role = 'user' AND created_at >= ? GROUP BY d`,
    new Date(Date.now() - 14 * 86_400_000).toISOString(),
  );
  const signupOrgs = await all<{ d: string; c: number }>(
    `SELECT created_at::date::text AS d, COUNT(*) AS c FROM organizations
     WHERE created_at >= ? GROUP BY d`,
    new Date(Date.now() - 14 * 86_400_000).toISOString(),
  );
  const userMap = new Map(signupUsers.map((r) => [r.d, Number(r.c)]));
  const orgMap = new Map(signupOrgs.map((r) => [r.d, Number(r.c)]));
  const signups = days.map((date) => ({
    label: new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }),
    users: userMap.get(date) ?? 0,
    organisations: orgMap.get(date) ?? 0,
  }));

  const topRows = await all<{
    name: string;
    tickets: number;
    completed: number;
    avg_wait: number | null;
  }>(
    `SELECT o.name, COUNT(t.id) AS tickets,
       SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed,
       AVG(CASE WHEN t.status = 'completed' AND t.checked_in_at IS NOT NULL
           THEN EXTRACT(EPOCH FROM (t.completed_at::timestamptz - t.checked_in_at::timestamptz)) / 60 END) AS avg_wait
     FROM organizations o
     LEFT JOIN tickets t ON t.org_id = o.id AND t.created_at >= ?
     WHERE o.status = 'approved'
     GROUP BY o.id ORDER BY tickets DESC LIMIT 5`,
    new Date(Date.now() - 30 * 86_400_000).toISOString(),
  );

  return {
    users: Number(users?.total ?? 0),
    customers: Number(users?.customers ?? 0),
    orgStaff: Number(users?.staff ?? 0),
    organisations: Number(orgs?.total ?? 0),
    pendingOrganisations: Number(orgs?.pending ?? 0),
    approvedOrganisations: Number(orgs?.approved ?? 0),
    ticketsToday: Number(tickets?.visitors ?? 0),
    completedToday: Number(tickets?.completed ?? 0),
    cancelledToday: Number(tickets?.cancelled ?? 0),
    waitingNow: Number(waiting?.c ?? 0),
    avgWaitMinutes: wait?.avg_wait != null ? Math.round(Number(wait.avg_wait)) : null,
    openReports: Number(reports?.c ?? 0),
    activeRestrictions: Number(restrictions?.c ?? 0),
    signups,
    topOrgs: topRows.map((row) => ({
      name: row.name,
      tickets: Number(row.tickets ?? 0),
      completed: Number(row.completed ?? 0),
      avgWait: row.avg_wait != null ? Math.round(Number(row.avg_wait)) : null,
    })),
  };
}
