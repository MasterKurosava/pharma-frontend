import { KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  type RoleItem,
  type UserItem,
  useChangeUserPasswordMutation,
  useCreateUserMutation,
  useDeleteUserMutation,
  useRolesQuery,
  useUpdateUserMutation,
  useUsersQuery,
} from "@/features/users/api/users-management-hooks";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/shared/ui/data-table/data-table";
import { Input } from "@/shared/ui/input";
import { ModalShell } from "@/shared/ui/modal-shell";
import { NativeSelect } from "@/shared/ui/native-select/native-select";

type UserFormState = {
  login: string;
  firstName: string;
  lastName: string;
  roleId: number | "";
  password: string;
};

const emptyUserForm: UserFormState = {
  login: "",
  firstName: "",
  lastName: "",
  roleId: "",
  password: "",
};

export function UsersManagementSection() {
  const usersQuery = useUsersQuery();
  const rolesQuery = useRolesQuery();
  const createUserMutation = useCreateUserMutation();
  const updateUserMutation = useUpdateUserMutation();
  const deleteUserMutation = useDeleteUserMutation();
  const changePasswordMutation = useChangeUserPasswordMutation();

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userMode, setUserMode] = useState<"create" | "edit">("create");
  const [activeUserId, setActiveUserId] = useState<number | null>(null);
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const rolesOptions = useMemo(
    () => (rolesQuery.data ?? []).map((role) => ({ value: role.id, label: role.name })),
    [rolesQuery.data],
  );

  const openCreateUser = () => {
    setUserMode("create");
    setActiveUserId(null);
    setUserForm(emptyUserForm);
    setUserModalOpen(true);
  };

  const openEditUser = (user: UserItem) => {
    setUserMode("edit");
    setActiveUserId(user.id);
    setUserForm({
      login: user.login,
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      roleId: user.roleId,
      password: "",
    });
    setUserModalOpen(true);
  };

  const openPasswordChange = (userId: number) => {
    setPasswordUserId(userId);
    setNewPassword("");
    setPasswordModalOpen(true);
  };

  const submitUser = async () => {
    if (!userForm.login.trim()) {
      toast.error("Логин обязателен");
      return;
    }
    if (!userForm.firstName.trim() || !userForm.lastName.trim()) {
      toast.error("Имя и фамилия обязательны");
      return;
    }
    if (typeof userForm.roleId !== "number") {
      toast.error("Выберите роль");
      return;
    }

    if (userMode === "create") {
      if (!userForm.password.trim()) {
        toast.error("Пароль обязателен");
        return;
      }
      await createUserMutation.mutateAsync({
        login: userForm.login.trim(),
        password: userForm.password,
        first_name: userForm.firstName.trim(),
        last_name: userForm.lastName.trim(),
        role_id: userForm.roleId,
      });
      toast.success("Пользователь создан");
    } else if (activeUserId !== null) {
      await updateUserMutation.mutateAsync({
        id: activeUserId,
        dto: {
          login: userForm.login.trim(),
          first_name: userForm.firstName.trim(),
          last_name: userForm.lastName.trim(),
          role_id: userForm.roleId,
        },
      });
      toast.success("Пользователь обновлен");
    }
    setUserModalOpen(false);
  };

  const submitPasswordChange = async () => {
    if (passwordUserId === null) return;
    if (!newPassword.trim()) {
      toast.error("Введите новый пароль");
      return;
    }
    await changePasswordMutation.mutateAsync({
      userId: passwordUserId,
      newPassword: newPassword.trim(),
    });
    toast.success("Пароль обновлен");
    setPasswordModalOpen(false);
  };

  const usersColumns = useMemo<Array<DataTableColumn<UserItem>>>(() => {
    return [
      { id: "id", header: "ID", accessorKey: "id", width: 80 },
      { id: "login", header: "Логин", accessorKey: "login" },
      {
        id: "fullName",
        header: "Имя",
        cell: (row) => `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim() || "—",
      },
      {
        id: "role",
        header: "Роль",
        cell: (row) => row.role?.name ?? "—",
      },
      {
        id: "actions",
        header: "",
        width: 150,
        align: "right",
        cell: (row) => (
          <div data-row-action="true" className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => openEditUser(row)} aria-label="Редактировать пользователя">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => openPasswordChange(row.id)} aria-label="Сменить пароль">
              <KeyRound className="h-4 w-4" />
            </Button>
            <ConfirmDialog
              trigger={
                <Button size="icon" variant="ghost" aria-label="Удалить пользователя">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              }
              title="Удалить пользователя?"
              description={`Пользователь "${row.login}" будет удален.`}
              confirmLabel="Удалить"
              cancelLabel="Отмена"
              confirmVariant="destructive"
              isConfirming={deleteUserMutation.isPending}
              onConfirm={async () => {
                await deleteUserMutation.mutateAsync(row.id);
                toast.success("Пользователь удален");
              }}
            />
          </div>
        ),
      },
    ];
  }, [deleteUserMutation, openEditUser]);

  const rolesColumns = useMemo<Array<DataTableColumn<RoleItem>>>(() => {
    return [
      { id: "id", header: "ID", accessorKey: "id", width: 80 },
      { id: "name", header: "Название", accessorKey: "name" },
      { id: "code", header: "Код", accessorKey: "code" },
    ];
  }, []);

  const usersLoading = usersQuery.isPending || rolesQuery.isPending;
  const rolesLoading = rolesQuery.isPending;

  return (
    <div className="space-y-6">
      <Card className="border-border/70 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h3 className="text-base font-semibold">Пользователи</h3>
            <p className="text-sm text-muted-foreground">Создание, редактирование, удаление и смена пароля</p>
          </div>
          <Button onClick={openCreateUser}>
            <Plus className="mr-2 h-4 w-4" />
            Создать пользователя
          </Button>
        </div>
        <div className="px-4 pb-4">
          <DataTable<UserItem>
            columns={usersColumns}
            data={usersQuery.data ?? []}
            loading={usersLoading}
            emptyTitle="Пользователи не найдены"
            emptyDescription="Создайте первого пользователя."
            rowKey={(row) => row.id}
          />
        </div>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h3 className="text-base font-semibold">Роли</h3>
            <p className="text-sm text-muted-foreground">Статические роли системы</p>
          </div>
        </div>
        <div className="px-4 pb-4">
          <DataTable<RoleItem>
            columns={rolesColumns}
            data={rolesQuery.data ?? []}
            loading={rolesLoading}
            emptyTitle="Роли не найдены"
            emptyDescription="Роли не найдены."
            rowKey={(row) => row.id}
          />
        </div>
      </Card>

      <ModalShell open={userModalOpen} onOpenChange={setUserModalOpen} title={userMode === "create" ? "Создать пользователя" : "Редактировать пользователя"}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Логин</label>
            <Input value={userForm.login} onChange={(e) => setUserForm((prev) => ({ ...prev, login: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Имя</label>
            <Input value={userForm.firstName} onChange={(e) => setUserForm((prev) => ({ ...prev, firstName: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Фамилия</label>
            <Input value={userForm.lastName} onChange={(e) => setUserForm((prev) => ({ ...prev, lastName: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Роль</label>
            <NativeSelect
              value={userForm.roleId}
              options={rolesOptions}
              onValueChange={(next) => setUserForm((prev) => ({ ...prev, roleId: next }))}
              placeholder="Выберите роль"
            />
          </div>
          {userMode === "create" ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Пароль</label>
              <Input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
              />
            </div>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setUserModalOpen(false)}>
              Отмена
            </Button>
            <Button onClick={() => void submitUser()} disabled={createUserMutation.isPending || updateUserMutation.isPending}>
              Сохранить
            </Button>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={passwordModalOpen} onOpenChange={setPasswordModalOpen} title="Смена пароля">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Новый пароль</label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setPasswordModalOpen(false)}>
              Отмена
            </Button>
            <Button onClick={() => void submitPasswordChange()} disabled={changePasswordMutation.isPending}>
              Сменить пароль
            </Button>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}

