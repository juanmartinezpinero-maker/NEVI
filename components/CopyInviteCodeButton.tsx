"use client";

import { useState } from "react";

interface CopyInviteCodeButtonProps {
  code: string;
}

export function CopyInviteCodeButton({ code }: CopyInviteCodeButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="mt-1 flex w-full items-center justify-between rounded-lg bg-warm-bg px-3 py-2.5"
    >
      <span className="font-mono text-base font-semibold tracking-widest text-ink">{code}</span>
      <span className="text-xs font-semibold text-sage">{copied ? "¡Copiado!" : "Copiar"}</span>
    </button>
  );
}
