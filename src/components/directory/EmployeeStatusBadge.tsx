import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type EmployeeStatusBadgeProps = {
  status: string;
  className?: string;
};

/** Green translucent for ACTIVE, red translucent for ARCHIVED; other keys shown as muted. */
export function EmployeeStatusBadge({ status, className }: EmployeeStatusBadgeProps) {
  const key = status.trim().toUpperCase();
  const isActive = key === "ACTIVE";
  const isArchived = key === "ARCHIVED";

  const label = isActive ? "Active" : isArchived ? "Archived" : status;

  return (
    <Badge
      variant="outline"
      className={cn(
        "border font-medium",
        className,
        isActive &&
          "border-emerald-500/35 bg-emerald-500/15 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-100",
        isArchived &&
          "border-red-500/35 bg-red-500/15 text-red-900 dark:border-red-500/40 dark:bg-red-500/20 dark:text-red-100",
        !isActive && !isArchived && "bg-muted/80 text-muted-foreground"
      )}
    >
      {label}
    </Badge>
  );
}
