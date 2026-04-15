import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BellRing, Building2, CheckCheck, Clock3, FileClock, UserPlus, Users } from "lucide-react";

import { KpiStatCard, KpiStatCardSkeleton } from "@/components/dashboard/KpiStatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useEmployeesList } from "@/modules/directory/hooks/useEmployeesList";
import { useLocations } from "@/modules/directory/hooks/useLocations";
import { useApprovalHistory } from "@/modules/leave/hooks/useApprovalHistory";
import { usePendingApprovals } from "@/modules/leave/hooks/usePendingApprovals";
import type { ApprovalHistoryItem } from "@/modules/leave/types";

const TODAY_YMD = new Date().toISOString().slice(0, 10);

function dateOnly(value?: string | null): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

function isToday(value?: string | null): boolean {
  return dateOnly(value) === TODAY_YMD;
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function statusBadge(status: string) {
  const key = String(status).trim().toUpperCase();
  const shared = "border font-medium";
  if (key === "APPROVED") {
    return (
      <Badge
        variant="outline"
        className={cn(
          shared,
          "border-emerald-500/35 bg-emerald-500/15 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-100",
        )}
      >
        Approved
      </Badge>
    );
  }
  if (key === "REJECTED") {
    return (
      <Badge
        variant="outline"
        className={cn(
          shared,
          "border-red-500/35 bg-red-500/15 text-red-900 dark:border-red-500/40 dark:bg-red-500/20 dark:text-red-100",
        )}
      >
        Rejected
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={cn(
        shared,
        "border-amber-500/35 bg-amber-500/15 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-100",
      )}
    >
      {key || "PENDING"}
    </Badge>
  );
}

export function HrDeskPage() {
  const navigate = useNavigate();
  const pendingQuery = usePendingApprovals({ page: 1, limit: 20 });
  const historyQuery = useApprovalHistory();
  const activeEmployeesQuery = useEmployeesList({ page: 1, limit: 1, status: "ACTIVE" });
  const locationsQuery = useLocations();

  const pendingRows = pendingQuery.data?.data ?? [];
  const priorityQueue = pendingRows.slice(0, 8);
  const historyRows = historyQuery.data?.data ?? [];
  const recentActivity = historyRows.slice(0, 6);

  const activeBranches = useMemo(
    () =>
      (locationsQuery.data ?? []).filter(
        (l) => String(l.status).toUpperCase() === "ACTIVE",
      ).length,
    [locationsQuery.data],
  );

  const actedToday = useMemo(
    () =>
      historyRows.filter((r) => {
        const action = String(r.approval.action).toUpperCase();
        return (action === "APPROVED" || action === "REJECTED") && isToday(r.approval.acted_at);
      }).length,
    [historyRows],
  );

  const urgentPending = useMemo(
    () => pendingRows.filter((r) => isToday(r.applied_at) || r.leave.days_requested >= 5).length,
    [pendingRows],
  );

  const kpiLoading =
    pendingQuery.isLoading || historyQuery.isLoading || activeEmployeesQuery.isLoading || locationsQuery.isLoading;

  const quickActions = [
    {
      label: "Review approvals",
      description: "Open pending approval queue",
      icon: FileClock,
      onClick: () => navigate("/approvals"),
    },
    {
      label: "Create employee",
      description: "Add a new employee profile",
      icon: UserPlus,
      onClick: () => navigate("/employees/new"),
    },
    {
      label: "Open employees",
      description: "Manage employee records",
      icon: Users,
      onClick: () => navigate("/employees"),
    },
  ];

  return (
    <section className="w-full space-y-4" aria-labelledby="hr-desk-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 id="hr-desk-title" className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            HR Desk
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Daily HR operations console for approvals, staffing snapshots, and fast actions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Button key={action.label} type="button" size="sm" onClick={action.onClick}>
              <action.icon className="mr-1 size-4" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="HR desk metrics">
        {kpiLoading ? (
          <>
            <KpiStatCardSkeleton />
            <KpiStatCardSkeleton />
            <KpiStatCardSkeleton />
            <KpiStatCardSkeleton />
          </>
        ) : (
          <>
            <KpiStatCard
              label="Pending approvals"
              value={pendingQuery.data?.total ?? 0}
              icon={Clock3}
              iconBoxClass="bg-amber-600"
            />
            <KpiStatCard
              label="Approvals acted today"
              value={actedToday}
              icon={CheckCheck}
              iconBoxClass="bg-emerald-600"
            />
            <KpiStatCard
              label="Active employees"
              value={activeEmployeesQuery.data?.total ?? 0}
              icon={Users}
              iconBoxClass="bg-blue-600"
            />
            <KpiStatCard
              label="Active branches"
              value={activeBranches}
              icon={Building2}
              iconBoxClass="bg-violet-600"
            />
          </>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.8fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Priority queue</CardTitle>
            <CardDescription>Top pending requests that need HR attention now.</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : pendingQuery.isError ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Could not load pending approvals.
              </div>
            ) : priorityQueue.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending approvals in your queue.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Request</th>
                      <th className="px-3 py-2">Requester</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Dates</th>
                      <th className="px-3 py-2">Days</th>
                      <th className="px-3 py-2">Applied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priorityQueue.map((item) => (
                      <tr
                        key={item.request_id}
                        className="cursor-pointer border-t border-border/80 hover:bg-muted/40"
                        onClick={() => void navigate(`/approvals/${item.request_id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            void navigate(`/approvals/${item.request_id}`);
                          }
                        }}
                      >
                        <td className="px-3 py-2 font-medium text-foreground">#{item.request_id}</td>
                        <td className="px-3 py-2 text-muted-foreground">{item.requester.full_name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{item.leave.leave_type_key}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {item.leave.start_date} {"->"} {item.leave.end_date}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{item.leave.days_requested}</td>
                        <td className="px-3 py-2 text-muted-foreground">{formatDate(item.applied_at)}</td>
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
              <CardTitle>Today summary</CardTitle>
              <CardDescription>Quick health check for current queue.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <span className="text-muted-foreground">Pending approvals</span>
                <span className="font-medium text-foreground">{pendingQuery.data?.total ?? 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <span className="text-muted-foreground">Acted today</span>
                <span className="font-medium text-foreground">{actedToday}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <span className="text-muted-foreground">Urgent in queue</span>
                <span className="font-medium text-foreground">{urgentPending}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="size-4" />
                Quick actions
              </CardTitle>
              <CardDescription>Jump to common HR workflows.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => (
                <button
                  key={`quick-${action.label}`}
                  type="button"
                  onClick={action.onClick}
                  className="flex w-full items-start gap-2 rounded-md border border-border p-2 text-left transition-colors hover:bg-muted/50"
                >
                  <action.icon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">{action.label}</span>
                    <span className="block text-xs text-muted-foreground">{action.description}</span>
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent approval activity</CardTitle>
          <CardDescription>Latest actions made by your role in the approval pipeline.</CardDescription>
        </CardHeader>
        <CardContent>
          {historyQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : historyQuery.isError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Could not load approval history.
            </div>
          ) : recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent approval activity found.</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((item: ApprovalHistoryItem) => (
                <button
                  key={item.approval_id}
                  type="button"
                  className="flex w-full flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-left hover:bg-muted/40"
                  onClick={() => void navigate(`/approvals/${item.request_id}`)}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      #{item.request_id} - {item.requester.full_name} ({item.leave.leave_type_key})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(item.leave.start_date)} {"->"} {formatDate(item.leave.end_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(item.approval.action)}
                    <span className="text-xs text-muted-foreground">{formatDate(item.approval.acted_at ?? item.applied_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
