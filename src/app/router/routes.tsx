import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "@/app/layouts/app-layout";
import { GuardedRoute } from "@/app/router/guarded-route";
import { DashboardPage } from "@/pages/dashboard/dashboard-page";
import { DictionaryResourcePage } from "@/pages/dictionaries/dictionary-resource-page";
import { LoginPage } from "@/pages/login/login-page";
import { ManufacturersPage } from "@/pages/manufacturers/manufacturers-page";
import { NotFoundPage } from "@/pages/not-found/not-found-page";
import {
  OrdersAlmatyDeliveryPage,
  OrdersArchivePage,
  OrdersPage,
  OrdersPickupPage,
  OrdersRequestsPage,
  OrdersRkDeliveryPage,
} from "@/pages/orders/orders-page";
import { ProductsPage } from "@/pages/products/products-page";
import { ActiveSubstancesPage } from "@/pages/active-substances/active-substances-page";
import { UsersPage } from "@/pages/users/users-page";
import {
  ActionOrderStatusesPage,
  StateOrderStatusesPage,
} from "@/pages/order-statuses/order-statuses-page";

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
          { path: "orders-requests", element: <OrdersRequestsPage /> },
          { path: "orders-pickup", element: <OrdersPickupPage /> },
          { path: "orders-almaty-delivery", element: <OrdersAlmatyDeliveryPage /> },
          { path: "orders-rk-delivery", element: <OrdersRkDeliveryPage /> },
          { path: "orders-archive", element: <OrdersArchivePage /> },
          { path: "products", element: <ProductsPage /> },
          { path: "manufacturers", element: <ManufacturersPage /> },
          { path: "active-substances", element: <ActiveSubstancesPage /> },
          { path: "order-statuses", element: <ActionOrderStatusesPage /> },
          { path: "order-statuses-action", element: <ActionOrderStatusesPage /> },
          { path: "order-statuses-state", element: <StateOrderStatusesPage /> },
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
