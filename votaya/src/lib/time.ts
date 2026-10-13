/** «Hace 2 horas», «Hace 3 días»… */
export function timeAgo(date: Date | null | undefined, now = Date.now()): string {
  if (!date) return "";
  const s = Math.max(0, Math.round((now - date.getTime()) / 1000));
  if (s < 60) return "Ahora mismo";
  const m = Math.round(s / 60);
  if (m < 60) return `Hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `Hace ${h} ${h === 1 ? "hora" : "horas"}`;
  const d = Math.round(h / 24);
  if (d < 30) return `Hace ${d} ${d === 1 ? "día" : "días"}`;
  const mo = Math.round(d / 30);
  return `Hace ${mo} ${mo === 1 ? "mes" : "meses"}`;
}
