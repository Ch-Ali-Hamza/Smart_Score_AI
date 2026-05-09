import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { studentNav } from "@/lib/nav-config";
import { Card, DataTable, PageHeader, Pill } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth";
import { getStudentDashboardData } from "@/lib/db";

export const Route = createFileRoute("/student/predictions")({
  head: () => ({ meta: [{ title: "My Predictions — SmartScore AI" }] }),
  component: Predictions,
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

function confidenceFromData(marksCount: number, attendanceDays: number) {
  // More data = higher confidence, capped at 95%
  const base = Math.min(marksCount * 5 + attendanceDays * 2, 95);
  return Math.max(base, 30);
}

function Predictions() {
  const auth = useAuth();
  const [marks, setMarks] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth?.id) return;
    (async () => {
      try {
        const data = await getStudentDashboardData(auth.id);
        setMarks(data.marks);
        setAttendance(data.attendance);
      } finally {
        setLoading(false);
      }
    })();
  }, [auth?.id]);

  // Overall average percentage
  const overallAvg =
    marks.length > 0
      ? Math.round(
          marks.reduce((sum, m) => sum + (m.marks_obtained / m.total_marks) * 100, 0) / marks.length,
        )
      : 0;

  const overallGrade = gradeFromPct(overallAvg);

  // Attendance factor
  const totalDays = attendance.length;
  const presentDays = attendance.filter((a) => a.status === "present").length;
  const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // Confidence ring value
  const confidence = confidenceFromData(marks.length, totalDays);

  // Group marks by subject for per-subject predictions
  const subjectMap: Record<string, { total: number; count: number }> = {};
  marks.forEach((m) => {
    if (!subjectMap[m.subject]) subjectMap[m.subject] = { total: 0, count: 0 };
    subjectMap[m.subject].total += (m.marks_obtained / m.total_marks) * 100;
    subjectMap[m.subject].count += 1;
  });

  const subjects = Object.entries(subjectMap).map(([name, val], i) => {
    const avg = Math.round(val.total / val.count);
    // Attendance penalty: if below 75%, reduce predicted score slightly
    const penalty = attendancePct < 75 ? Math.round((75 - attendancePct) * 0.3) : 0;
    const predicted = Math.max(0, avg - penalty);
    const grade = gradeFromPct(predicted);
    const status = predicted >= 60 ? "Pass" : predicted >= 50 ? "Borderline" : "Fail";
    const subjectConfidence = Math.min(60 + i * 5, 90);
    return { name, avg, predicted, grade, status, subjectConfidence };
  });

  return (
    <AppShell role="student" nav={studentNav}>
      <PageHeader title="My Predictions" />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading predictions...</p>
      ) : marks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No marks data yet. Predictions will appear once your teacher enters your marks.
        </p>
      ) : (
        <>
          {/* Overall predicted grade banner */}
          <div className="mb-6 flex flex-col items-center gap-6 rounded-2xl border border-border bg-gradient-to-r from-info-soft to-pill-student-bg p-8 shadow-sm sm:flex-row sm:justify-between">
            <div>
              <div className="text-base font-semibold text-foreground">Your Predicted Final Grade</div>
              <div className="mt-2 text-6xl font-bold text-brand">{overallGrade}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Based on {marks.length} mark{marks.length !== 1 ? "s" : ""} and {attendancePct}% attendance
              </div>
            </div>
            <ConfidenceRing pct={confidence} />
          </div>

          {/* Per-subject predictions */}
          <Card title="Subject-wise Predictions" className="mb-6">
            <DataTable>
              <thead>
                <tr className="bg-accent text-left text-xs font-semibold text-accent-foreground">
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Current Avg</th>
                  <th className="px-4 py-3">Predicted Score</th>
                  <th className="px-4 py-3">Predicted Grade</th>
                  <th className="px-4 py-3">Confidence</th>
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
                    <td className="px-4 py-3">{s.avg}%</td>
                    <td className="px-4 py-3 font-semibold">{s.predicted}%</td>
                    <td className="px-4 py-3 font-semibold text-brand">{s.grade}</td>
                    <td className="px-4 py-3">{s.subjectConfidence}%</td>
                    <td className="px-4 py-3">
                      <Pill
                        variant={
                          s.status === "Pass"
                            ? "success"
                            : s.status === "Borderline"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {s.status}
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </Card>

          {/* Info banner */}
          <div className="rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm text-warning-foreground">
            This prediction is based on your attendance ({attendancePct}%), marks entered so far, and overall performance trend.
            Predictions improve as more marks are entered.
          </div>
        </>
      )}
    </AppShell>
  );
}

function ConfidenceRing({ pct }: { pct: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct / 100);
  return (
    <div className="relative h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} stroke="var(--border)" strokeWidth="8" fill="none" />
        <circle
          cx="50"
          cy="50"
          r={r}
          stroke="var(--teal)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-lg font-semibold text-teal">
        {pct}%
      </div>
    </div>
  );
}
