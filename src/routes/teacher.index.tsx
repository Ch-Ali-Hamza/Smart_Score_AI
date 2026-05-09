import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, BookOpen, Hourglass, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, Cell, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { teacherNav } from "@/lib/nav-config";
import { Card, DataTable, HeroHeader, Pill, StatCard } from "@/components/ui-kit";
import { Presentation } from "lucide-react";
import { getStudents, getAttendancePercent, getSubjectAverages, scoreToGrade, getCurrentUser } from "@/lib/db";

export const Route = createFileRoute("/teacher/")({
  head: () => ({ meta: [{ title: "Teacher Dashboard — SmartScore AI" }] }),
  component: TeacherDashboard,
});

interface StudentRow {
  id: string;
  name: string;
  attendance: number;
  avg: number;
  grade: string;
  risk: "low" | "medium" | "high";
}

function getRisk(avg: number, attendance: number): "low" | "medium" | "high" {
  if (avg < 50 || attendance < 60) return "high";
  if (avg < 65 || attendance < 75) return "medium";
  return "low";
}

function TeacherDashboard() {
  const [teacherName, setTeacherName] = useState("Teacher");
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [user, students] = await Promise.all([getCurrentUser(), getStudents()]);
        if (user) setTeacherName(user.name);

        const enriched: StudentRow[] = await Promise.all(
          students.map(async (s: any) => {
            const [attendance, avgs] = await Promise.all([
              getAttendancePercent(s.id),
              getSubjectAverages(s.id),
            ]);
            const att = attendance ?? 0;
            const avg = avgs.length
              ? Math.round(avgs.reduce((a: number, b: any) => a + b.avg, 0) / avgs.length)
              : 0;
            return {
              id: s.id,
              name: s.users?.name ?? "Unknown",
              attendance: att,
              avg,
              grade: scoreToGrade(avg),
              risk: getRisk(avg, att),
            };
          })
        );
        setRows(enriched);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const weakCount = rows.filter((r) => r.risk === "high").length;
  const chartData = rows.map((s) => ({ name: s.name.split(" ")[0], avg: s.avg, weak: s.avg < 55 }));

  return (
    <AppShell role="teacher" nav={teacherNav}>
      <PageHeader title={`Welcome, ${teacherName}`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Students" value={loading ? "…" : rows.length} tone="info" icon={<Users className="h-5 w-5" />} />
        <StatCard label="Classes Assigned" value={4} tone="success" icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label="Pending Data Entry" value={2} tone="warning" icon={<Hourglass className="h-5 w-5" />} />
        <StatCard label="Weak Students" value={loading ? "…" : weakCount} tone="danger" icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      <Card title="Class Performance Overview" className="mt-6">
        {loading ? (
          <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.weak ? "oklch(0.72 0.14 27)" : "oklch(0.72 0.10 240)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card title="Students" className="mt-6">
        <DataTable>
          <thead>
            <tr className="bg-accent text-left text-xs font-semibold text-accent-foreground">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Attendance</th>
              <th className="px-4 py-3">Avg Marks</th>
              <th className="px-4 py-3">Predicted Grade</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">Loading students…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">No students found.</td></tr>
            ) : rows.map((s, i) => (
              <tr key={s.id} className={i % 2 ? "bg-surface-soft" : "bg-card"}>
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3">{s.attendance}%</td>
                <td className="px-4 py-3">{s.avg}</td>
                <td className="px-4 py-3 font-semibold">{s.grade}</td>
                <td className="px-4 py-3">
                  <Pill variant={s.risk === "low" ? "success" : s.risk === "medium" ? "warning" : "danger"}>
                    {s.risk === "low" ? "On track" : s.risk === "medium" ? "Watch" : "At risk"}
                  </Pill>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to="/teacher/student/$id" params={{ id: s.id }} className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground hover:bg-brand/90">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </Card>
    </AppShell>
  );
}
