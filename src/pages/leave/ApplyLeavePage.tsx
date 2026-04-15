import axios from "axios";
import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { applyLeave } from "@/modules/leave/api/leaveApi";
import { useApplyLeaveOverview } from "@/modules/leave/hooks/useApplyLeaveOverview";
import { useHandoverCandidates } from "@/modules/leave/hooks/useHandoverCandidates";
import { useMyLeaveRequests } from "@/modules/leave/hooks/useMyLeaveRequests";
import type { ApplyLeavePayload } from "@/modules/leave/types";

type TaskRow = {
  id: string;
  title: string;
  description: string;
};

function makeTask(idSeed: number): TaskRow {
  return {
    id: `task-${idSeed}`,
    title: "",
    description: "",
  };
}

export function ApplyLeavePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const leaveTypesQuery = useApplyLeaveOverview();
  const candidatesQuery = useHandoverCandidates();
  const myRequestsQuery = useMyLeaveRequests({ page: 1, limit: 10 });

  const [leaveTypeKey, setLeaveTypeKey] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [handoverTo, setHandoverTo] = useState("");
  const [handoverNotes, setHandoverNotes] = useState("");
  const [tasks, setTasks] = useState<TaskRow[]>([makeTask(1)]);

  const typeOptions = leaveTypesQuery.data?.leave_types ?? [];
  const candidateOptions = candidatesQuery.data?.employees ?? [];
  const selectedType = useMemo(
    () => typeOptions.find((t) => t.type_key === leaveTypeKey) ?? null,
    [typeOptions, leaveTypeKey]
  );

  const mutation = useMutation({
    mutationFn: (payload: ApplyLeavePayload) => applyLeave(payload),
    onSuccess: (data) => {
      toast.success("Leave request submitted", {
        description: `Request #${data.request_id} submitted successfully.`,
      });
      void queryClient.invalidateQueries({ queryKey: ["leave", "my-requests"] });
      setLeaveTypeKey("");
      setStartDate("");
      setEndDate("");
      setReason("");
      setHandoverTo("");
      setHandoverNotes("");
      setTasks([makeTask(1)]);
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

  const addTaskRow = () => {
    setTasks((prev) => [...prev, makeTask(prev.length + 1)]);
  };

  const removeTaskRow = (id: string) => {
    setTasks((prev) => (prev.length === 1 ? prev : prev.filter((task) => task.id !== id)));
  };

  const updateTask = (id: string, key: "title" | "description", value: string) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, [key]: value } : task)));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.reset();
    if (!leaveTypeKey) {
      toast.error("Leave type is required");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Start and end dates are required");
      return;
    }
    if (startDate > endDate) {
      toast.error("End date must be on or after start date");
      return;
    }
    if (!handoverTo) {
      toast.error("Handover person is required");
      return;
    }

    const normalizedTasks = tasks
      .map((task) => ({
        title: task.title.trim(),
        description: task.description.trim(),
      }))
      .filter((task) => task.title.length > 0);

    mutation.mutate({
      leave_type_key: leaveTypeKey,
      start_date: startDate,
      end_date: endDate,
      reason: reason.trim() || undefined,
      handover_to: handoverTo,
      handover_notes: handoverNotes.trim() || undefined,
      handover_tasks:
        normalizedTasks.length > 0
          ? normalizedTasks.map((task) => ({
              title: task.title,
              ...(task.description ? { description: task.description } : {}),
            }))
          : undefined,
    });
  };

  if (leaveTypesQuery.isLoading || candidatesQuery.isLoading) {
    return (
      <section className="w-full space-y-4">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="w-full space-y-4" aria-labelledby="apply-leave-title">
      <div>
        <h1 id="apply-leave-title" className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Apply leave
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit a leave request with handover details. Approval will follow your configured workflow.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave application form</CardTitle>
          <CardDescription>
            Choose leave type and dates, then assign handover. At least one handover task title is recommended.
          </CardDescription>
        </CardHeader>

        <form onSubmit={onSubmit}>
          <CardContent className="space-y-6">
            {submitError ? (
              <div
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {submitError}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="leave-type">
                  Leave type <span className="text-destructive">*</span>
                </label>
                <select
                  id="leave-type"
                  className={cn(
                    "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none",
                    "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                  )}
                  value={leaveTypeKey}
                  onChange={(e) => setLeaveTypeKey(e.target.value)}
                  required
                >
                  <option value="">Select leave type</option>
                  {typeOptions.map((type) => (
                    <option key={type.type_key} value={type.type_key}>
                      {type.name} ({type.type_key})
                    </option>
                  ))}
                </select>
                {selectedType ? (
                  <p className="text-[11px] text-muted-foreground">
                    Available days: {selectedType.available_days ?? "N/A"} | Approval levels:{" "}
                    {selectedType.approval_levels} | Max consecutive:{" "}
                    {selectedType.max_consecutive_days ?? "N/A"}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="handover-to">
                  Handover to <span className="text-destructive">*</span>
                </label>
                <select
                  id="handover-to"
                  className={cn(
                    "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none",
                    "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                  )}
                  value={handoverTo}
                  onChange={(e) => setHandoverTo(e.target.value)}
                  required
                >
                  <option value="">Select handover person</option>
                  {candidateOptions.map((candidate) => (
                    <option key={candidate.employee_number} value={candidate.employee_number}>
                      {candidate.full_name} ({candidate.employee_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="start-date">
                  Start date <span className="text-destructive">*</span>
                </label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="end-date">
                  End date <span className="text-destructive">*</span>
                </label>
                <Input
                  id="end-date"
                  type="date"
                  min={startDate || undefined}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="leave-reason">
                Reason
              </label>
              <textarea
                id="leave-reason"
                className={cn(
                  "min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none",
                  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                )}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for leave (optional)"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="handover-notes">
                Handover notes
              </label>
              <textarea
                id="handover-notes"
                className={cn(
                  "min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none",
                  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                )}
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                placeholder="Important notes for the person handling your tasks"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">Handover tasks</p>
                <Button type="button" variant="outline" size="sm" onClick={addTaskRow}>
                  Add task
                </Button>
              </div>

              {tasks.map((task, idx) => (
                <div key={task.id} className="grid gap-2 rounded-md border border-border p-3 md:grid-cols-[1fr_1fr_auto]">
                  <Input
                    value={task.title}
                    onChange={(e) => updateTask(task.id, "title", e.target.value)}
                    placeholder={`Task ${idx + 1} title`}
                  />
                  <Input
                    value={task.description}
                    onChange={(e) => updateTask(task.id, "description", e.target.value)}
                    placeholder="Task description (optional)"
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeTaskRow(task.id)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>

          <CardFooter className="flex justify-end border-t border-border pt-4">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Submitting..." : "Submit leave request"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My requests</CardTitle>
          <CardDescription>Your latest leave submissions and statuses.</CardDescription>
        </CardHeader>
        <CardContent>
          {myRequestsQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : myRequestsQuery.isError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Could not load your leave requests.
            </div>
          ) : (myRequestsQuery.data?.data.requests ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No leave requests submitted yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Request</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Dates</th>
                    <th className="px-3 py-2">Days</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {(myRequestsQuery.data?.data.requests ?? []).map((request) => (
                    <tr
                      key={request.id}
                      className="cursor-pointer border-t border-border/80 hover:bg-muted/40"
                      onClick={() => void navigate(`/my-leave/${request.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          void navigate(`/my-leave/${request.id}`);
                        }
                      }}
                    >
                      <td className="px-3 py-2 font-medium text-foreground">#{request.id}</td>
                      <td className="px-3 py-2 text-muted-foreground">{request.leave_type_key}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {request.start_date} {"->"} {request.end_date}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{request.total_days}</td>
                      <td className="px-3 py-2">{renderLeaveStatusBadge(request.status)}</td>
                      <td className="max-w-[20rem] truncate px-3 py-2 text-muted-foreground">
                        {request.reason ?? "-"}
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

function renderLeaveStatusBadge(status: string) {
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
