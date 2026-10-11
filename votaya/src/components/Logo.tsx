export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="vy-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="0.6" stopColor="#ec4899" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#vy-g)" />
      <rect x="14" y="34" width="9" height="16" rx="3" fill="#fff" opacity="0.55" />
      <rect x="27.5" y="24" width="9" height="26" rx="3" fill="#fff" opacity="0.8" />
      <path d="M41 30 l5 5 l10 -14" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="font-display text-xl font-extrabold tracking-tight">
        Vota<span className="text-gradient">Ya</span>
      </span>
    </span>
  );
}
