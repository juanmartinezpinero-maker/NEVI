import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-[28px] bg-lime p-8 text-center">
      <p className="text-[64px] font-black leading-none tracking-[-0.06em]">
        404<span className="text-pink">!</span>
      </p>
      <h1 className="mt-3 text-2xl font-black tracking-[-0.04em]">No encontramos esta página</h1>
      <p className="mt-2">Puede que la encuesta se haya retirado o el enlace esté mal.</p>
      <Link href="/" className="mt-5 inline-block rounded-full bg-ink px-6 py-3 font-extrabold text-lime">
        Ir al inicio
      </Link>
    </div>
  );
}
