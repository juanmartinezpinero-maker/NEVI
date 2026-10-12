import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { CreatePollForm } from "./CreatePollForm";

export const metadata: Metadata = { title: "Crear una pregunta", robots: { index: false } };

export default async function CreatePage() {
  const user = await requireUser("/crear");
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-[40px] font-black leading-none tracking-[-0.05em]">Propón una pregunta</h1>
        <p className="mt-1 text-muted">Dos opciones para un duelo, o hasta diez para un ranking.</p>
      </div>
      <CreatePollForm isAdmin={user.role === "admin"} />
    </div>
  );
}
