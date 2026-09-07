// Deterministic fallback intelligence used whenever GEMINI_API_KEY is not
// configured (or a live Gemini call fails). Keeps every VoltScout feature
// fully functional out of the box, without a network dependency.

import type { OpportunityDTO, ResumeMatchResult, CoverLetterResult } from "./types";

const SKILL_DISPLAY: Record<string, string> = {
  verilog: "RTL Design (Verilog)",
  vhdl: "RTL Design (VHDL)",
  systemverilog: "SystemVerilog / UVM Verification",
  cadence: "Analog/Mixed-Signal IC Design (Cadence)",
  virtuoso: "Analog/Mixed-Signal IC Design (Cadence Virtuoso)",
  synopsys: "Digital Design Flows (Synopsys)",
  vivado: "FPGA Development (Xilinx Vivado)",
  fpga: "FPGA Prototyping",
  spice: "SPICE-Level Circuit Simulation",
  ltspice: "SPICE-Level Circuit Simulation (LTspice)",
  matlab: "MATLAB/Simulink Modeling",
  simulink: "MATLAB/Simulink Modeling",
  pscad: "Power Systems Simulation (PSCAD)",
  altium: "PCB Design (Altium Designer)",
  kicad: "PCB Design (KiCad)",
  freertos: "Embedded RTOS Firmware",
  rtos: "Real-Time Embedded Systems",
  embedded: "Embedded Systems Development",
  python: "Scripting & Automation (Python)",
  "c++": "Embedded C/C++ Development",
  firmware: "Firmware Engineering",
  rf: "RF Circuit Design",
  antenna: "RF / Antenna Engineering",
  control: "Control Systems Design",
  controls: "Control Systems Design",
  robotics: "Robotics & Motion Control",
  power: "Power Electronics",
  converter: "Power Converter Design",
  inverter: "Power Converter Design",
  battery: "Battery / Energy Storage Systems",
  photonics: "Photonics",
  quantum: "Quantum Hardware",
  sensor: "Sensor Systems Design",
  sensors: "Sensor Systems Design",
  biomedical: "Biomedical Electronics",
  signal: "Signal Processing",
  dsp: "Digital Signal Processing",
  layout: "IC Layout Design",
  tapeout: "Silicon Tapeout Experience",
  pcb: "PCB Design",
  analog: "Analog Circuit Design",
  digital: "Digital Logic Design",
  can: "Automotive Networking (CAN/LIN)",
  automotive: "Automotive Electronics",
  microcontroller: "Microcontroller Programming",
  soc: "SoC Architecture",
  asic: "ASIC Design",
};

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+.\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 3),
  );
}

function requirementText(o: OpportunityDTO): string {
  return [o.domain, o.techStack.join(" "), o.qualifications.join(" "), o.responsibilities.join(" "), o.title]
    .join(" ")
    .toLowerCase();
}

function overlapRatio(oppTokens: Set<string>, profileTokens: Set<string>): number {
  if (oppTokens.size === 0) return 0;
  let hits = 0;
  for (const t of oppTokens) if (profileTokens.has(t)) hits++;
  return hits / oppTokens.size;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function heuristicMatchResume(profileText: string, opportunities: OpportunityDTO[]): ResumeMatchResult {
  const profileTokens = tokenize(profileText);

  const scored = opportunities.map((o) => {
    const oppTokens = tokenize(requirementText(o));
    const ratio = overlapRatio(oppTokens, profileTokens);
    // Base score scaled so a modest overlap already reads as a plausible
    // match (25 floor) while strong overlap approaches a very strong 96.
    const score = clamp(Math.round(25 + ratio * 260), 5, 96);
    return { opportunity: o, score, oppTokens };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 5);

  const overallFitScore = clamp(
    Math.round(top.slice(0, 3).reduce((s, x) => s + x.score, 0) / Math.min(3, top.length || 1)),
    30,
    95,
  );

  // Strengths: recognized skill keywords present in both the profile and
  // frequently requested across the catalog.
  const skillFrequencyAcrossCatalog = new Map<string, number>();
  for (const o of opportunities) {
    const tokens = tokenize(requirementText(o));
    for (const t of tokens) {
      if (SKILL_DISPLAY[t]) {
        skillFrequencyAcrossCatalog.set(t, (skillFrequencyAcrossCatalog.get(t) ?? 0) + 1);
      }
    }
  }

  const matchedSkills = [...skillFrequencyAcrossCatalog.keys()]
    .filter((t) => profileTokens.has(t))
    .sort((a, b) => (skillFrequencyAcrossCatalog.get(b) ?? 0) - (skillFrequencyAcrossCatalog.get(a) ?? 0));

  const strengthSet = new Set(matchedSkills.map((t) => SKILL_DISPLAY[t]));
  const strengths =
    strengthSet.size > 0
      ? [...strengthSet].slice(0, 5)
      : ["General EE fundamentals evident from coursework", "Willingness to learn new tools quickly"];

  const missingHighDemandSkills = [...skillFrequencyAcrossCatalog.entries()]
    .filter(([t]) => !profileTokens.has(t))
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => SKILL_DISPLAY[t])
    .filter((label) => !strengthSet.has(label));

  const growthAreas =
    missingHighDemandSkills.length > 0
      ? [...new Set(missingHighDemandSkills)].slice(0, 4)
      : ["Consider tackling a tapeout or publication-grade project to stand out at tier-1 labs"];

  const recommendations = top.map((t) => ({
    opportunityId: t.opportunity.id,
    score: t.score,
    rationale: buildRationale(t.opportunity, t.oppTokens, profileTokens),
  }));

  return { overallFitScore, strengths, growthAreas, recommendations, provider: "heuristic" };
}

function buildRationale(o: OpportunityDTO, oppTokens: Set<string>, profileTokens: Set<string>): string {
  const shared = [...oppTokens]
    .filter((t) => profileTokens.has(t) && SKILL_DISPLAY[t])
    .map((t) => SKILL_DISPLAY[t]);
  const unique = [...new Set(shared)];
  if (unique.length === 0) {
    return `Aligned with the ${o.domain} track at ${o.organization} based on overall profile fit.`;
  }
  return `Strong overlap in ${unique.slice(0, 2).join(" and ")} with ${o.organization}'s ${o.domain} team.`;
}

const TONE_OPENERS: Record<string, string> = {
  corporate_tech: "I am writing to express my strong interest in",
  academic_rigor: "I write to formally apply for",
  cutting_edge: "I'm excited to throw my hat in the ring for",
};

const TONE_CLOSERS: Record<string, string> = {
  corporate_tech: "I would welcome the opportunity to discuss how my background can contribute to your team's results.",
  academic_rigor: "I would be glad to further discuss the methodological alignment between my research background and this position.",
  cutting_edge: "I'd love to jump on a call and talk about the bold, high-impact work your team is pushing forward.",
};

const TONE_SIGNOFF: Record<string, string> = {
  corporate_tech: "Best regards,",
  academic_rigor: "Sincerely,",
  cutting_edge: "Looking forward to connecting,",
};

export function heuristicCoverLetter(
  opportunity: OpportunityDTO,
  tone: string,
  profileText: string,
): CoverLetterResult {
  const opener = TONE_OPENERS[tone] ?? TONE_OPENERS.corporate_tech;
  const closer = TONE_CLOSERS[tone] ?? TONE_CLOSERS.corporate_tech;
  const signoff = TONE_SIGNOFF[tone] ?? TONE_SIGNOFF.corporate_tech;

  const profileTokens = tokenize(profileText);
  const oppTokens = tokenize(requirementText(opportunity));
  const shared = [...new Set([...oppTokens].filter((t) => profileTokens.has(t) && SKILL_DISPLAY[t]))].map(
    (t) => SKILL_DISPLAY[t],
  );
  const highlightSkills = shared.length > 0 ? shared.slice(0, 3) : [opportunity.techStack[0] ?? "core EE fundamentals"];

  const firstQualification = opportunity.qualifications[0] ?? "the qualifications outlined in the posting";
  const firstResponsibility = opportunity.responsibilities[0]?.toLowerCase() ?? "the core responsibilities of the role";

  const letter = [
    `Dear ${opportunity.organization} Hiring Team,`,
    `${opener} the ${opportunity.title} position within your ${opportunity.domain} group. Having built hands-on experience with ${highlightSkills.join(
      ", ",
    )}, I am confident I can contribute meaningfully from day one.`,
    `My profile aligns closely with what you're looking for — specifically "${firstQualification}" — and I am particularly drawn to the chance to work on ${firstResponsibility}.${opportunity.techStack.length ? ` I have hands-on exposure to ${opportunity.techStack.slice(0, 3).join(", ")}, which I understand are central to this team's workflow.` : ""}`,
    `${closer}`,
    `${signoff}\nA VoltScout Candidate`,
  ].join("\n\n");

  const talkingPoints = [
    `Walk through a project using ${highlightSkills[0]}`,
    `Explain how your background maps to: "${firstQualification}"`,
    `Ask about the team's approach to ${opportunity.responsibilities[1] ?? opportunity.responsibilities[0] ?? "day-to-day technical work"}`,
    `Highlight familiarity with ${opportunity.techStack.slice(0, 2).join(" and ") || "the team's core tooling"}`,
    `Discuss why ${opportunity.organization}'s ${opportunity.domain} work specifically excites you`,
  ];

  return {
    subject: `Application for ${opportunity.title} — ${opportunity.organization}`,
    letter,
    talkingPoints,
    provider: "heuristic",
  };
}
