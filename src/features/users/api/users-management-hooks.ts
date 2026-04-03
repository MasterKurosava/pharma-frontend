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

type UsersOptimisticContext = {
  usersSnapshot?: UserItem[];
  temporaryId?: number;
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

function getFallbackRole(roleId: number): RoleItem {
  return {
    id: roleId,
    name: "—",
    code: "UNKNOWN",
    isSystem: false,
  };
}

function upsertUser(list: UserItem[] | undefined, user: UserItem, temporaryId?: number) {
  const current = list ?? [];
  if (typeof temporaryId === "number") {
    let replaced = false;
    const mapped = current.map((item) => {
      if (item.id !== temporaryId) return item;
      replaced = true;
      return user;
    });
    if (replaced) return mapped;
  }

  const exists = current.some((item) => item.id === user.id);
  return exists ? current : [user, ...current];
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
    onMutate: async (dto): Promise<UsersOptimisticContext> => {
      await queryClient.cancelQueries({ queryKey: usersQueryKeys.users(), exact: false });
      const usersSnapshot = queryClient.getQueryData<UserItem[]>(usersQueryKeys.users());
      const roles = queryClient.getQueryData<RoleItem[]>(usersQueryKeys.roles()) ?? [];
      const optimisticRole = roles.find((role) => role.id === dto.role_id) ?? getFallbackRole(dto.role_id);
      const temporaryId = -Date.now();
      const optimisticUser: UserItem = {
        id: temporaryId,
        login: dto.login,
        firstName: dto.first_name,
        lastName: dto.last_name,
        roleId: dto.role_id,
        isActive: true,
        role: optimisticRole,
      };

      queryClient.setQueryData<UserItem[]>(usersQueryKeys.users(), (old) =>
        [optimisticUser, ...(old ?? [])],
      );

      return { usersSnapshot, temporaryId };
    },
    onSuccess: (createdUser, _variables, context) => {
      queryClient.setQueryData<UserItem[]>(
        usersQueryKeys.users(),
        (old) => upsertUser(old, createdUser, context?.temporaryId),
      );
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(usersQueryKeys.users(), context?.usersSnapshot);
      toast.error(getApiErrorMessage(error, "Не удалось создать пользователя"));
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: usersQueryKeys.users(), exact: false });
    },
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: number; dto: UpdateUserDto }) => {
      const { data } = await apiClient.put<UserItem>(`/users/${payload.id}`, payload.dto);
      return data;
    },
    onMutate: async ({ id, dto }) => {
      await queryClient.cancelQueries({ queryKey: usersQueryKeys.users(), exact: false });
      const usersSnapshot = queryClient.getQueryData<UserItem[]>(usersQueryKeys.users());
      const roles = queryClient.getQueryData<RoleItem[]>(usersQueryKeys.roles()) ?? [];
      const nextRole = dto.role_id ? roles.find((role) => role.id === dto.role_id) : undefined;

      queryClient.setQueryData<UserItem[]>(usersQueryKeys.users(), (old) =>
        old?.map((user) =>
          user.id !== id
            ? user
            : {
                ...user,
                login: dto.login ?? user.login,
                firstName: dto.first_name ?? user.firstName,
                lastName: dto.last_name ?? user.lastName,
                roleId: dto.role_id ?? user.roleId,
                role: nextRole ?? user.role,
              },
        ) ?? old,
      );

      return { usersSnapshot };
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<UserItem[]>(usersQueryKeys.users(), (old) =>
        old?.map((user) => (user.id === updatedUser.id ? updatedUser : user)) ?? old,
      );
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(usersQueryKeys.users(), context?.usersSnapshot);
      toast.error(getApiErrorMessage(error, "Не удалось обновить пользователя"));
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: usersQueryKeys.users(), exact: false });
    },
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/users/${id}`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: usersQueryKeys.users(), exact: false });
      const usersSnapshot = queryClient.getQueryData<UserItem[]>(usersQueryKeys.users());

      queryClient.setQueryData<UserItem[]>(usersQueryKeys.users(), (old) => old?.filter((user) => user.id !== id) ?? old);

      return { usersSnapshot };
    },
    onError: (error, _id, context) => {
      queryClient.setQueryData(usersQueryKeys.users(), context?.usersSnapshot);
      toast.error(getApiErrorMessage(error, "Не удалось удалить пользователя"));
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: usersQueryKeys.users(), exact: false });
    },
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

