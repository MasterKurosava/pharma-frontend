export type UserRole = "admin" | "manager" | "viewer" | string;

export type CurrentUser = {
  userId: number;
  email: string;
  role: UserRole;
};
