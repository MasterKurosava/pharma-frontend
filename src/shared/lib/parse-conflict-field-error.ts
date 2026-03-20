import axios from "axios";

export type ConflictFieldError = {
  field: string;
  message: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) return null;
  return value as Record<string, unknown>;
}

/**
 * Tries to extract a field-specific error from a 409 Conflict payload.
 * Backend payloads can vary, so this function is defensive by design.
 */
export function parseConflictErrorForField(error: unknown, field: string): ConflictFieldError | null {
  if (!axios.isAxiosError(error)) return null;
  if (error.response?.status !== 409) return null;

  const data = error.response.data;

  const fallbackMessage =
    field === "phone"
      ? "Клиент с таким номером телефона уже существует"
      : `Field "${field}" already exists`;

  if (typeof data === "string") {
    const lowered = data.toLowerCase();
    if (lowered.includes(field.toLowerCase())) {
      return { field, message: fallbackMessage };
    }
    return null;
  }

  const record = asRecord(data);
  if (!record) return null;

  // Common shapes: { field: "phone", message: "..." }
  const recordField = typeof record.field === "string" ? record.field : undefined;
  if (recordField === field) {
    const messageFromPayload = typeof record.message === "string" ? record.message : undefined;
    return { field, message: messageFromPayload ?? fallbackMessage };
  }

  // Common shapes: { errors: { phone: "..." } }
  const errorsRecord = record.errors ? asRecord(record.errors) : null;
  const errorsField = errorsRecord ? errorsRecord[field] : undefined;
  if (typeof errorsField === "string") {
    return { field, message: errorsField };
  }

  // Another common shape: { conflicts: { field: "phone", message: "..." } }
  const conflicts = record.conflicts;
  if (Array.isArray(conflicts)) {
    const match = conflicts.find((c) => asRecord(c)?.field === field);
    const matchRecord = match ? asRecord(match) : null;
    const matchMessage = matchRecord ? matchRecord.message : undefined;
    if (matchRecord && typeof matchMessage === "string") {
      return { field, message: matchMessage };
    }
  }

  // Heuristic fallback: inspect serialized payload for field name.
  try {
    const lowered = JSON.stringify(record).toLowerCase();
    if (lowered.includes(field.toLowerCase())) {
      const messageFromPayload = typeof record.message === "string" ? record.message : undefined;
      return { field, message: messageFromPayload ?? fallbackMessage };
    }
  } catch {
    // ignore
  }

  return null;
}

