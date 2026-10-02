/**
 * Freno silencioso ante ráfagas de PIN fallidos: nunca bloquea (no se puede
 * atrasar a un mesero), pero cada fallo de más en la ventana tarda un poco
 * más en responder, lo que hace inviable probar los 10 000 PIN.
 */
const WINDOW_MS = 60_000;
const FREE_FAILURES = 10;
const STEP_MS = 1_000;
const MAX_DELAY_MS = 3_000;

const failures = new Map<string, number[]>();

const recent = (key: string, now: number) =>
  (failures.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

export const recordFailure = (key: string, now = Date.now()) => {
  const list = [...recent(key, now), now];
  failures.set(key, list);
  return list.length;
};

export const clearFailures = (key: string) => failures.delete(key);

/** Espera a aplicar antes de responder a un intento fallido. */
export const delayFor = (key: string, now = Date.now()) => {
  const extra = recent(key, now).length - FREE_FAILURES;
  return extra > 0 ? Math.min(MAX_DELAY_MS, extra * STEP_MS) : 0;
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
