import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  roles: string[];
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: () => {},
  setUser: () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!api.isAuthenticated()) {
          setLoading(false);
          return;
        }

        try {
          const { user } = await api.getCurrentUser();
          setUser(user);
        } catch (error: any) {
          console.error("[AuthProvider] Auth check failed:", {
            error: error.message,
            stack: error.stack,
            details: error,
          });
          api.logout();
          setUser(null);
        } finally {
          setLoading(false);
        }
      } catch (error: any) {
        console.error("[AuthProvider] Unexpected error:", error);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signOut = () => {
    api.logout();
    setUser(null);
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export type { User };
