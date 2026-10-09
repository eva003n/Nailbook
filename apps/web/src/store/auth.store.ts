import { isAxiosError } from "axios";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import api from "@/lib/api";
import { validateOrThrow } from "@/lib/guards";
import { AuthResponseSchema, MeResponseSchema } from "@/lib/schemas";
import type { User } from "@/lib/schemas";

/**
 * `unknown` until the server has confirmed (or denied) the session cookie.
 * The `sid` cookie is httpOnly, so the client can only learn its validity via `/auth/me`.
 */
export type AuthStatus = "unknown" | "authenticated" | "unauthenticated";

interface AuthState {
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  clearAuth: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  /** Called once on app mount to validate the session cookie via /auth/me */
  initialize: () => Promise<void>;
}

let initializing: Promise<void> | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      status: "unknown",
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) =>
        set({ user, status: "authenticated", isAuthenticated: true }),

      clearAuth: () =>
        set({ user: null, status: "unauthenticated", isAuthenticated: false }),

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post("/auth/login", { email, password });
          const { data } = response.data;
          const validated = validateOrThrow(AuthResponseSchema, data, "login");
          // The API sets the httpOnly `sid` session cookie on this response.
          get().setUser(validated.user);
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await api.delete("/auth/logout");
        } catch {
          // Ignore errors — proceed with clearing client state
        } finally {
          // The server destroys the session; clear local state regardless.
          get().clearAuth();
          set({ isLoading: false });
        }
      },

      fetchMe: async () => {
        try {
          set({ isLoading: true });
          const response = await api.get("/auth/me");
          const validated = validateOrThrow(
            MeResponseSchema,
            response.data,
            "fetchMe",
          );
          get().setUser(validated.data);
        } catch {
          get().clearAuth();
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Validate the session cookie on app load.
       *
       *  - 200: refresh `user` from the server.
       *  - 401 / invalid response: clear local state.
       *  - No response (offline PWA): trust the persisted `user` hint, if any,
       *    so the app stays usable; the next online request will re-validate.
       *
       * Concurrent calls share one request.
       */
      initialize: () => {
        if (initializing) return initializing;
        set({ isLoading: true });
        initializing = (async () => {
          try {
            const response = await api.get("/auth/me");
            const validated = validateOrThrow(
              MeResponseSchema,
              response.data,
              "initialize",
            );
            get().setUser(validated.data);
          } catch (error) {
            // A login that completed while this check was in flight is authoritative.
            if (get().status === "authenticated") return;
            const offline = isAxiosError(error) && !error.response;
            const { user } = get();
            if (offline && user) {
              set({ status: "authenticated", isAuthenticated: true });
            } else {
              get().clearAuth();
            }
          } finally {
            set({ isLoading: false });
            initializing = null;
          }
        })();
        return initializing;
      },
    }),
    {
      name: "nailbook-auth",
      storage: createJSONStorage(() => localStorage),
      // Only an offline display hint is persisted; the session itself lives in the httpOnly cookie.
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
