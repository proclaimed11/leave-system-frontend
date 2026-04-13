import {
  Archive,
  Building2,
  MapPinned,
  UserCheck,
  Users,
} from "lucide-react";

import {
  type KpiStatCardProps,
  KpiStatCard,
} from "@/components/dashboard/KpiStatCard";

/** Placeholder figures until dashboard summary API is wired up. */
const DASHBOARD_STATS_DUMMY = {
  branchCount: 14,
  departmentCount: 9,
  totalEmployees: 248,
  activeEmployees: 231,
  archivedEmployees: 17,
} as const;

const STAT_WIDGETS: KpiStatCardProps[] = [
  {
    label: "Branches",
    value: DASHBOARD_STATS_DUMMY.branchCount,
    icon: MapPinned,
    iconBoxClass: "bg-primary",
  },
  {
    label: "Departments",
    value: DASHBOARD_STATS_DUMMY.departmentCount,
    icon: Building2,
    iconBoxClass: "bg-emerald-500",
  },
  {
    label: "Total employees",
    value: DASHBOARD_STATS_DUMMY.totalEmployees,
    icon: Users,
    iconBoxClass: "bg-blue-600",
  },
  {
    label: "Active employees",
    value: DASHBOARD_STATS_DUMMY.activeEmployees,
    icon: UserCheck,
    iconBoxClass: "bg-violet-600",
  },
  {
    label: "Archived employees",
    value: DASHBOARD_STATS_DUMMY.archivedEmployees,
    icon: Archive,
    iconBoxClass: "bg-amber-600",
  },
];

/** Dashboard home: organization KPI widgets only. */
export function DashboardHomePage() {
  return (
    <section className="w-full max-w-6xl" aria-labelledby="overview-title">
      <h1 id="overview-title" className="sr-only">
        Overview
      </h1>
      <div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        aria-label="Organization summary"
      >
        {STAT_WIDGETS.map((item) => (
          <KpiStatCard
            key={item.label}
            label={item.label}
            value={item.value}
            icon={item.icon}
            iconBoxClass={item.iconBoxClass}
          />
        ))}
      </div>
    </section>
  );
}
