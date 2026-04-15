export type ApplyLeaveTypeCard = {
  type_key: string;
  name: string;
  available_days: number | null;
  max_consecutive_days: number | null;
  max_per_year: number | null;
  requires_document: boolean;
  requires_approval: boolean;
  approval_levels: number;
  deduct_from_balance: boolean;
};

export type ApplyLeaveOverviewResponse = {
  count: number;
  leave_types: ApplyLeaveTypeCard[];
};

export type HandoverCandidate = {
  employee_number: string;
  full_name: string;
  email?: string;
  department?: string | null;
  title?: string | null;
};

export type HandoverCandidatesResponse = {
  count: number;
  employees: HandoverCandidate[];
};

export type ApplyLeaveTaskPayload = {
  title: string;
  description?: string;
};

export type ApplyLeavePayload = {
  leave_type_key: string;
  start_date: string;
  end_date: string;
  reason?: string;
  handover_to: string;
  handover_notes?: string;
  handover_tasks?: ApplyLeaveTaskPayload[];
};

export type ApplyLeaveResponse = {
  message: string;
  request_id: number;
  days_requested: number;
  next_approver: {
    role: string;
    employee_number: string | null;
  } | null;
};

export type MyLeaveRequestItem = {
  id: number;
  leave_type_key: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  status: string;
  created_at: string;
};

export type MyLeaveRequestsResponse = {
  success: boolean;
  data: {
    employee_number: string;
    page: number;
    limit: number;
    total: number;
    requests: MyLeaveRequestItem[];
  };
};

export type LeaveApprovalTrailItem = {
  id?: number;
  request_id: number;
  step_order?: number;
  approver_emp_no: string | null;
  role: string;
  action: string;
  remarks: string | null;
  created_at: string;
  acted_at?: string | null;
};

export type LeaveAttachmentItem = {
  id: number;
  request_id: number;
  file_url: string;
  created_at: string;
};

export type LeaveHandoverTaskItem = {
  id: number;
  title: string;
  is_completed: boolean;
  order_index?: number;
  completed_at?: string | null;
};

export type LeaveRequestDetailResponse = {
  /** When set, whether the current user may POST approve/reject (from API; preferred over client heuristics). */
  viewer_can_act?: boolean;
  leave: {
    id: number;
    leave_type_key: string;
    start_date: string;
    end_date: string;
    total_days: number;
    reason: string | null;
    status: string;
    created_at: string;
  };
  requester: {
    employee_number: string;
    full_name: string;
    email: string;
    department: string | null;
    title: string | null;
    company_key?: string;
    location?: string | null;
  };
  approvals: LeaveApprovalTrailItem[];
  attachments: LeaveAttachmentItem[];
  handover: {
    assigned_to: string | null;
    notes: string | null;
    document_url: string | null;
    tasks: LeaveHandoverTaskItem[];
  } | null;
};

export type PendingApprovalItem = {
  approval_id: number;
  request_id: number;
  requester: {
    employee_number: string;
    full_name: string;
  };
  leave: {
    leave_type_key: string;
    leave_type_name: string;
    start_date: string;
    end_date: string;
    days_requested: number;
    reason: string | null;
  };
  approval: {
    role: string;
    step_order: number;
  };
  applied_at: string;
};

export type PendingApprovalsResponse = {
  page: number;
  limit: number;
  count: number;
  total: number;
  total_pages: number;
  data: PendingApprovalItem[];
};

export type ApprovalActionPayload = {
  action: "APPROVED" | "REJECTED";
  remarks?: string;
};

export type ApprovalHistoryItem = {
  approval_id: number;
  request_id: number;
  requester: {
    employee_number: string;
    full_name: string;
  };
  leave: {
    leave_type_key: string;
    leave_type_name: string;
    start_date: string;
    end_date: string;
    days_requested: number;
    reason: string | null;
  };
  approval: {
    role: string;
    step_order: number;
    action: "PENDING" | "APPROVED" | "REJECTED";
    acted_at: string | null;
    remarks: string | null;
  };
  applied_at: string;
};

export type ApprovalHistoryResponse = {
  page: number;
  limit: number;
  count: number;
  total: number;
  total_pages: number;
  data: ApprovalHistoryItem[];
};
