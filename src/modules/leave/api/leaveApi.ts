import axios from "axios";

import { getAccessToken } from "@/modules/auth/api/authApi";
import type {
  ApprovalHistoryResponse,
  ApprovalActionPayload,
  ApplyLeaveOverviewResponse,
  ApplyLeavePayload,
  ApplyLeaveResponse,
  HandoverCandidatesResponse,
  LeaveRequestDetailResponse,
  MyLeaveRequestsResponse,
  PendingApprovalsResponse,
} from "../types";

const LEAVE_REQUEST_BASE_URL =
  import.meta.env.VITE_LEAVE_REQUEST_API_URL ?? "http://localhost:3006";

const leaveApi = axios.create({
  baseURL: LEAVE_REQUEST_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

leaveApi.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function fetchApplyLeaveOverview(): Promise<ApplyLeaveOverviewResponse> {
  const { data } = await leaveApi.get<ApplyLeaveOverviewResponse>("/overview/leave-overview");
  return data;
}

export async function fetchHandoverCandidates(): Promise<HandoverCandidatesResponse> {
  const { data } = await leaveApi.get<HandoverCandidatesResponse>("/leave-request-handover/candidates");
  return data;
}

export async function applyLeave(body: ApplyLeavePayload): Promise<ApplyLeaveResponse> {
  const { data } = await leaveApi.post<ApplyLeaveResponse>("/leave-request/apply", body);
  return data;
}

export type FetchMyLeaveRequestsParams = {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
};

export async function fetchMyLeaveRequests(
  params: FetchMyLeaveRequestsParams = {}
): Promise<MyLeaveRequestsResponse> {
  const { data } = await leaveApi.get<MyLeaveRequestsResponse>("/leave-request/my-requests", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      ...(params.status ? { status: params.status } : {}),
      ...(params.search ? { search: params.search } : {}),
    },
  });
  return data;
}

export async function fetchLeaveRequestDetail(requestId: number): Promise<LeaveRequestDetailResponse> {
  const { data } = await leaveApi.get<LeaveRequestDetailResponse>(`/leave-request/${requestId}`);
  return data;
}

export type FetchPendingApprovalsParams = {
  page?: number;
  limit?: number;
};

export async function fetchPendingApprovals(
  params: FetchPendingApprovalsParams = {}
): Promise<PendingApprovalsResponse> {
  const { data } = await leaveApi.get<PendingApprovalsResponse>("/approvals/pending", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    },
  });
  return data;
}

export async function actOnApproval(requestId: number, body: ApprovalActionPayload): Promise<{ message: string }> {
  const { data } = await leaveApi.post<{ message: string }>(`/approvals/${requestId}/act`, body);
  return data;
}

export async function fetchApprovalHistory(params?: {
  page?: number;
  limit?: number;
  action?: "APPROVED" | "REJECTED" | "PENDING";
  search?: string;
}): Promise<ApprovalHistoryResponse> {
  const { data } = await leaveApi.get<ApprovalHistoryResponse>("/approvals/history", {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 25,
      ...(params?.action ? { action: params.action } : {}),
      ...(params?.search ? { search: params.search } : {}),
    },
  });
  return data;
}
