import { redirect } from "next/navigation";

export default async function CategoryRedirect(props: PageProps<"/c/[category]">) {
  const { category } = await props.params;
  redirect(`/encuestas?cat=${encodeURIComponent(category)}`);
}
