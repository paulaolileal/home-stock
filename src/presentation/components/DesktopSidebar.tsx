import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Plus, Package, Tag, MapPin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuickAddDialog } from "@/presentation/components/QuickAddDialog";
import { AddProductSheet } from "@/presentation/components/AddProductSheet";
import { NAV_ITEMS } from "@/presentation/navigation/navItems";

// z-index scale (desktop): 10 sidebar (sticky) < 40 BottomNav (mobile-only, see
// BottomNav.tsx) < 50 Dialog/Sheet/DropdownMenu (Radix Portal, global). Sidebar and
// BottomNav never coexist since their breakpoints are mutually exclusive.
export function DesktopSidebar() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState<"category" | "location" | null>(null);
  const [addProductOpen, setAddProductOpen] = useState(false);

  return (
    <>
      <aside
        aria-label="Navegação"
        className="hidden lg:sticky lg:top-0 lg:z-10 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:gap-1 lg:border-r lg:border-border/60 lg:bg-card/60 lg:p-4"
      >
        <div className="mb-4 px-2 text-lg font-extrabold tracking-tight">Home Stock</div>

        {NAV_ITEMS.map((it) => {
          const active = it.match(pathname);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
              {it.label}
            </Link>
          );
        })}

        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Adicionar"
              className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-foreground py-2.5 text-sm font-bold text-background transition-transform active:scale-[0.98]"
            >
              <Plus className="size-4" strokeWidth={2.4} />
              Adicionar
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-48 rounded-2xl p-1.5">
            <DropdownMenuItem
              className="gap-2 rounded-xl py-2.5 text-sm font-semibold"
              onSelect={() => setAddProductOpen(true)}
            >
              <Package className="size-4" strokeWidth={2.2} />
              Novo produto
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 rounded-xl py-2.5 text-sm font-semibold"
              onSelect={() => setQuickAdd("category")}
            >
              <Tag className="size-4" strokeWidth={2.2} />
              Nova categoria
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 rounded-xl py-2.5 text-sm font-semibold"
              onSelect={() => setQuickAdd("location")}
            >
              <MapPin className="size-4" strokeWidth={2.2} />
              Novo local
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </aside>

      {quickAdd && (
        <QuickAddDialog
          type={quickAdd}
          open={!!quickAdd}
          onOpenChange={(open) => !open && setQuickAdd(null)}
        />
      )}
      <AddProductSheet open={addProductOpen} onOpenChange={setAddProductOpen} />
    </>
  );
}
