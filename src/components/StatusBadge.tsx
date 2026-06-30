import { Badge } from "@/components/ui/badge";

type Status = "Green" | "Amber" | "Red";

const STATUS_STYLES: Record<Status, string> = {
  Green: "bg-green-100 text-green-800 border-green-300",
  Amber: "bg-amber-100 text-amber-800 border-amber-300",
  Red: "bg-red-100 text-red-800 border-red-300",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant="outline" className={STATUS_STYLES[status]}>
      {status}
    </Badge>
  );
}
