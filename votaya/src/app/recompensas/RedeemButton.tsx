"use client";

import { useActionState } from "react";
import { redeemAction, type RedeemState } from "@/app/actions/rewards";

export function RedeemButton({ rewardId, canAfford, label }: { rewardId: string; canAfford: boolean; label: string }) {
  const [state, action, pending] = useActionState<RedeemState, FormData>(redeemAction, {});
  if (state.ok) {
    return (
      <div role="status" className="rounded-xl bg-emerald-50 p-3 text-sm ring-1 ring-emerald-200">
        <p className="font-bold text-emerald-800">¡Canjeado! Tu código:</p>
        <p className="mt-1 select-all font-mono text-lg font-bold tracking-wider">{state.code}</p>
        {state.code?.startsWith("DEMO") && <p className="mt-1 text-xs text-emerald-800">Cupón de demostración, sin valor real.</p>}
      </div>
    );
  }
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="rewardId" value={rewardId} />
      <button
        disabled={!canAfford || pending}
        className="w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-muted"
      >
        {pending ? "Canjeando…" : label}
      </button>
      {state.error && (
        <p role="alert" className="text-xs text-rose-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
