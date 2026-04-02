import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiClient } from "@/shared/api/client";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

export type RoleItem = {
  id: number;
  name: string;
  code: string;
  isSystem: boolean;
};

export type UserItem = {
  id: number;
  login: string;
  firstName?: string | null;
  lastName?: string | null;
  roleId: number;
  isActive: boolean;
  role: RoleItem;
};

export type CreateUserDto = {
  login: string;
  password: string;
  first_name: string;
  last_name: string;
  role_id: number;
};

export type UpdateUserDto = {
  login?: string;
  first_name?: string;
  last_name?: string;
  role_id?: number;
};


const usersQueryKeys = {
  all: ["users-management"] as const,
  users: () => [...usersQueryKeys.all, "users"] as const,
  roles: () => [...usersQueryKeys.all, "roles"] as const,
};

async function getUsers() {
  const { data } = await apiClient.get<UserItem[]>("/users");
  return data;
}

async function getRoles() {
  const { data } = await apiClient.get<RoleItem[]>("/roles");
  return data;
}

export function useUsersQuery() {
  return useQuery({
    queryKey: usersQueryKeys.users(),
    queryFn: getUsers,
    retry: false,
  });
}

export function useRolesQuery() {
  return useQuery({
    queryKey: usersQueryKeys.roles(),
    queryFn: getRoles,
    retry: false,
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateUserDto) => {
      const { data } = await apiClient.post<UserItem>("/users", dto);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersQueryKeys.users(), exact: false });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Не удалось создать пользователя")),
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: number; dto: UpdateUserDto }) => {
      const { data } = await apiClient.put<UserItem>(`/users/${payload.id}`, payload.dto);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersQueryKeys.users(), exact: false });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Не удалось обновить пользователя")),
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/users/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersQueryKeys.users(), exact: false });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Не удалось удалить пользователя")),
  });
}

export function useChangeUserPasswordMutation() {
  return useMutation({
    mutationFn: async (payload: { userId: number; newPassword: string }) => {
      await apiClient.patch(`/users/${payload.userId}/password`, { new_password: payload.newPassword });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Не удалось сменить пароль")),
  });
}

