// Shared vocabulary for VoltScout — kept in one place so seed data, the
// scouting agent, filters, and analytics never drift out of sync.

export const EE_DOMAINS = [
  "VLSI & Chip Design",
  "Power Systems & Energy",
  "Robotics & Controls",
  "Embedded Systems & IoT",
  "RF & 5G/6G Telecom",
  "Photonics & Quantum Hardware",
  "Biomedical & Sensors",
  "Automotive & Hardware",
] as const;

export type EeDomain = (typeof EE_DOMAINS)[number];

export const ORG_TYPES = [
  { value: "industry", label: "Industry" },
  { value: "corporate", label: "Corporate" },
  { value: "research_institute", label: "Research Institute" },
  { value: "university", label: "University" },
] as const;

export const REGIONS = [
  { value: "north_america", label: "North America" },
  { value: "europe", label: "Europe" },
  { value: "asia_pacific", label: "Asia-Pacific" },
  { value: "global_remote", label: "Global / Remote" },
] as const;

export const EDUCATION_LEVELS = [
  { value: "undergraduate", label: "Undergraduate" },
  { value: "masters", label: "Master's" },
  { value: "phd", label: "PhD" },
] as const;

export const SEASONS = [
  { value: "summer_2026", label: "Summer 2026" },
  { value: "fall_2026", label: "Fall 2026" },
  { value: "spring_2027", label: "Spring 2027" },
  { value: "year_round", label: "Year-Round" },
] as const;

export const USER_STATUSES = [
  { value: "discovered", label: "Discovered" },
  { value: "saved", label: "Saved & Wishlist" },
  { value: "applied", label: "Applied / Submitted" },
  { value: "interview", label: "Technical Interview" },
  { value: "offer", label: "Offer Received" },
  { value: "archived", label: "Archived" },
] as const;

// The 4 Kanban stages the pipeline board renders (archived/discovered are
// not pipeline stages — "discovered" opportunities live in the catalog
// until a candidate explicitly saves them).
export const KANBAN_STAGES = [
  { value: "saved", label: "Saved & Wishlist" },
  { value: "applied", label: "Applied / Submitted" },
  { value: "interview", label: "Technical Interview" },
  { value: "offer", label: "Offer Received" },
] as const;

export const QUICK_FILTERS = [
  "Electrical Engineering Internship",
  "Power Electronics Internship",
  "Power Systems Internship",
  "Embedded Systems Internship",
  "VLSI Internship",
  "Hardware Engineering Intern",
  "Electrical Research Intern",
  "Digital or Analog Intern",
] as const;

export const EDA_TOOLS = [
  "Cadence Virtuoso",
  "Altium Designer",
  "Synopsys",
  "PSCAD",
  "LTspice",
  "MATLAB/Simulink",
  "FreeRTOS",
  "KiCad",
  "Xilinx Vivado",
  "PSpice",
] as const;

export const COVER_LETTER_TONES = [
  { value: "corporate_tech", label: "Corporate Tech" },
  { value: "academic_rigor", label: "Academic Rigor" },
  { value: "cutting_edge", label: "Cutting-Edge" },
] as const;
