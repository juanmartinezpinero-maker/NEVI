import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto mt-10 max-w-md p-8 text-center">
      <p className="text-6xl" aria-hidden>
        🤷
      </p>
      <h1 className="mt-3 font-display text-2xl font-extrabold">No encontramos esta página</h1>
      <p className="mt-2 text-muted">Puede que la encuesta se haya retirado o el enlace esté mal.</p>
      <Link href="/" className="bg-brand-gradient mt-5 inline-block rounded-full px-6 py-3 font-bold text-white">
        Ir al inicio
      </Link>
    </div>
  );
}
