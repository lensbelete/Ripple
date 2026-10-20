"use client";

import type { AuthUserDto } from "@ripple/shared-types";
import { createContext, useContext } from "react";

export interface AuthState {
  user: AuthUserDto | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
