export type SerializableQueryParam = string | number | boolean | null;

export type SerializableQueryParams = Record<string, SerializableQueryParam | undefined>;

function normalizeParams(params: SerializableQueryParams | undefined): SerializableQueryParams | undefined {
  if (!params) return undefined;

  const cleanedEntries = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => [key, value]);

  return Object.fromEntries(cleanedEntries) as SerializableQueryParams;
}

/**
 * Returns stable string representation of query params for use in React Query keys.
 */
export function serializeQueryParams(params: SerializableQueryParams | undefined): string | undefined {
  const normalized = normalizeParams(params);
  if (!normalized) return undefined;

  // Stable key order: sort object keys.
  const sorted = Object.keys(normalized)
    .sort()
    .reduce<SerializableQueryParams>((acc, key) => {
      acc[key] = normalized[key];
      return acc;
    }, {});

  return JSON.stringify(sorted);
}

