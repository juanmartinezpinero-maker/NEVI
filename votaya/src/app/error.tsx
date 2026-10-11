"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card mx-auto mt-10 max-w-md p-8 text-center">
      <p className="text-6xl" aria-hidden>
        😵
      </p>
      <h1 className="mt-3 font-display text-2xl font-extrabold">Algo ha fallado</h1>
      <p className="mt-2 text-muted">Prueba de nuevo en unos segundos.</p>
      <button onClick={reset} className="bg-brand-gradient mt-5 rounded-full px-6 py-3 font-bold text-white">
        Reintentar
      </button>
    </div>
  );
}
