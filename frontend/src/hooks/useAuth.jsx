import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("kb_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((token, userObj) => {
    localStorage.setItem("kb_token", token);
    localStorage.setItem("kb_user", JSON.stringify(userObj));
    setUser(userObj);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("kb_token");
    localStorage.removeItem("kb_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
