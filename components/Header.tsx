import { getGreeting } from "@/lib/greeting";
import { BellIcon } from "@/components/icons";

interface HeaderProps {
  userName: string;
  hasNotifications?: boolean;
}

export function Header({ userName, hasNotifications = true }: HeaderProps) {
  return (
    <header className="flex items-center justify-between pt-6 pb-4">
      <div>
        <p className="text-sm text-ink/60">
          {getGreeting()}, {userName}
        </p>
        <h1 className="font-heading text-2xl font-semibold text-ink">nevi</h1>
      </div>

      <button
        type="button"
        aria-label="Notificaciones"
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
      >
        <BellIcon className="h-5 w-5 text-ink/70" />
        {hasNotifications && (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-coral-red ring-2 ring-white" />
        )}
      </button>
    </header>
  );
}
