import { useEffect, useState } from "react";

const memory = new Map<string, unknown>();

function readValue<T>(key: string, initial: T): T {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // Corrupt or unavailable validation storage falls back safely.
  }
  return (memory.get(key) as T | undefined) ?? initial;
}

/** Durable fictional validation data for demo mode; never an academic system of record. */
export function usePersistentDemoState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readValue(key, initial));
  useEffect(() => {
    memory.set(key, value);
    try {
      globalThis.localStorage?.setItem(key, JSON.stringify(value));
    } catch {
      /* memory fallback */
    }
  }, [key, value]);
  return [value, setValue] as const;
}
