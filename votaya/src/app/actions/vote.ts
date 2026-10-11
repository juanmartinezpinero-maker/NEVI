"use server";

import { track } from "@/lib/analytics";
import { getResults, type Results } from "@/lib/polls";
import { castVote, type VoteError } from "@/lib/votes";
import { currentVoter } from "@/lib/voter";

const MESSAGES: Record<VoteError, string> = {
  not_found: "Esta encuesta no existe.",
  closed: "Esta encuesta ya no acepta votos.",
  already_voted: "Ya habías votado en esta encuesta.",
  invalid_option: "Elige una opción válida.",
  invalid_text: "Escribe una respuesta válida (máx. 60 caracteres, sin insultos).",
  rate_limited: "Demasiados votos seguidos desde tu conexión. Prueba en un rato.",
  needs_signup: "¡Llevas muchos votos! Regístrate gratis en 30 segundos para seguir votando y guardarlos.",
};

export type VoteActionResult =
  | { ok: true; results: Results; myOptionId: string | null; myWriteInId: string | null }
  | { ok: false; error: VoteError; message: string; results?: Results };

export async function voteAction(pollId: string, choice: { optionId?: string; otherText?: string }): Promise<VoteActionResult> {
  if (typeof pollId !== "string" || pollId.length > 64) return { ok: false, error: "not_found", message: MESSAGES.not_found };
  const voter = await currentVoter();
  const res = await castVote(
    pollId,
    {
      optionId: typeof choice?.optionId === "string" ? choice.optionId : undefined,
      otherText: typeof choice?.otherText === "string" ? choice.otherText.slice(0, 200) : undefined,
    },
    voter,
  );
  if (!res.ok) {
    const results = res.error === "already_voted" ? await getResults(pollId) : undefined;
    return { ok: false, error: res.error, message: MESSAGES[res.error], results };
  }
  await track("vote", {
    pollId,
    userId: voter.userId,
    anonId: voter.anonId,
    refCode: voter.refCode,
    meta: { verified: Boolean(voter.profile), other: Boolean(res.writeInId) },
  });
  return { ok: true, results: await getResults(pollId), myOptionId: res.optionId, myWriteInId: res.writeInId };
}
