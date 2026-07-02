import { SparklesIcon } from "@/components/icons";

interface AIInsightBannerProps {
  message: string;
}

export function AIInsightBanner({ message }: AIInsightBannerProps) {
  return (
    <section className="flex gap-3 rounded-2xl border border-deep-blue/20 bg-deep-blue/15 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-deep-blue text-white">
        <SparklesIcon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-deep-blue">
          Predicción de nevi
        </p>
        <p className="mt-0.5 text-sm leading-snug text-ink/80">{message}</p>
      </div>
    </section>
  );
}
