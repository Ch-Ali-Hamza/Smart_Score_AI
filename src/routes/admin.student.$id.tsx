import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/lib/nav-config";
import { Card, DataTable, PageHeader, Pill, StatCard } from "@/components/ui-kit";
import { getStudentById, getMarksByStudent, getAttendancePercent, getMarksOverTime, scoreToGrade } from "@/lib/db";

export const Route = createFileRoute("/admin/student/$id")({
  head: () => ({ meta: [{ title: "Student Profile — SmartScore AI" }] }),
  component: AdminStudentProfile,
});

function AdminStudentProfile() {
  const { id } = Route.useParams();
  const [student, setStudent] = useState<any>(null);
  const [marks, setMarks] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [attendance, setAttendance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, m, chart, att] = await Promise.all([
        getStudentById(id),
        getMarksByStudent(id),
        getMarksOverTime(id),
        getAttendancePercent(id),
      ]);
      setStudent(s); setMarks(m); setChartData(chart); setAttendance(att ?? 0);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <AppShell role="admin" nav={adminNav}><p className="p-6 text-sm text-muted-foreground">Loading…</p></AppShell>;
  if (!student) return <AppShell role="admin" nav={adminNav}><p className="p-6 text-sm text-muted-foreground">Student not found.</p></AppShell>;

  const avgMark = marks.length > 0
    ? Math.round(marks.reduce((s, m) => s + (m.marks_obtained / m.total_marks) * 100, 0) / marks.length)
    : 0;

  const subjectMap: Record<string, { total: number; count: number }> = {};
  for (const m of marks) {
    if (!subjectMap[m.subject]) subjectMap[m.subject] = { total: 0, count: 0 };
    subjectMap[m.subject].total += (m.marks_obtained / m.total_marks) * 100;
    subjectMap[m.subject].count++;
  }

  return (
    <AppShell role="admin" nav={adminNav}>
      <Link to="/admin" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <PageHeader title={`${student.users?.name ?? "Student"} — ${student.student_id_number}`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Attendance" value={`${attendance}%`} tone="success" icon={<span>✓</span>} />
        <StatCard label="Average Marks" value={`${avgMark}%`} tone="info" icon={<span>μ</span>} />
        <StatCard label="Predicted Grade" value={scoreToGrade(avgMark)} tone="warning" icon={<span>★</span>} />
      </div>

      {chartData.length > 0 && (
        <Card title="Marks Over Time" className="mt-6">
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                {Object.keys(chartData[0] ?? {}).filter(k => k !== "week").map((k, i) => (
                  <Line key={k} type="monotone" dataKey={k} stroke={["var(--brand)", "var(--teal)", "var(--warning)"][i % 3]} strokeWidth={2} dot={{ r: 3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card title="Subject-wise Marks" className="mt-6">
        {Object.keys(subjectMap).length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No marks entered yet.</p>
        ) : (
          <DataTable>
            <thead>
              <tr className="bg-accent text-left text-xs font-semibold text-accent-foreground">
                <th className="px-4 py-3">Subject</th><th className="px-4 py-3">Avg Score</th><th className="px-4 py-3">Grade</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(subjectMap).map(([name, val], i) => {
                const avg = Math.round(val.total / val.count);
                return (
                  <tr key={name} className={i % 2 ? "bg-surface-soft" : "bg-card"}>
                    <td className="px-4 py-3 font-medium">{name}</td>
                    <td className="px-4 py-3">{avg}%</td>
                    <td className="px-4 py-3"><Pill variant="info">{scoreToGrade(avg)}</Pill></td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        )}
      </Card>
    </AppShell>
  );
}
