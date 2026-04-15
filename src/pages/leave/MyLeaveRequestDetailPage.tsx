import axios from "axios";
import { Link, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useLeaveRequestDetail } from "@/modules/leave/hooks/useLeaveRequestDetail";

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
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

export function MyLeaveRequestDetailPage() {
  const raw = useParams<{ requestId: string }>().requestId;
  const requestId = raw ? Number(raw) : NaN;
  const query = useLeaveRequestDetail(Number.isFinite(requestId) ? requestId : undefined);

  const errorMessage = (() => {
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
          Leave request #{requestId}
        </h1>
        <Link to="/my-leave" className="text-sm text-primary underline-offset-4 hover:underline">
          Back to my requests
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
          Could not load request details. {errorMessage ?? ""}
        </div>
      ) : query.data ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Request details</CardTitle>
              <CardDescription>Full information for your selected leave request.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-medium">{query.data.leave.leave_type_key}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <div className="mt-1">{statusBadge(query.data.leave.status)}</div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dates</p>
                <p>
                  {query.data.leave.start_date} {"->"} {query.data.leave.end_date}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total days</p>
                <p>{query.data.leave.total_days}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground">Reason</p>
                <p>{query.data.leave.reason || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p>{formatDateTime(query.data.leave.created_at)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Requester profile</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p>{query.data.requester.full_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Employee number</p>
                <p>{query.data.requester.employee_number}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p>{query.data.requester.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p>{query.data.requester.department || "-"}</p>
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
                    <div key={`${item.request_id}-${idx}`} className="rounded-md border border-border p-3 text-sm">
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

          <Card>
            <CardHeader>
              <CardTitle>Handover</CardTitle>
            </CardHeader>
            <CardContent>
              {!query.data.handover ? (
                <p className="text-sm text-muted-foreground">No handover details provided.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Assigned to:</span>{" "}
                    {query.data.handover.assigned_to || "-"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Notes:</span> {query.data.handover.notes || "-"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Document:</span>{" "}
                    {query.data.handover.document_url ? query.data.handover.document_url : "-"}
                  </p>
                  <div>
                    <p className="text-muted-foreground">Tasks</p>
                    {query.data.handover.tasks.length === 0 ? (
                      <p className="text-muted-foreground">No tasks.</p>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {query.data.handover.tasks.map((task) => (
                          <li key={task.id}>
                            - {task.title} {task.is_completed ? "(completed)" : "(pending)"}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              {query.data.attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attachments.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {query.data.attachments.map((att) => (
                    <div key={att.id} className="rounded-md border border-border p-3">
                      <p className="text-xs text-muted-foreground">Uploaded: {formatDateTime(att.created_at)}</p>
                      <a
                        href={att.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {att.file_url}
                      </a>
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
