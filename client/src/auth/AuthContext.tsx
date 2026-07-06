import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { http } from "../api/http";
import type {
  ApiResponse,
  FrontendBootstrap,
  UserProfile,
} from "../types/frontend";

interface LoginInput {
  email: string;
  password: string;
}

interface AuthContextValue {
  token: string | null;
  user: UserProfile | null;
  bootstrap: FrontendBootstrap | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
  refreshBootstrap: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function extractLoginData(responseData: any) {
  const data = responseData?.data ?? responseData;

  const token =
    data?.token ||
    data?.accessToken ||
    data?.jwt ||
    data?.authToken ||
    responseData?.token;

  const user =
    data?.user ||
    data?.profile ||
    data?.currentUser ||
    responseData?.user ||
    null;

  return {
    token,
    user,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("indusconnect_token")
  );

  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem("indusconnect_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [bootstrap, setBootstrap] = useState<FrontendBootstrap | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshBootstrap() {
    const response = await http.get<ApiResponse<FrontendBootstrap>>(
      "/frontend/bootstrap"
    );

    setBootstrap(response.data.data);
    setUser(response.data.data.profile);

    localStorage.setItem(
      "indusconnect_user",
      JSON.stringify(response.data.data.profile)
    );
  }

  async function login(input: LoginInput) {
    const response = await http.post("/auth/login", input);
    const loginData = extractLoginData(response.data);

    if (!loginData.token) {
      throw new Error(
        "Login successful but token was not found in API response."
      );
    }

    localStorage.setItem("indusconnect_token", loginData.token);
    setToken(loginData.token);

    if (loginData.user) {
      localStorage.setItem("indusconnect_user", JSON.stringify(loginData.user));
      setUser(loginData.user);
    }

    await refreshBootstrap();
  }

  function logout() {
    localStorage.removeItem("indusconnect_token");
    localStorage.removeItem("indusconnect_user");

    setToken(null);
    setUser(null);
    setBootstrap(null);
  }

  useEffect(() => {
    async function loadSession() {
      try {
        if (token) {
          await refreshBootstrap();
        }
      } catch {
        logout();
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      bootstrap,
      isAuthenticated: Boolean(token),
      isLoading,
      login,
      logout,
      refreshBootstrap,
    }),
    [token, user, bootstrap, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}