import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, GraduationCap, UserCheck, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/lib/nav-config";
import { Card, DataTable, HeroHeader, Pill, StatCard } from "@/components/ui-kit";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — SmartScore AI" }] }),
  component: AdminDashboard,
});

interface ActivityRow {
  ts: string;
  user: string;
  user_id: string;
  action: string;
  status: string;
}

interface Stats {
  students: number;
  teachers: number;
  active: number;
  alerts: number;
}

function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ students: 0, teachers: 0, active: 0, alerts: 0 });
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Fetch user role counts
      const { data: users } = await supabase
        .from("users")
        .select("id, role, created_at, name");

      // Fetch recent logs/activity
      const { data: logs } = await supabase
        .from("logs")
        .select("created_at, user_id, action, status, users(name, role)")
        .order("created_at", { ascending: false })
        .limit(10);

      if (users) {
        const students = users.filter((u: any) => u.role === "student").length;
        const teachers = users.filter((u: any) => u.role === "teacher").length;
        // "active" = users created/seen in last 30 days as a proxy
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const active = users.filter((u: any) => new Date(u.created_at) >= thirtyDaysAgo).length;

        setStats({ students, teachers, active, alerts: 0 });
      }

      if (logs) {
        const rows: ActivityRow[] = (logs as any[]).map((l) => ({
          ts: new Date(l.created_at).toLocaleString("en-PK", { dateStyle: "short", timeStyle: "short" }),
          user: l.users?.name ?? l.user_id,
          user_id: l.user_id,
          action: l.action,
          status: l.status ?? "Success",
        }));
        setActivity(rows);
      }

      setLoading(false);
    }
    load();
  }, []);

  return (
    <AppShell role="admin" nav={adminNav}>
      <HeroHeader
        title="Welcome, Admin"
        subtitle="Monitor users, activity, and the overall system health."
        icon={<ShieldCheck className="h-6 w-6" />}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Students" value={stats.students} tone="info" icon={<Users className="h-5 w-5" />} />
        <StatCard label="Total Teachers" value={stats.teachers} tone="success" icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard label="Active Users (30d)" value={stats.active} tone="warning" icon={<UserCheck className="h-5 w-5" />} />
        <StatCard label="System Alerts" value={stats.alerts} tone="danger" icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      <div className="mt-6">
        <Card title="Recent Activity">
          {loading ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">Loading activity…</p>
          ) : (
            <DataTable>
              <thead>
                <tr className="bg-accent text-left text-xs font-semibold uppercase tracking-wide text-accent-foreground">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {activity.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-foreground">No activity recorded yet.</td>
                  </tr>
                ) : (
                  activity.map((r, i) => (
                    <tr key={i} className={i % 2 ? "bg-surface-soft" : "bg-card"}>
                      <td className="px-4 py-3 text-muted-foreground">{r.ts}</td>
                      <td className="px-4 py-3">
                        <Link to="/admin/student/$id" params={{ id: r.user_id }} className="font-medium text-foreground hover:text-brand">
                          {r.user}
                        </Link>
                      </td>
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
      </div>
    </AppShell>
  );
}
