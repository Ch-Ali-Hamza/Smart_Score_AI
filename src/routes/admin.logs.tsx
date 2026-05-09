import { createFileRoute } from "@tanstack/react-router";
import { Shield, CheckCircle2, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/lib/nav-config";
import { Card, DataTable, PageHeader, Pill } from "@/components/ui-kit";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/logs")({
  head: () => ({ meta: [{ title: "System Logs & Backup — SmartScore AI" }] }),
  component: SystemLogs,
});

interface LogRow {
  ts: string;
  user: string;
  role: string;
  action: string;
  status: string;
}

function SystemLogs() {
  const [tab, setTab] = useState<"logs" | "backup">("logs");
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  async function loadLogs(from?: string, to?: string, user?: string) {
    setLoading(true);

    let query = supabase
      .from("logs")
      .select("created_at, action, status, user_id, users(name, role)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (from) query = query.gte("created_at", from);
    if (to)   query = query.lte("created_at", to + "T23:59:59");

    const { data, error } = await query;

    if (error) {
      toast.error("Failed to load logs");
      setLoading(false);
      return;
    }

    let rows: LogRow[] = (data ?? []).map((l: any) => ({
      ts: new Date(l.created_at).toLocaleString("en-PK", { dateStyle: "short", timeStyle: "short" }),
      user: l.users?.name ?? l.user_id,
      role: l.users?.role
        ? l.users.role.charAt(0).toUpperCase() + l.users.role.slice(1)
        : "—",
      action: l.action,
      status: l.status ?? "Success",
    }));

    // Client-side user search filter
    if (user) {
      const lc = user.toLowerCase();
      rows = rows.filter((r) => r.user.toLowerCase().includes(lc));
    }

    setLogs(rows);
    setLoading(false);
  }

  useEffect(() => { loadLogs(); }, []);

  function applyFilters() {
    loadLogs(fromDate || undefined, toDate || undefined, search || undefined);
  }

  return (
    <AppShell role="admin" nav={adminNav}>
      <PageHeader title="System Logs & Backup" icon={<Shield className="h-5 w-5 text-brand" />} />

      <div className="mb-4 flex border-b border-border">
        {(["logs", "backup"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === t
                ? "border-brand text-brand"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "logs" ? "System Logs" : "Backup Data"}
          </button>
        ))}
      </div>

      {tab === "logs" ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-lg border border-input bg-card px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-lg border border-input bg-card px-3 py-2 text-sm"
            />
            <input
              placeholder="Search user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-input bg-card px-3 py-2 text-sm"
            />
            <button
              onClick={applyFilters}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
            >
              Apply
            </button>
          </div>

          <Card>
            {loading ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">Loading logs…</p>
            ) : (
              <DataTable>
                <thead>
                  <tr className="bg-accent text-left text-xs font-semibold text-accent-foreground">
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                        No logs found.
                      </td>
                    </tr>
                  ) : (
                    logs.map((r, i) => (
                      <tr key={i} className={i % 2 ? "bg-surface-soft" : "bg-card"}>
                        <td className="px-4 py-3 text-muted-foreground">{r.ts}</td>
                        <td className="px-4 py-3 font-medium">{r.user}</td>
                        <td className="px-4 py-3">{r.role}</td>
                        <td className="px-4 py-3">{r.action}</td>
                        <td className="px-4 py-3">
                          <Pill variant={r.status === "Success" ? "success" : "danger"}>{r.status}</Pill>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </DataTable>
            )}
          </Card>
        </>
      ) : (
        <Card>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-success-foreground" />
            <div className="text-base font-semibold">Last Backup: 07 May 2026 — 11:45 PM</div>
            <button
              onClick={() => toast.success("Backup started")}
              className="mt-2 rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground"
            >
              Backup Now
            </button>
            <a href="#" className="inline-flex items-center gap-1 text-sm text-teal hover:underline">
              <Download className="h-4 w-4" /> Download Last Backup
            </a>
          </div>
        </Card>
      )}
    </AppShell>
  );
}
