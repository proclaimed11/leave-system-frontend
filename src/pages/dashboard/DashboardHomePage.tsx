import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Archive, Building2, Globe2, MapPinned, UserCheck, Users } from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
} from "recharts";

import { type KpiStatCardProps, KpiStatCard } from "@/components/dashboard/KpiStatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  type ChartConfig,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useDepartments } from "@/modules/directory/hooks/useDepartments";
import { useEmployeesList } from "@/modules/directory/hooks/useEmployeesList";
import { useLocations } from "@/modules/directory/hooks/useLocations";
import { useApprovalHistory } from "@/modules/leave/hooks/useApprovalHistory";

/** Placeholder figures until dashboard summary API is wired up. */
const DASHBOARD_STATS_DUMMY = {
  branchCount: 14,
  countryCount: 4,
  departmentCount: 9,
  totalEmployees: 248,
  activeEmployees: 231,
  archivedEmployees: 17,
} as const;

/** Dashboard home: organization KPI widgets only. */
export function DashboardHomePage() {
  const navigate = useNavigate();
  const locationsQuery = useLocations();
  const departmentsQuery = useDepartments();
  const employeesQuery = useEmployeesList({ page: 1, limit: 500, sort_by: "full_name", sort_dir: "asc" });
  const activeEmployeesQuery = useEmployeesList({ page: 1, limit: 1, status: "ACTIVE" });
  const archivedEmployeesQuery = useEmployeesList({ page: 1, limit: 1, status: "ARCHIVED" });
  const latestEmployeesQuery = useEmployeesList({ page: 1, limit: 6, sort_by: "created_at", sort_dir: "desc" });
  const approvalHistoryQuery = useApprovalHistory();
  const activeBranchCount = (locationsQuery.data ?? []).filter(
    (l) => String(l.status).toUpperCase() === "ACTIVE"
  ).length;
  const uniqueCountryCount = new Set(
    (locationsQuery.data ?? [])
      .map((l) => String(l.country_group ?? "").trim())
      .filter(Boolean)
  ).size;
  const departmentCount = (departmentsQuery.data ?? []).length;
  const totalEmployees = employeesQuery.data?.total ?? 0;
  const activeEmployees = activeEmployeesQuery.data?.total ?? 0;
  const archivedEmployees = archivedEmployeesQuery.data?.total ?? 0;
  const branchWidgetValue = locationsQuery.isSuccess
    ? activeBranchCount
    : DASHBOARD_STATS_DUMMY.branchCount;
  const countryWidgetValue = locationsQuery.isSuccess
    ? uniqueCountryCount
    : DASHBOARD_STATS_DUMMY.countryCount;
  const departmentWidgetValue = departmentsQuery.isSuccess
    ? departmentCount
    : DASHBOARD_STATS_DUMMY.departmentCount;
  const totalEmployeesWidgetValue = employeesQuery.isSuccess
    ? totalEmployees
    : DASHBOARD_STATS_DUMMY.totalEmployees;
  const activeEmployeesWidgetValue = activeEmployeesQuery.isSuccess
    ? activeEmployees
    : DASHBOARD_STATS_DUMMY.activeEmployees;
  const archivedEmployeesWidgetValue = archivedEmployeesQuery.isSuccess
    ? archivedEmployees
    : DASHBOARD_STATS_DUMMY.archivedEmployees;

  const statWidgets: KpiStatCardProps[] = [
    {
      label: "Branches",
      value: branchWidgetValue,
      icon: MapPinned,
      iconBoxClass: "bg-primary",
    },
    {
      label: "Countries",
      value: countryWidgetValue,
      icon: Globe2,
      iconBoxClass: "bg-cyan-600",
    },
    {
      label: "Departments",
      value: departmentWidgetValue,
      icon: Building2,
      iconBoxClass: "bg-emerald-500",
    },
    {
      label: "Total employees",
      value: totalEmployeesWidgetValue,
      icon: Users,
      iconBoxClass: "bg-blue-600",
    },
    {
      label: "Active employees",
      value: activeEmployeesWidgetValue,
      icon: UserCheck,
      iconBoxClass: "bg-violet-600",
    },
    {
      label: "Archived employees",
      value: archivedEmployeesWidgetValue,
      icon: Archive,
      iconBoxClass: "bg-amber-600",
    },
  ];

  const departmentDistData = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const e of employeesQuery.data?.employees ?? []) {
      const name = String(e.department ?? "Unassigned").trim() || "Unassigned";
      buckets.set(name, (buckets.get(name) ?? 0) + 1);
    }
    return Array.from(buckets.entries())
      .map(([name, employees]) => ({ name, employees }))
      .sort((a, b) => b.employees - a.employees);
  }, [employeesQuery.data?.employees]);

  const statusPieData = useMemo(
    () => [
      { key: "active", label: "Active", value: activeEmployeesWidgetValue },
      { key: "inactive", label: "Archived", value: archivedEmployeesWidgetValue },
    ],
    [activeEmployeesWidgetValue, archivedEmployeesWidgetValue],
  );

  const branchPieData = useMemo(() => {
    const buckets = new Map<string, number>();

    // Start from all configured branches so zero-count locations are still visible.
    for (const loc of locationsQuery.data ?? []) {
      const branchKey = String(loc.location_key ?? "").trim();
      if (!branchKey) continue;
      buckets.set(branchKey, 0);
    }

    // Overlay actual employee counts per branch.
    for (const e of employeesQuery.data?.employees ?? []) {
      const branch = String(e.location ?? "Unknown").trim() || "Unknown";
      buckets.set(branch, (buckets.get(branch) ?? 0) + 1);
    }
    return Array.from(buckets.entries())
      .map(([name, employees]) => ({ name, employees }))
      .sort((a, b) => {
        if (b.employees !== a.employees) return b.employees - a.employees;
        return a.name.localeCompare(b.name);
      });
  }, [employeesQuery.data?.employees, locationsQuery.data]);

  const departmentColors = [
    "#2563eb",
    "#14b8a6",
    "#f59e0b",
    "#8b5cf6",
    "#ef4444",
    "#06b6d4",
    "#84cc16",
    "#f97316",
    "#6366f1",
    "#ec4899",
  ];

  const departmentChartConfig = useMemo(() => {
    const cfg: ChartConfig = {};
    departmentDistData.forEach((row, i) => {
      const key = `dept_${i}`;
      cfg[key] = {
        label: row.name,
        color: departmentColors[i % departmentColors.length],
      };
    });
    return cfg;
  }, [departmentDistData]);

  const statusChartConfig = {
    active: { label: "Active", color: "#16a34a" },
    inactive: { label: "Archived", color: "#f59e0b" },
  } satisfies ChartConfig;

  const branchChartConfig = useMemo(() => {
    const cfg: ChartConfig = {};
    branchPieData.forEach((row, i) => {
      const key = `branch_${i}`;
      cfg[key] = {
        label: row.name,
        color: departmentColors[i % departmentColors.length],
      };
    });
    return cfg;
  }, [branchPieData]);

  const chartsLoading = employeesQuery.isLoading;
  const chartsError = employeesQuery.isError;

  return (
    <section className="w-full space-y-4" aria-labelledby="overview-title">
      <h1 id="overview-title" className="sr-only">
        Overview
      </h1>
      <div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        aria-label="Organization summary"
      >
        {statWidgets.map((item) => (
          <KpiStatCard
            key={item.label}
            label={item.label}
            value={item.value}
            icon={item.icon}
            iconBoxClass={item.iconBoxClass}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Employees by department</CardTitle>
            <CardDescription>Pie chart showing workforce distribution per department.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {chartsLoading ? (
              <Skeleton className="h-[300px] w-full rounded-xl" />
            ) : chartsError ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Could not load department chart.
              </div>
            ) : departmentDistData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No employee data available.</p>
            ) : (
              <ChartContainer config={departmentChartConfig} className="mx-auto h-[300px] w-full max-w-[560px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={departmentDistData}
                    dataKey="employees"
                    nameKey="name"
                    cx="50%"
                    cy="48%"
                    outerRadius={95}
                    innerRadius={38}
                    paddingAngle={2}
                  >
                    {departmentDistData.map((_, i) => (
                      <Cell key={`dept-cell-${i}`} fill={departmentColors[i % departmentColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
            {departmentDistData.length > 0 ? (
              <div className="mt-3 grid w-full grid-cols-1 gap-x-3 gap-y-2 text-[11px] leading-tight sm:grid-cols-2 lg:grid-cols-3">
                {departmentDistData.map((row, i) => (
                  <div key={`dept-label-${row.name}`} className="flex min-w-0 items-start gap-1.5">
                    <span
                      className="mt-0.5 inline-block size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: departmentColors[i % departmentColors.length] }}
                    />
                    <span className="break-words text-muted-foreground">
                      {row.name} ({row.employees})
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active vs archived employees</CardTitle>
            <CardDescription>Status split of the workforce.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {chartsLoading ? (
              <Skeleton className="h-[300px] w-full rounded-xl" />
            ) : (
              <ChartContainer config={statusChartConfig} className="mx-auto h-[300px] w-full max-w-[520px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={statusPieData} dataKey="value" nameKey="label" cx="50%" cy="48%" outerRadius={95}>
                    <Cell fill="var(--color-active)" />
                    <Cell fill="var(--color-inactive)" />
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employees by branch</CardTitle>
            <CardDescription>Pie chart showing workforce distribution per branch.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {chartsLoading ? (
              <Skeleton className="h-[300px] w-full rounded-xl" />
            ) : chartsError ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Could not load branch chart.
              </div>
            ) : branchPieData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No branch data available.</p>
            ) : (
              <ChartContainer config={branchChartConfig} className="mx-auto h-[300px] w-full max-w-[560px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={branchPieData}
                    dataKey="employees"
                    nameKey="name"
                    cx="50%"
                    cy="48%"
                    outerRadius={95}
                    innerRadius={38}
                    paddingAngle={2}
                  >
                    {branchPieData.map((_, i) => (
                      <Cell key={`branch-cell-${i}`} fill={departmentColors[i % departmentColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
            {branchPieData.length > 0 ? (
              <div className="mt-3 grid w-full grid-cols-1 gap-x-3 gap-y-2 text-[11px] leading-tight sm:grid-cols-2 lg:grid-cols-3">
                {branchPieData.map((row, i) => (
                  <div key={`branch-label-${row.name}`} className="flex min-w-0 items-start gap-1.5">
                    <span
                      className="mt-0.5 inline-block size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: departmentColors[i % departmentColors.length] }}
                    />
                    <span className="break-words text-muted-foreground">
                      {row.name} ({row.employees})
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>Latest created employees</CardTitle>
                <CardDescription>Most recently added employee records.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => navigate("/employees")}>
                Go to employees
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {latestEmployeesQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : latestEmployeesQuery.isError ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Could not load recent employees.
              </div>
            ) : (latestEmployeesQuery.data?.employees ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No employee records found.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Employee</th>
                      <th className="px-3 py-2">Department</th>
                      <th className="px-3 py-2">Role</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(latestEmployeesQuery.data?.employees ?? []).slice(0, 5).map((emp) => (
                      <tr key={emp.employee_number} className="border-t border-border/80">
                        <td className="px-3 py-2">
                          <p className="font-medium text-foreground">{emp.full_name}</p>
                          <p className="text-xs text-muted-foreground">{emp.employee_number}</p>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{emp.department ?? "-"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{emp.directory_role}</td>
                        <td className="px-3 py-2 text-muted-foreground">{emp.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>Latest leave requests</CardTitle>
                <CardDescription>Most recent requests visible to your approval role.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => navigate("/approvals")}>
                Go to approvals
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {approvalHistoryQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : approvalHistoryQuery.isError ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Could not load latest requests.
              </div>
            ) : (approvalHistoryQuery.data?.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No leave requests found.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Request</th>
                      <th className="px-3 py-2">Requester</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Dates</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(approvalHistoryQuery.data?.data ?? []).slice(0, 5).map((item) => (
                      <tr key={item.approval_id} className="border-t border-border/80">
                        <td className="px-3 py-2 font-medium text-foreground">#{item.request_id}</td>
                        <td className="px-3 py-2 text-muted-foreground">{item.requester.full_name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{item.leave.leave_type_key}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {item.leave.start_date} {"->"} {item.leave.end_date}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{item.approval.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
