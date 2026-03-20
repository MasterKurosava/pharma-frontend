import axios from "axios";

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage;
  }

  const messageFromResponse =
    typeof error.response?.data === "object" &&
    error.response?.data !== null &&
    "message" in error.response.data &&
    typeof (error.response.data as { message?: string }).message === "string"
      ? (error.response.data as { message: string }).message
      : null;

  return messageFromResponse ?? fallbackMessage;
}
