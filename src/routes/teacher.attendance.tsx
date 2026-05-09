import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { teacherNav } from "@/lib/nav-config";
import { Card, DataTable, PageHeader } from "@/components/ui-kit";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { insertLog } from "@/lib/db";

export const Route = createFileRoute("/teacher/attendance")({
  head: () => ({
    meta: [{ title: "Enter Attendance — SmartScore AI" }],
  }),
  component: Attendance,
});

interface StudentRow {
  id: string;
  roll: string;
  name: string;
}

function Attendance() {
  const auth = useAuth();

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [present, setPresent] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadStudents() {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, students(student_id_number)")
        .eq("role", "student")
        .order("name", { ascending: true });

      if (error) {
        toast.error("Failed to load students");
        setLoading(false);
        return;
      }

      const rows: StudentRow[] = (data ?? []).map((u: any) => ({
        id: u.id,
        roll: u.students?.[0]?.student_id_number ?? "—",
        name: u.name,
      }));

      setStudents(rows);

      const defaultAttendance: Record<string, boolean> = {};

      rows.forEach((student) => {
        defaultAttendance[student.id] = true;
      });

      setPresent(defaultAttendance);
      setLoading(false);
    }

    loadStudents();
  }, []);

  async function saveAttendance() {
    if (!auth) {
      toast.error("Authentication required");
      return;
    }

    setSaving(true);

    try {
      const today = new Date().toISOString().split("T")[0];

      const attendanceRows = students.map((student) => ({
        student_id: student.id,
        date: today,
        status: present[student.id] ? "present" : "absent",
        marked_by: auth.id,
      }));

      const { error } = await supabase
        .from("attendance")
        .upsert(attendanceRows, {
          onConflict: "student_id,date",
        });

      if (error) {
        throw new Error(error.message);
      }

      await insertLog({
        user_id: auth.id,
        action: "Attendance saved",
        status: "Success",
      });

      toast.success("Attendance saved successfully");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell role="teacher" nav={teacherNav}>
      <PageHeader
        title="Enter Attendance"
        icon={<ClipboardCheck className="h-5 w-5 text-brand" />}
      />

      <Card>
        {loading ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            Loading students...
          </p>
        ) : (
          <DataTable>
            <thead>
              <tr className="bg-accent text-left text-xs font-semibold text-accent-foreground">
                <th className="px-4 py-3">Roll No</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Present</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student, index) => (
                <tr
                  key={student.id}
                  className={index % 2 ? "bg-surface-soft" : "bg-card"}
                >
                  <td className="px-4 py-3 text-muted-foreground">
                    {student.roll}
                  </td>

                  <td className="px-4 py-3 font-medium">
                    {student.name}
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={present[student.id] ?? true}
                      onChange={(e) =>
                        setPresent((prev) => ({
                          ...prev,
                          [student.id]: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-[var(--brand)]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}

        <div className="mt-4">
          <button
            onClick={saveAttendance}
            disabled={saving || loading}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </Card>
    </AppShell>
  );
}
