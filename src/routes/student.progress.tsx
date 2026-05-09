import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import { useEffect, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { studentNav } from "@/lib/nav-config";
import { Card, DataTable, PageHeader } from "@/components/ui-kit";
// FIX: removed getMarksOverTime (never existed in db.ts — was mock data).
// Chart data is now built from getMarksByStudentId using buildChartData().
import { getCurrentStudent, getMarksByStudentId } from "@/lib/db";

export const Route = createFileRoute("/student/progress")({
  head: () => ({ meta: [{ title: "Track Progress — SmartScore AI" }] }),
  component: Progress,
});

interface CompareRow {
  subject: string;
  last: number;
  current: number;
  change: number;
  next: number;
}

// ─────────────────────────────────────────────────────────────
// buildChartData
//
// Converts raw marks rows into chart-friendly data.
// Each mark entry becomes one "Exam N" point on the X axis.
// Subjects become keys on each point, e.g.:
//   [
//     { week: "Exam 1", Mathematics: 72, Physics: 65 },
//     { week: "Exam 2", Mathematics: 78, Physics: 70 },
//   ]
// ─────────────────────────────────────────────────────────────
function buildChartData(marks: any[]): any[] {
  if (marks.length === 0) return [];

  // Group marks by subject, preserving insertion order
  const bySubject: Record<string, number[]> = {};
  for (const m of marks) {
    const subject = m.subject as string;
    if (!bySubject[subject]) bySubject[subject] = [];
    bySubject[subject].push(
      Math.round((m.marks_obtained / m.total_marks) * 100)
    );
  }

  // Find the longest subject series to set the number of chart points
  const maxLen = Math.max(...Object.values(bySubject).map((v) => v.length));

  const points: any[] = [];
  for (let i = 0; i < maxLen; i++) {
    const point: any = { week: `Exam ${i + 1}` };
    for (const [subject, scores] of Object.entries(bySubject)) {
      // Use last known score if this subject has fewer entries
      point[subject] = scores[i] ?? scores[scores.length - 1];
    }
    points.push(point);
  }

  return points;
}

// ─────────────────────────────────────────────────────────────
// buildCompare
//
// Splits each subject's marks into two halves (earlier vs
// recent), computes averages, and projects the next score.
// ─────────────────────────────────────────────────────────────
function buildCompare(marks: any[]): CompareRow[] {
  const bySubject: Record<string, number[]> = {};
  for (const m of marks) {
    const key = m.subject as string;
    if (!bySubject[key]) bySubject[key] = [];
    bySubject[key].push((m.marks_obtained / m.total_marks) * 100);
  }

  return Object.entries(bySubject).map(([subject, vals]) => {
    const half = Math.ceil(vals.length / 2);
    const lastHalf = vals.slice(0, half);
    const curHalf = vals.slice(half);
    const avg = (arr: number[]) =>
      arr.length
        ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
        : 0;
    const last = avg(lastHalf);
    const current = avg(curHalf.length ? curHalf : lastHalf);
    const change = current - last;
    const next = Math.min(100, Math.round(current + change * 0.5));
    return { subject, last, current, change, next };
  });
}

const LINE_COLORS = [
  "var(--brand)",
  "var(--teal)",
  "var(--warning)",
  "oklch(0.55 0.20 305)",
];

function Progress() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [compare, setCompare] = useState<CompareRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const student = await getCurrentStudent();
        if (!student) return;

        // FIX: single DB call — no more getMarksOverTime.
        // Both the chart and the comparison table derive from
        // the same marks array.
        const allMarks = await getMarksByStudentId(student.id);

        setChartData(buildChartData(allMarks));
        setCompare(buildCompare(allMarks));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Derive subject lines dynamically from whatever subjects
  // exist in the chart data — no hardcoded subject names needed.
  const activeLines =
    chartData.length > 0
      ? Object.keys(chartData[0])
          .filter((k) => k !== "week")
          .map((key, i) => ({
            key,
            label: key,
            color: LINE_COLORS[i % LINE_COLORS.length],
          }))
      : [];

  return (
    <AppShell role="student" nav={studentNav}>
      <PageHeader
        title="Track Your Progress"
        icon={<TrendingUp className="h-5 w-5 text-brand" />}
      />

      <Card title="Marks Trend by Subject" className="mb-6">
        {loading ? (
          <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
            Loading chart…
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
            No marks data yet.
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="week"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                />
                <Legend />
                {activeLines.map((l) => (
                  <Line
                    key={l.key}
                    type="monotone"
                    dataKey={l.key}
                    name={l.label}
                    stroke={l.color}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card title="Month-over-Month Comparison" className="mb-6">
        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : compare.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No comparison data yet.
          </div>
        ) : (
          <DataTable>
            <thead>
              <tr className="bg-accent text-left text-xs font-semibold text-accent-foreground">
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Last Month Avg</th>
                <th className="px-4 py-3">This Month Avg</th>
                <th className="px-4 py-3">Change</th>
                <th className="px-4 py-3">Predicted Next</th>
              </tr>
            </thead>
            <tbody>
              {compare.map((r, i) => (
                <tr
                  key={r.subject}
                  className={i % 2 ? "bg-surface-soft" : "bg-card"}
                >
                  <td className="px-4 py-3 font-medium">{r.subject}</td>
                  <td className="px-4 py-3">{r.last}</td>
                  <td className="px-4 py-3">{r.current}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 ${
                        r.change >= 0
                          ? "text-success-foreground"
                          : "text-danger-foreground"
                      }`}
                    >
                      {r.change >= 0 ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                      )}
                      {Math.abs(r.change)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{r.next}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Card>

      {!loading && compare.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {compare.map((r) => {
            const target = 85;
            return (
              <Card key={r.subject}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium">{r.subject}</span>
                  <span className="text-muted-foreground">
                    {r.current} / {target}
                  </span>
                </div>
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-brand"
                    style={{ width: `${r.current}%` }}
                  />
                  <div
                    className="absolute top-0 h-full w-0.5 bg-warning"
                    style={{ left: `${target}%` }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
