import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { teacherNav } from "@/lib/nav-config";
import { Card, DataTable, PageHeader, Pill } from "@/components/ui-kit";
import { getClassPerformanceData } from "@/lib/db";

export const Route = createFileRoute("/teacher/weak")({
  head: () => ({ meta: [{ title: "Weak Students — SmartScore AI" }] }),
  component: WeakStudents,
});

interface WeakStudent {
  id: string;
  name: string;
  attendance: number;
  avg: number;
  grade: string;
  risk: "high" | "medium";
}

function calcGrade(avg: number) {
  if (avg >= 85) return "A+";
  if (avg >= 75) return "A";
  if (avg >= 65) return "B+";
  if (avg >= 55) return "B";
  if (avg >= 45) return "C";
  if (avg >= 35) return "D";
  return "F";
}

function calcRisk(avg: number, attendance: number): "high" | "medium" {
  if (avg < 50 || attendance < 60) return "high";
  return "medium";
}

function WeakStudents() {
  const [weak, setWeak] = useState<WeakStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulk, setBulk] = useState(false);
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { students, marks: marksData, attendance: attData } = await getClassPerformanceData();
      const namesByStudent = new Map((students as any[]).map((s) => [s.id, s.users?.name ?? s.student_id_number ?? s.id]));

      // Avg marks per student
      const markMap: Record<string, { name: string; total: number; count: number }> = {};
      for (const m of marksData as any[]) {
        const uid = m.student_id;
        const pct = m.total_marks > 0 ? (m.marks_obtained / m.total_marks) * 100 : 0;
        if (!markMap[uid]) markMap[uid] = { name: namesByStudent.get(uid) ?? uid, total: 0, count: 0 };
        markMap[uid].total += pct;
        markMap[uid].count += 1;
      }

      // Attendance % per student
      const attMap: Record<string, { present: number; total: number }> = {};
      for (const a of (attData ?? []) as any[]) {
        if (!attMap[a.student_id]) attMap[a.student_id] = { present: 0, total: 0 };
        attMap[a.student_id].total += 1;
        if (a.status === "present") attMap[a.student_id].present += 1;
      }

      const all: WeakStudent[] = Object.entries(markMap).map(([id, s]) => {
        const avg = Math.round(s.total / s.count);
        const att = attMap[id];
        const attendance = att ? Math.round((att.present / att.total) * 100) : 0;
        return { id, name: s.name, avg, attendance, grade: calcGrade(avg), risk: calcRisk(avg, attendance) };
      });

      // Only students with medium or high risk (avg < 65 or attendance < 75)
      setWeak(all.filter((s) => s.avg < 65 || s.attendance < 75));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <AppShell role="teacher" nav={teacherNav}>
      <PageHeader title="Weak Students" icon={<AlertTriangle className="h-5 w-5 text-danger" />} />

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="mb-4 rounded-lg bg-danger-soft px-4 py-3 text-sm font-medium text-danger-foreground">
            {weak.length} student{weak.length !== 1 ? "s" : ""} require immediate attention.
          </div>

          <Card className="mb-4">
            <DataTable>
              <thead>
                <tr className="bg-accent text-left text-xs font-semibold text-accent-foreground">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3">Avg Marks</th>
                  <th className="px-4 py-3">Predicted Grade</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {weak.map((s, i) => (
                  <tr key={s.id} className={i % 2 ? "bg-surface-soft" : "bg-card"}>
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3">{s.attendance}%</td>
                    <td className="px-4 py-3">{s.avg}%</td>
                    <td className="px-4 py-3 font-semibold">{s.grade}</td>
                    <td className="px-4 py-3">
                      <Pill variant={s.risk === "high" ? "danger" : "warning"}>
                        {s.risk === "high" ? "High" : "Medium"}
                      </Pill>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to="/teacher/student/$id"
                          params={{ id: s.id }}
                          className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground"
                        >
                          View Profile
                        </Link>
                        <button
                          onClick={() => setTarget(s.name)}
                          className="rounded-md border border-danger px-3 py-1 text-xs font-semibold text-danger"
                        >
                          Send Alert
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {weak.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No at-risk students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </DataTable>
          </Card>

          <button
            onClick={() => setBulk(true)}
            className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-destructive-foreground"
          >
            Send Bulk Alert
          </button>
        </>
      )}

      {(bulk || target) && (
        <Modal
          title={bulk ? "Send Bulk Alert" : `Send Alert to ${target}`}
          onClose={() => { setBulk(false); setTarget(null); }}
        >
          <textarea
            rows={4}
            className="w-full rounded-lg border border-input bg-card p-3 text-sm"
            placeholder="Type your alert message..."
          />
          <button
            onClick={() => { setBulk(false); setTarget(null); toast.success("Alert sent"); }}
            className="mt-3 w-full rounded-lg bg-brand py-2 text-sm font-semibold text-brand-foreground"
          >
            Send
          </button>
        </Modal>
      )}
    </AppShell>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
