import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "@/app/layouts/app-layout";
import { GuardedRoute } from "@/app/router/guarded-route";
import { DashboardPage } from "@/pages/dashboard/dashboard-page";
import { DictionaryResourcePage } from "@/pages/dictionaries/dictionary-resource-page";
import { LoginPage } from "@/pages/login/login-page";
import { ManufacturersPage } from "@/pages/manufacturers/manufacturers-page";
import { NotFoundPage } from "@/pages/not-found/not-found-page";
import { OrdersAssemblyPage, OrdersDeliveryPage, OrdersPage } from "@/pages/orders/orders-page";
import { ProductsPage } from "@/pages/products/products-page";
import { ActiveSubstancesPage } from "@/pages/active-substances/active-substances-page";
import { UsersPage } from "@/pages/users/users-page";

export const appRouter = createBrowserRouter([
  {
    element: <GuardedRoute requireAuth={false} />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
    ],
  },
  {
    element: <GuardedRoute requireAuth />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "orders", element: <OrdersPage /> },
          { path: "orders-delivery", element: <OrdersDeliveryPage /> },
          { path: "orders-assembly", element: <OrdersAssemblyPage /> },
          { path: "products", element: <ProductsPage /> },
          { path: "manufacturers", element: <ManufacturersPage /> },
          { path: "active-substances", element: <ActiveSubstancesPage /> },
          { path: "users", element: <UsersPage /> },
          { path: "product-order-sources", element: <DictionaryResourcePage resource="product-order-sources" /> },
          { path: "storage-places", element: <DictionaryResourcePage resource="storage-places" /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
