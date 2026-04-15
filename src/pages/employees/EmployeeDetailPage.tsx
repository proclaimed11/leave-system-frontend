import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { Pencil, RotateCcw, Skull, Trash2 } from "lucide-react";

import { EmployeeStatusBadge } from "@/components/directory/EmployeeStatusBadge";
import { ProfilePhotoSlot } from "@/components/ProfilePhotoSlot";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { DirectoryEmployeeRecord } from "@/modules/directory/types";
import {
  archiveEmployee,
  deleteEmployeePermanently,
  restoreEmployee,
} from "@/modules/directory/api/directoryApi";
import { isDirectoryHrOrAdmin } from "@/modules/directory/directoryRoles";
import { useEmployeeDetail } from "@/modules/directory/hooks/useEmployeeDetail";
import { useDirectoryProfile } from "@/modules/directory/hooks/useDirectoryProfile";

export function EmployeeDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { employeeNumber: rawParam } = useParams<{ employeeNumber: string }>();
  const employeeNumber = rawParam ? decodeURIComponent(rawParam) : undefined;
  const query = useEmployeeDetail(employeeNumber);
  const profileQuery = useDirectoryProfile();
  const canManageEmployees = isDirectoryHrOrAdmin(profileQuery.data?.directory_role);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [activateOpen, setActivateOpen] = useState(false);
  const [activatePending, setActivatePending] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [permanentOpen, setPermanentOpen] = useState(false);
  const [permanentPending, setPermanentPending] = useState(false);
  const [permanentError, setPermanentError] = useState<string | null>(null);

  const encoded = employeeNumber ? encodeURIComponent(employeeNumber) : "";

  const handleArchiveConfirm = async () => {
    if (!employeeNumber) return;
    setDeletePending(true);
    setArchiveError(null);
    try {
      await archiveEmployee(employeeNumber);
      setDeleteOpen(false);
      const name = query.data?.full_name ?? employeeNumber;
      toast.success("Employee archived", {
        description: `${name} (${employeeNumber}) was removed from the active directory.`,
      });
      await queryClient.invalidateQueries({ queryKey: ["directory", "employees"] });
      await queryClient.invalidateQueries({ queryKey: ["directory", "employee", employeeNumber] });
      await queryClient.invalidateQueries({ queryKey: ["directory", "profile"] });
      void navigate("/");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { error?: string } | undefined;
        setArchiveError(data?.error ?? err.message);
      } else {
        setArchiveError(String(err));
      }
    } finally {
      setDeletePending(false);
    }
  };

  const handleRestoreConfirm = async () => {
    if (!employeeNumber) return;
    setActivatePending(true);
    setActivateError(null);
    try {
      await restoreEmployee(employeeNumber);
      setActivateOpen(false);
      const name = query.data?.full_name ?? employeeNumber;
      toast.success("Employee activated", {
        description: `${name} (${employeeNumber}) is active in the directory again.`,
      });
      await queryClient.invalidateQueries({ queryKey: ["directory", "employees"] });
      await queryClient.invalidateQueries({ queryKey: ["directory", "employee", employeeNumber] });
      await queryClient.invalidateQueries({ queryKey: ["directory", "profile"] });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { error?: string } | undefined;
        setActivateError(data?.error ?? err.message);
      } else {
        setActivateError(String(err));
      }
    } finally {
      setActivatePending(false);
    }
  };

  const handlePermanentConfirm = async () => {
    if (!employeeNumber) return;
    setPermanentPending(true);
    setPermanentError(null);
    try {
      await deleteEmployeePermanently(employeeNumber);
      setPermanentOpen(false);
      const name = query.data?.full_name ?? employeeNumber;
      toast.success("Employee removed permanently", {
        description: `${name} (${employeeNumber}) was deleted from the directory.`,
      });
      await queryClient.invalidateQueries({ queryKey: ["directory", "employees"] });
      await queryClient.removeQueries({ queryKey: ["directory", "employee", employeeNumber] });
      await queryClient.invalidateQueries({ queryKey: ["directory", "profile"] });
      void navigate("/");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { error?: string } | undefined;
        setPermanentError(data?.error ?? err.message);
      } else {
        setPermanentError(String(err));
      }
    } finally {
      setPermanentPending(false);
    }
  };

  const errorMessage = (() => {
    if (!query.error) return null;
    if (axios.isAxiosError(query.error)) {
      const data = query.error.response?.data as { error?: string } | undefined;
      return data?.error ?? query.error.message;
    }
    return String(query.error);
  })();

  return (
    <section className="w-full space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          ← Back to overview
        </Link>
      </div>

      {!employeeNumber ? (
        <p className="text-sm text-muted-foreground">Missing employee in URL.</p>
      ) : query.isLoading ? (
        <Card>
          <CardHeader className="flex flex-row items-start gap-4 border-b border-border pb-4">
            <Skeleton className="size-28 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-7 w-48 max-w-full" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ) : query.isError ? (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <p className="font-medium">Could not load employee</p>
          <p className="mt-1 text-xs opacity-90">{errorMessage}</p>
        </div>
      ) : query.data ? (
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
              <ProfilePhotoSlot
                size="lg"
                src={query.data.avatar_url}
                alt={`Profile photo of ${query.data.full_name}`}
              />
              <div className="min-w-0 flex-1 space-y-1">
                <CardTitle className="text-xl sm:text-2xl">
                  {query.data.full_name}
                </CardTitle>
                <CardDescription className="text-base">{query.data.email}</CardDescription>
                <p className="font-mono text-xs text-muted-foreground">
                  {query.data.employee_number}
                </p>
              </div>
            </div>
            <CardAction>
              {canManageEmployees ? (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {query.data.status === "ARCHIVED" ? (
                    <>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          setActivateError(null);
                          setActivateOpen(true);
                        }}
                      >
                        <RotateCcw className="size-3.5 opacity-90" aria-hidden />
                        Activate
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          setPermanentError(null);
                          setPermanentOpen(true);
                        }}
                      >
                        <Skull className="size-3.5 opacity-80" aria-hidden />
                        Delete permanently
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link
                        to={`/employees/${encoded}/edit`}
                        className={cn(
                          buttonVariants({ variant: "default", size: "sm" }),
                          "gap-1.5"
                        )}
                      >
                        <Pencil className="size-3.5 opacity-90" aria-hidden />
                        Edit
                      </Link>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          setArchiveError(null);
                          setDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="size-3.5 opacity-80" aria-hidden />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              ) : null}
            </CardAction>
          </CardHeader>
          <CardContent className="pt-2">
            <Tabs defaultValue="overview">
              <TabsList aria-label="Profile sections">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="full">Full profile</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="pt-2">
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <Detail label="Employee #" value={query.data.employee_number} mono />
                  <Detail label="Email" value={query.data.email} />
                  <Detail label="Department" value={query.data.department ?? "—"} />
                  <Detail label="Title" value={query.data.title ?? "—"} />
                  <Detail label="Role" value={query.data.directory_role} />
                  <Detail
                    label="Status"
                    value={<EmployeeStatusBadge status={query.data.status} />}
                  />
                  <Detail label="Company" value={query.data.company_key} />
                  <Detail label="Location" value={query.data.location ?? "—"} />
                  {query.data.manager_employee_number ? (
                    <Detail label="Manager #" value={query.data.manager_employee_number} mono />
                  ) : null}
                  {query.data.phone ? <Detail label="Phone" value={query.data.phone} /> : null}
                </dl>
              </TabsContent>
              <TabsContent value="full" className="pt-2">
                <EmployeeFullProfileDetails data={query.data} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : null}

      <AlertDialog open={deleteOpen} onOpenChange={(open) => setDeleteOpen(open)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive{" "}
              {query.data ? (
                <>
                  <span className="font-medium text-foreground">{query.data.full_name}</span> (
                  <span className="font-mono text-xs">{query.data.employee_number}</span>)
                </>
              ) : (
                "this employee"
              )}
              . You can activate them again from this screen while they stay archived.
            </AlertDialogDescription>
            {archiveError ? (
              <p className="text-left text-sm text-destructive" role="alert">
                {archiveError}
              </p>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deletePending}
              onClick={() => void handleArchiveConfirm()}
            >
              {deletePending ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={activateOpen} onOpenChange={(open) => setActivateOpen(open)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Activate employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore{" "}
              {query.data ? (
                <>
                  <span className="font-medium text-foreground">{query.data.full_name}</span> (
                  <span className="font-mono text-xs">{query.data.employee_number}</span>)
                </>
              ) : (
                "this employee"
              )}{" "}
              to active status in the directory.
            </AlertDialogDescription>
            {activateError ? (
              <p className="text-left text-sm text-destructive" role="alert">
                {activateError}
              </p>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={activatePending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              disabled={activatePending}
              onClick={() => void handleRestoreConfirm()}
            >
              {activatePending ? "Activating…" : "Activate"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={permanentOpen} onOpenChange={(open) => setPermanentOpen(open)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                This removes{" "}
                {query.data ? (
                  <>
                    <span className="font-medium text-foreground">{query.data.full_name}</span> (
                    <span className="font-mono text-xs">{query.data.employee_number}</span>)
                  </>
                ) : (
                  "this employee"
                )}{" "}
                from the directory database. This cannot be undone.
              </span>
              <span className="block text-xs text-muted-foreground">
                Leave history, entitlements, and login accounts in other services are not removed
                automatically.
              </span>
            </AlertDialogDescription>
            {permanentError ? (
              <p className="text-left text-sm text-destructive" role="alert">
                {permanentError}
              </p>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={permanentPending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={permanentPending}
              onClick={() => void handlePermanentConfirm()}
            >
              {permanentPending ? "Deleting…" : "Delete permanently"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function formatOptional(v: string | null | undefined): string {
  const t = v?.trim();
  return t ? t : "—";
}

function formatDetailDate(v: string | null | undefined): string {
  if (v == null || String(v).trim() === "") return "—";
  const s = String(v).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return s;
}

function formatDateTime(v: string | null | undefined): string {
  if (v == null || String(v).trim() === "") return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function EmployeeFullProfileDetails({ data }: { data: DirectoryEmployeeRecord }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Work &amp; role</h3>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <Detail label="Employee #" value={data.employee_number} mono />
          <Detail label="Department" value={formatOptional(data.department)} />
          <Detail label="Title" value={formatOptional(data.title)} />
          <Detail label="Directory role" value={data.directory_role} />
          <Detail label="Company" value={data.company_key} />
          <Detail label="Location" value={formatOptional(data.location)} />
          <Detail label="Employment type" value={formatOptional(data.employment_type)} />
          <Detail
            label="Status"
            value={<EmployeeStatusBadge status={data.status} />}
          />
          <Detail label="Manager #" value={formatOptional(data.manager_employee_number)} mono />
        </dl>
      </div>

      <Separator />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Dates</h3>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <Detail label="Hire date" value={formatDetailDate(data.hire_date)} />
          <Detail label="Termination date" value={formatDetailDate(data.termination_date)} />
          <Detail label="Record created" value={formatDateTime(data.created_at)} />
        </dl>
      </div>

      <Separator />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Contact</h3>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <Detail label="Email" value={data.email} />
          <Detail label="Phone" value={formatOptional(data.phone)} />
          <Detail label="Address" value={formatOptional(data.address)} className="sm:col-span-2" />
          <Detail label="Country" value={formatOptional(data.country)} />
        </dl>
      </div>

      <Separator />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Personal</h3>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <Detail label="Gender" value={formatOptional(data.gender)} />
          <Detail label="Marital status" value={formatOptional(data.marital_status)} />
          <Detail label="Date of birth" value={formatDetailDate(data.date_of_birth)} />
        </dl>
      </div>

      <Separator />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Emergency contact</h3>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <Detail label="Name" value={formatOptional(data.emergency_contact_name)} />
          <Detail label="Phone" value={formatOptional(data.emergency_contact_phone)} />
        </dl>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  const isString = typeof value === "string" || typeof value === "number";
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd
        className={
          mono && isString
            ? "font-mono text-xs text-foreground"
            : isString
              ? "text-foreground"
              : "text-foreground"
        }
      >
        {value}
      </dd>
    </div>
  );
}
