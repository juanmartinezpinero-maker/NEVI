"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-[28px] bg-lime p-8 text-center">
      <p className="text-[64px] font-black leading-none tracking-[-0.06em]">
        ups<span className="text-pink">!</span>
      </p>
      <h1 className="mt-3 text-2xl font-black tracking-[-0.04em]">Algo ha fallado</h1>
      <p className="mt-2">Prueba de nuevo en unos segundos.</p>
      <button onClick={reset} className="mt-5 rounded-full bg-ink px-6 py-3 font-extrabold text-lime">
        Reintentar
      </button>
    </div>
  );
}
