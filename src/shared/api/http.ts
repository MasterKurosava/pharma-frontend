import type { AxiosRequestConfig } from "axios";

import { apiClient } from "@/shared/api/client";

export async function httpGet<TResponse>(url: string, config?: AxiosRequestConfig) {
  const { data } = await apiClient.get<TResponse>(url, config);
  return data;
}

export async function httpPost<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig,
) {
  const { data } = await apiClient.post<TResponse>(url, body, config);
  return data;
}

export async function httpPut<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig,
) {
  const { data } = await apiClient.put<TResponse>(url, body, config);
  return data;
}

export async function httpDelete<TResponse>(url: string, config?: AxiosRequestConfig) {
  const { data } = await apiClient.delete<TResponse>(url, config);
  return data;
}
