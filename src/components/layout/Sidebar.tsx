"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Kanban,
  Activity,
  Settings,
  ShoppingCart,
  Megaphone,
  CheckSquare,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contacts", label: "Contactos", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/contenido", label: "Contenido", icon: Megaphone },
  { href: "/tareas", label: "Tareas", icon: CheckSquare },
  { href: "/decisiones", label: "Decisiones", icon: Zap },
  { href: "/activities", label: "Actividades", icon: Activity },
  { href: "/settings", label: "Configuración", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col bg-[var(--sidebar)] text-[var(--sidebar-foreground)] min-h-screen">
      <div className="flex h-16 items-center gap-3 px-6 border-b border-[var(--sidebar-border)]">
        {/* GrowthCore G logo mark */}
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="28" height="28" rx="7" fill="#22C55E" fillOpacity="0.15"/>
          <text x="14" y="19" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="16" fill="#22C55E">G</text>
        </svg>
        <span className="text-lg font-bold tracking-tight">GrowthCore CRM</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)]"
                  : "text-[var(--sidebar-foreground)]/70 hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-[var(--sidebar-border)]">
        <p className="text-xs text-[var(--sidebar-foreground)]/50">
          GrowthCore CRM v1.0
        </p>
        <p className="text-xs text-[var(--sidebar-foreground)]/50">
          by GrowthCore
        </p>
      </div>
    </aside>
  );
}
