const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  // Keeping warning here helps quickly detect bad env setup across environments.
  console.warn("VITE_API_BASE_URL is not set. Falling back to /api");
}

export const env = {
  // In dev we use relative `/api` to avoid browser CORS preflight issues.
  // Vite dev server can proxy `/api` to backend.
  apiBaseUrl:
    import.meta.env.DEV && API_BASE_URL && (API_BASE_URL.startsWith("http://") || API_BASE_URL.startsWith("https://"))
      ? "/api"
      : API_BASE_URL ?? "/api",
};
