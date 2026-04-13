import axios from "axios";
import type {
  ChangePasswordResponse,
  LoginRequest,
  LoginResponse,
  MeResponse,
  RefreshTokenResponse,
} from "../types";

const IDENTITY_BASE_URL =
  import.meta.env.VITE_IDENTITY_API_URL ?? "http://localhost:3001";

const authApi = axios.create({
  baseURL: IDENTITY_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let accessToken: string | null = null;

authApi.interceptors.request.use((config) => {
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/** Current Bearer token for non-identity APIs (e.g. directory-svc). */
export function getAccessToken(): string | null {
  return accessToken;
}

export async function loginWithPassword(
  payload: LoginRequest
): Promise<LoginResponse> {
  const { data } = await authApi.post<LoginResponse>("/auth/login", payload);
  return data;
}

export async function getMe(token: string): Promise<MeResponse> {
  setAccessToken(token);
  const { data } = await authApi.get<MeResponse>("/auth/me");
  return data;
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<RefreshTokenResponse> {
  const { data } = await authApi.post<RefreshTokenResponse>("/auth/refresh", {
    refresh_token: refreshToken,
  });
  return data;
}

export async function logoutCurrentSession(refreshToken: string): Promise<void> {
  await authApi.post("/auth/logout", {
    refresh_token: refreshToken,
  });
}

export async function logoutAll(token: string): Promise<void> {
  setAccessToken(token);
  await authApi.post("/auth/logout-all", {});
}

export async function changePassword(body: {
  current_password: string;
  new_password: string;
}): Promise<ChangePasswordResponse> {
  const { data } = await authApi.post<ChangePasswordResponse>(
    "/auth/change-password",
    body
  );
  return data;
}
