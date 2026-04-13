/** Must match directory-svc `EmployeeRepository` sort whitelist. */
export const EMPLOYEE_LIST_SORT_BY = [
  { value: "employee_number", label: "Employee #" },
  { value: "full_name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "department", label: "Department" },
  { value: "title", label: "Title" },
  { value: "directory_role", label: "Role" },
  { value: "status", label: "Status" },
  { value: "location", label: "Location" },
  { value: "company_key", label: "Company" },
] as const;

export type EmployeeListSortBy = (typeof EMPLOYEE_LIST_SORT_BY)[number]["value"];

export type EmployeeListSortDir = "asc" | "desc";

export const DEFAULT_EMPLOYEE_LIST_SORT_BY: EmployeeListSortBy = "full_name";
export const DEFAULT_EMPLOYEE_LIST_SORT_DIR: EmployeeListSortDir = "asc";
