"use client";

import { useEffect, useState } from "react";
import type { OpportunityDTO, CoverLetterResult } from "@/lib/types";
import { COVER_LETTER_TONES } from "@/lib/constants";
import { SAMPLE_PROFILES } from "@/lib/sample-profiles";
import { aiProviderLabel } from "@/lib/format";
import { PenLine, Loader2, Copy, Check } from "lucide-react";

export function CoverLetterStudio() {
  const [opportunities, setOpportunities] = useState<OpportunityDTO[]>([]);
  const [opportunityId, setOpportunityId] = useState("");
  const [tone, setTone] = useState<string>(COVER_LETTER_TONES[0].value);
  const [profileText, setProfileText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CoverLetterResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/opportunities")
      .then((r) => r.json())
      .then((d) => {
        setOpportunities(d.opportunities ?? []);
        if (d.opportunities?.[0]) setOpportunityId(d.opportunities[0].id);
      });
  }, []);

  async function generate() {
    if (!opportunityId) {
      setError("Select a target role first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId, tone, profileText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  function copy(label: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_3fr]">
      <div className="card space-y-4 p-4">
        <div>
          <p className="label-xs mb-1.5">Target Role</p>
          <select className="select" value={opportunityId} onChange={(e) => setOpportunityId(e.target.value)}>
            {opportunities.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title} — {o.organization}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="label-xs mb-1.5">Tone</p>
          <div className="flex flex-wrap gap-2">
            {COVER_LETTER_TONES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTone(t.value)}
                className={tone === t.value ? "chip-active" : "chip"}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="label-xs mb-1.5">Candidate Profile (optional but recommended)</p>
          <textarea
            className="input min-h-[140px] resize-y"
            placeholder="Paste coursework, projects, tools..."
            value={profileText}
            onChange={(e) => setProfileText(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {SAMPLE_PROFILES.map((p) => (
              <button key={p.name} className="chip hover:border-volt-400/50" onClick={() => setProfileText(p.text)}>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <button onClick={generate} disabled={loading} className="btn-primary">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <PenLine size={15} />}
          {loading ? "Drafting…" : "Generate Cover Letter"}
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      <div className="card p-4">
        {!result ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center text-ink-400">
            <PenLine size={28} />
            <p className="text-sm">Generate a letter to see the subject line, draft, and talking points here.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <FieldBlock
              label="Email Subject"
              value={result.subject}
              copied={copied === "subject"}
              onCopy={() => copy("subject", result.subject)}
            />
            <FieldBlock
              label="Cover Letter"
              value={result.letter}
              multiline
              copied={copied === "letter"}
              onCopy={() => copy("letter", result.letter)}
            />
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="label-xs">Key Interview Talking Points</p>
                <button
                  className="btn-ghost !px-2 !py-1 text-xs"
                  onClick={() => copy("points", result.talkingPoints.map((p) => `• ${p}`).join("\n"))}
                >
                  {copied === "points" ? <Check size={12} /> : <Copy size={12} />} Copy
                </button>
              </div>
              <ul className="list-disc space-y-1 pl-4 text-sm text-ink-200">
                {result.talkingPoints.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-ink-500">
              Generated via {aiProviderLabel(result.provider)}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FieldBlock({
  label,
  value,
  multiline,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="label-xs">{label}</p>
        <button className="btn-ghost !px-2 !py-1 text-xs" onClick={onCopy}>
          {copied ? <Check size={12} /> : <Copy size={12} />} Copy
        </button>
      </div>
      <div className={`rounded-lg border border-ink-700 bg-ink-800/60 p-3 text-sm text-ink-100 ${multiline ? "whitespace-pre-line" : ""}`}>
        {value}
      </div>
    </div>
  );
}
