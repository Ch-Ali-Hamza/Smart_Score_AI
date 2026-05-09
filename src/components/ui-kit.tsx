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
}: {
  label: string;
  value: string | number;
  iconBg?: string;
  iconFg?: string;
  icon: ReactNode;
  tone?: "info" | "success" | "warning" | "danger";
}) {
  const toneMap: Record<string, { bg: string; fg: string }> = {
    info: { bg: "bg-info-soft", fg: "text-info-foreground" },
    success: { bg: "bg-success-soft", fg: "text-success-foreground" },
    warning: { bg: "bg-warning-soft", fg: "text-warning-foreground" },
    danger: { bg: "bg-danger-soft", fg: "text-danger-foreground" },
  };
  const t = tone ? toneMap[tone] : null;
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className={cn("mb-3 grid h-10 w-10 place-items-center rounded-lg", iconBg ?? t?.bg, iconFg ?? t?.fg)}>
        {icon}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-foreground">{value}</div>
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
