import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Search, UserPlus, X } from "lucide-react";

import { EmployeeStatusBadge } from "@/components/directory/EmployeeStatusBadge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DEFAULT_EMPLOYEE_LIST_SORT_BY,
  DEFAULT_EMPLOYEE_LIST_SORT_DIR,
  EMPLOYEE_LIST_SORT_BY,
  type EmployeeListSortBy,
  type EmployeeListSortDir,
} from "@/modules/directory/employeeListSort";
import { isDirectoryHrOrAdmin } from "@/modules/directory/directoryRoles";
import { useDirectoryProfile } from "@/modules/directory/hooks/useDirectoryProfile";
import { useEmployeesList } from "@/modules/directory/hooks/useEmployeesList";
import type { EmployeeListRow } from "@/modules/directory/types";
import { cn } from "@/lib/utils";
import { EmployeeTableRowActions } from "@/pages/employees/EmployeeTableRowActions";

const selectClass = cn(
  "h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
);

/** Company-wide employee directory at `/employees`. */
export function EmployeesPage() {
  const navigate = useNavigate();
  const profileQuery = useDirectoryProfile();
  const companyKey = profileQuery.data?.company_key;
  const canManageEmployees = isDirectoryHrOrAdmin(profileQuery.data?.directory_role);
  const profileSettled = profileQuery.isSuccess || profileQuery.isError;
  const [sortBy, setSortBy] = useState<EmployeeListSortBy>(DEFAULT_EMPLOYEE_LIST_SORT_BY);
  const [sortDir, setSortDir] = useState<EmployeeListSortDir>(DEFAULT_EMPLOYEE_LIST_SORT_DIR);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => setSearchQuery(searchInput.trim()), 400);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const listParams = useMemo(
    () => ({
      page: 1,
      limit: 500,
      sort_by: sortBy,
      sort_dir: sortDir,
      ...(companyKey ? { company_key: companyKey } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
    }),
    [companyKey, sortBy, sortDir, searchQuery]
  );

  const employeesQuery = useEmployeesList(listParams, { enabled: profileSettled });

  const errorMessage = (() => {
    if (!employeesQuery.error) return null;
    if (axios.isAxiosError(employeesQuery.error)) {
      const data = employeesQuery.error.response?.data as { error?: string } | undefined;
      return data?.error ?? employeesQuery.error.message;
    }
    return String(employeesQuery.error);
  })();

  const employeeColumns = useMemo<DataTableColumn<EmployeeListRow>[]>(
    () => [
      {
        id: "employee_number",
        header: "Employee #",
        headerClassName: "whitespace-nowrap",
        cellClassName: "whitespace-nowrap px-3 py-2 font-mono text-xs text-foreground",
        cell: (row) => row.employee_number,
      },
      {
        id: "full_name",
        header: "Name",
        cellClassName: "max-w-[12rem] truncate px-3 py-2 font-medium text-foreground",
        cell: (row) => row.full_name,
      },
      {
        id: "email",
        header: "Email",
        cellClassName: "max-w-[14rem] truncate px-3 py-2 text-muted-foreground",
        cell: (row) => row.email,
      },
      {
        id: "department",
        header: "Department",
        cellClassName: "whitespace-nowrap px-3 py-2 text-muted-foreground",
        cell: (row) => row.department ?? "—",
      },
      {
        id: "title",
        header: "Title",
        cellClassName: "max-w-[10rem] truncate px-3 py-2 text-muted-foreground",
        cell: (row) => row.title ?? "—",
      },
      {
        id: "directory_role",
        header: "Role",
        cellClassName: "whitespace-nowrap px-3 py-2 text-muted-foreground",
        cell: (row) => row.directory_role,
      },
      {
        id: "status",
        header: "Status",
        cellClassName: "whitespace-nowrap px-3 py-2 align-middle",
        cell: (row) => <EmployeeStatusBadge status={row.status} />,
      },
      {
        id: "location",
        header: "Location",
        cellClassName: "whitespace-nowrap px-3 py-2 text-muted-foreground",
        cell: (row) => row.location ?? "—",
      },
      {
        id: "actions",
        header: <span className="sr-only">Actions</span>,
        headerClassName: "w-12 whitespace-nowrap px-2 py-2.5 text-center",
        cellClassName: "px-1 py-1 text-center",
        isolateRowClick: true,
        cell: (row) => (
          <EmployeeTableRowActions
            employeeNumber={row.employee_number}
            fullName={row.full_name}
            status={row.status}
            canManageEmployees={canManageEmployees}
          />
        ),
      },
    ],
    [canManageEmployees]
  );

  const listData = employeesQuery.data?.employees ?? [];

  const tableFooter = (() => {
    const res = employeesQuery.data;
    if (!res) return null;
    if (res.total > 0) {
      return (
        <>
          {searchQuery ? (
            <>
              <span className="font-medium text-foreground">{`"${searchQuery}"`}</span>
              {" · "}
            </>
          ) : null}
          Showing {res.count} of {res.total} employee
          {res.total === 1 ? "" : "s"}
          {res.total_pages > 1
            ? ` (page ${res.page} of ${res.total_pages}; increase limit to see more)`
            : null}
        </>
      );
    }
    return (
      <>
        {searchQuery ? (
          <>
            No employees match <span className="font-medium text-foreground">{`"${searchQuery}"`}</span>
            . Try different keywords or clear search.
          </>
        ) : (
          "No employees match this view."
        )}
      </>
    );
  })();

  return (
    <section className="w-full space-y-6" aria-labelledby="employees-page-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            id="employees-page-title"
            className="font-heading text-2xl font-semibold tracking-tight text-foreground"
          >
            Employees
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Company directory
            {companyKey ? (
              <>
                {" "}
                · <span className="font-medium text-foreground">{companyKey}</span>
              </>
            ) : null}
            . Search, sort, and open a profile.
          </p>
        </div>
        {canManageEmployees ? (
          <Link
            to="/employees/new"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "shrink-0 gap-1.5 no-underline"
            )}
          >
            <UserPlus className="size-4" aria-hidden />
            Add employee
          </Link>
        ) : null}
      </div>

      {!profileSettled || (employeesQuery.isLoading && !employeesQuery.data) ? (
        <div className="space-y-2 rounded-lg border border-border bg-card p-4">
          <Skeleton className="h-8 w-full max-w-md" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : employeesQuery.isError ? (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <p className="font-medium">Could not load employees</p>
          <p className="mt-1 text-xs opacity-90">{errorMessage}</p>
        </div>
      ) : (
        <DataTable<EmployeeListRow>
          columns={employeeColumns}
          data={listData}
          getRowId={(row) => row.employee_number}
          onRowClick={(row) =>
            void navigate(`/employees/${encodeURIComponent(row.employee_number)}`)
          }
          getRowAriaLabel={(row) => `View profile for ${row.full_name}`}
          toolbar={
            <>
              <div className="relative min-w-0 flex-1 sm:max-w-md">
                <label htmlFor="employees-directory-search" className="sr-only">
                  Search employees
                </label>
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="employees-directory-search"
                  type="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  placeholder="search keyword#…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setSearchQuery(searchInput.trim());
                    }
                    if (e.key === "Escape" && searchInput) {
                      e.preventDefault();
                      setSearchInput("");
                      setSearchQuery("");
                    }
                  }}
                  className={cn("h-9 pl-9", searchInput ? "pr-9" : "pr-2.5")}
                />
                {searchInput ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0.5 top-1/2 size-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                    onClick={() => {
                      setSearchInput("");
                      setSearchQuery("");
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                ) : null}
              </div>
              {employeesQuery.isFetching ? (
                <div
                  className="flex items-center gap-1.5 text-xs text-muted-foreground sm:shrink-0"
                  aria-live="polite"
                >
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Updating…
                </div>
              ) : null}
              <div className="flex flex-col gap-1.5 sm:min-w-[11rem]">
                <label
                  htmlFor="employees-directory-sort-by"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Sort by
                </label>
                <select
                  id="employees-directory-sort-by"
                  className={cn(selectClass, "min-w-0 sm:min-w-[11rem]")}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as EmployeeListSortBy)}
                >
                  {EMPLOYEE_LIST_SORT_BY.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 sm:min-w-[9rem]">
                <label
                  htmlFor="employees-directory-sort-dir"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Order
                </label>
                <select
                  id="employees-directory-sort-dir"
                  className={cn(selectClass, "min-w-0 sm:min-w-[9rem]")}
                  value={sortDir}
                  onChange={(e) => setSortDir(e.target.value as EmployeeListSortDir)}
                >
                  <option value="asc">Ascending (A→Z)</option>
                  <option value="desc">Descending (Z→A)</option>
                </select>
              </div>
            </>
          }
          footer={tableFooter}
        />
      )}
    </section>
  );
}
