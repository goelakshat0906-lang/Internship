"use client";

import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

export function FitGauge({ score }: { score: number }) {
  const color = score >= 75 ? "#34d399" : score >= 50 ? "#facc15" : "#f87171";
  const data = [{ name: "fit", value: score, fill: color }];

  return (
    <div className="relative flex h-40 w-40 items-center justify-center">
      <RadialBarChart
        width={160}
        height={160}
        cx="50%"
        cy="50%"
        innerRadius="70%"
        outerRadius="100%"
        barSize={12}
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar background={{ fill: "#171c29" }} dataKey="value" cornerRadius={8} angleAxisId={0} />
      </RadialBarChart>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-ink-50">{score}</span>
        <span className="text-[10px] uppercase tracking-wide text-ink-400">Fit Score</span>
      </div>
    </div>
  );
}
