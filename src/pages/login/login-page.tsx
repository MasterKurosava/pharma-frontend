import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

import { useLoginMutation } from "@/features/auth/model/use-login-mutation";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";

const loginSchema = z.object({
  login: z
    .string()
    .trim()
    .min(1, "Введите логин")
    .refine((value) => !value.includes("@"), "Нужен логин, не email"),
  password: z.string().min(6, "Минимально 6 символов"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  const loginMutation = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      login: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    await loginMutation.mutateAsync(values);
    navigate(state?.from?.pathname ?? "/", { replace: true });
  };

  return (
    <div className="grid min-h-screen bg-muted/30 lg:grid-cols-2">
      <div className="hidden border-r bg-gradient-to-b from-primary/10 to-background p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">Pharma Admin</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Панель управления для заказов, товаров, клиентов и словарей в одном административном панеле.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md border-border/70 bg-card/95 shadow-lg">
          <CardHeader>
            <CardTitle>Вход в систему</CardTitle>
            <CardDescription>Используйте свои административные учетные данные для продолжения.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-1.5">
                <label htmlFor="login" className="text-sm font-medium">
                  Логин
                </label>
                <Input
                  id="login"
                  type="text"
                  autoComplete="username"
                  placeholder="admin"
                  {...register("login")}
                />
                {errors.login ? <p className="text-xs text-destructive">{errors.login.message}</p> : null}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium">
                  Пароль
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Введите ваш пароль"
                  {...register("password")}
                />
                {errors.password ? <p className="text-xs text-destructive">{errors.password.message}</p> : null}
              </div>

              <Button className="w-full" type="submit" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Вход в систему..." : "Вход в систему"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
