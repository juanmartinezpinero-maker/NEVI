/** Días seguidos con al menos un voto. `days` en formato YYYY-MM-DD (UTC). */
export function streakFrom(days: string[], today = new Date()): number {
  const set = new Set(days);
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const key = () => d.toISOString().slice(0, 10);
  if (!set.has(key())) d.setUTCDate(d.getUTCDate() - 1);
  let n = 0;
  while (set.has(key())) {
    n++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return n;
}
