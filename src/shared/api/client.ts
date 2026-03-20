import axios from "axios";

import { emitUnauthorizedEvent } from "@/features/auth/model/auth-events";
import { env } from "@/shared/config/env";
import { clearAccessToken, getAccessToken } from "@/shared/lib/auth-token";

const AUTH_LOGIN_URL = "/auth/login";

function isLoginRequest(url?: string) {
  return Boolean(url && url.includes(AUTH_LOGIN_URL));
}

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15_000,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url as string | undefined;

    if (status === 401 && !isLoginRequest(requestUrl)) {
      const hadToken = Boolean(getAccessToken());
      clearAccessToken();

      if (hadToken) {
        emitUnauthorizedEvent();
      }
    }

    return Promise.reject(error);
  },
);
