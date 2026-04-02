import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CurrentUser } from "@/entities/user/model/types";
import type { LoginDto } from "@/features/auth/api/types";
import { useAuth } from "@/features/auth/model/use-auth";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

export function useLoginMutation() {
  const { login } = useAuth();

  return useMutation<CurrentUser, Error, LoginDto>({
    mutationFn: login,
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Неверный логин или пароль"));
    },
  });
}
