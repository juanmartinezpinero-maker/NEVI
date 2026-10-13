import { redirect } from "next/navigation";

export default async function SearchRedirect(props: PageProps<"/buscar">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  redirect(q ? `/encuestas?q=${encodeURIComponent(q)}` : "/encuestas");
}
