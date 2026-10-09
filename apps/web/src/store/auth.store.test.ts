import { describe, it, expect, vi, beforeEach } from "vitest";
import { AxiosError } from "axios";
import { useAuthStore } from "./auth.store";
import api from "@/lib/api";

vi.mock("@/lib/api", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

const user = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  name: "Wanny",
  email: "wanny@example.com",
  role: "OWNER" as const,
};

const unauthorized = () =>
  new AxiosError("Unauthorized", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 401,
  } as never);

const networkError = () => new AxiosError("Network Error", "ERR_NETWORK");

describe("auth.store (session-cookie auth)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      status: "unknown",
      isAuthenticated: false,
      isLoading: false,
    });
  });

  describe("setUser", () => {
    it("sets the user and marks as authenticated", () => {
      useAuthStore.getState().setUser(user);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(user);
      expect(state.status).toBe("authenticated");
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe("clearAuth", () => {
    it("clears the user and marks unauthenticated", () => {
      useAuthStore.getState().setUser(user);

      useAuthStore.getState().clearAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.status).toBe("unauthenticated");
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe("login", () => {
    it("sets auth state on successful login", async () => {
      mockedApi.post.mockResolvedValue({ data: { data: { user } } });

      await useAuthStore.getState().login("wanny@example.com", "Admin123!");

      const state = useAuthStore.getState();
      expect(state.user?.email).toBe("wanny@example.com");
      expect(state.status).toBe("authenticated");
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it("calls the API with the correct payload", async () => {
      mockedApi.post.mockResolvedValue({ data: { data: { user } } });

      await useAuthStore.getState().login("wanny@example.com", "Admin123!");

      expect(mockedApi.post).toHaveBeenCalledWith("/auth/login", {
        email: "wanny@example.com",
        password: "Admin123!",
      });
    });

    it("does not set auth state on failed login", async () => {
      mockedApi.post.mockRejectedValue(new Error("Invalid credentials"));

      await expect(
        useAuthStore.getState().login("wanny@example.com", "wrong"),
      ).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });

  describe("logout", () => {
    it("clears auth state on logout", async () => {
      mockedApi.delete.mockResolvedValue({});
      useAuthStore.getState().setUser(user);

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(mockedApi.delete).toHaveBeenCalledWith("/auth/logout");
      expect(state.user).toBeNull();
      expect(state.status).toBe("unauthenticated");
      expect(state.isAuthenticated).toBe(false);
    });

    it("clears state even if the API call fails", async () => {
      mockedApi.delete.mockRejectedValue(new Error("Network error"));
      useAuthStore.getState().setUser(user);

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe("fetchMe", () => {
    it("updates the user from the API", async () => {
      mockedApi.get.mockResolvedValue({ data: { data: user } });

      await useAuthStore.getState().fetchMe();

      const state = useAuthStore.getState();
      expect(state.user?.name).toBe("Wanny");
      expect(state.isLoading).toBe(false);
    });

    it("clears the user on API failure", async () => {
      mockedApi.get.mockRejectedValue(unauthorized());
      useAuthStore.getState().setUser(user);

      await useAuthStore.getState().fetchMe();

      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe("initialize", () => {
    it("sets authenticated on successful session validation", async () => {
      mockedApi.get.mockResolvedValue({ data: { data: user } });

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(mockedApi.get).toHaveBeenCalledWith("/auth/me");
      expect(state.status).toBe("authenticated");
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe("wanny@example.com");
    });

    it("clears auth when the session has expired (401)", async () => {
      mockedApi.get.mockRejectedValue(unauthorized());
      useAuthStore.setState({ user });

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.status).toBe("unauthenticated");
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it("keeps the persisted user when offline", async () => {
      mockedApi.get.mockRejectedValue(networkError());
      useAuthStore.setState({ user });

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.status).toBe("authenticated");
      expect(state.user).toEqual(user);
    });

    it("is unauthenticated when offline with no persisted user", async () => {
      mockedApi.get.mockRejectedValue(networkError());

      await useAuthStore.getState().initialize();

      expect(useAuthStore.getState().status).toBe("unauthenticated");
    });

    it("dedupes concurrent calls into one request", async () => {
      mockedApi.get.mockResolvedValue({ data: { data: user } });

      await Promise.all([
        useAuthStore.getState().initialize(),
        useAuthStore.getState().initialize(),
      ]);

      expect(mockedApi.get).toHaveBeenCalledTimes(1);
    });
  });
});
