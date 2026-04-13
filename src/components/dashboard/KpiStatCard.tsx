import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type KpiStatCardProps = {
  label: string;
  /** Shown with locale-aware grouping (e.g. thousands separators). */
  value: number;
  icon: LucideIcon;
  /** Tailwind classes for the icon tile background; icon stroke uses white for contrast. */
  iconBoxClass: string;
  className?: string;
};

/**
 * Compact KPI tile: label + colored icon badge + numeric value.
 * Use for dashboard summaries and anywhere you need the same stat pattern.
 */
export function KpiStatCard({
  label,
  value,
  icon: Icon,
  iconBoxClass,
  className,
}: KpiStatCardProps) {
  return (
    <Card size="sm" className={cn("gap-0 py-0.5", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 px-1.5 pb-0 pt-0">
        <CardDescription className="text-xs font-medium leading-none text-muted-foreground">
          {label}
        </CardDescription>
        <div
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-md text-white shadow-sm",
            iconBoxClass
          )}
          aria-hidden
        >
          <Icon className="size-3.5 text-white" />
        </div>
      </CardHeader>
      <CardContent className="px-1.5 pb-0 pt-0">
        <p className="font-heading text-base font-semibold leading-none tabular-nums tracking-tight text-foreground">
          {value.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}

/** Matches {@link KpiStatCard} height for loading rows. */
export function KpiStatCardSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-14 w-full rounded-xl", className)} aria-hidden />;
}
