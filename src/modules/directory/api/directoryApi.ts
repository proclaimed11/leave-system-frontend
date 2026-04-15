import axios from "axios";

import { getAccessToken } from "@/modules/auth/api/authApi";
import type {
  CountryRow,
  DepartmentSummary,
  DirectoryEmployeeRecord,
  DirectoryLocationRow,
  DirectoryRoleRow,
  EmployeeCreatePayload,
  CountryOverviewResponse,
  EmployeeProfile,
  EmployeesListResponse,
  EmployeeUpdatePayload,
  EmploymentTypeRow,
} from "../types";

const DIRECTORY_BASE_URL =
  import.meta.env.VITE_DIRECTORY_API_URL ?? "http://localhost:3002";

const directoryApi = axios.create({
  baseURL: DIRECTORY_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

directoryApi.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function fetchMyProfile(): Promise<EmployeeProfile> {
  const { data } = await directoryApi.get<EmployeeProfile>("/profile");
  return data;
}

export async function fetchDirectoryRoles(): Promise<DirectoryRoleRow[]> {
  const { data } = await directoryApi.get<DirectoryRoleRow[]>("/roles");
  return data;
}

export async function fetchEmploymentTypes(): Promise<EmploymentTypeRow[]> {
  const { data } = await directoryApi.get<EmploymentTypeRow[]>("/employment-types");
  return data;
}

export async function fetchCountries(): Promise<CountryRow[]> {
  const { data } = await directoryApi.get<CountryRow[]>("/countries");
  return data;
}

export type FetchDepartmentsParams = {
  company_key?: string;
};

export async function fetchDepartments(
  params: FetchDepartmentsParams = {}
): Promise<DepartmentSummary[]> {
  const { data } = await directoryApi.get<{ count: number; departments: DepartmentSummary[] }>(
    "/departments",
    {
      params: {
        ...(params.company_key ? { company_key: params.company_key } : {}),
      },
    }
  );
  return data.departments ?? [];
}

type LocationsApiResponse = {
  count: number;
  locations: DirectoryLocationRow[];
};

export async function fetchLocations(): Promise<DirectoryLocationRow[]> {
  const { data } = await directoryApi.get<LocationsApiResponse>("/locations");
  return data.locations ?? [];
}

export type FetchEmployeesListParams = {
  page?: number;
  limit?: number;
  company_key?: string;
  status?: string;
  search?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
};

export async function fetchEmployeesList(
  params: FetchEmployeesListParams = {}
): Promise<EmployeesListResponse> {
  const { page = 1, limit = 200, company_key, status, search, sort_by, sort_dir } = params;
  const { data } = await directoryApi.get<EmployeesListResponse>("/employees", {
    params: {
      page,
      limit,
      ...(company_key ? { company_key } : {}),
      ...(status ? { status } : {}),
      ...(search ? { search } : {}),
      ...(sort_by ? { sort_by } : {}),
      ...(sort_dir ? { sort_dir } : {}),
    },
  });
  return data;
}

export async function fetchCountryOverview(
  countryPrefix: string
): Promise<CountryOverviewResponse> {
  const { data } = await directoryApi.get<CountryOverviewResponse>(
    "/dashboard/overview/country",
    { params: { country_prefix: countryPrefix } }
  );
  return data;
}

export async function fetchEmployeeByNumber(
  employeeNumber: string
): Promise<DirectoryEmployeeRecord> {
  const { data } = await directoryApi.get<DirectoryEmployeeRecord>(
    `/employees/${encodeURIComponent(employeeNumber)}`
  );
  return data;
}

export type CreateEmployeeResponse = {
  message: string;
  employee: DirectoryEmployeeRecord;
  temporary_password?: string;
  identity_error?: string;
  identity_skipped?: boolean;
  identity_skip_reason?: string;
};

/** POST /employees — HR/admin only (directory-svc `hrOrAdmin`). */
export async function createEmployee(
  body: EmployeeCreatePayload
): Promise<CreateEmployeeResponse> {
  const { data } = await directoryApi.post<CreateEmployeeResponse>("/employees", body);
  return data;
}

export async function archiveEmployee(employeeNumber: string): Promise<void> {
  await directoryApi.put(
    `/employees/${encodeURIComponent(employeeNumber)}/archive`,
    {}
  );
}

export async function restoreEmployee(employeeNumber: string): Promise<void> {
  await directoryApi.put(
    `/employees/${encodeURIComponent(employeeNumber)}/restore`,
    {}
  );
}

export async function deleteEmployeePermanently(employeeNumber: string): Promise<void> {
  await directoryApi.delete(
    `/employees/${encodeURIComponent(employeeNumber)}/permanent`
  );
}

export type UploadAvatarResponse = {
  message: string;
  avatar_url: string;
  employee: DirectoryEmployeeRecord;
};

/** Uses `fetch` so multipart boundaries are set correctly (axios default JSON Content-Type breaks uploads). */
export async function uploadEmployeeAvatar(
  employeeNumber: string,
  file: File
): Promise<UploadAvatarResponse> {
  const body = new FormData();
  body.append("file", file);
  const token = getAccessToken();
  const base = DIRECTORY_BASE_URL.replace(/\/$/, "");
  const res = await fetch(
    `${base}/employees/${encodeURIComponent(employeeNumber)}/avatar`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body,
    }
  );
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    avatar_url?: string;
    employee?: DirectoryEmployeeRecord;
    message?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? `Upload failed (${res.status})`);
  }
  if (!data.avatar_url || !data.employee) {
    throw new Error("Invalid response from server");
  }
  return {
    message: data.message ?? "Avatar updated",
    avatar_url: data.avatar_url,
    employee: data.employee,
  };
}

export type UpdateEmployeeResponse = {
  message: string;
  employee: DirectoryEmployeeRecord;
};

export async function updateEmployee(
  employeeNumber: string,
  body: EmployeeUpdatePayload
): Promise<DirectoryEmployeeRecord> {
  const { data } = await directoryApi.put<UpdateEmployeeResponse>(
    `/employees/${encodeURIComponent(employeeNumber)}`,
    body
  );
  return data.employee;
}
