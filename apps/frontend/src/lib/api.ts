import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/authStore";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorEnvelope>) => {
    if (error.response?.status === 401) {
      const state = useAuthStore.getState();
      if (state.isAuthenticated) {
        state.logout();
      }
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorEnvelope>(error)) {
    return (
      error.response?.data?.error?.message ||
      error.message ||
      "Request failed"
    );
  }
  return error instanceof Error ? error.message : "Request failed";
}

export function isUnauthorized(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

function unwrap<T>(response: { data: ApiEnvelope<T> }): T {
  return response.data.data;
}

export async function httpGet<T>(
  url: string,
  params?: Record<string, unknown>
): Promise<T> {
  const response = await apiClient.get<ApiEnvelope<T>>(url, { params });
  return unwrap(response);
}

export async function httpList<T>(
  url: string,
  params?: Record<string, unknown>
): Promise<Paginated<T>> {
  const response = await apiClient.get<ApiEnvelope<T[]>>(url, { params });
  const envelope = response.data;
  const meta = envelope.meta ?? { page: 1, limit: 20, total: envelope.data.length, totalPages: 1 };
  return {
    items: envelope.data,
    total: meta.total,
    totalPages: meta.totalPages,
    page: meta.page,
    limit: meta.limit,
  };
}

export async function httpPost<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.post<ApiEnvelope<T>>(url, body, config);
  return unwrap(response);
}

export async function httpPatch<T>(
  url: string,
  body?: unknown
): Promise<T> {
  const response = await apiClient.patch<ApiEnvelope<T>>(url, body);
  return unwrap(response);
}

export type { AxiosRequestConfig };