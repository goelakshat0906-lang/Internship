"use client";

import { useState } from "react";
import { ResumeMatcher } from "./resume-matcher";
import { CoverLetterStudio } from "./cover-letter-studio";
import { Sparkles, ScanSearch, PenLine } from "lucide-react";
import clsx from "clsx";

const TABS = [
  { id: "match", label: "Resume Fit Matcher", icon: ScanSearch },
  { id: "letter", label: "Cover Letter & Outreach", icon: PenLine },
] as const;

export function StudioView() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("match");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink-50">
          <Sparkles className="text-volt-400" /> AI Candidate Fit & Pitch Studio
        </h1>
        <p className="mt-1 text-sm text-ink-300">
          Score your fit against tier-1 EE labs and draft technical, tailored outreach in seconds.
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                tab === t.id
                  ? "border-volt-400/50 bg-volt-400/10 text-volt-300"
                  : "border-ink-600 bg-ink-800 text-ink-300 hover:bg-ink-700",
              )}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "match" ? <ResumeMatcher /> : <CoverLetterStudio />}
    </div>
  );
}
