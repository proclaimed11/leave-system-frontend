import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { format, isValid, parse } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover } from "@base-ui/react/popover";

import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeeAvatarUpload } from "@/components/directory/EmployeeAvatarUpload";
import { updateEmployee } from "@/modules/directory/api/directoryApi";
import { useCountries } from "@/modules/directory/hooks/useCountries";
import { useDepartments } from "@/modules/directory/hooks/useDepartments";
import { useDirectoryRoles } from "@/modules/directory/hooks/useDirectoryRoles";
import { useEmploymentTypes } from "@/modules/directory/hooks/useEmploymentTypes";
import { useEmployeeDetail } from "@/modules/directory/hooks/useEmployeeDetail";
import { useLocations } from "@/modules/directory/hooks/useLocations";
import type {
  CountryRow,
  DirectoryEmployeeRecord,
  DirectoryLocationRow,
  DirectoryRoleRow,
  EmployeeUpdatePayload,
  EmploymentTypeRow,
} from "@/modules/directory/types";
import { cn } from "@/lib/utils";
import { SelectField as DepartmentSelectField } from "@/pages/employees/employeeFormControls";

/** Must match `directory-svc` `genders` seed keys. */
const GENDER_KEYS = new Set(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]);
const GENDER_SELECT_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Not set" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
];

/** Must match `directory-svc` `marital_statuses` seed keys. */
const MARITAL_KEYS = new Set(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]);
const MARITAL_SELECT_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Not set" },
  { value: "SINGLE", label: "Single" },
  { value: "MARRIED", label: "Married" },
  { value: "DIVORCED", label: "Divorced" },
  { value: "WIDOWED", label: "Widowed" },
];

const selectClass = cn(
  "h-8 w-full rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
);

const YMD = "yyyy-MM-dd";

/** Directory API often returns `DATE` as ISO (`1990-05-15T00:00:00.000Z`). Pickers need plain `YYYY-MM-DD`. */
function stripToYmd(v: string | null | undefined): string {
  if (v == null) return "";
  const s = String(v).trim();
  if (!s) return "";
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : s;
}

function parseYmd(raw: string): Date | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const ymd = t.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  if (!ymd) return undefined;
  const d = parse(ymd, YMD, new Date(2000, 0, 1));
  return isValid(d) ? d : undefined;
}

function toYmd(d: Date): string {
  return format(d, YMD);
}

type EditFormState = {
  full_name: string;
  email: string;
  department: string;
  title: string;
  manager_employee_number: string;
  status: string;
  directory_role: string;
  company_key: string;
  location: string;
  employment_type: string;
  phone: string;
  address: string;
  country: string;
  gender: string;
  marital_status: string;
  date_of_birth: string;
  hire_date: string;
  termination_date: string;
  avatar_url: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
};

function nullIfEmpty(v: string): string | null {
  const t = v.trim();
  return t === "" ? null : t;
}

function normalizeGenderFormValue(raw: string | null | undefined): string {
  const t = (raw ?? "").trim().toUpperCase();
  return GENDER_KEYS.has(t) ? t : "";
}

function normalizeMaritalFormValue(raw: string | null | undefined): string {
  const t = (raw ?? "").trim().toUpperCase();
  return MARITAL_KEYS.has(t) ? t : "";
}

function genderToPayload(v: string): string | null {
  const t = v.trim().toUpperCase();
  return GENDER_KEYS.has(t) ? t : null;
}

function maritalToPayload(v: string): string | null {
  const t = v.trim().toUpperCase();
  return MARITAL_KEYS.has(t) ? t : null;
}

/** Map employee row role to a `roles.role_key` (FK), tolerating legacy casing. */
function canonicalDirectoryRole(
  raw: string | null | undefined,
  roles: DirectoryRoleRow[]
): string {
  const t = (raw ?? "").trim();
  if (!t || roles.length === 0) return t;
  if (roles.some((r) => r.role_key === t)) return t;
  const hit = roles.find((r) => r.role_key.toLowerCase() === t.toLowerCase());
  return hit?.role_key ?? t;
}

function canonicalEmploymentType(
  raw: string | null | undefined,
  types: EmploymentTypeRow[]
): string {
  const t = (raw ?? "").trim();
  if (!t || types.length === 0) return t;
  if (types.some((r) => r.type_key === t)) return t;
  const hit = types.find((r) => r.type_key.toLowerCase() === t.toLowerCase());
  return hit?.type_key ?? t;
}

function canonicalCountry(raw: string | null | undefined, countries: CountryRow[]): string {
  const t = (raw ?? "").trim();
  if (!t || countries.length === 0) return t;
  if (countries.some((c) => c.country_key === t)) return t;
  const hit = countries.find((c) => c.country_key.toLowerCase() === t.toLowerCase());
  return hit?.country_key ?? t;
}

/** Legacy keys from older `locations` seed (pre country-group migration). */
const LEGACY_LOCATION_KEY: Record<string, string> = {
  MOMBASA: "KE_MOMBASA",
  NAIROBI: "KE_NAIROBI",
  KISUMU: "KE_NAIROBI",
  LAMU: "KE_NAIROBI",
  ELDORET: "KE_NAIROBI",
};

const LOCATION_GROUP_ORDER = ["Tanzania", "Kenya", "Uganda", "Rwanda"] as const;

function countryKeyFromLocationKey(locKey: string): string {
  const k = locKey.trim().toUpperCase();
  if (k.startsWith("TZ_")) return "TANZANIA";
  if (k.startsWith("KE_")) return "KENYA";
  if (k.startsWith("UG_")) return "UGANDA";
  if (k.startsWith("RW_")) return "RWANDA";
  return "";
}

function buildLocationGroups(
  rows: DirectoryLocationRow[]
): { group: string; items: { value: string; label: string }[] }[] {
  const map = new Map<string, { value: string; label: string }[]>();
  for (const r of rows) {
    const g = (r.country_group || "Other").trim() || "Other";
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push({ value: r.location_key, label: r.name });
  }
  const out: { group: string; items: { value: string; label: string }[] }[] = [];
  for (const label of LOCATION_GROUP_ORDER) {
    const items = map.get(label);
    if (items?.length) out.push({ group: label, items });
    map.delete(label);
  }
  for (const [group, items] of map) {
    if (items.length) out.push({ group, items });
  }
  return out;
}

function canonicalLocationKey(
  raw: string | null | undefined,
  locations: DirectoryLocationRow[]
): string {
  let t = (raw ?? "").trim();
  const mapped = LEGACY_LOCATION_KEY[t.toUpperCase()];
  if (mapped) t = mapped;
  if (!t || locations.length === 0) return t;
  if (locations.some((l) => l.location_key === t)) return t;
  const hit = locations.find((l) => l.location_key.toLowerCase() === t.toLowerCase());
  return hit?.location_key ?? t;
}

function recordToForm(e: DirectoryEmployeeRecord): EditFormState {
  return {
    full_name: e.full_name ?? "",
    email: e.email ?? "",
    department: e.department ?? "",
    title: e.title ?? "",
    manager_employee_number: e.manager_employee_number ?? "",
    status: e.status ?? "",
    directory_role: e.directory_role ?? "",
    company_key: e.company_key ?? "",
    location: e.location ?? "",
    employment_type: e.employment_type ?? "",
    phone: e.phone ?? "",
    address: e.address ?? "",
    country: e.country ?? "",
    gender: normalizeGenderFormValue(e.gender),
    marital_status: normalizeMaritalFormValue(e.marital_status),
    date_of_birth: stripToYmd(e.date_of_birth),
    hire_date: stripToYmd(e.hire_date),
    termination_date: stripToYmd(e.termination_date),
    avatar_url: e.avatar_url ?? "",
    emergency_contact_name: e.emergency_contact_name ?? "",
    emergency_contact_phone: e.emergency_contact_phone ?? "",
  };
}

function formToPayload(form: EditFormState): EmployeeUpdatePayload {
  return {
    full_name: form.full_name.trim(),
    email: form.email.trim().toLowerCase(),
    department: nullIfEmpty(form.department),
    title: nullIfEmpty(form.title),
    manager_employee_number: nullIfEmpty(form.manager_employee_number),
    status: form.status.trim(),
    directory_role: form.directory_role.trim(),
    company_key: form.company_key.trim(),
    location: form.location.trim(),
    employment_type: nullIfEmpty(form.employment_type),
    phone: nullIfEmpty(form.phone),
    address: nullIfEmpty(form.address),
    country: nullIfEmpty(form.country),
    gender: genderToPayload(form.gender),
    marital_status: maritalToPayload(form.marital_status),
    date_of_birth: nullIfEmpty(form.date_of_birth),
    hire_date: nullIfEmpty(form.hire_date),
    termination_date: nullIfEmpty(form.termination_date),
    avatar_url: nullIfEmpty(form.avatar_url),
    emergency_contact_name: nullIfEmpty(form.emergency_contact_name),
    emergency_contact_phone: nullIfEmpty(form.emergency_contact_phone),
  };
}

export function EmployeeEditPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { employeeNumber: raw } = useParams<{ employeeNumber: string }>();
  const employeeNumber = useMemo(
    () => (raw ? decodeURIComponent(raw) : undefined),
    [raw]
  );

  const detailQuery = useEmployeeDetail(employeeNumber);
  const rolesQuery = useDirectoryRoles();
  const employmentTypesQuery = useEmploymentTypes();
  const countriesQuery = useCountries();
  const locationsQuery = useLocations();
  const [form, setForm] = useState<EditFormState | null>(null);

  const departmentsQuery = useDepartments(
    form?.company_key ? { company_key: form.company_key } : {}
  );

  useEffect(() => {
    if (!detailQuery.data) return;
    setForm(recordToForm(detailQuery.data));
  }, [detailQuery.data]);

  useEffect(() => {
    const rows = rolesQuery.data;
    if (!rows?.length) return;
    setForm((prev) => {
      if (!prev) return prev;
      const next = canonicalDirectoryRole(prev.directory_role, rows);
      return next === prev.directory_role ? prev : { ...prev, directory_role: next };
    });
  }, [rolesQuery.data]);

  useEffect(() => {
    const rows = employmentTypesQuery.data;
    if (!rows?.length) return;
    setForm((prev) => {
      if (!prev) return prev;
      const next = canonicalEmploymentType(prev.employment_type, rows);
      return next === prev.employment_type ? prev : { ...prev, employment_type: next };
    });
  }, [employmentTypesQuery.data]);

  useEffect(() => {
    const rows = countriesQuery.data;
    if (!rows?.length) return;
    setForm((prev) => {
      if (!prev) return prev;
      const next = canonicalCountry(prev.country, rows);
      return next === prev.country ? prev : { ...prev, country: next };
    });
  }, [countriesQuery.data]);

  useEffect(() => {
    const rows = locationsQuery.data;
    if (!rows?.length) return;
    setForm((prev) => {
      if (!prev) return prev;
      const nextLoc = canonicalLocationKey(prev.location, rows);
      const derivedCountry = countryKeyFromLocationKey(nextLoc);
      const nextCountry =
        derivedCountry && countriesQuery.data?.some((c) => c.country_key === derivedCountry)
          ? derivedCountry
          : prev.country;
      if (nextLoc === prev.location && nextCountry === prev.country) return prev;
      return { ...prev, location: nextLoc, country: nextCountry };
    });
  }, [locationsQuery.data, countriesQuery.data]);

  const directoryRoleOptions = useMemo(() => {
    const rows = rolesQuery.data ?? [];
    const base = rows.map((r) => ({ value: r.role_key, label: r.name }));
    const cur = form?.directory_role?.trim();
    if (cur && !rows.some((r) => r.role_key === cur)) {
      return [{ value: cur, label: `${cur} (not in directory)` }, ...base];
    }
    return base;
  }, [rolesQuery.data, form?.directory_role]);

  const employmentTypeOptions = useMemo(() => {
    const rows = employmentTypesQuery.data ?? [];
    const fromDb = rows.map((r) => ({ value: r.type_key, label: r.name }));
    const cur = form?.employment_type?.trim();
    const extra =
      cur && !rows.some((r) => r.type_key === cur)
        ? [{ value: cur, label: `${cur} (not in directory)` }]
        : [];
    return [{ value: "", label: "Not set" }, ...extra, ...fromDb];
  }, [employmentTypesQuery.data, form?.employment_type]);

  const departmentOptions = useMemo(() => {
    const rows = departmentsQuery.data ?? [];
    const fromDb = rows.map((d) => ({
      value: d.dept_key,
      label:
        d.status === "inactive"
          ? `${d.name} (${d.dept_key}) — inactive`
          : `${d.name} (${d.dept_key})`,
    }));
    const cur = form?.department?.trim();
    const extra =
      cur && !rows.some((d) => d.dept_key === cur)
        ? [{ value: cur, label: `${cur} (not in directory)` }]
        : [];
    const blank = !cur ? [{ value: "", label: "Select department" }] : [];
    return [...blank, ...extra, ...fromDb];
  }, [departmentsQuery.data, form?.department]);

  const countryOptions = useMemo(() => {
    const rows = countriesQuery.data ?? [];
    const fromDb = rows.map((c) => ({ value: c.country_key, label: c.name }));
    const cur = form?.country?.trim();
    const extra =
      cur && !rows.some((c) => c.country_key === cur)
        ? [{ value: cur, label: `${cur} (not in directory)` }]
        : [];
    return [{ value: "", label: "Not set" }, ...extra, ...fromDb];
  }, [countriesQuery.data, form?.country]);

  const locationGroups = useMemo(() => {
    const rows = locationsQuery.data ?? [];
    const groups = buildLocationGroups(rows);
    const cur = form?.location?.trim();
    if (cur && !rows.some((l) => l.location_key === cur)) {
      return [
        { group: "Other", items: [{ value: cur, label: `${cur} (legacy)` }] },
        ...groups,
      ];
    }
    return groups;
  }, [locationsQuery.data, form?.location]);

  const mutation = useMutation({
    mutationFn: (payload: EmployeeUpdatePayload) =>
      updateEmployee(employeeNumber!, payload),
    onSuccess: async (updated) => {
      toast.success("Employee updated", {
        description: `${updated.full_name} (${updated.employee_number}) was saved.`,
      });
      await queryClient.invalidateQueries({ queryKey: ["directory", "employees"] });
      await queryClient.invalidateQueries({
        queryKey: ["directory", "employee", employeeNumber],
      });
      await queryClient.invalidateQueries({ queryKey: ["directory", "profile"] });
      void navigate(`/employees/${encodeURIComponent(employeeNumber!)}`, { replace: true });
    },
  });

  const submitError = (() => {
    if (!mutation.error) return null;
    if (axios.isAxiosError(mutation.error)) {
      const data = mutation.error.response?.data as { error?: string } | undefined;
      return data?.error ?? mutation.error.message;
    }
    return String(mutation.error);
  })();

  const loadError = (() => {
    if (!detailQuery.error) return null;
    if (axios.isAxiosError(detailQuery.error)) {
      const data = detailQuery.error.response?.data as { error?: string } | undefined;
      return data?.error ?? detailQuery.error.message;
    }
    return String(detailQuery.error);
  })();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !employeeNumber) return;
    if (!form.full_name.trim() || !form.email.trim()) return;
    if (!form.location.trim()) return;
    mutation.mutate(formToPayload(form));
  };

  const set =
    (key: keyof EditFormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => (prev ? { ...prev, [key]: e.target.value } : prev));
    };

  const setSelect =
    (key: keyof EditFormState) =>
    (value: string) => {
      setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    };

  const setLocationFromGroupedSelect = (locKey: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      const derived = countryKeyFromLocationKey(locKey);
      const country =
        derived && countriesQuery.data?.some((c) => c.country_key === derived)
          ? derived
          : prev.country;
      return { ...prev, location: locKey, country };
    });
  };

  if (!employeeNumber) {
    return (
      <p className="text-sm text-muted-foreground">Missing employee in URL.</p>
    );
  }

  return (
    <section className="w-full max-w-3xl space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link to="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          ← Overview
        </Link>
        <Link
          to={`/employees/${encodeURIComponent(employeeNumber)}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          View profile
        </Link>
      </div>

      {detailQuery.isLoading || !form ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      ) : detailQuery.isError ? (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <p className="font-medium">Could not load employee</p>
          <p className="mt-1 text-xs opacity-90">{loadError}</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Edit employee</CardTitle>
            <CardDescription>
              Changes are saved to directory (
              <code className="rounded bg-muted px-1 py-0.5 text-xs">PUT /employees/:id</code>
              ). HR or admin access required.
            </CardDescription>
            <p className="pt-1 font-mono text-xs text-muted-foreground">{employeeNumber}</p>
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
                <legend className="text-sm font-medium text-foreground">Core</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Full name"
                    id="full_name"
                    value={form.full_name}
                    onChange={set("full_name")}
                    required
                  />
                  <Field
                    label="Email"
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    required
                  />
                  <DepartmentSelectField
                    label="Department"
                    id="department"
                    value={form.department}
                    onChange={setSelect("department")}
                    options={departmentOptions}
                    disabled={departmentsQuery.isLoading && departmentOptions.length === 0}
                    hint="From GET /departments — must match departments.dept_key (FK)."
                  />
                  {departmentsQuery.isError ? (
                    <p className="text-[11px] text-destructive sm:col-span-2" role="alert">
                      Could not load departments. Check HR/admin access to GET /departments.
                    </p>
                  ) : null}
                  <Field label="Title" id="title" value={form.title} onChange={set("title")} />
                  <Field
                    label="Manager employee #"
                    id="manager_employee_number"
                    value={form.manager_employee_number}
                    onChange={set("manager_employee_number")}
                    placeholder="Leave empty if none"
                  />
                  <Field
                    label="Status (set via Delete or Activate)"
                    id="status"
                    value={form.status}
                    onChange={set("status")}
                    disabled
                    title="Archive or activate the employee from the overview or profile; status cannot be edited here."
                  />
                  <SelectField
                    label="Directory role"
                    id="directory_role"
                    value={form.directory_role}
                    onChange={setSelect("directory_role")}
                    options={directoryRoleOptions}
                    disabled={rolesQuery.isLoading && directoryRoleOptions.length === 0}
                    hint="Values come from the directory `roles` table (FK on `employees.directory_role`)."
                  />
                  {rolesQuery.isError ? (
                    <p className="text-[11px] text-destructive sm:col-span-2" role="alert">
                      Could not load role list. Check network or HR/admin access to{" "}
                      <code className="rounded bg-muted px-1 py-0.5 text-[10px]">GET /roles</code>.
                    </p>
                  ) : null}
                  <Field
                    label="Company key"
                    id="company_key"
                    value={form.company_key}
                    onChange={set("company_key")}
                    placeholder="e.g. ESL"
                  />
                  <GroupedSelectField
                    label="Location (site)"
                    id="location"
                    value={form.location}
                    onChange={setLocationFromGroupedSelect}
                    groups={locationGroups}
                    disabled={locationsQuery.isLoading && locationGroups.length === 0}
                    required
                    hint="Grouped by country: Tanzania, Kenya, Uganda, Rwanda. Picking a site sets Country to match."
                  />
                  {locationsQuery.isError ? (
                    <p className="text-[11px] text-destructive sm:col-span-2" role="alert">
                      Could not load locations. Check HR/admin access to{" "}
                      <code className="rounded bg-muted px-1 py-0.5 text-[10px]">GET /locations</code>.
                    </p>
                  ) : null}
                  <SelectField
                    label="Employment type"
                    id="employment_type"
                    value={form.employment_type}
                    onChange={setSelect("employment_type")}
                    options={employmentTypeOptions}
                    disabled={
                      employmentTypesQuery.isLoading && employmentTypeOptions.length <= 1
                    }
                    hint="Values come from the directory `employment_types` table (FK on `employees.employment_type`)."
                  />
                  {employmentTypesQuery.isError ? (
                    <p className="text-[11px] text-destructive sm:col-span-2" role="alert">
                      Could not load employment types. Check HR/admin access to{" "}
                      <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                        GET /employment-types
                      </code>
                      .
                    </p>
                  ) : null}
                </div>
              </fieldset>

              <fieldset className="space-y-4">
                <legend className="text-sm font-medium text-foreground">Contact &amp; profile</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Phone" id="phone" value={form.phone} onChange={set("phone")} />
                  <Field label="Address" id="address" value={form.address} onChange={set("address")} />
                  <SelectField
                    label="Country"
                    id="country"
                    value={form.country}
                    onChange={setSelect("country")}
                    options={countryOptions}
                    disabled={countriesQuery.isLoading && countryOptions.length <= 1}
                    hint="Directory `countries` table (FK). Updates automatically when you change Location when possible."
                  />
                  {countriesQuery.isError ? (
                    <p className="text-[11px] text-destructive sm:col-span-2" role="alert">
                      Could not load countries. Check HR/admin access to{" "}
                      <code className="rounded bg-muted px-1 py-0.5 text-[10px]">GET /countries</code>.
                    </p>
                  ) : null}
                  <EmployeeAvatarUpload
                    employeeNumber={employeeNumber!}
                    fullName={form.full_name}
                    value={form.avatar_url}
                    onChange={(url) =>
                      setForm((prev) => (prev ? { ...prev, avatar_url: url } : prev))
                    }
                    disabled={mutation.isPending}
                  />
                  <SelectField
                    label="Gender"
                    id="gender"
                    value={form.gender}
                    onChange={setSelect("gender")}
                    options={GENDER_SELECT_OPTIONS}
                    hint="Must match directory lookup keys (FK)."
                  />
                  <SelectField
                    label="Marital status"
                    id="marital_status"
                    value={form.marital_status}
                    onChange={setSelect("marital_status")}
                    options={MARITAL_SELECT_OPTIONS}
                    hint="Must match directory lookup keys (FK)."
                  />
                  <DatePickerField
                    label="Date of birth"
                    id="date_of_birth"
                    value={form.date_of_birth}
                    onChange={setSelect("date_of_birth")}
                    placeholder="Pick a date"
                    fromYear={1920}
                    toYear={new Date().getFullYear()}
                  />
                  <DatePickerField
                    label="Hire date"
                    id="hire_date"
                    value={form.hire_date}
                    onChange={setSelect("hire_date")}
                    placeholder="Pick a date"
                    fromYear={1970}
                    toYear={new Date().getFullYear() + 5}
                  />
                  <DatePickerField
                    label="Termination date"
                    id="termination_date"
                    value={form.termination_date}
                    onChange={setSelect("termination_date")}
                    placeholder="None — pick to set"
                    allowClear
                    fromYear={1970}
                    toYear={new Date().getFullYear() + 5}
                  />
                  <Field
                    label="Emergency contact name"
                    id="emergency_contact_name"
                    value={form.emergency_contact_name}
                    onChange={set("emergency_contact_name")}
                  />
                  <Field
                    label="Emergency contact phone"
                    id="emergency_contact_phone"
                    value={form.emergency_contact_phone}
                    onChange={set("emergency_contact_phone")}
                  />
                </div>
              </fieldset>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-end gap-2 border-t border-border bg-transparent pt-4">
              <Link
                to={`/employees/${encodeURIComponent(employeeNumber)}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Cancel
              </Link>
              <Button type="submit" size="sm" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving…" : "Save changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </section>
  );
}

function GroupedSelectField({
  label,
  id,
  value,
  onChange,
  groups,
  hint,
  disabled,
  required: isRequired,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  groups: { group: string; items: { value: string; label: string }[] }[];
  hint?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  const flatKeys = groups.flatMap((g) => g.items.map((i) => i.value));
  const inList = value !== "" && flatKeys.includes(value);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        className={selectClass}
        value={value}
        disabled={disabled}
        required={isRequired}
        onChange={(e) => onChange(e.target.value)}
      >
        {value && !inList ? (
          <option value={value}>
            {value} (legacy)
          </option>
        ) : null}
        {groups.map((g) => (
          <optgroup key={g.group} label={g.group}>
            {g.items.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function DatePickerField({
  label,
  id,
  value,
  onChange,
  placeholder,
  allowClear,
  fromYear,
  toYear,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  allowClear?: boolean;
  fromYear: number;
  toYear: number;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseYmd(value);
  const labelText = selected ? format(selected, "PPP") : placeholder;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          id={id}
          type="button"
          className={cn(
            "flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-left text-sm outline-none transition-colors",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30",
            "data-popup-open:border-ring data-popup-open:ring-3 data-popup-open:ring-ring/50"
          )}
        >
          <span className={cn("min-w-0 truncate", !selected && "text-muted-foreground")}>
            {labelText}
          </span>
          <CalendarIcon className="size-4 shrink-0 opacity-60" aria-hidden />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="bottom" align="start" sideOffset={4} className="z-[90]">
            <Popover.Popup
              data-slot="popover-content"
              className="rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-lg outline-none"
            >
              <Popover.Title className="sr-only">{label}</Popover.Title>
              <Calendar
                mode="single"
                captionLayout="dropdown"
                fromYear={fromYear}
                toYear={toYear}
                defaultMonth={selected ?? new Date()}
                selected={selected}
                onSelect={(d) => {
                  if (d) onChange(toYmd(d));
                  setOpen(false);
                }}
                className="rounded-md border-0 p-0"
              />
              {allowClear ? (
                <div className="flex justify-end border-t border-border pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      onChange("");
                      setOpen(false);
                    }}
                  >
                    Clear date
                  </Button>
                </div>
              ) : null}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

function Field({
  label,
  id,
  ...props
}: {
  label: string;
  id: string;
} & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <Input id={id} {...props} />
    </div>
  );
}

function SelectField({
  label,
  id,
  value,
  onChange,
  options,
  hint,
  disabled,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        className={selectClass}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value === "" ? "__empty" : o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
