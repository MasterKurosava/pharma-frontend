export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized";

export function emitUnauthorizedEvent() {
  window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
}

export function subscribeUnauthorizedEvent(listener: () => void) {
  window.addEventListener(AUTH_UNAUTHORIZED_EVENT, listener);

  return () => {
    window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, listener);
  };
}
