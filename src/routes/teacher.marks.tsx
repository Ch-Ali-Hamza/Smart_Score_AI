import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { teacherNav } from "@/lib/nav-config";
import { Card, DataTable, PageHeader } from "@/components/ui-kit";
import { getStudents, insertMarks } from "@/lib/db";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/teacher/marks")({
  head: () => ({ meta: [{ title: "Enter Marks — SmartScore AI" }] }),
  component: EnterMarks,
});

const SUBJECTS = ["Mathematics", "Physics", "Computer Science", "English", "Pakistan Studies"];
const ASSESSMENTS = ["Internal", "External", "Final"];

function EnterMarks() {
  const auth = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [assessment, setAssessment] = useState(ASSESSMENTS[0]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudents().then((s) => { setStudents(s); setLoading(false); });
  }, []);

  const set = (id: string, v: string) => setMarks((m) => ({ ...m, [id]: v }));
  const invalid = (v?: string) => v !== undefined && v !== "" && Number(v) > 100;

  async function handleSave() {
    const entries = students
      .filter((s) => marks[s.id] !== undefined && marks[s.id] !== "")
      .map((s) => ({
        student_id: s.id,
        subject,
        marks_obtained: Number(marks[s.id]),
        total_marks: 100,
        exam_type: assessment,
        entered_by: auth?.id ?? "",
      }));

    if (entries.length === 0) { toast.error("No marks entered"); return; }

    setSaving(true);
    try {
      await insertMarks(entries);
      toast.success(`Saved marks for ${entries.length} student(s)`);
      setMarks({});
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell role="teacher" nav={teacherNav}>
      <PageHeader title="Enter Marks" icon={<Pencil className="h-5 w-5 text-brand" />} />

      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select label="Subject" value={subject} onChange={setSubject} options={SUBJECTS} />
          <Select label="Assessment" value={assessment} onChange={setAssessment} options={ASSESSMENTS} />
        </div>
      </Card>

      <div className="mb-4 rounded-lg bg-accent px-4 py-2 text-sm text-accent-foreground">
        Entering <span className="font-semibold">{assessment}</span> marks for{" "}
        <span className="font-semibold">{subject}</span>
      </div>

      <Card>
        {loading ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Loading students…</p>
        ) : (
          <DataTable>
            <thead>
              <tr className="bg-accent text-left text-xs font-semibold text-accent-foreground">
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Marks (0–100)</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => {
                const v = marks[s.id];
                const bad = invalid(v);
                return (
                  <tr key={s.id} className={i % 2 ? "bg-surface-soft" : "bg-card"}>
                    <td className="px-4 py-3 text-muted-foreground">{s.student_id_number}</td>
                    <td className="px-4 py-3">
                      <Link to="/teacher/student/$id" params={{ id: s.id }} className="font-medium hover:text-brand">
                        {s.users?.name ?? "Unknown"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <input
                          type="number"
                          value={v ?? ""}
                          onChange={(e) => set(s.id, e.target.value)}
                          className={`w-28 rounded-lg border bg-card px-3 py-1.5 text-sm outline-none focus:border-brand ${bad ? "border-danger" : "border-input"}`}
                        />
                        {bad && <span className="ml-2 text-xs text-danger-foreground">Max 100</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Marks"}
          </button>
          <button
            onClick={() => toast.info("Choose a CSV to upload")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-teal px-4 py-2 text-sm font-semibold text-teal hover:bg-accent"
          >
            <Upload className="h-4 w-4" /> Upload CSV
          </button>
        </div>
      </Card>
    </AppShell>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-brand">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}
