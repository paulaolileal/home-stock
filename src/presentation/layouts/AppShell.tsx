import { Outlet } from "react-router-dom";
import { BottomNav } from "@/presentation/components/BottomNav";
import { DesktopSidebar } from "@/presentation/components/DesktopSidebar";

export function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <DesktopSidebar />

      <div className="lg:min-w-0 lg:flex-1">
        <div className="mx-auto w-full max-w-lg lg:max-w-6xl lg:px-8">
          <Outlet />

          <footer className="flex justify-center py-3">
            <a
              href="https://lealtek.com"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-40 transition-opacity hover:opacity-70"
              title="Desenvolvido por LealTEK"
            >
              <img src="/lealtek-full.png" alt="LealTEK" className="h-8 object-contain" />
            </a>
          </footer>
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
