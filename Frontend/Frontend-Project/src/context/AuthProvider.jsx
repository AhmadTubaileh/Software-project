// src/context/AuthProvider.jsx
import { useState } from "react";
import AuthContext from "./AuthContext";
import { useLocalSession } from "../hooks/useLocalSession";

export default function AuthProvider({ children }) {
  const { currentUser, setSession, clearSession } = useLocalSession();

  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const value = {
    currentUser,
    setSession,
    clearSession,
    isAuthLoading,
    setIsAuthLoading,
    authError,
    setAuthError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
