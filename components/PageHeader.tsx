import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="flex items-center gap-3 pt-6 pb-4">
      <Link
        href="/"
        aria-label="Volver al inicio"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm"
      >
        <ArrowLeftIcon className="h-5 w-5 text-ink/70" />
      </Link>
      <div>
        <h1 className="font-heading text-xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-ink/60">{subtitle}</p>}
      </div>
    </header>
  );
}
