import { SparklesIcon } from "@/components/icons";

interface ComingSoonProps {
  message: string;
}

export function ComingSoon({ message }: ComingSoonProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 pb-28 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-deep-blue/10 text-deep-blue">
        <SparklesIcon className="h-6 w-6" />
      </div>
      <p className="max-w-[240px] text-sm text-ink/60">{message}</p>
    </div>
  );
}
