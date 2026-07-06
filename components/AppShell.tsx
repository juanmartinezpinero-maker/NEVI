import { BottomNav } from "@/components/BottomNav";
import { SidebarNav } from "@/components/SidebarNav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-warm-bg md:flex">
      <SidebarNav />
      <div className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-1 flex-col px-4 md:max-w-none md:px-10 md:py-8">
        <div className="flex w-full flex-1 flex-col md:mx-auto md:max-w-3xl">{children}</div>
      </div>
      <BottomNav />
    </div>
  );
}
