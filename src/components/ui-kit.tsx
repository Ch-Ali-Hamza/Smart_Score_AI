import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground sm:text-[22px]">
        {icon}
        {title}
      </h1>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  iconBg,
  iconFg,
  icon,
  tone,
  trend,
}: {
  label: string;
  value: string | number;
  iconBg?: string;
  iconFg?: string;
  icon: ReactNode;
  tone?: "info" | "success" | "warning" | "danger";
  trend?: string;
}) {
  const gradientMap: Record<string, string> = {
    info: "var(--gradient-info)",
    success: "var(--gradient-success)",
    warning: "var(--gradient-warning)",
    danger: "var(--gradient-danger)",
  };
  const grad = tone ? gradientMap[tone] : "var(--gradient-info)";
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5"
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      <div
        aria-hidden
        className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
        style={{ background: grad }}
      />
      <div
        className={cn("mb-3 grid h-11 w-11 place-items-center rounded-xl text-white shadow-md", iconBg, iconFg)}
        style={!iconBg ? { background: grad } : undefined}
      >
        {icon}
      </div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-end gap-2">
        <div className="text-3xl font-bold tracking-tight text-foreground">{value}</div>
        {trend && <div className="pb-1 text-xs font-medium text-muted-foreground">{trend}</div>}
      </div>
    </div>
  );
}

export function HeroHeader({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div
      className="relative mb-6 overflow-hidden rounded-2xl p-6 text-white sm:p-8"
      style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-elevated)" }}
    >
      <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20 text-white">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-white/85">{subtitle}</p>}
          </div>
        </div>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}

export function Card({
  title,
  children,
  className,
  action,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 shadow-sm", className)}>
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Pill({
  children,
  variant = "info",
}: {
  children: ReactNode;
  variant?: "info" | "success" | "warning" | "danger" | "student" | "teacher" | "admin";
}) {
  const map: Record<string, string> = {
    info: "bg-info-soft text-info-foreground",
    success: "bg-success-soft text-success-foreground",
    warning: "bg-warning-soft text-warning-foreground",
    danger: "bg-danger-soft text-danger-foreground",
    student: "bg-pill-student-bg text-pill-student-fg",
    teacher: "bg-pill-teacher-bg text-pill-teacher-fg",
    admin: "bg-pill-admin-bg text-pill-admin-fg",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", map[variant])}>
      {children}
    </span>
  );
}

export function DataTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
