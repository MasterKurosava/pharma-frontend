import type { DictionaryResourceName } from "@/entities/dictionary/api/dictionary-types";

export type SimpleDictionaryConfig = {
  resource: DictionaryResourceName;
  tabLabel: string;
  singularLabel: string;
  supportsCode: boolean;
  supportsColor: boolean;
  supportsActive: boolean;
};

export const simpleDictionariesConfig = [
  {
    resource: "manufacturers",
    tabLabel: "Производители",
    singularLabel: "Производитель",
    supportsCode: false,
    supportsColor: false,
    supportsActive: true,
  },
  {
    resource: "active-substances",
    tabLabel: "Активные вещества",
    singularLabel: "Активное вещество",
    supportsCode: false,
    supportsColor: false,
    supportsActive: true,
  },
  {
    resource: "product-order-sources",
    tabLabel: "Источники заказа препаратов",
    singularLabel: "Источник заказа препарата",
    supportsCode: false,
    supportsColor: true,
    supportsActive: true,
  },
  {
    resource: "product-storage-places",
    tabLabel: "Места хранения препаратов",
    singularLabel: "Место хранения препарата",
    supportsCode: false,
    supportsColor: false,
    supportsActive: true,
  },
  {
    resource: "storage-places",
    tabLabel: "Места хранения заказов",
    singularLabel: "Место хранения заказа",
    supportsCode: false,
    supportsColor: false,
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

