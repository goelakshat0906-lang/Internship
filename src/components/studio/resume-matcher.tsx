"use client";

import { useState } from "react";
import { SAMPLE_PROFILES } from "@/lib/sample-profiles";
import { FitGauge } from "./fit-gauge";
import { Sparkles, Loader2, TrendingUp, TrendingDown, Target } from "lucide-react";
import type { OpportunityDTO } from "@/lib/types";
import { formatDeadline } from "@/lib/format";

type Recommendation = { opportunityId: string; score: number; rationale: string; opportunity: OpportunityDTO };
type MatchResponse = {
  overallFitScore: number;
  strengths: string[];
  growthAreas: string[];
  recommendations: Recommendation[];
  provider: "gemini" | "heuristic";
};

export function ResumeMatcher() {
  const [profileText, setProfileText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    if (!profileText.trim()) {
      setError("Paste a profile (coursework, projects, tools) first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Match failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Match failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
      <div className="card p-4">
        <p className="label-xs mb-2">Candidate Profile</p>
        <textarea
          className="input min-h-[220px] resize-y"
          placeholder="Paste your coursework, lab projects, and tools (e.g. Verilog, Cadence Virtuoso, MATLAB, FreeRTOS)..."
          value={profileText}
          onChange={(e) => setProfileText(e.target.value)}
        />

        <div className="mt-3">
          <p className="label-xs mb-1.5">Or try a sample profile</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PROFILES.map((p) => (
              <button key={p.name} className="chip hover:border-volt-400/50" onClick={() => setProfileText(p.text)}>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <button onClick={analyze} disabled={loading} className="btn-primary mt-4">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          {loading ? "Analyzing…" : "Analyze Fit"}
        </button>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </div>

      <div className="card p-4">
        {!result ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-12 text-center text-ink-400">
            <Target size={28} />
            <p className="text-sm">Run an analysis to see your fit score and top-matching openings.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <FitGauge score={result.overallFitScore} />
              <div>
                <p className="text-sm text-ink-300">
                  Overall fit for tier-1 EE labs & employers, computed via{" "}
                  <span className="text-ink-100">{result.provider === "gemini" ? "Gemini reasoning" : "VoltScout heuristic matcher"}</span>.
                </p>
              </div>
            </div>

            <div>
              <p className="mb-1.5 flex items-center gap-1.5 label-xs text-emerald-400">
                <TrendingUp size={13} /> Core Strengths
              </p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-ink-200">
                {result.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-1.5 flex items-center gap-1.5 label-xs text-amber-400">
                <TrendingDown size={13} /> Growth Areas for Tier-1 Labs
              </p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-ink-200">
                {result.growthAreas.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="card p-4 lg:col-span-2">
          <p className="label-xs mb-3">Top Matching Openings</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {result.recommendations.map((r) => (
              <div key={r.opportunityId} className="rounded-lg border border-ink-700 bg-ink-800/60 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink-50">{r.opportunity.title}</p>
                  <span className="chip-active !py-0.5">{r.score}%</span>
                </div>
                <p className="text-xs text-ink-300">
                  {r.opportunity.organization} · Due {formatDeadline(r.opportunity.deadline)}
                </p>
                <p className="mt-2 text-xs text-ink-400">{r.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
