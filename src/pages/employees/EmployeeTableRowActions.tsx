import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { MoreVertical, Pencil, RotateCcw, Skull, Trash2 } from "lucide-react";
import { Popover } from "@base-ui/react/popover";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  archiveEmployee,
  deleteEmployeePermanently,
  restoreEmployee,
} from "@/modules/directory/api/directoryApi";
import { cn } from "@/lib/utils";

type EmployeeTableRowActionsProps = {
  employeeNumber: string;
  fullName: string;
  status: string;
  canManageEmployees: boolean;
};

export function EmployeeTableRowActions({
  employeeNumber,
  fullName,
  status,
  canManageEmployees,
}: EmployeeTableRowActionsProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [permanentOpen, setPermanentOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [permanentError, setPermanentError] = useState<string | null>(null);
  const isArchived = status === "ARCHIVED";

  const encoded = encodeURIComponent(employeeNumber);

  const handleEdit = () => {
    setMenuOpen(false);
    void navigate(`/employees/${encoded}/edit`);
  };

  const openDelete = () => {
    setArchiveError(null);
    setMenuOpen(false);
    setDeleteOpen(true);
  };

  const openRestore = () => {
    setArchiveError(null);
    setMenuOpen(false);
    setRestoreOpen(true);
  };

  const openPermanent = () => {
    setPermanentError(null);
    setMenuOpen(false);
    setPermanentOpen(true);
  };

  const handleRestoreConfirm = async () => {
    setPending(true);
    setArchiveError(null);
    try {
      await restoreEmployee(employeeNumber);
      setRestoreOpen(false);
      toast.success("Employee activated", {
        description: `${fullName} (${employeeNumber}) is active in the directory again.`,
      });
      await queryClient.invalidateQueries({ queryKey: ["directory", "employees"] });
      await queryClient.invalidateQueries({ queryKey: ["directory", "profile"] });
      await queryClient.invalidateQueries({
        queryKey: ["directory", "employee", employeeNumber],
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { error?: string } | undefined;
        setArchiveError(data?.error ?? err.message);
      } else {
        setArchiveError(String(err));
      }
    } finally {
      setPending(false);
    }
  };

  const handlePermanentConfirm = async () => {
    setPending(true);
    setPermanentError(null);
    try {
      await deleteEmployeePermanently(employeeNumber);
      setPermanentOpen(false);
      toast.success("Employee removed permanently", {
        description: `${fullName} (${employeeNumber}) was deleted from the directory.`,
      });
      await queryClient.invalidateQueries({ queryKey: ["directory", "employees"] });
      await queryClient.invalidateQueries({ queryKey: ["directory", "profile"] });
      await queryClient.removeQueries({ queryKey: ["directory", "employee", employeeNumber] });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { error?: string } | undefined;
        setPermanentError(data?.error ?? err.message);
      } else {
        setPermanentError(String(err));
      }
    } finally {
      setPending(false);
    }
  };

  const handleArchiveConfirm = async () => {
    setPending(true);
    setArchiveError(null);
    try {
      await archiveEmployee(employeeNumber);
      setDeleteOpen(false);
      toast.success("Employee archived", {
        description: `${fullName} (${employeeNumber}) was removed from the active directory.`,
      });
      await queryClient.invalidateQueries({ queryKey: ["directory", "employees"] });
      await queryClient.invalidateQueries({ queryKey: ["directory", "profile"] });
      await queryClient.invalidateQueries({
        queryKey: ["directory", "employee", employeeNumber],
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { error?: string } | undefined;
        setArchiveError(data?.error ?? err.message);
      } else {
        setArchiveError(String(err));
      }
    } finally {
      setPending(false);
    }
  };

  if (!canManageEmployees) {
    return null;
  }

  return (
    <>
      <Popover.Root open={menuOpen} onOpenChange={(open) => setMenuOpen(open)}>
        <Popover.Trigger
          type="button"
          className={cn(
            "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors",
            "hover:bg-muted hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "data-popup-open:bg-muted data-popup-open:text-foreground"
          )}
          aria-label={`Actions for ${fullName}`}
        >
          <MoreVertical className="size-4" aria-hidden />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="bottom" align="end" sideOffset={4} className="z-[80]">
            <Popover.Popup className="min-w-[11rem] rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none">
              <Popover.Title className="sr-only">Actions for {fullName}</Popover.Title>
              {isArchived ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-full justify-start gap-2 px-2 font-normal"
                    onClick={openRestore}
                  >
                    <RotateCcw className="size-3.5 shrink-0 opacity-80" aria-hidden />
                    Activate
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-full justify-start gap-2 px-2 font-normal text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={openPermanent}
                  >
                    <Skull className="size-3.5 shrink-0 opacity-80" aria-hidden />
                    Delete permanently
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-full justify-start gap-2 px-2 font-normal"
                    onClick={handleEdit}
                  >
                    <Pencil className="size-3.5 shrink-0 opacity-80" aria-hidden />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-full justify-start gap-2 px-2 font-normal text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={openDelete}
                  >
                    <Trash2 className="size-3.5 shrink-0 opacity-80" aria-hidden />
                    Delete
                  </Button>
                </>
              )}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>

      <AlertDialog open={deleteOpen} onOpenChange={(open) => setDeleteOpen(open)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive{" "}
              <span className="font-medium text-foreground">{fullName}</span> (
              <span className="font-mono text-xs">{employeeNumber}</span>). You can activate them
              again from the directory while they stay archived.
            </AlertDialogDescription>
            {archiveError ? (
              <p className="text-left text-sm text-destructive" role="alert">
                {archiveError}
              </p>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => void handleArchiveConfirm()}
            >
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={restoreOpen} onOpenChange={(open) => setRestoreOpen(open)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Activate employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore{" "}
              <span className="font-medium text-foreground">{fullName}</span> (
              <span className="font-mono text-xs">{employeeNumber}</span>) to active status in the
              directory.
            </AlertDialogDescription>
            {archiveError ? (
              <p className="text-left text-sm text-destructive" role="alert">
                {archiveError}
              </p>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              disabled={pending}
              onClick={() => void handleRestoreConfirm()}
            >
              {pending ? "Activating…" : "Activate"}
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
                <span className="font-medium text-foreground">{fullName}</span> (
                <span className="font-mono text-xs">{employeeNumber}</span>) from the directory
                database. This cannot be undone.
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
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => void handlePermanentConfirm()}
            >
              {pending ? "Deleting…" : "Delete permanently"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
