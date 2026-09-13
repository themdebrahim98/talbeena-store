/**
 * Realtime Database stores "arrays" as objects with numeric-string keys
 * (`{ "0": "a", "1": "b" }`). This normalises either shape to a real array.
 */
export type RtdbList<T> = T[] | Record<string, T> | null | undefined;

export function rtdbListToArray<T>(value: RtdbList<T>): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return Object.keys(value)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => (value as Record<string, T>)[key]);
}

/** RTDB keys cannot contain `. $ # [ ] /` — sanitise emails for key use. */
export function sanitizeKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[.$#[\]/]/g, ",")
    .replace(/[^a-z0-9,@_-]/g, "-");
}