import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "@/app/layouts/app-layout";
import { GuardedRoute } from "@/app/router/guarded-route";
import { ClientsPage } from "@/pages/clients/clients-page";
import { DashboardPage } from "@/pages/dashboard/dashboard-page";
import { DictionaryResourcePage } from "@/pages/dictionaries/dictionary-resource-page";
import { CitiesPage } from "@/pages/cities/cities-page";
import { CountriesPage } from "@/pages/countries/countries-page";
import { LoginPage } from "@/pages/login/login-page";
import { ManufacturersPage } from "@/pages/manufacturers/manufacturers-page";
import { NotFoundPage } from "@/pages/not-found/not-found-page";
import { OrdersPage } from "@/pages/orders/orders-page";
import { ProductsPage } from "@/pages/products/products-page";
import { ActiveSubstancesPage } from "@/pages/active-substances/active-substances-page";

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
          { path: "products", element: <ProductsPage /> },
          { path: "clients", element: <ClientsPage /> },
          { path: "cities", element: <CitiesPage /> },
          { path: "countries", element: <CountriesPage /> },
          { path: "manufacturers", element: <ManufacturersPage /> },
          { path: "active-substances", element: <ActiveSubstancesPage /> },
          { path: "client-statuses", element: <DictionaryResourcePage resource="client-statuses" /> },
          { path: "product-statuses", element: <DictionaryResourcePage resource="product-statuses" /> },
          { path: "product-order-sources", element: <DictionaryResourcePage resource="product-order-sources" /> },
          { path: "delivery-companies", element: <DictionaryResourcePage resource="delivery-companies" /> },
          { path: "delivery-types", element: <DictionaryResourcePage resource="delivery-types" /> },
          { path: "payment-statuses", element: <DictionaryResourcePage resource="payment-statuses" /> },
          { path: "assembly-statuses", element: <DictionaryResourcePage resource="assembly-statuses" /> },
          { path: "order-statuses", element: <DictionaryResourcePage resource="order-statuses" /> },
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
