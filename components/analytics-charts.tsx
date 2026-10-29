"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { OrgAnalytics } from "@/lib/analytics";

const grid = "rgba(255,255,255,0.06)";
const axis = "#64748b";

function tooltipStyle() {
  return {
    contentStyle: {
      background: "#0b1024",
      border: "1px solid rgba(255,255,255,.12)",
      borderRadius: 12,
      color: "#e2e8f0",
      fontSize: 11,
    },
    labelStyle: { color: "#94a3b8", marginBottom: 4 },
    itemStyle: { color: "#e2e8f0" },
  };
}

export function VisitorsChart({ data }: { data: OrgAnalytics["daily"] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -20, right: 6, top: 8 }}>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis dataKey="label" stroke={axis} fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke={axis} fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip {...tooltipStyle()} />
          <Bar dataKey="visitors" name="Visitors" fill="#8b6cfb" radius={[5, 5, 0, 0]} maxBarSize={22} />
          <Bar dataKey="completed" name="Completed" fill="#22d3ee" radius={[5, 5, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WaitTrendChart({ data }: { data: OrgAnalytics["waitTrend"] }) {
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -20, right: 6, top: 8 }}>
          <defs>
            <linearGradient id="wait-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b6cfb" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#8b6cfb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis dataKey="label" stroke={axis} fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke={axis} fontSize={10} tickLine={false} axisLine={false} unit="m" />
          <Tooltip {...tooltipStyle()} />
          <Area type="monotone" dataKey="avgWait" name="Avg wait (min)" stroke="#a78bfa" strokeWidth={2} fill="url(#wait-fill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HourlyChart({ data }: { data: OrgAnalytics["hourly"] }) {
  const filtered = data.filter((item) => item.visitors > 0 || Number(item.hour.replace(/\D/g, "")) >= 8);
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={filtered} margin={{ left: -20, right: 6, top: 8 }}>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis dataKey="hour" stroke={axis} fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke={axis} fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip {...tooltipStyle()} />
          <Line type="monotone" dataKey="visitors" name="Visitors" stroke="#22d3ee" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ForecastChart({ data }: { data: NonNullable<OrgAnalytics["forecast"]> }) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -20, right: 6, top: 8 }}>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis dataKey="label" stroke={axis} fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke={axis} fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip {...tooltipStyle()} />
          <Bar dataKey="visitors" name="Predicted visitors" fill="#34d399" radius={[5, 5, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AdminSignupChart({ data }: { data: Array<{ label: string; users: number; organisations: number }> }) {
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: -20, right: 6, top: 8 }}>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis dataKey="label" stroke={axis} fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke={axis} fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip {...tooltipStyle()} />
          <Line type="monotone" dataKey="users" name="Customers" stroke="#8b6cfb" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="organisations" name="Organisations" stroke="#22d3ee" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
