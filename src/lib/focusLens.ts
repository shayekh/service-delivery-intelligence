import type { AnalysisJson } from "@/types";

export const SECTION_TITLES: Record<string, string> = {
  "section-01": "01 Executive Summary",
  "section-02": "02 Service Overview",
  "section-03": "03 Delivery Status",
  "section-04": "04 Health Rating",
  "section-05": "05 Key Achievements",
  "section-06": "06 Delivery Summary",
  "section-07": "07 Service Metrics",
  "section-08": "08 Support & Incidents",
  "section-09": "09 Quality & Health",
  "section-10": "10 Risks & Dependencies",
  "section-11": "11 Customer Feedback",
  "section-12": "12 Value Delivered",
  "section-13": "13 Cross-Analysis Summary",
  "section-14": "14 Lessons Learned",
  "section-15": "15 Next Quarter Focus",
  "section-16": "16 ITSM Maturity Summary",
  "section-17": "17 Management Attention",
  "section-18": "18 Closing Note",
};

export interface FocusLensItem {
  id: string;
  lenses: string[];
  sectionId: string;
  title: string;
  excerpt: string;
}

export interface LensDefinition {
  key: string;
  label: string;
  count: number;
}

const LENS_LABEL: Record<string, string> = {
  blind_spot: "Blind Spots",
  disagree: "Disagreements",
  complement: "Complements",
  agree: "Agreed",
  risk: "Risks",
  high_urgency: "Urgent",
};

// Display order — lenses not in this list appear after in discovery order
const LENS_ORDER = ["blind_spot", "disagree", "complement", "agree", "risk", "high_urgency"];

export function getFocusLensItems(analysis: AnalysisJson): FocusLensItem[] {
  const items: FocusLensItem[] = [];

  // Cross-analysis items — tagged by relationship value
  (analysis.ai_generated.s10_cross_analysis ?? []).forEach((entry, i) => {
    items.push({
      id: `ca-${i}`,
      lenses: [entry.relationship.toLowerCase()],
      sectionId: "section-13",
      title: entry.topic,
      excerpt: entry.finding,
    });
  });

  // ITSM maturity items — also tagged by relationship value
  (analysis.ai_generated.s15_itsm_maturity ?? []).forEach((entry, i) => {
    items.push({
      id: `itsm-${i}`,
      lenses: [entry.relationship.toLowerCase()],
      sectionId: "section-16",
      title: entry.topic,
      excerpt: entry.finding,
    });
  });

  // Risk items — all s8_risks entries regardless of type/impact
  (analysis.section_synthesis.s8_risks ?? []).forEach((row, i) => {
    const desc = row.description.length > 70 ? row.description.slice(0, 70) + "…" : row.description;
    items.push({
      id: `risk-${i}`,
      lenses: ["risk"],
      sectionId: "section-10",
      title: `${row.type}: ${desc}`,
      excerpt: `Impact: ${row.impact} · ${row.mitigation}`,
    });
  });

  // Management attention — High urgency only (Medium/Low not surfaced as a lens)
  (analysis.ai_generated.s13_management_attention ?? []).forEach((item, i) => {
    if (item.urgency === "High") {
      items.push({
        id: `attn-${i}`,
        lenses: ["high_urgency"],
        sectionId: "section-17",
        title: item.item,
        excerpt: item.explanation,
      });
    }
  });

  return items;
}

export function getAvailableLenses(items: FocusLensItem[]): LensDefinition[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const lens of item.lenses) {
      counts.set(lens, (counts.get(lens) ?? 0) + 1);
    }
  }

  const result: LensDefinition[] = [];
  const seen = new Set<string>();

  for (const key of LENS_ORDER) {
    const count = counts.get(key);
    if (count) {
      result.push({ key, label: LENS_LABEL[key] ?? key, count });
      seen.add(key);
    }
  }

  // Any lens keys not in LENS_ORDER (future-proof for new relationship values)
  counts.forEach((count, key) => {
    if (!seen.has(key) && count > 0) {
      result.push({ key, label: LENS_LABEL[key] ?? key, count });
    }
  });

  return result;
}
