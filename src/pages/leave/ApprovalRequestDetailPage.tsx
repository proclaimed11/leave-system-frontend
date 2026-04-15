import axios from "axios";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/modules/auth/AuthContext";
import { useDirectoryProfile } from "@/modules/directory/hooks/useDirectoryProfile";
import { actOnApproval } from "@/modules/leave/api/leaveApi";
import type { LeaveApprovalTrailItem } from "@/modules/leave/types";
import { useLeaveRequestDetail } from "@/modules/leave/hooks/useLeaveRequestDetail";

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** Display YYYY-MM-DD or parse ISO date strings without ugly Z suffix in UI. */
function formatLeaveDate(raw: string) {
  const s = String(raw);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString();
}

function listPendingRoles(approvals: LeaveApprovalTrailItem[]): string[] {
  return approvals
    .filter((a) => String(a.action).toUpperCase() === "PENDING")
    .map((a) => String(a.role).toUpperCase());
}

/**
 * True when this user may act on at least one pending row (HR and HOD work in parallel; any order).
 * Matches leave-request-svc pooled HR/HOD + named approver rows.
 */
function canViewerActOnPendingStep(
  approvals: LeaveApprovalTrailItem[],
  leaveStatus: string,
  directoryRole: string | undefined,
  employeeNumber: string | null | undefined,
): boolean {
  if (String(leaveStatus).toUpperCase() !== "PENDING") return false;
  const myRole = String(directoryRole ?? "")
    .trim()
    .toLowerCase();
  for (const a of approvals) {
    if (String(a.action).toUpperCase() !== "PENDING") continue;
    const stepRole = String(a.role).toLowerCase();
    if (a.approver_emp_no) {
      if (a.approver_emp_no !== employeeNumber) continue;
      if (stepRole === myRole) return true;
      continue;
    }
    if (stepRole === "hod" && myRole === "hod") return true;
    if (stepRole === "hr" && myRole === "hr") return true;
    if (stepRole === myRole) return true;
  }
  return false;
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
          "border-emerald-500/35 bg-emerald-500/15 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-100"
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
          "border-red-500/35 bg-red-500/15 text-red-900 dark:border-red-500/40 dark:bg-red-500/20 dark:text-red-100"
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
        "border-amber-500/35 bg-amber-500/15 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-100"
      )}
    >
      {key || "PENDING"}
    </Badge>
  );
}

export function ApprovalRequestDetailPage() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const profileQuery = useDirectoryProfile();
  const raw = useParams<{ requestId: string }>().requestId;
  const requestId = raw ? Number(raw) : NaN;
  const query = useLeaveRequestDetail(Number.isFinite(requestId) ? requestId : undefined);
  const [remarks, setRemarks] = useState("");

  const canAct = useMemo(() => {
    if (!query.data) return false;
    const client = canViewerActOnPendingStep(
      query.data.approvals,
      query.data.leave.status,
      profileQuery.data?.directory_role,
      session?.user.employee_number ?? undefined,
    );
    if (query.data.viewer_can_act === true) return true;
    if (query.data.viewer_can_act === false && profileQuery.isFetched) {
      return client;
    }
    if (typeof query.data.viewer_can_act !== "boolean") return client;
    return client;
  }, [
    query.data,
    profileQuery.data?.directory_role,
    profileQuery.isFetched,
    session?.user.employee_number,
  ]);

  const pendingRoles = useMemo(() => {
    if (!query.data) return [];
    return listPendingRoles(query.data.approvals);
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: (payload: { action: "APPROVED" | "REJECTED"; remarks?: string }) =>
      actOnApproval(requestId, payload),
    onSuccess: (_, vars) => {
      toast.success(vars.action === "APPROVED" ? "Request approved" : "Request rejected");
      void queryClient.invalidateQueries({ queryKey: ["leave", "pending-approvals"] });
      void queryClient.invalidateQueries({ queryKey: ["leave", "approval-history"] });
      void queryClient.invalidateQueries({ queryKey: ["leave", "request-detail", requestId] });
      setRemarks("");
    },
  });

  const submitError = (() => {
    if (!mutation.error) return null;
    if (axios.isAxiosError(mutation.error)) {
      const payload = mutation.error.response?.data as { error?: string } | undefined;
      return payload?.error ?? mutation.error.message;
    }
    return String(mutation.error);
  })();

  const loadError = (() => {
    if (!query.error) return null;
    if (axios.isAxiosError(query.error)) {
      const payload = query.error.response?.data as { error?: string } | undefined;
      return payload?.error ?? query.error.message;
    }
    return String(query.error);
  })();

  if (!Number.isFinite(requestId)) {
    return (
      <section className="w-full space-y-4">
        <p className="text-sm text-destructive">Invalid request id.</p>
      </section>
    );
  }

  return (
    <section className="w-full space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Approval request #{requestId}
        </h1>
        <Link to="/approvals" className="text-sm text-primary underline-offset-4 hover:underline">
          Back to approvals
        </Link>
      </div>

      {query.isLoading ? (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-6 w-60" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      ) : query.isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Could not load request details.{loadError ? ` ${loadError}` : ""}
        </div>
      ) : query.data ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Request details</CardTitle>
              <CardDescription>Review the leave request before decision.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Requester</p>
                <p>
                  {query.data.requester.full_name} ({query.data.requester.employee_number})
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <div className="mt-1">{statusBadge(query.data.leave.status)}</div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p>{query.data.leave.leave_type_key}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total days</p>
                <p>{query.data.leave.total_days}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground">Dates</p>
                <p>
                  {formatLeaveDate(query.data.leave.start_date)} {"->"}{" "}
                  {formatLeaveDate(query.data.leave.end_date)}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground">Reason</p>
                <p>{query.data.leave.reason || "-"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Requester profile</CardTitle>
              <CardDescription>Employee context for this leave request.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p>{query.data.requester.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p>{query.data.requester.department ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Title</p>
                <p>{query.data.requester.title ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Company</p>
                <p>{query.data.requester.company_key ?? "—"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground">Location</p>
                <p>{query.data.requester.location ?? "—"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approval action</CardTitle>
              <CardDescription>
                {canAct
                  ? "Enter remarks (optional for approve, recommended for reject), then submit your decision."
                  : "You can review this request. HR and HOD must both approve (in any order). If either rejects, the whole request is rejected."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!canAct && query.data.leave.status === "PENDING" && pendingRoles.length > 0 ? (
                <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  Still waiting on:{" "}
                  <span className="font-medium text-foreground">{pendingRoles.join(", ")}</span>
                  . You do not have a pending approval on this request (check role, department, or
                  country scope). You can still review the details above.
                </div>
              ) : null}
              {submitError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {submitError}
                </div>
              ) : null}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="approval-remarks">
                  Remarks
                </label>
                <Input
                  id="approval-remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional remarks"
                  disabled={!canAct}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() =>
                    mutation.mutate({
                      action: "APPROVED",
                      remarks: remarks.trim() || undefined,
                    })
                  }
                  disabled={mutation.isPending || !canAct}
                >
                  {mutation.isPending ? "Submitting..." : "Approve"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() =>
                    mutation.mutate({
                      action: "REJECTED",
                      remarks: remarks.trim() || undefined,
                    })
                  }
                  disabled={mutation.isPending || !canAct}
                >
                  {mutation.isPending ? "Submitting..." : "Reject"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approval trail</CardTitle>
            </CardHeader>
            <CardContent>
              {query.data.approvals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No approval actions yet.</p>
              ) : (
                <div className="space-y-2">
                  {query.data.approvals.map((item, idx) => (
                    <div
                      key={item.id != null ? String(item.id) : `${item.request_id}-${item.step_order ?? idx}`}
                      className="rounded-md border border-border p-3 text-sm"
                    >
                      <p>
                        <span className="font-medium">{item.action}</span> by{" "}
                        {item.approver_emp_no || `role:${item.role}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        At: {formatDateTime(item.acted_at ?? item.created_at)}
                      </p>
                      {item.remarks ? <p className="mt-1 text-muted-foreground">{item.remarks}</p> : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </section>
  );
}
