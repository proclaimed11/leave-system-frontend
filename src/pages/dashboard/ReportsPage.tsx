import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, RefreshCcw } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { KpiStatCard, type KpiStatCardProps } from "@/components/dashboard/KpiStatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  type ChartConfig,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmployeesList } from "@/modules/directory/hooks/useEmployeesList";
import { useApplyLeaveOverview } from "@/modules/leave/hooks/useApplyLeaveOverview";
import { useApprovalHistory } from "@/modules/leave/hooks/useApprovalHistory";

type Filters = {
  startDate: string;
  endDate: string;
  country: string;
  department: string;
  leaveType: string;
  status: string;
};

function getCountryPrefix(location?: string | null): string {
  return String(location ?? "").trim().toUpperCase().split("_")[0] ?? "";
}

function monthKey(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "Unknown";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function daysBetween(from: string, to?: string | null): number | null {
  if (!to) return null;
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

function toCsvCell(value: unknown): string {
  const raw = String(value ?? "");
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function ReportsPage() {
  const [filters, setFilters] = useState<Filters>({
    startDate: "",
    endDate: "",
    country: "ALL",
    department: "ALL",
    leaveType: "ALL",
    status: "ALL",
  });

  const employeesQuery = useEmployeesList({ page: 1, limit: 1000, sort_by: "full_name", sort_dir: "asc" });
  const leaveTypesQuery = useApplyLeaveOverview();
  const historyQuery = useApprovalHistory({ page: 1, limit: 500 });

  const employees = employeesQuery.data?.employees ?? [];
  const history = historyQuery.data?.data ?? [];

  const employeeByNo = useMemo(() => {
    const map = new Map<string, (typeof employees)[number]>();
    for (const e of employees) map.set(e.employee_number, e);
    return map;
  }, [employees]);

  const filterOptions = useMemo(() => {
    const countries = new Set<string>();
    const departments = new Set<string>();
    const leaveTypes = new Set<string>();
    for (const e of employees) {
      const c = getCountryPrefix(e.location);
      if (c) countries.add(c);
      const d = String(e.department ?? "").trim();
      if (d) departments.add(d);
    }
    for (const row of history) {
      const t = String(row.leave.leave_type_key ?? "").trim();
      if (t) leaveTypes.add(t);
    }
    for (const lt of leaveTypesQuery.data?.leave_types ?? []) {
      const t = String(lt.type_key ?? "").trim();
      if (t) leaveTypes.add(t);
    }
    return {
      countries: Array.from(countries).sort(),
      departments: Array.from(departments).sort(),
      leaveTypes: Array.from(leaveTypes).sort(),
    };
  }, [employees, history, leaveTypesQuery.data?.leave_types]);

  const filtered = useMemo(() => {
    return history.filter((row) => {
      const employee = employeeByNo.get(row.requester.employee_number);
      const country = getCountryPrefix(employee?.location ?? null);
      const department = String(employee?.department ?? "").trim();
      const leaveType = String(row.leave.leave_type_key ?? "").trim();
      const status = String(row.approval.action ?? "").toUpperCase();
      const applied = row.applied_at ? row.applied_at.slice(0, 10) : "";

      if (filters.country !== "ALL" && country !== filters.country) return false;
      if (filters.department !== "ALL" && department !== filters.department) return false;
      if (filters.leaveType !== "ALL" && leaveType !== filters.leaveType) return false;
      if (filters.status !== "ALL" && status !== filters.status) return false;
      if (filters.startDate && applied < filters.startDate) return false;
      if (filters.endDate && applied > filters.endDate) return false;
      return true;
    });
  }, [history, employeeByNo, filters]);

  const metrics = useMemo(() => {
    const total = filtered.length;
    const approved = filtered.filter((r) => String(r.approval.action).toUpperCase() === "APPROVED").length;
    const rejected = filtered.filter((r) => String(r.approval.action).toUpperCase() === "REJECTED").length;
    const pending = filtered.filter((r) => String(r.approval.action).toUpperCase() === "PENDING").length;
    const actedDurations = filtered
      .map((r) => daysBetween(r.applied_at, r.approval.acted_at))
      .filter((v): v is number => v != null);
    const avgProcessing =
      actedDurations.length > 0
        ? Number((actedDurations.reduce((a, b) => a + b, 0) / actedDurations.length).toFixed(1))
        : 0;

    const today = new Date().toISOString().slice(0, 10);
    const activeOnLeave = new Set(
      filtered
        .filter((r) => String(r.approval.action).toUpperCase() === "APPROVED")
        .filter((r) => r.leave.start_date <= today && r.leave.end_date >= today)
        .map((r) => r.requester.employee_number),
    ).size;

    return { total, approved, rejected, pending, avgProcessing, activeOnLeave };
  }, [filtered]);

  const kpiCards: KpiStatCardProps[] = [
    { label: "Total requests", value: metrics.total, icon: FileSpreadsheet, iconBoxClass: "bg-blue-600" },
    {
      label: "Approval rate (%)",
      value: metrics.total ? Math.round((metrics.approved / metrics.total) * 100) : 0,
      icon: Download,
      iconBoxClass: "bg-emerald-600",
    },
    {
      label: "Rejection rate (%)",
      value: metrics.total ? Math.round((metrics.rejected / metrics.total) * 100) : 0,
      icon: RefreshCcw,
      iconBoxClass: "bg-rose-600",
    },
    {
      label: "Avg processing (days)",
      value: Math.round(metrics.avgProcessing),
      icon: RefreshCcw,
      iconBoxClass: "bg-violet-600",
    },
    {
      label: "Employees on leave",
      value: metrics.activeOnLeave,
      icon: FileSpreadsheet,
      iconBoxClass: "bg-cyan-600",
    },
  ];

  const monthlyTrend = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      const key = monthKey(r.applied_at);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([month, requests]) => ({ month, requests }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-8);
  }, [filtered]);

  const outcomesByMonth = useMemo(() => {
    const map = new Map<string, { month: string; approved: number; rejected: number; pending: number }>();
    for (const r of filtered) {
      const month = monthKey(r.applied_at);
      if (!map.has(month)) map.set(month, { month, approved: 0, rejected: 0, pending: 0 });
      const row = map.get(month)!;
      const action = String(r.approval.action).toUpperCase();
      if (action === "APPROVED") row.approved += 1;
      else if (action === "REJECTED") row.rejected += 1;
      else row.pending += 1;
    }
    return Array.from(map.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-8);
  }, [filtered]);

  const utilization = useMemo(() => {
    const deptMap = new Map<string, { department: string; requests: number; days: number; headcount: number; share: number }>();
    for (const e of employees) {
      const d = String(e.department ?? "Unassigned").trim() || "Unassigned";
      if (!deptMap.has(d)) deptMap.set(d, { department: d, requests: 0, days: 0, headcount: 0, share: 0 });
      deptMap.get(d)!.headcount += 1;
    }
    for (const r of filtered) {
      const d = String(employeeByNo.get(r.requester.employee_number)?.department ?? "Unassigned").trim() || "Unassigned";
      if (!deptMap.has(d)) deptMap.set(d, { department: d, requests: 0, days: 0, headcount: 0, share: 0 });
      const row = deptMap.get(d)!;
      row.requests += 1;
      row.days += Number(r.leave.days_requested ?? 0);
    }
    return Array.from(deptMap.values())
      .map((r) => ({ ...r, share: r.headcount ? Number(((r.requests / r.headcount) * 100).toFixed(1)) : 0 }))
      .filter((r) => r.requests > 0 || r.headcount > 0)
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 8);
  }, [employees, filtered, employeeByNo]);

  const sla = useMemo(() => {
    const now = Date.now();
    const pendingRows = filtered.filter((r) => String(r.approval.action).toUpperCase() === "PENDING");
    const olderThan = (days: number) =>
      pendingRows.filter((r) => now - new Date(r.applied_at).getTime() > days * 24 * 60 * 60 * 1000).length;
    return { d3: olderThan(3), d7: olderThan(7), d14: olderThan(14) };
  }, [filtered]);

  const onReset = () =>
    setFilters({
      startDate: "",
      endDate: "",
      country: "ALL",
      department: "ALL",
      leaveType: "ALL",
      status: "ALL",
    });

  const onExportCsv = () => {
    const headers = [
      "request_id",
      "requester",
      "employee_number",
      "country",
      "department",
      "leave_type",
      "start_date",
      "end_date",
      "days",
      "status",
      "approval_role",
      "applied_at",
      "acted_at",
      "processing_days",
    ];

    const lines = [
      headers.map(toCsvCell).join(","),
      ...filtered.map((r) => {
        const emp = employeeByNo.get(r.requester.employee_number);
        const values = [
          r.request_id,
          r.requester.full_name,
          r.requester.employee_number,
          getCountryPrefix(emp?.location),
          emp?.department ?? "",
          r.leave.leave_type_key,
          r.leave.start_date,
          r.leave.end_date,
          r.leave.days_requested,
          r.approval.action,
          r.approval.role,
          r.applied_at,
          r.approval.acted_at ?? "",
          daysBetween(r.applied_at, r.approval.acted_at) ?? "",
        ];
        return values.map(toCsvCell).join(",");
      }),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reports_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV export started");
  };

  const loading = employeesQuery.isLoading || historyQuery.isLoading;

  const trendConfig = { requests: { label: "Requests", color: "#2563eb" } } satisfies ChartConfig;
  const outcomeConfig = {
    approved: { label: "Approved", color: "#16a34a" },
    rejected: { label: "Rejected", color: "#ef4444" },
    pending: { label: "Pending", color: "#f59e0b" },
  } satisfies ChartConfig;

  return (
    <section className="w-full space-y-4" aria-labelledby="reports-title">
      <div>
        <h1 id="reports-title" className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Reports
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Trend analytics and exports for leave workflows.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter report output then export the exact results.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Input type="date" value={filters.startDate} onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value }))} />
            <Input type="date" value={filters.endDate} onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value }))} />
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={filters.country}
              onChange={(e) => setFilters((p) => ({ ...p, country: e.target.value }))}
            >
              <option value="ALL">All countries</option>
              {filterOptions.countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={filters.department}
              onChange={(e) => setFilters((p) => ({ ...p, department: e.target.value }))}
            >
              <option value="ALL">All departments</option>
              {filterOptions.departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={filters.leaveType}
              onChange={(e) => setFilters((p) => ({ ...p, leaveType: e.target.value }))}
            >
              <option value="ALL">All leave types</option>
              {filterOptions.leaveTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
            >
              <option value="ALL">All statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onReset}>
              <RefreshCcw className="mr-1 size-4" />
              Reset
            </Button>
            <Button type="button" onClick={onExportCsv}>
              <FileSpreadsheet className="mr-1 size-4" />
              Export CSV
            </Button>
            <Button type="button" variant="outline" onClick={() => toast.info("PDF export will be added next.")}>
              <Download className="mr-1 size-4" />
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpiCards.map((k) => (
          <KpiStatCard key={k.label} {...k} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Requests trend</CardTitle>
            <CardDescription>Monthly request volume.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[260px] w-full rounded-xl" />
            ) : (
              <ChartContainer config={trendConfig} className="h-[260px] w-full">
                <AreaChart data={monthlyTrend}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="requests" stroke="var(--color-requests)" fill="var(--color-requests)" fillOpacity={0.2} />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Approval outcomes</CardTitle>
            <CardDescription>Monthly approved/rejected/pending distribution.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[260px] w-full rounded-xl" />
            ) : (
              <ChartContainer config={outcomeConfig} className="h-[260px] w-full">
                <BarChart data={outcomesByMonth}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="approved" stackId="a" fill="var(--color-approved)" />
                  <Bar dataKey="rejected" stackId="a" fill="var(--color-rejected)" />
                  <Bar dataKey="pending" stackId="a" fill="var(--color-pending)" />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Department leave utilization</CardTitle>
            <CardDescription>Request load and request-to-headcount share.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Department</th>
                    <th className="px-3 py-2">Requests</th>
                    <th className="px-3 py-2">Days</th>
                    <th className="px-3 py-2">Headcount</th>
                    <th className="px-3 py-2">Requests/Headcount %</th>
                  </tr>
                </thead>
                <tbody>
                  {utilization.map((r) => (
                    <tr key={r.department} className="border-t border-border/80">
                      <td className="px-3 py-2 text-foreground">{r.department}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.requests}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.days}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.headcount}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.share}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SLA watch</CardTitle>
            <CardDescription>Pending requests breaching age thresholds.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
              <span className="text-muted-foreground">Pending &gt; 3 days</span>
              <span className="font-medium text-foreground">{sla.d3}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
              <span className="text-muted-foreground">Pending &gt; 7 days</span>
              <span className="font-medium text-foreground">{sla.d7}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
              <span className="text-muted-foreground">Pending &gt; 14 days</span>
              <span className="font-medium text-foreground">{sla.d14}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed leave report</CardTitle>
          <CardDescription>Filtered request-level export source.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No report rows match current filters.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Request</th>
                    <th className="px-3 py-2">Employee</th>
                    <th className="px-3 py-2">Country</th>
                    <th className="px-3 py-2">Department</th>
                    <th className="px-3 py-2">Leave type</th>
                    <th className="px-3 py-2">Dates</th>
                    <th className="px-3 py-2">Days</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Acted</th>
                    <th className="px-3 py-2">Processing (days)</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const emp = employeeByNo.get(r.requester.employee_number);
                    return (
                      <tr key={r.approval_id} className="border-t border-border/80">
                        <td className="px-3 py-2 font-medium text-foreground">#{r.request_id}</td>
                        <td className="px-3 py-2 text-muted-foreground">{r.requester.full_name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{getCountryPrefix(emp?.location)}</td>
                        <td className="px-3 py-2 text-muted-foreground">{emp?.department ?? "-"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{r.leave.leave_type_key}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {r.leave.start_date} {"->"} {r.leave.end_date}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{r.leave.days_requested}</td>
                        <td className="px-3 py-2 text-muted-foreground">{r.approval.action}</td>
                        <td className="px-3 py-2 text-muted-foreground">{r.approval.role}</td>
                        <td className="px-3 py-2 text-muted-foreground">{r.approval.acted_at ?? "-"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{daysBetween(r.applied_at, r.approval.acted_at) ?? "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

