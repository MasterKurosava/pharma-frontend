import type { CurrentUser } from "@/entities/user/model/types";

export type LoginDto = {
  login: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
};

export type MeResponse = CurrentUser;

