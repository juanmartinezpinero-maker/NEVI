export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando">
      <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-ink-3" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-56 animate-pulse rounded-3xl bg-ink-3" />
        ))}
      </div>
    </div>
  );
}
