import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { teacherNav } from "@/lib/nav-config";
import { Card, DataTable, PageHeader, Pill, StatCard } from "@/components/ui-kit";
// FIX: removed getMarksOverTime — never existed in db.ts.
// Chart data is now derived from getMarksByStudent using buildChartData().
import { getStudentById, getMarksByStudent, getAttendancePercent, scoreToGrade } from "@/lib/db";

export const Route = createFileRoute("/teacher/student/$id")({
  head: () => ({ meta: [{ title: "Student Profile — SmartScore AI" }] }),
  component: StudentProfile,
});

// ─────────────────────────────────────────────────────────────
// buildChartData
//
// Converts raw marks rows into chart-friendly points.
// Each mark entry becomes one "Exam N" point on the X axis.
// Subjects become keys on each point, e.g.:
//   [
//     { week: "Exam 1", Mathematics: 72, Physics: 65 },
//     { week: "Exam 2", Mathematics: 78, Physics: 70 },
//   ]
// ─────────────────────────────────────────────────────────────
function buildChartData(marks: any[]): any[] {
  if (marks.length === 0) return [];

  const bySubject: Record<string, number[]> = {};
  for (const m of marks) {
    const subject = m.subject as string;
    if (!bySubject[subject]) bySubject[subject] = [];
    bySubject[subject].push(
      Math.round((m.marks_obtained / m.total_marks) * 100)
    );
  }

  const maxLen = Math.max(...Object.values(bySubject).map((v) => v.length));

  const points: any[] = [];
  for (let i = 0; i < maxLen; i++) {
    const point: any = { week: `Exam ${i + 1}` };
    for (const [subject, scores] of Object.entries(bySubject)) {
      point[subject] = scores[i] ?? scores[scores.length - 1];
    }
    points.push(point);
  }

  return points;
}

function StudentProfile() {
  const { id } = Route.useParams();
  const [student, setStudent] = useState<any>(null);
  const [marks, setMarks] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [attendance, setAttendance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      // FIX: removed getMarksOverTime call. Three real DB calls only.
      // Chart data is derived from the same marks array.
      const [s, m, att] = await Promise.all([
        getStudentById(id),
        getMarksByStudent(id),
        getAttendancePercent(id),
      ]);
      setStudent(s);
      setMarks(m);
      setChartData(buildChartData(m));
      setAttendance(att ?? 0);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return (
    <AppShell role="teacher" nav={teacherNav}>
      <p className="p-6 text-sm text-muted-foreground">Loading…</p>
    </AppShell>
  );

  if (!student) return (
    <AppShell role="teacher" nav={teacherNav}>
      <p className="p-6 text-sm text-muted-foreground">Student not found.</p>
    </AppShell>
  );

  const avgMark =
    marks.length > 0
      ? Math.round(
          marks.reduce(
            (s, m) => s + (m.marks_obtained / m.total_marks) * 100,
            0
          ) / marks.length
        )
      : 0;

  // Group by subject for table
  const subjectMap: Record<
    string,
    { internal: number; external: number; ic: number; ec: number }
  > = {};

  for (const m of marks) {
    if (!subjectMap[m.subject])
      subjectMap[m.subject] = { internal: 0, external: 0, ic: 0, ec: 0 };
    if (m.exam_type === "Internal") {
      subjectMap[m.subject].internal += (m.marks_obtained / m.total_marks) * 100;
      subjectMap[m.subject].ic++;
    } else {
      subjectMap[m.subject].external += (m.marks_obtained / m.total_marks) * 100;
      subjectMap[m.subject].ec++;
    }
  }

  const subjects = Object.entries(subjectMap).map(([name, v]) => {
    const intAvg = v.ic > 0 ? v.internal / v.ic : 0;
    const extAvg = v.ec > 0 ? v.external / v.ec : 0;
    const divisor = (v.ic > 0 ? 1 : 0) + (v.ec > 0 ? 1 : 0);
    const total = divisor > 0 ? Math.round((intAvg + extAvg) / divisor) : 0;
    return {
      name,
      internal: Math.round(intAvg),
      external: Math.round(extAvg),
      total,
      grade: scoreToGrade(total),
    };
  });

  const LINE_COLORS = [
    "var(--brand)",
    "var(--teal)",
    "var(--warning)",
    "oklch(0.55 0.20 305)",
  ];

  return (
    <AppShell role="teacher" nav={teacherNav}>
      <Link
        to="/teacher/weak"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <PageHeader
        title={`${student.users?.name ?? "Student"} — ${student.student_id_number}`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Attendance"
          value={`${attendance}%`}
          tone="success"
          icon={<span>✓</span>}
        />
        <StatCard
          label="Average Marks"
          value={`${avgMark}%`}
          tone="info"
          icon={<span>μ</span>}
        />
        <StatCard
          label="Predicted Grade"
          value={scoreToGrade(avgMark)}
          tone="warning"
          icon={<span>★</span>}
        />
      </div>

      {chartData.length > 0 && (
        <Card title="Marks Over Time" className="mt-6">
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="week"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                />
                {Object.keys(chartData[0] ?? {})
                  .filter((k) => k !== "week")
                  .map((k, i) => (
                    <Line
                      key={k}
                      type="monotone"
                      dataKey={k}
                      stroke={LINE_COLORS[i % LINE_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {subjects.length > 0 && (
        <Card title="Subject-wise Marks" className="mt-6">
          <DataTable>
            <thead>
              <tr className="bg-accent text-left text-xs font-semibold text-accent-foreground">
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Internal Avg</th>
                <th className="px-4 py-3">External Avg</th>
                <th className="px-4 py-3">Overall</th>
                <th className="px-4 py-3">Grade</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((sub, i) => (
                <tr
                  key={sub.name}
                  className={i % 2 ? "bg-surface-soft" : "bg-card"}
                >
                  <td className="px-4 py-3 font-medium">{sub.name}</td>
                  <td className="px-4 py-3">
                    {sub.internal > 0 ? `${sub.internal}%` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {sub.external > 0 ? `${sub.external}%` : "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold">{sub.total}%</td>
                  <td className="px-4 py-3">
                    <Pill variant="info">{sub.grade}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </Card>
      )}

      <button
        onClick={() => setOpen(true)}
        className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
      >
        <Send className="h-4 w-4" /> Send Alert to Student
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg"
          >
            <h3 className="mb-3 text-base font-semibold">
              Alert {student.users?.name}
            </h3>
            <textarea
              rows={4}
              className="w-full rounded-lg border border-input bg-card p-3 text-sm"
              placeholder="Message..."
            />
            <button
              onClick={() => {
                setOpen(false);
                toast.success("Alert sent");
              }}
              className="mt-3 w-full rounded-lg bg-brand py-2 text-sm font-semibold text-brand-foreground"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
