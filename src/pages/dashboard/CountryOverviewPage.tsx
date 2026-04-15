import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Archive, Building2, Clock3, Inbox, MapPinned, UserCheck, Users } from "lucide-react";
import { Cell, Pie, PieChart } from "recharts";

import { type KpiStatCardProps, KpiStatCard } from "@/components/dashboard/KpiStatCard";
import {
  ChartContainer,
  type ChartConfig,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmployeesList } from "@/modules/directory/hooks/useEmployeesList";
import { useLocations } from "@/modules/directory/hooks/useLocations";
import { useCountryOverview } from "@/modules/directory/hooks/useCountryOverview";
import { useApprovalHistory } from "@/modules/leave/hooks/useApprovalHistory";
import { usePendingApprovals } from "@/modules/leave/hooks/usePendingApprovals";

export function CountryOverviewPage() {
  const navigate = useNavigate();
  const { countryPrefix } = useParams<{ countryPrefix: string }>();
  const prefix = String(countryPrefix ?? "").trim().toUpperCase();
  const countryOverviewQuery = useCountryOverview(prefix, Boolean(prefix));
  const locationsQuery = useLocations();
  const employeesQuery = useEmployeesList({ page: 1, limit: 500, sort_by: "full_name", sort_dir: "asc" });
  const pendingQuery = usePendingApprovals({ page: 1, limit: 50 });
  const historyQuery = useApprovalHistory();

  const countryLocations = useMemo(
    () =>
      (locationsQuery.data ?? []).filter((l) =>
        String(l.location_key ?? "").trim().toUpperCase().startsWith(`${prefix}_`),
      ),
    [locationsQuery.data, prefix],
  );

  const countryEmployees = useMemo(
    () =>
      (employeesQuery.data?.employees ?? []).filter((e) =>
        String(e.location ?? "").trim().toUpperCase().startsWith(`${prefix}_`),
      ),
    [employeesQuery.data?.employees, prefix],
  );

  const countryEmployeeNos = useMemo(
    () => new Set(countryEmployees.map((e) => e.employee_number)),
    [countryEmployees],
  );

  const pendingForCountry = useMemo(
    () =>
      (pendingQuery.data?.data ?? []).filter((r) =>
        countryEmployeeNos.has(r.requester.employee_number),
      ),
    [pendingQuery.data?.data, countryEmployeeNos],
  );

  const historyForCountry = useMemo(
    () =>
      (historyQuery.data?.data ?? []).filter((r) =>
        countryEmployeeNos.has(r.requester.employee_number),
      ),
    [historyQuery.data?.data, countryEmployeeNos],
  );

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const requestsThisMonth = useMemo(
    () =>
      historyForCountry.filter((r) => {
        const d = new Date(r.applied_at);
        if (Number.isNaN(d.getTime())) return false;
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).length,
    [historyForCountry, currentMonth, currentYear],
  );

  const latestEmployees = countryEmployees.slice(0, 5);
  const latestRequests = [...historyForCountry]
    .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
    .slice(0, 5);

  const departmentPieData = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of countryEmployees) {
      const key = String(e.department ?? "Unassigned").trim() || "Unassigned";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [countryEmployees]);

  const pieColors = ["#2563eb", "#14b8a6", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#84cc16", "#f97316"];
  const departmentConfig = useMemo(() => {
    const cfg: ChartConfig = {};
    departmentPieData.forEach((d, i) => {
      cfg[`dep_${i}`] = { label: d.name, color: pieColors[i % pieColors.length] };
    });
    return cfg;
  }, [departmentPieData]);

  const statusCounts = useMemo(() => {
    let approved = 0;
    let rejected = 0;
    for (const r of historyForCountry) {
      const action = String(r.approval.action).toUpperCase();
      if (action === "APPROVED") approved++;
      else if (action === "REJECTED") rejected++;
    }
    const pending = pendingForCountry.length;
    return { pending, approved, rejected };
  }, [historyForCountry, pendingForCountry.length]);

  const stalePending = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return pendingForCountry.filter((r) => new Date(r.applied_at).getTime() < cutoff).length;
  }, [pendingForCountry]);

  const zeroEmployeeBranches = useMemo(() => {
    const employeeLocations = new Set(countryEmployees.map((e) => e.location));
    return countryLocations.filter((l) => !employeeLocations.has(l.location_key)).length;
  }, [countryEmployees, countryLocations]);

  const loading =
    countryOverviewQuery.isLoading ||
    employeesQuery.isLoading ||
    pendingQuery.isLoading ||
    historyQuery.isLoading;

  const statWidgets: KpiStatCardProps[] = useMemo(
    () => [
      {
        label: "Country branches",
        value: countryOverviewQuery.data?.kpis.branches ?? countryLocations.length,
        icon: MapPinned,
        iconBoxClass: "bg-primary",
      },
      {
        label: "Country departments",
        value: countryOverviewQuery.data?.kpis.departments ?? 0,
        icon: Building2,
        iconBoxClass: "bg-emerald-500",
      },
      {
        label: "Country employees",
        value: countryOverviewQuery.data?.kpis.totalEmployees ?? countryEmployees.length,
        icon: Users,
        iconBoxClass: "bg-blue-600",
      },
      {
        label: "Country active",
        value: countryOverviewQuery.data?.kpis.activeEmployees ?? 0,
        icon: UserCheck,
        iconBoxClass: "bg-violet-600",
      },
      {
        label: "Country archived",
        value: countryOverviewQuery.data?.kpis.archivedEmployees ?? 0,
        icon: Archive,
        iconBoxClass: "bg-amber-600",
      },
      {
        label: "Pending approvals",
        value: statusCounts.pending,
        icon: Clock3,
        iconBoxClass: "bg-rose-600",
      },
      {
        label: "Requests this month",
        value: requestsThisMonth,
        icon: Inbox,
        iconBoxClass: "bg-cyan-600",
      },
    ],
    [countryOverviewQuery.data, countryLocations.length, countryEmployees.length, requestsThisMonth, statusCounts.pending],
  );

  return (
    <section className="w-full space-y-4" aria-labelledby="country-overview-title">
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 id="country-overview-title" className="font-heading text-xl font-semibold tracking-tight text-foreground">
              Country dashboard ({prefix})
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Local HR operations view for staffing, approvals, and alerts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => navigate("/employees")}>
              View employees
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => navigate("/approvals")}>
              View approvals
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => navigate("/hr-desk")}>
              Open HR desk
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
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

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Latest leave requests</CardTitle>
            <CardDescription>Most recent requests within this country view.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : latestRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requests found for this country.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full min-w-[680px] text-left text-sm">
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
                    {latestRequests.map((r) => (
                      <tr key={r.approval_id} className="border-t border-border/80">
                        <td className="px-3 py-2 font-medium text-foreground">#{r.request_id}</td>
                        <td className="px-3 py-2 text-muted-foreground">{r.requester.full_name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{r.leave.leave_type_key}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {r.leave.start_date} {"->"} {r.leave.end_date}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{r.approval.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department mix</CardTitle>
              <CardDescription>Employee distribution by department in this country.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {loading ? (
                <Skeleton className="h-[280px] w-full rounded-xl" />
              ) : departmentPieData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No department data available.</p>
              ) : (
                <>
                  <ChartContainer config={departmentConfig} className="h-[280px] w-full max-w-[420px]">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie data={departmentPieData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={36}>
                        {departmentPieData.map((_, i) => (
                          <Cell key={`dep-${i}`} fill={pieColors[i % pieColors.length]} />
                        ))}
                      </Pie>
                      <ChartLegend
                        content={
                          <ChartLegendContent
                            payload={departmentPieData.map((d, i) => ({
                              value: d.name,
                              dataKey: `dep_${i}`,
                              color: pieColors[i % pieColors.length],
                            }))}
                          />
                        }
                        verticalAlign="bottom"
                      />
                    </PieChart>
                  </ChartContainer>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>HR alerts</CardTitle>
              <CardDescription>Country-specific operational watchlist.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <AlertTriangle className="size-4 text-amber-500" />
                  Branches with zero employees
                </span>
                <span className="font-medium text-foreground">{zeroEmployeeBranches}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <span className="text-muted-foreground">Pending approvals older than 7 days</span>
                <span className="font-medium text-foreground">{stalePending}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <span className="text-muted-foreground">Approved requests (history)</span>
                <span className="font-medium text-foreground">{statusCounts.approved}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <span className="text-muted-foreground">Rejected requests (history)</span>
                <span className="font-medium text-foreground">{statusCounts.rejected}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Latest created employees</CardTitle>
          <CardDescription>Newest employee profiles in this country context.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : latestEmployees.length === 0 ? (
            <p className="text-sm text-muted-foreground">No employees available for this country.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Employee</th>
                    <th className="px-3 py-2">Department</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Location</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {latestEmployees.map((e) => (
                    <tr key={e.employee_number} className="border-t border-border/80">
                      <td className="px-3 py-2">
                        <p className="font-medium text-foreground">{e.full_name}</p>
                        <p className="text-xs text-muted-foreground">{e.employee_number}</p>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{e.department ?? "-"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{e.directory_role}</td>
                      <td className="px-3 py-2 text-muted-foreground">{e.location ?? "-"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{e.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
