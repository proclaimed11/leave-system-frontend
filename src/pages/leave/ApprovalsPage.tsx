import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useApprovalHistory } from "@/modules/leave/hooks/useApprovalHistory";

export function ApprovalsPage() {
  const navigate = useNavigate();
  const query = useApprovalHistory();

  return (
    <section className="w-full space-y-4" aria-labelledby="approvals-title">
      <div>
        <h1 id="approvals-title" className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Approvals
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your approval queue and action history.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approvals</CardTitle>
          <CardDescription>
            One row per leave request. HR and HOD can approve in any order; both are required before the
            request is fully approved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : query.isError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Could not load approvals.
            </div>
          ) : (query.data?.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No approvals found.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Request</th>
                    <th className="px-3 py-2">Requester</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Dates</th>
                    <th className="px-3 py-2">Days</th>
                    <th className="px-3 py-2">Step</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {(query.data?.data ?? []).map((item) => (
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
                      <td className="px-3 py-2 text-muted-foreground">
                        {item.requester.full_name} ({item.requester.employee_number})
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{item.leave.leave_type_key}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {item.leave.start_date} {"->"} {item.leave.end_date}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{item.leave.days_requested}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {String(item.approval.role).toUpperCase()} (#{item.approval.step_order})
                      </td>
                      <td className="px-3 py-2">{renderApprovalStatusBadge(item.approval.action)}</td>
                      <td className="max-w-[22rem] truncate px-3 py-2 text-muted-foreground">
                        {item.leave.reason ?? "-"}
                      </td>
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

function renderApprovalStatusBadge(status: string) {
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
