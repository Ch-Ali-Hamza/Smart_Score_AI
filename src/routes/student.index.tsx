import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, BookOpen, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { studentNav } from "@/lib/nav-config";
import { Card, HeroHeader, StatCard } from "@/components/ui-kit";
import { GraduationCap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getStudentByUserId, getMarksByStudent, getAttendanceByStudent } from "@/lib/db";

export const Route = createFileRoute("/student/")({
  head: () => ({ meta: [{ title: "Student Dashboard — SmartScore AI" }] }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const auth = useAuth();
  const [marks, setMarks] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth?.id) return;
    (async () => {
      try {
        const student = await getStudentByUserId(auth.id);
        if (student) {
          const [m, a] = await Promise.all([
            getMarksByStudent(student.id),
            getAttendanceByStudent(student.id),
          ]);
          setMarks(m);
          setAttendance(a);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [auth?.id]);

  // Calculate attendance percentage
  const totalDays = attendance.length;
  const presentDays = attendance.filter((a) => a.status === "present").length;
  const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // Calculate average marks
  const avgMark =
    marks.length > 0
      ? Math.round(
          marks.reduce((sum, m) => sum + (m.marks_obtained / m.total_marks) * 100, 0) / marks.length,
        )
      : 0;

  // Predict grade from average
  function predictGrade(avg: number) {
    if (avg >= 90) return "A+";
    if (avg >= 80) return "A";
    if (avg >= 70) return "B+";
    if (avg >= 60) return "B";
    if (avg >= 50) return "C";
    if (avg >= 40) return "D";
    return "F";
  }

  // Build chart data — one point per mark entry grouped by subject
  const subjectMap: Record<string, { total: number; count: number }> = {};
  marks.forEach((m) => {
    if (!subjectMap[m.subject]) subjectMap[m.subject] = { total: 0, count: 0 };
    subjectMap[m.subject].total += (m.marks_obtained / m.total_marks) * 100;
    subjectMap[m.subject].count += 1;
  });

  const chartData = Object.entries(subjectMap).map(([subject, val], i) => ({
    week: `Exam ${i + 1}`,
    score: Math.round(val.total / val.count),
    subject,
  }));

  // Recommendations based on real data
  const recommendations: string[] = [];
  if (attendancePct < 80) recommendations.push(`Your attendance is ${attendancePct}% — try to attend more classes.`);
  Object.entries(subjectMap).forEach(([subject, val]) => {
    const avg = Math.round(val.total / val.count);
    if (avg < 60) recommendations.push(`Your marks in ${subject} are low (${avg}%) — needs improvement.`);
  });
  if (recommendations.length === 0) recommendations.push("Great performance! Keep it up.");

  return (
    <AppShell role="student" nav={studentNav}>
      <HeroHeader
        title={`Welcome back, ${auth?.name ?? "Student"}`}
        subtitle="Here is your academic overview at a glance."
        icon={<GraduationCap className="h-6 w-6" />}
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading your data...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Attendance"
              value={totalDays > 0 ? `${attendancePct}%` : "No data"}
              tone="success"
              icon={<CalendarCheck className="h-5 w-5" />}
            />
            <StatCard
              label="Average Marks"
              value={marks.length > 0 ? `${avgMark}%` : "No data"}
              tone="info"
              icon={<BookOpen className="h-5 w-5" />}
            />
            <Link to="/student/predictions" className="rounded-xl">
              <StatCard
                label="Predicted Grade"
                value={marks.length > 0 ? predictGrade(avgMark) : "—"}
                tone="warning"
                icon={<Award className="h-5 w-5" />}
              />
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card title="Your Marks Over Time" className="lg:col-span-2">
              {chartData.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No marks entered yet.
                </p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="areaBlue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={12} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={12} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="var(--brand)"
                        strokeWidth={2}
                        fill="url(#areaBlue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card title="Recommendations" className="border-l-4 border-l-warning">
              <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
                {recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      )}
    </AppShell>
  );
}
