import { LogOut } from "lucide-react";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth/model/use-auth";
import { Button } from "@/shared/ui/button";

const titles: Record<string, string> = {
  "/": "Обзор",
  "/orders": "Заказы",
  "/products": "Препараты",
  "/clients": "Клиенты",
  "/cities": "Города",
  "/countries": "Страны",
  "/manufacturers": "Производители",
  "/active-substances": "Активные вещества",
  "/client-statuses": "Статусы клиентов",
  "/product-statuses": "Статусы препаратов",
  "/product-order-sources": "Источники заказа препаратов",
  "/delivery-companies": "Службы доставки",
  "/delivery-types": "Типы доставки",
  "/payment-statuses": "Статусы оплаты",
  "/assembly-statuses": "Статусы сборки",
  "/order-statuses": "Статусы заказов",
  "/storage-places": "Места хранения",
};

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const pageTitle = useMemo(() => titles[location.pathname] ?? "Admin Panel", [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
      <div>
        <h1 className="text-xl font-semibold">{pageTitle}</h1>
        <p className="text-xs text-muted-foreground">Управление заказами и данными аптеки</p>
      </div>

      <div className="flex items-center gap-2">

        <div className="rounded-md border bg-card px-3 py-2 text-sm">
          <p className="font-medium">{user?.email ?? "Admin пользователь"}</p>
          <p className="text-xs text-muted-foreground">{user?.role ?? "Нет роли"}</p>
        </div>

        <Button variant="destructive" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Выйти
        </Button>
      </div>
    </header>
  );
}
