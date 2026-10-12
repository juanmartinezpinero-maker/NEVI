export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="6" y="34" width="12" height="24" rx="4" fill="#f43f6b" />
      <rect x="22" y="20" width="12" height="38" rx="4" fill="#e5254f" />
      <rect x="38" y="8" width="12" height="50" rx="4" fill="#c81d43" />
      <path d="M44 22 l6 6 l12 -16" stroke="#7c3aed" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="font-display text-[22px] font-extrabold tracking-tight text-ink">VotaYa</span>
    </span>
  );
}
