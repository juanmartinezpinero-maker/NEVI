"use client";

import { useActionState } from "react";
import { redeemAction, type RedeemState } from "@/app/actions/rewards";

export function RedeemButton({ rewardId, canAfford, label }: { rewardId: string; canAfford: boolean; label: string }) {
  const [state, action, pending] = useActionState<RedeemState, FormData>(redeemAction, {});
  if (state.ok) {
    return (
      <div role="status" className="rounded-[16px] bg-lime p-3 text-sm">
        <p className="font-bold">¡Canjeado! Tu código:</p>
        <p className="mt-1 select-all font-mono text-lg font-bold tracking-wider">{state.code}</p>
        {state.code?.startsWith("DEMO") && <p className="mt-1 text-xs">Cupón de demostración, sin valor real.</p>}
      </div>
    );
  }
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="rewardId" value={rewardId} />
      <button
        disabled={!canAfford || pending}
        className="w-full rounded-full bg-ink py-2.5 text-sm font-extrabold text-lime disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
      >
        {pending ? "Canjeando…" : label}
      </button>
      {state.error && (
        <p role="alert" className="text-xs text-pink">
          {state.error}
        </p>
      )}
    </form>
  );
}
