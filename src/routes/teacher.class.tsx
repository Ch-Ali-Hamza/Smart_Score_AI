import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { teacherNav } from "@/lib/nav-config";
import { Card, PageHeader } from "@/components/ui-kit";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/teacher/class")({
  head: () => ({ meta: [{ title: "Performance Dashboard — SmartScore AI" }] }),
  component: ClassData,
});

interface StudentSummary {
  id: string;
  name: string;
  avg: number;
  attendance: number;
}

interface SubjectAvg {
  name: string;
  total: number;
}

interface TrendPoint {
  week: string;
  cs: number;
}

function avgGrade(avg: number) {
  if (avg >= 85) return "A+";
  if (avg >= 75) return "A";
  if (avg >= 65) return "B+";
  if (avg >= 55) return "B";
  if (avg >= 45) return "C";
  if (avg >= 35) return "D";
  return "F";
}

function ClassData() {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [subjects, setSubjects] = useState<SubjectAvg[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Load all marks joined with user names
      const { data: marksData } = await supabase
        .from("marks")
        .select("student_id, subject, marks_obtained, total_marks, exam_type, users(id, name)");

      // Load attendance counts
      const { data: attData } = await supabase
        .from("attendance")
        .select("student_id, status");

      if (!marksData) { setLoading(false); return; }

      // Build per-student avg
      const studentMap: Record<string, { name: string; total: number; count: number; id: string }> = {};
      for (const m of marksData as any[]) {
        const uid = m.student_id;
        const pct = m.total_marks > 0 ? (m.marks_obtained / m.total_marks) * 100 : 0;
        if (!studentMap[uid]) studentMap[uid] = { id: uid, name: m.users?.name ?? uid, total: 0, count: 0 };
        studentMap[uid].total += pct;
        studentMap[uid].count += 1;
      }

      // Build attendance % per student
      const attMap: Record<string, { present: number; total: number }> = {};
      for (const a of (attData ?? []) as any[]) {
        if (!attMap[a.student_id]) attMap[a.student_id] = { present: 0, total: 0 };
        attMap[a.student_id].total += 1;
        if (a.status === "present") attMap[a.student_id].present += 1;
      }

      const studentRows: StudentSummary[] = Object.values(studentMap).map((s) => {
        const att = attMap[s.id];
        return {
          id: s.id,
          name: s.name,
          avg: Math.round(s.total / s.count),
          attendance: att ? Math.round((att.present / att.total) * 100) : 0,
        };
      });
      setStudents(studentRows.sort((a, b) => b.avg - a.avg));

      // Build subject averages
      const subMap: Record<string, { total: number; count: number }> = {};
      for (const m of marksData as any[]) {
        const pct = m.total_marks > 0 ? (m.marks_obtained / m.total_marks) * 100 : 0;
        if (!subMap[m.subject]) subMap[m.subject] = { total: 0, count: 0 };
        subMap[m.subject].total += pct;
        subMap[m.subject].count += 1;
      }
      setSubjects(
        Object.entries(subMap).map(([name, v]) => ({ name, total: Math.round(v.total / v.count) }))
      );

      // Build trend: group by exam_type as "weeks"
      const trendMap: Record<string, { total: number; count: number }> = {};
      for (const m of (marksData as any[]).filter((m: any) => m.subject === "Computer Science" || m.subject === "CS")) {
        const key = m.exam_type ?? "General";
        if (!trendMap[key]) trendMap[key] = { total: 0, count: 0 };
        const pct = m.total_marks > 0 ? (m.marks_obtained / m.total_marks) * 100 : 0;
        trendMap[key].total += pct;
        trendMap[key].count += 1;
      }
      setTrend(
        Object.entries(trendMap).map(([week, v]) => ({ week, cs: Math.round(v.total / v.count) }))
      );

      setLoading(false);
    }
    load();
  }, []);

  const top = students.slice(0, 5);

  // Categorise students
  const good = students.filter((s) => s.avg >= 65 && s.attendance >= 75).length;
  const atRisk = students.filter((s) => s.avg < 65 || s.attendance < 75).length;
  const weak = students.filter((s) => s.avg < 50 || s.attendance < 60).length;
  const pieData = [
    { name: "Good", value: good, color: "oklch(0.78 0.14 145)" },
    { name: "At Risk", value: atRisk - weak, color: "oklch(0.82 0.12 80)" },
    { name: "Weak", value: weak, color: "oklch(0.72 0.14 27)" },
  ];

  return (
    <AppShell role="teacher" nav={teacherNav}>
      <PageHeader title="Performance Dashboard" icon={<BarChart3 className="h-5 w-5 text-brand" />}>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-brand px-3 py-1.5 text-sm font-semibold text-brand hover:bg-accent">
          <Download className="h-4 w-4" /> Export Dashboard
        </button>
      </PageHeader>

      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <select className="rounded-lg border border-input bg-card px-3 py-2 text-sm"><option>BCS-3A</option></select>
          <select className="rounded-lg border border-input bg-card px-3 py-2 text-sm"><option>All Subjects</option></select>
          <input type="date" className="rounded-lg border border-input bg-card px-3 py-2 text-sm" />
          <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">Apply Filters</button>
        </div>
      </Card>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading dashboard…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="Performance Trend Over Time">
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={trend.length ? trend : [{ week: "No data", cs: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="cs" stroke="var(--brand)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Subject-wise Average Marks">
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={subjects}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Bar dataKey="total" fill="oklch(0.78 0.10 245)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Student Categories">
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Top Performers">
            <ol className="space-y-2">
              {top.map((s, i) => (
                <li key={s.id} className="flex items-center justify-between rounded-lg bg-surface-soft px-3 py-2">
                  <div className="flex items-center gap-3">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">{i + 1}</span>
                    <Link to="/teacher/student/$id" params={{ id: s.id }} className="font-medium hover:text-brand">{s.name}</Link>
                  </div>
                  <span className="text-sm font-semibold">{s.avg}%</span>
                </li>
              ))}
              {top.length === 0 && <li className="text-sm text-muted-foreground">No data yet</li>}
            </ol>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
