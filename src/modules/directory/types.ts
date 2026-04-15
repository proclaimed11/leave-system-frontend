/** Row from directory-svc GET /employees list. */
export type EmployeeListRow = {
  employee_number: string;
  full_name: string;
  email: string;
  department: string | null;
  title: string | null;
  status: string;
  directory_role: string;
  company_key: string;
  location: string | null;
};

/** Row from directory-svc `GET /roles` (`roles` table). */
export type DirectoryRoleRow = {
  role_key: string;
  name: string;
  description: string | null;
};

/** Row from directory-svc `GET /employment-types` (`employment_types` table). */
export type EmploymentTypeRow = {
  type_key: string;
  name: string;
  description: string | null;
};

/** Row from directory-svc `GET /departments` (`departments` table summary). */
export type DepartmentSummary = {
  dept_key: string;
  name: string;
  status: "active" | "inactive";
  head_employee_number: string | null;
  employees_count: number;
};

/** Row from directory-svc `GET /countries` (`countries` table). */
export type CountryRow = {
  country_key: string;
  name: string;
  description: string | null;
};

/** Active location from directory-svc `GET /locations`. */
export type DirectoryLocationRow = {
  location_key: string;
  name: string;
  is_head_office: boolean;
  status: string;
  /** e.g. Tanzania, Kenya, Uganda, Rwanda — for grouped dropdown */
  country_group: string;
};

export type EmployeesListResponse = {
  page: number;
  limit: number;
  count: number;
  total: number;
  total_pages: number;
  employees: EmployeeListRow[];
};

export type CountryOverviewResponse = {
  country_prefix: string;
  kpis: {
    totalEmployees: number;
    activeEmployees: number;
    archivedEmployees: number;
    departments: number;
    branches: number;
  };
};

/** Raw employee row from GET /employees/:employee_number (directory DB). */
export type DirectoryEmployeeRecord = EmployeeListRow & {
  avatar_url?: string | null;
  manager_employee_number?: string | null;
  phone?: string | null;
  address?: string | null;
  country?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  date_of_birth?: string | null;
  hire_date?: string | null;
  termination_date?: string | null;
  created_at?: string;
  employment_type?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
};

/** Body for POST /employees (directory-svc insert; subset of columns). */
export type EmployeeCreatePayload = {
  employee_number: string;
  full_name: string;
  email: string;
  department: string | null;
  title: string | null;
  /** Branch / site (`locations.location_key`). */
  location: string | null;
  employment_type: string | null;
  hire_date: string | null;
  /** Optional; often set automatically when picking a location. */
  country?: string | null;
  manager_employee_number?: string | null;
  phone: string | null;
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  marital_status?: string | null;
  gender: string | null;
  date_of_birth?: string | null;
};

/** Body for PUT /employees/:employee_number (whitelist; omit read-only fields). */
export type EmployeeUpdatePayload = {
  full_name: string;
  email: string;
  department: string | null;
  title: string | null;
  manager_employee_number: string | null;
  status: string;
  directory_role: string;
  company_key: string;
  location: string | null;
  employment_type: string | null;
  phone: string | null;
  address?: string | null;
  country?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  date_of_birth?: string | null;
  hire_date?: string | null;
  termination_date?: string | null;
  avatar_url?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
};

/** Mirrors directory-svc `EmployeeProfile` (GET /profile). */
export type EmployeeProfile = {
  employee_number: string;
  full_name: string;
  email: string;
  title: string | null;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  directory_role: string;
  company_key: string;
  status: string;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  country: string | null;
  gender: string | null;
  marital_status: string | null;
  date_of_birth: string | null;
  hire_date: string | null;
  termination_date: string | null;
  created_at: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  manager: {
    employee_number: string;
    full_name: string;
  } | null;
};
