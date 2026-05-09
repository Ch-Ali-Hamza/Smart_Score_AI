import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { studentNav } from "@/lib/nav-config";
import { Card, PageHeader, StatCard } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth";
import { getStudentDashboardData } from "@/lib/db";

export const Route = createFileRoute("/student/subject/$name")({
  head: () => ({ meta: [{ title: "Subject Detail — SmartScore AI" }] }),
  component: SubjectDetail,
});

function SubjectDetail() {
  const { name } = Route.useParams();
  const auth = useAuth();
  const subjectName = decodeURIComponent(name);
  const [marks, setMarks] = useState<any[]>([]);
  const [attendance, setAttendance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth?.id) return;
    (async () => {
      const data = await getStudentDashboardData(auth.id);
      setMarks(data.marks.filter((x: any) => x.subject === subjectName));
      const present = data.attendance.filter((x: any) => x.status === "present").length;
      setAttendance(data.attendance.length > 0 ? Math.round((present / data.attendance.length) * 100) : 0);
      setLoading(false);
    })();
  }, [auth?.id, subjectName]);

  const internalMarks = marks.filter(m => m.exam_type === "Internal");
  const externalMarks = marks.filter(m => m.exam_type === "External");
  const avgInternal = internalMarks.length > 0 ? Math.round(internalMarks.reduce((s, m) => s + (m.marks_obtained / m.total_marks) * 100, 0) / internalMarks.length) : 0;
  const avgExternal = externalMarks.length > 0 ? Math.round(externalMarks.reduce((s, m) => s + (m.marks_obtained / m.total_marks) * 100, 0) / externalMarks.length) : 0;
  const overall = marks.length > 0 ? Math.round(marks.reduce((s, m) => s + (m.marks_obtained / m.total_marks) * 100, 0) / marks.length) : 0;

  const grade = overall >= 90 ? "A+" : overall >= 80 ? "A" : overall >= 70 ? "B+" : overall >= 60 ? "B" : overall >= 50 ? "C" : overall >= 40 ? "D" : "F";

  const chartData = marks.map((m, i) => ({ week: `Exam ${i + 1}`, score: Math.round((m.marks_obtained / m.total_marks) * 100) }));

  const recommendations: string[] = [];
  if (attendance < 80) recommendations.push(`Attendance is ${attendance}% — try to attend more classes.`);
  if (overall < 60) recommendations.push(`Your average in ${subjectName} is ${overall}% — needs improvement.`);
  if (recommendations.length === 0) recommendations.push("Great performance! Keep it up.");

  return (
    <AppShell role="student" nav={studentNav}>
      <Link to="/student/performance" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <PageHeader title={`${subjectName} — Detail View`} />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Internal Avg" value={internalMarks.length > 0 ? `${avgInternal}%` : "—"} tone="info" icon={<span>I</span>} />
            <StatCard label="External Avg" value={externalMarks.length > 0 ? `${avgExternal}%` : "—"} tone="info" icon={<span>E</span>} />
            <StatCard label="Final Grade" value={marks.length > 0 ? grade : "—"} tone="success" icon={<span>★</span>} />
          </div>

          {chartData.length > 0 && (
            <Card title="Marks Over Time" className="mb-6">
              <div className="h-64">
                <ResponsiveContainer>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={12} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                    <Area dataKey="score" stroke="var(--brand)" fill="url(#sg)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Attendance">
              <div className="flex items-center gap-6">
                <Donut pct={attendance} />
                <div>
                  <div className="text-2xl font-semibold">{attendance}%</div>
                  <div className="text-sm text-muted-foreground">Classes attended</div>
                </div>
              </div>
            </Card>
            <Card title="Recommendations" className="border-l-4 border-l-warning">
              <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
                {recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </Card>
          </div>
        </>
      )}
    </AppShell>
  );
}

function Donut({ pct }: { pct: number }) {
  const r = 38, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
      <circle cx="50" cy="50" r={r} stroke="var(--muted)" strokeWidth="12" fill="none" />
      <circle cx="50" cy="50" r={r} stroke="var(--success)" strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
    </svg>
  );
}
