import type { Metadata } from "next";
import Link from "next/link";
import { CreatePollForm } from "@/app/crear/CreatePollForm";
import { requireBrand } from "@/lib/brands";

export const metadata: Metadata = { title: "Nueva encuesta de marca", robots: { index: false } };

export default async function NewBrandPoll(props: PageProps<"/marca/[sponsorId]/nueva">) {
  const { sponsorId } = await props.params;
  const { user, brand } = await requireBrand(sponsorId, `/marca/${sponsorId}/nueva`);
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link href={`/marca/${sponsorId}`} className="kicker hover:text-ink">
        ← {brand.name}
      </Link>
      <h1 className="text-[40px] font-black leading-none tracking-[-0.05em]">Nueva encuesta</h1>
      <CreatePollForm isAdmin={user.role === "admin"} brand={{ id: brand.id, name: brand.name }} />
    </div>
  );
}
