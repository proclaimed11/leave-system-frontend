import {
  useCallback,
  useMemo,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type FormEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createEmployee } from "@/modules/directory/api/directoryApi";
import { isDirectoryHrOrAdmin } from "@/modules/directory/directoryRoles";
import { useCountries } from "@/modules/directory/hooks/useCountries";
import { useDepartments } from "@/modules/directory/hooks/useDepartments";
import { useDirectoryProfile } from "@/modules/directory/hooks/useDirectoryProfile";
import { useEmploymentTypes } from "@/modules/directory/hooks/useEmploymentTypes";
import { useLocations } from "@/modules/directory/hooks/useLocations";
import type {
  DirectoryEmployeeRecord,
  EmployeeCreatePayload,
} from "@/modules/directory/types";
import { cn } from "@/lib/utils";
import {
  GroupedSelectField,
  SelectField,
  employeeFormSelectClass,
} from "@/pages/employees/employeeFormControls";
import {
  buildLocationGroups,
  countryKeyFromLocationKey,
} from "@/pages/employees/employeeLocationHelpers";

/** Matches directory-svc `employeeValidator` for `employee_number`. */
const EMPLOYEE_NUMBER_REGEX = /^[A-Z0-9]+-\d+$/;

const GENDER_OPTIONS: { value: string; label: string }[] = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
];

const MARITAL_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Not set" },
  { value: "SINGLE", label: "Single" },
  { value: "MARRIED", label: "Married" },
  { value: "DIVORCED", label: "Divorced" },
  { value: "WIDOWED", label: "Widowed" },
];

function nullIfEmpty(v: string): string | null {
  const t = v.trim();
  return t === "" ? null : t;
}

type FormState = {
  employee_number: string;
  full_name: string;
  email: string;
  department: string;
  title: string;
  phone: string;
  gender: string;
  location: string;
  country: string;
  employment_type: string;
  hire_date: string;
  manager_employee_number: string;
  address: string;
  marital_status: string;
  date_of_birth: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
};

const initialForm: FormState = {
  employee_number: "",
  full_name: "",
  email: "",
  department: "",
  title: "",
  phone: "",
  gender: "MALE",
  location: "",
  country: "",
  employment_type: "",
  hire_date: "",
  manager_employee_number: "",
  address: "",
  marital_status: "",
  date_of_birth: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
};

function toPayload(form: FormState): EmployeeCreatePayload {
  return {
    employee_number: form.employee_number.trim().toUpperCase(),
    full_name: form.full_name.trim(),
    email: form.email.trim().toLowerCase(),
    department: nullIfEmpty(form.department),
    title: nullIfEmpty(form.title),
    location: form.location.trim(),
    employment_type: form.employment_type.trim(),
    hire_date: form.hire_date.trim(),
    country: nullIfEmpty(form.country),
    phone: nullIfEmpty(form.phone),
    gender: form.gender.trim().toUpperCase() || null,
    manager_employee_number: nullIfEmpty(form.manager_employee_number),
    address: nullIfEmpty(form.address),
    marital_status: nullIfEmpty(form.marital_status),
    date_of_birth: nullIfEmpty(form.date_of_birth),
    emergency_contact_name: nullIfEmpty(form.emergency_contact_name),
    emergency_contact_phone: nullIfEmpty(form.emergency_contact_phone),
  };
}

function Field({
  label,
  id,
  required: isRequired,
  ...props
}: {
  label: string;
  id: string;
  required?: boolean;
} & ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
        {isRequired ? <span className="text-destructive"> *</span> : null}
      </label>
      <Input id={id} required={isRequired} {...props} />
    </div>
  );
}

export function EmployeeCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profileQuery = useDirectoryProfile();
  const profile = profileQuery.data;
  const settled = profileQuery.isSuccess || profileQuery.isError;
  const canCreate = isDirectoryHrOrAdmin(profile?.directory_role);

  const locationsQuery = useLocations();
  const countriesQuery = useCountries();
  const employmentTypesQuery = useEmploymentTypes();
  const departmentsQuery = useDepartments();

  const [form, setForm] = useState<FormState>(initialForm);
  const [tempPasswordHandoff, setTempPasswordHandoff] = useState<{
    password: string;
    employee: DirectoryEmployeeRecord;
  } | null>(null);

  const locationGroups = useMemo(
    () => buildLocationGroups(locationsQuery.data ?? []),
    [locationsQuery.data]
  );

  const countryOptions = useMemo(() => {
    const rows = countriesQuery.data ?? [];
    const fromDb = rows.map((c) => ({ value: c.country_key, label: c.name }));
    return [{ value: "", label: "Not set" }, ...fromDb];
  }, [countriesQuery.data]);

  const employmentTypeOptions = useMemo(() => {
    const rows = employmentTypesQuery.data ?? [];
    const fromDb = rows.map((r) => ({ value: r.type_key, label: r.name }));
    return [
      { value: "", label: "Select employment type" },
      ...fromDb,
    ];
  }, [employmentTypesQuery.data]);

  const departmentOptions = useMemo(() => {
    const rows = departmentsQuery.data ?? [];
    const fromDb = rows.map((d) => ({
      value: d.dept_key,
      label:
        d.status === "inactive"
          ? `${d.name} (${d.dept_key}) — inactive`
          : `${d.name} (${d.dept_key})`,
    }));
    return [{ value: "", label: "Select department" }, ...fromDb];
  }, [departmentsQuery.data]);

  const mutation = useMutation({
    mutationFn: (body: EmployeeCreatePayload) => createEmployee(body),
    onSuccess: async (data) => {
      const who = `${data.employee.full_name} (${data.employee.employee_number})`;

      // One surface: directory succeeded; identity may be skipped/failed separately — avoid stacked toasts.
      if (data.identity_error) {
        toast.warning("Employee created — LMS login not linked", {
          description: `${who}. ${data.identity_error.slice(0, 320)}`,
          duration: 12_000,
        });
      } else if (data.identity_skipped && data.identity_skip_reason) {
        toast.success("Employee created", {
          description: `${who}\n\n${data.identity_skip_reason}`,
          duration: 12_000,
        });
      } else {
        toast.success("Employee created", {
          description: who,
        });
      }
      if (data.temporary_password) {
        void queryClient.invalidateQueries({ queryKey: ["directory", "employees"] });
        setTempPasswordHandoff({
          password: data.temporary_password,
          employee: data.employee,
        });
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["directory", "employees"] });
      void navigate(`/employees/${encodeURIComponent(data.employee.employee_number)}`, {
        replace: true,
      });
    },
  });

  const dismissTempPasswordModal = useCallback(() => {
    setTempPasswordHandoff((current) => {
      if (!current) return null;
      const employeeNumber = current.employee.employee_number;
      queueMicrotask(() => {
        mutation.reset();
        void navigate(`/employees/${encodeURIComponent(employeeNumber)}`, {
          replace: true,
        });
      });
      return null;
    });
  }, [mutation, navigate]);

  const submitError = (() => {
    if (!mutation.error) return null;
    if (axios.isAxiosError(mutation.error)) {
      const data = mutation.error.response?.data as { error?: string } | undefined;
      return data?.error ?? mutation.error.message;
    }
    return String(mutation.error);
  })();

  const set =
    (key: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const setSelect = (key: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setLocationFromGroupedSelect = (locKey: string) => {
    setForm((prev) => {
      const derived = countryKeyFromLocationKey(locKey);
      const country =
        derived && countriesQuery.data?.some((c) => c.country_key === derived)
          ? derived
          : prev.country;
      return { ...prev, location: locKey, country };
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const empNo = form.employee_number.trim().toUpperCase();
    if (!EMPLOYEE_NUMBER_REGEX.test(empNo)) {
      toast.error("Invalid employee number", {
        description: "Use letters/digits, a hyphen, then digits (e.g. ESL-1024).",
      });
      return;
    }
    if (!form.location.trim()) {
      toast.error("Branch / location required", {
        description: "Pick the site where this employee works.",
      });
      return;
    }
    if (!form.employment_type.trim()) {
      toast.error("Employment type required");
      return;
    }
    if (!form.hire_date.trim()) {
      toast.error("Hire date required");
      return;
    }
    if (
      !form.full_name.trim() ||
      !form.email.trim() ||
      !form.department.trim() ||
      !form.title.trim() ||
      !form.phone.trim() ||
      !form.gender.trim()
    ) {
      toast.error("Missing required fields");
      return;
    }
    mutation.mutate(toPayload({ ...form, employee_number: empNo }));
  };

  if (!settled) {
    return (
      <section className="w-full space-y-6" aria-labelledby="create-employee-title">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      </section>
    );
  }

  if (!canCreate) {
    return (
      <section className="w-full space-y-6" aria-labelledby="create-employee-title">
        <div className="flex flex-wrap gap-2">
          <Link to="/employees" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            ← Employees
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle id="create-employee-title">New employee</CardTitle>
            <CardDescription>
              Creating employees is limited to HR and directory administrators.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    );
  }

  return (
    <section className="w-full space-y-6" aria-labelledby="create-employee-title">
      <div className="flex flex-wrap gap-2">
        <Link to="/employees" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          ← Employees
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle id="create-employee-title">New employee</CardTitle>
          <CardDescription>
            <span className="font-medium text-foreground">Department</span> must be chosen from the
            directory list (matches <code className="rounded bg-muted px-1 py-0.5 text-xs">departments.dept_key</code>
            ). Branch <span className="font-medium text-foreground">location</span>,{" "}
            <span className="font-medium text-foreground">employment type</span>, and{" "}
            <span className="font-medium text-foreground">hire date</span> are required. Employee # format:{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">PREFIX-123</code>. Country is optional
            but usually set when you pick a location.
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

            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-foreground">Identity &amp; role</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Employee #"
                  id="create-employee_number"
                  value={form.employee_number}
                  onChange={set("employee_number")}
                  placeholder="e.g. ESL-1024"
                  autoComplete="off"
                  required
                />
                <Field
                  label="Full name"
                  id="create-full_name"
                  value={form.full_name}
                  onChange={set("full_name")}
                  required
                />
                <Field
                  label="Email"
                  id="create-email"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  required
                />
                <SelectField
                  label="Department"
                  id="create-department"
                  value={form.department}
                  onChange={setSelect("department")}
                  options={departmentOptions}
                  disabled={departmentsQuery.isLoading && departmentOptions.length <= 1}
                  required
                  hint="From GET /departments (scoped to your company when available)."
                />
                {departmentsQuery.isError ? (
                  <p className="text-[11px] text-destructive sm:col-span-2" role="alert">
                    Could not load departments. Check HR/admin access to GET /departments.
                  </p>
                ) : null}
                <Field
                  label="Title"
                  id="create-title"
                  value={form.title}
                  onChange={set("title")}
                  required
                />
                <Field
                  label="Manager employee #"
                  id="create-manager"
                  value={form.manager_employee_number}
                  onChange={set("manager_employee_number")}
                  placeholder="Leave empty if none"
                />
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-foreground">Branch, employment &amp; hire</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <GroupedSelectField
                    label="Location (branch / site)"
                    id="create-location"
                    value={form.location}
                    onChange={setLocationFromGroupedSelect}
                    groups={locationGroups}
                    disabled={locationsQuery.isLoading && locationGroups.length === 0}
                    required
                    placeholderLabel={
                      locationsQuery.isLoading ? "Loading locations…" : "Select branch / site"
                    }
                    hint="Grouped by country. Required so we know which branch this employee belongs to."
                  />
                  {locationsQuery.isError ? (
                    <p className="mt-1 text-[11px] text-destructive" role="alert">
                      Could not load locations. Check HR/admin access to GET /locations.
                    </p>
                  ) : null}
                </div>

                <SelectField
                  label="Country"
                  id="create-country"
                  value={form.country}
                  onChange={setSelect("country")}
                  options={countryOptions}
                  disabled={countriesQuery.isLoading && countryOptions.length <= 1}
                  hint="Optional. Often filled when you pick a location above."
                />
                {countriesQuery.isError ? (
                  <p className="text-[11px] text-destructive sm:col-span-2" role="alert">
                    Could not load countries.
                  </p>
                ) : null}

                <SelectField
                  label="Employment type"
                  id="create-employment_type"
                  value={form.employment_type}
                  onChange={setSelect("employment_type")}
                  options={employmentTypeOptions}
                  disabled={employmentTypesQuery.isLoading && employmentTypeOptions.length <= 1}
                  required
                  hint="From directory employment_types (FK)."
                />
                {employmentTypesQuery.isError ? (
                  <p className="text-[11px] text-destructive sm:col-span-2" role="alert">
                    Could not load employment types.
                  </p>
                ) : null}

                <Field
                  label="Hire date"
                  id="create-hire_date"
                  type="date"
                  value={form.hire_date}
                  onChange={set("hire_date")}
                  required
                />
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-foreground">Contact</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Phone"
                  id="create-phone"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="+255…"
                  required
                />
                <div className="space-y-1.5">
                  <label htmlFor="create-gender" className="text-xs font-medium text-muted-foreground">
                    Gender <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="create-gender"
                    className={employeeFormSelectClass}
                    value={form.gender}
                    onChange={(e) => setSelect("gender")(e.target.value)}
                    required
                  >
                    {GENDER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground">
                    Must match directory gender lookup keys (FK).
                  </p>
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-foreground">Optional</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Address"
                  id="create-address"
                  value={form.address}
                  onChange={set("address")}
                />
                <div className="space-y-1.5">
                  <label htmlFor="create-marital" className="text-xs font-medium text-muted-foreground">
                    Marital status
                  </label>
                  <select
                    id="create-marital"
                    className={employeeFormSelectClass}
                    value={form.marital_status}
                    onChange={(e) => setSelect("marital_status")(e.target.value)}
                  >
                    {MARITAL_OPTIONS.map((o) => (
                      <option key={o.value === "" ? "__empty" : o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Field
                  label="Date of birth"
                  id="create-dob"
                  type="date"
                  value={form.date_of_birth}
                  onChange={set("date_of_birth")}
                />
                <Field
                  label="Emergency contact name"
                  id="create-emergency-name"
                  value={form.emergency_contact_name}
                  onChange={set("emergency_contact_name")}
                />
                <Field
                  label="Emergency contact phone"
                  id="create-emergency-phone"
                  value={form.emergency_contact_phone}
                  onChange={set("emergency_contact_phone")}
                />
              </div>
            </fieldset>
          </CardContent>
          <CardFooter className="flex flex-wrap justify-end gap-2 border-t border-border bg-transparent pt-4">
            <Link
              to="/employees"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Cancel
            </Link>
            <Button type="submit" size="sm" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create employee"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Dialog
        open={Boolean(tempPasswordHandoff)}
        onOpenChange={(open) => {
          if (!open) dismissTempPasswordModal();
        }}
        disablePointerDismissal
      >
        <DialogContent className="sm:max-w-md" aria-describedby="temp-password-dialog-desc">
          {tempPasswordHandoff ? (
            <>
              <DialogHeader>
                <DialogTitle>One-time LMS password</DialogTitle>
                <DialogDescription id="temp-password-dialog-desc">
                  For{" "}
                  <span className="font-medium text-foreground">
                    {tempPasswordHandoff.employee.full_name}
                  </span>{" "}
                  ({tempPasswordHandoff.employee.employee_number}). Copy it now — it is not stored and
                  cannot be shown again. They must choose a new password on first login.
                </DialogDescription>
              </DialogHeader>
              <Input
                readOnly
                value={tempPasswordHandoff.password}
                className="h-11 font-mono text-base tracking-wide"
                onFocus={(e) => e.target.select()}
              />
              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    void navigator.clipboard.writeText(tempPasswordHandoff.password);
                    toast.success("Password copied to clipboard");
                  }}
                >
                  Copy password
                </Button>
                <Button type="button" onClick={dismissTempPasswordModal}>
                  Continue to employee
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
