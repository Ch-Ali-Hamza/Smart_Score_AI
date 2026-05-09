import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { studentNav } from "@/lib/nav-config";
import { Card, DataTable, PageHeader, Pill } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth";
import { getStudentByUserId, getMarksByStudent, getAttendanceByStudent } from "@/lib/db";

export const Route = createFileRoute("/student/performance")({
  head: () => ({ meta: [{ title: "My Performance — SmartScore AI" }] }),
  component: Performance,
});

function gradeFromPct(pct: number) {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
}

function gradePill(g: string) {
  if (g.startsWith("A")) return <Pill variant="success">{g}</Pill>;
  if (g.startsWith("B")) return <Pill variant="info">{g}</Pill>;
  if (g.startsWith("C")) return <Pill variant="warning">{g}</Pill>;
  return <Pill variant="danger">{g}</Pill>;
}

function attendanceBar(pct: number) {
  const color = pct >= 80 ? "bg-success" : pct >= 65 ? "bg-warning" : "bg-danger";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function Performance() {
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

  // Group marks by subject
  const subjectMap: Record<string, { internal: number; external: number; internalCount: number; externalCount: number }> = {};
  marks.forEach((m) => {
    if (!subjectMap[m.subject]) {
      subjectMap[m.subject] = { internal: 0, external: 0, internalCount: 0, externalCount: 0 };
    }
    if (m.exam_type === "Internal") {
      subjectMap[m.subject].internal += (m.marks_obtained / m.total_marks) * 100;
      subjectMap[m.subject].internalCount += 1;
    } else {
      subjectMap[m.subject].external += (m.marks_obtained / m.total_marks) * 100;
      subjectMap[m.subject].externalCount += 1;
    }
  });

  const subjects = Object.entries(subjectMap).map(([name, val]) => {
    const internal = val.internalCount > 0 ? Math.round(val.internal / val.internalCount) : 0;
    const external = val.externalCount > 0 ? Math.round(val.external / val.externalCount) : 0;
    const total = Math.round((internal + external) / (val.internalCount > 0 && val.externalCount > 0 ? 2 : 1));
    const grade = gradeFromPct(total);
    const status = total >= 60 ? "Pass" : total >= 50 ? "Borderline" : "Fail";
    return { name, internal, external, total, grade, status };
  });

  // Attendance per subject (use overall attendance for now)
  const totalDays = attendance.length;
  const presentDays = attendance.filter((a) => a.status === "present").length;
  const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  return (
    <AppShell role="student" nav={studentNav}>
      <PageHeader title="My Performance" />

      <div className="mb-4 flex flex-wrap gap-2">
        <select className="rounded-lg border border-input bg-card px-3 py-2 text-sm">
          <option>All Exams</option>
          <option>Internal</option>
          <option>External</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading your performance data...</p>
      ) : subjects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No marks entered yet. Check back after your teacher enters them.</p>
      ) : (
        <>
          <Card title="Subject-wise Marks" className="mb-6">
            <DataTable>
              <thead>
                <tr className="bg-accent text-left text-xs font-semibold text-accent-foreground">
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Internal Avg</th>
                  <th className="px-4 py-3">External Avg</th>
                  <th className="px-4 py-3">Overall</th>
                  <th className="px-4 py-3">Grade</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s, i) => (
                  <tr key={s.name} className={i % 2 ? "bg-surface-soft" : "bg-card"}>
                    <td className="px-4 py-3">
                      <Link
                        to="/student/subject/$name"
                        params={{ name: encodeURIComponent(s.name) }}
                        className="font-medium hover:text-brand"
                      >
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{s.internal > 0 ? `${s.internal}%` : "—"}</td>
                    <td className="px-4 py-3">{s.external > 0 ? `${s.external}%` : "—"}</td>
                    <td className="px-4 py-3 font-semibold">{s.total}%</td>
                    <td className="px-4 py-3">{gradePill(s.grade)}</td>
                    <td className="px-4 py-3">
                      <Pill variant={s.status === "Pass" ? "success" : s.status === "Borderline" ? "warning" : "danger"}>
                        {s.status}
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Internal vs External">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjects}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                      }}
                    />
                    <Legend />
                    <Bar dataKey="internal" name="Internal" fill="var(--brand)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="external" name="External" fill="var(--teal)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Attendance Overview">
              {totalDays === 0 ? (
                <p className="text-sm text-muted-foreground">No attendance records yet.</p>
              ) : (
                <ul className="space-y-3">
                  {subjects.map((s) => (
                    <li key={s.name}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground">{attendancePct}%</span>
                      </div>
                      {attendanceBar(attendancePct)}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </AppShell>
  );
}
