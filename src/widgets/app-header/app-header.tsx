import { LogOut, RotateCcw } from "lucide-react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/features/auth/model/use-auth";
import { Button } from "@/shared/ui/button";

const titles: Record<string, string> = {
  "/": "Обзор",
  "/orders": "Заказы",
  "/orders-delivery": "Доставка",
  "/orders-assembly": "Сборка заказов",
  "/products": "Препараты",
  "/manufacturers": "Производители",
  "/active-substances": "Активные вещества",
  "/users": "Пользователи и роли",
  "/product-order-sources": "Источники заказа препаратов",
  "/product-storage-places": "Места хранения препаратов",
  "/storage-places": "Места хранения заказов",
};

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();

  const pageTitle = useMemo(() => titles[location.pathname] ?? "Admin Panel", [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleClearCache = () => {
    queryClient.clear();
    toast.success("Кеш успешно сброшен");
  };

  return (
    <header className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
      <div>
        <h1 className="text-xl font-semibold">{pageTitle}</h1>
        <p className="text-xs text-muted-foreground">Управление заказами и данными аптеки</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="rounded-md border bg-card px-3 py-2 text-sm">
          <p className="font-medium">{user?.login ?? user?.email ?? "Admin пользователь"}</p>
          <p className="text-xs text-muted-foreground">{user?.role ?? "Нет роли"}</p>
        </div>

        <Button variant="outline" onClick={handleClearCache}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Сбросить кеш
        </Button>

        <Button variant="destructive" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Выйти
        </Button>
      </div>
    </header>
  );
}
