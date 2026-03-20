import type { DictionaryResourceName } from "@/entities/dictionary/api/dictionary-types";

export type SimpleDictionaryConfig = {
  resource: DictionaryResourceName;
  tabLabel: string;
  singularLabel: string;
  supportsCode: boolean;
  supportsActive: boolean;
};

export const simpleDictionariesConfig = [
  {
    resource: "manufacturers",
    tabLabel: "Производители",
    singularLabel: "Производитель",
    supportsCode: false,
    supportsActive: true,
  },
  {
    resource: "active-substances",
    tabLabel: "Активные вещества",
    singularLabel: "Активное вещество",
    supportsCode: false,
    supportsActive: true,
  },
  {
    resource: "product-statuses",
    tabLabel: "Статусы препаратов",
    singularLabel: "Статус препарата",
    supportsCode: false,
    supportsActive: true,
  },
  {
    resource: "product-order-sources",
    tabLabel: "Источники заказа препаратов",
    singularLabel: "Источник заказа препарата",
    supportsCode: false,
    supportsActive: true,
  },
  {
    resource: "delivery-companies",
    tabLabel: "Службы доставки",
    singularLabel: "Служба доставки",
    supportsCode: false,
    supportsActive: true,
  },
  {
    resource: "delivery-types",
    tabLabel: "Типы доставки",
    singularLabel: "Тип доставки",
    supportsCode: false,
    supportsActive: true,
  },
  {
    resource: "payment-statuses",
      tabLabel: "Статусы оплаты",
    singularLabel: "Статус оплаты",
    supportsCode: false,
    supportsActive: true,
  },
  {
    resource: "assembly-statuses",
    tabLabel: "Статусы сборки",
    singularLabel: "Статус сборки",
    supportsCode: false,
    supportsActive: true,
  },
  {
    resource: "order-statuses",
    tabLabel: "Статусы заказов",
    singularLabel: "Статус заказа",
    supportsCode: false,
    supportsActive: true,
  },
  {
    resource: "storage-places",
    tabLabel: "Места хранения",
    singularLabel: "Место хранения",
    supportsCode: false,
    supportsActive: true,
  },
  {
    resource: "client-statuses",
    tabLabel: "Статусы клиентов",
    singularLabel: "Статус клиента",
    supportsCode: false,
    supportsActive: true,
  },
  {
    resource: "countries",
    tabLabel: "Страны",
    singularLabel: "Страна",
    supportsCode: true,
    supportsActive: true,
  },
] satisfies ReadonlyArray<SimpleDictionaryConfig>;

export type SimpleDictionaryResourceName = (typeof simpleDictionariesConfig)[number]["resource"];

export function getSimpleDictionaryConfig(resource: DictionaryResourceName): SimpleDictionaryConfig {
  const config = simpleDictionariesConfig.find((item) => item.resource === resource);

  if (!config) {
    throw new Error(`No dictionary config for resource: ${resource}`);
  }

  return config;
}

