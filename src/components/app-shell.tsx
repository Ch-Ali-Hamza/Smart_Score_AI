import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Brain, LogOut, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { logout, useAuth, type Role } from "@/lib/auth";
import { cn } from "@/lib/utils";

export type NavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function AppShell({
  role,
  nav,
  children,
}: {
  role: Role;
  nav: NavItem[];
  children: ReactNode;
}) {
  const auth = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const onLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  const initials = auth?.initials ?? (role === "admin" ? "AD" : role === "teacher" ? "AY" : "AH");

  return (
    <div className="min-h-screen bg-surface text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-navbar px-6">
        <Link to={dashboardFor(role)} className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-info-soft text-brand">
            <Brain className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold text-foreground">SmartScore AI</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="relative grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger" />
          </Link>
          <button
            type="button"
            aria-label="Settings"
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Settings className="h-5 w-5" />
          </button>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-info-soft text-sm font-semibold text-brand">
            {initials}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[220px] shrink-0 flex-col justify-between border-r border-border bg-sidebar md:flex">
          <nav className="flex flex-col gap-1 p-3">
            {nav.map((item) => {
              const active =
                item.to === dashboardFor(role)
                  ? pathname === item.to
                  : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-accent",
                    active && "bg-accent text-accent-foreground",
                  )}
                >
                  {active && (
                    <span className="absolute inset-y-1 left-0 w-1 rounded-r-full bg-brand" />
                  )}
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-3">
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-accent"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

export function dashboardFor(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "teacher") return "/teacher";
  return "/student";
}
