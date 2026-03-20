import { createContext } from "react";

import type { CurrentUser } from "@/entities/user/model/types";
import type { LoginDto } from "@/features/auth/api/types";

export type AuthContextValue = {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (payload: LoginDto) => Promise<CurrentUser>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
