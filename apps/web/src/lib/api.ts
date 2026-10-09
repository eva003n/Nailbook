import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/auth.store";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 120_000,
  timeoutErrorMessage: "Network timeout",
  headers: { "Content-Type": "application/json" },
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    // Login failures and the startup session check (/auth/me) handle their own 401s.
    const skipRedirectUrls = ["/auth/login", "/auth/me"];

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !skipRedirectUrls.includes(original.url ?? "") &&
      window.location.pathname !== "/login"
    ) {
      original._retry = true;
      // Session expired (30 min idle / 12 h absolute): ProtectedRoute redirects to /login.
      useAuthStore.getState().clearAuth();
    }
    return Promise.reject(error);
  },
);

/**
 * Extract data from API envelope format: { data: T, meta?: PaginationMeta }
 */
export function unwrap<T>(response: { data: { data: T; meta?: PaginationMeta } }): {
  data: T;
  meta?: PaginationMeta;
} {
  return response.data;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default api;