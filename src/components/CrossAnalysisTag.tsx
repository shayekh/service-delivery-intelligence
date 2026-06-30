import { Badge } from "@/components/ui/badge";

type Relationship = "AGREE" | "DISAGREE" | "COMPLEMENT" | "BLIND_SPOT";

const RELATIONSHIP_STYLES: Record<Relationship, string> = {
  AGREE: "bg-blue-100 text-blue-800 border-blue-300",
  DISAGREE: "bg-red-100 text-red-800 border-red-300",
  COMPLEMENT: "bg-green-100 text-green-800 border-green-300",
  BLIND_SPOT: "bg-amber-100 text-amber-800 border-amber-300",
};

export function CrossAnalysisTag({ relationship }: { relationship: Relationship }) {
  return (
    <Badge variant="outline" className={RELATIONSHIP_STYLES[relationship]}>
      {relationship}
    </Badge>
  );
}
