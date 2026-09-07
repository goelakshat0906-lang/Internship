"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BarChart3 } from "lucide-react";

type Analytics = {
  total: number;
  domainBreakdown: { domain: string; count: number }[];
  orgTypeBreakdown: { orgType: string; label: string; count: number }[];
  regionBreakdown: { region: string; label: string; count: number }[];
  industryAcademiaRatio: { industryAndCorporate: number; academiaAndLabs: number };
  visaFriendliness: { sponsoring: number; notSponsoring: number };
};

const PALETTE = ["#facc15", "#38bdf8", "#a78bfa", "#34d399", "#fb923c", "#f472b6", "#22d3ee", "#f87171"];

const TOOLTIP_STYLE = {
  background: "#171c29",
  border: "1px solid #323b52",
  borderRadius: 8,
  fontSize: 12,
  color: "#d6dae3",
};

export function AnalyticsView() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-80 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const sectorPie = [
    { name: "Industry & Corporate", value: data.industryAcademiaRatio.industryAndCorporate },
    { name: "Academia & National Labs", value: data.industryAcademiaRatio.academiaAndLabs },
  ];

  const visaPie = [
    { name: "Visa Sponsorship Available", value: data.visaFriendliness.sponsoring },
    { name: "No Visa Sponsorship", value: data.visaFriendliness.notSponsoring },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink-50">
          <BarChart3 className="text-volt-400" /> Hiring Intelligence & Analytics
        </h1>
        <p className="mt-1 text-sm text-ink-300">Live signal across {data.total} catalog opportunities.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Hiring Share by EE Sub-Field">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.domainBreakdown} layout="vertical" margin={{ left: 24, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232a3b" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#aab1c2", fontSize: 11 }} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="domain"
                width={160}
                tick={{ fill: "#d6dae3", fontSize: 11 }}
                interval={0}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#232a3b55" }} />
              <Bar dataKey="count" fill="#facc15" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sector Ratio — Industry vs. Academia / National Labs">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={sectorPie} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={2}>
                {sectorPie.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i]} stroke="#0b0e14" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#d6dae3" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Geographic Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.regionBreakdown} margin={{ left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232a3b" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#aab1c2", fontSize: 11 }} />
              <YAxis tick={{ fill: "#aab1c2", fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#232a3b55" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.regionBreakdown.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="International Visa Friendliness Ratio">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={visaPie} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={2}>
                <Cell fill="#34d399" stroke="#0b0e14" strokeWidth={2} />
                <Cell fill="#f87171" stroke="#0b0e14" strokeWidth={2} />
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#d6dae3" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Sector Breakdown by Organization Type" className="mt-6">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.orgTypeBreakdown} margin={{ left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#232a3b" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#aab1c2", fontSize: 11 }} />
            <YAxis tick={{ fill: "#aab1c2", fontSize: 11 }} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#232a3b55" }} />
            <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`card p-4 ${className ?? ""}`}>
      <p className="label-xs mb-3">{title}</p>
      {children}
    </div>
  );
}
