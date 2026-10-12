/** Logotipo de texto: «voppi» en tinta y la exclamación en rosa. */
export function Logo({ className = "text-[28px]" }: { className?: string }) {
  return (
    <span className={`font-black leading-none tracking-[-0.06em] text-ink ${className}`}>
      voppi<span className="tracking-normal text-pink">!</span>
    </span>
  );
}

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <span
      className="inline-grid place-items-center rounded-[28%] bg-lime font-black tracking-[-0.06em] text-ink"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      aria-hidden
    >
      v<span className="text-pink">!</span>
    </span>
  );
}
