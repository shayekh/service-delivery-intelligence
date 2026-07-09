// Shared tag color definitions — single source of truth for inline badges and Focus Lens tabs.
// Both CrossAnalysisSummary, ItsmMaturitySection, and FocusLensBar import from here.

export interface TagColors {
  bg: string;
  text: string;
  border: string;
}

// Keyed by uppercase relationship value (matches analysis.json CrossAnalysisRelationship).
export const RELATIONSHIP_TAG: Record<string, TagColors & { label: string }> = {
  AGREE: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-l-green-500",
    label: "Agree",
  },
  DISAGREE: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-l-red-500",
    label: "Disagree",
  },
  COMPLEMENT: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-l-blue-500",
    label: "Complement",
  },
  BLIND_SPOT: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-l-amber-500",
    label: "Blind Spot",
  },
};

// Keyed by lowercase lens key (matches focusLens.ts LENS_ORDER).
// Relationship lenses reuse the same colors as their inline badge equivalents.
// NOTE: "risk" has no existing inline badge in the report — using neutral slate as
// fallback. Flag to product if a distinct color is wanted.
export const LENS_COLORS: Record<string, { bg: string; text: string }> = {
  agree: { bg: RELATIONSHIP_TAG.AGREE.bg, text: RELATIONSHIP_TAG.AGREE.text },
  disagree: { bg: RELATIONSHIP_TAG.DISAGREE.bg, text: RELATIONSHIP_TAG.DISAGREE.text },
  complement: { bg: RELATIONSHIP_TAG.COMPLEMENT.bg, text: RELATIONSHIP_TAG.COMPLEMENT.text },
  blind_spot: { bg: RELATIONSHIP_TAG.BLIND_SPOT.bg, text: RELATIONSHIP_TAG.BLIND_SPOT.text },
  // ManagementAttentionCards High-urgency badge: bg-red-100 text-red-700
  high_urgency: { bg: "bg-red-100", text: "text-red-700" },
  // No existing category badge for the risk lens — neutral fallback
  risk: { bg: "bg-slate-100", text: "text-slate-600" },
};
