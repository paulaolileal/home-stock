import { Outlet } from "react-router-dom";
import { BottomNav } from "@/presentation/components/BottomNav";

export function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-lg">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
