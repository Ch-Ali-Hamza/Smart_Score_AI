import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/lib/nav-config";
import { Card, DataTable, Field, Modal, PageHeader, Pill } from "@/components/ui-kit";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Manage Users — SmartScore AI" }] }),
  component: ManageUsers,
});

interface UserRow {
  id: string;
  name: string;
  email: string;
  reg: string;
  role: string;
  active: boolean;
}

function ManageUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [confirm, setConfirm] = useState<UserRow | null>(null);

  // Add form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newReg, setNewReg] = useState("");
  const [newRole, setNewRole] = useState("student");
  const [saving, setSaving] = useState(false);

  async function loadUsers() {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, role, created_at, students(student_id_number)")
      .order("name");

    if (error) { toast.error("Failed to load users"); setLoading(false); return; }

    const rows: UserRow[] = (data ?? []).map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email ?? "—",
      reg: u.students?.[0]?.student_id_number ?? u.id.slice(0, 8),
      role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
      active: true, // no active column in schema — default true; adjust if you add one
    }));

    setUsers(rows);
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      u.role.toLowerCase().includes(q.toLowerCase()),
  );

  async function handleAdd() {
    if (!newName || !newEmail) { toast.error("Name and email are required"); return; }
    setSaving(true);

    const { error } = await supabase.from("users").insert({
      name: newName,
      email: newEmail,
      role: newRole,
    });

    setSaving(false);

    if (error) {
      toast.error("Failed to add user: " + error.message);
    } else {
      toast.success("User added successfully");
      setShowAdd(false);
      setNewName(""); setNewEmail(""); setNewReg(""); setNewRole("student");
      loadUsers();
    }
  }

  async function handleDelete(user: UserRow) {
    const { error } = await supabase.from("users").delete().eq("id", user.id);
    if (error) {
      toast.error("Failed to delete user");
    } else {
      toast.success(`Deleted ${user.name}`);
      setConfirm(null);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    }
  }

  return (
    <AppShell role="admin" nav={adminNav}>
      <PageHeader title="Manage Users" icon={<Users className="h-5 w-5 text-brand" />} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 sm:w-80">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or role..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
        >
          <Plus className="h-4 w-4" /> Add User
        </button>
      </div>

      <Card>
        {loading ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Loading users…</p>
        ) : (
          <DataTable>
            <thead>
              <tr className="bg-accent text-left text-xs font-semibold text-accent-foreground">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Registration No</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">No users found.</td>
                </tr>
              ) : (
                filtered.map((u, i) => (
                  <tr key={u.id} className={i % 2 ? "bg-surface-soft" : "bg-card"}>
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.reg}</td>
                    <td className="px-4 py-3">
                      <Pill variant={u.role === "Student" ? "student" : u.role === "Teacher" ? "teacher" : "admin"}>{u.role}</Pill>
                    </td>
                    <td className="px-4 py-3">
                      <Pill variant={u.active ? "success" : "danger"}>{u.active ? "Active" : "Inactive"}</Pill>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toast.info(`Edit ${u.name}`)}
                          className="rounded-md border border-brand px-2.5 py-1 text-xs font-medium text-brand hover:bg-accent"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirm(u)}
                          className="rounded-md border border-danger px-2.5 py-1 text-xs font-medium text-danger hover:bg-danger-soft"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </DataTable>
        )}
      </Card>

      {showAdd && (
        <Modal onClose={() => setShowAdd(false)} title="Add User">
          <div className="space-y-3">
            <Field label="Full name">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-brand" />
            </Field>
            <Field label="Email">
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-brand" />
            </Field>
            <Field label="Registration No">
              <input value={newReg} onChange={(e) => setNewReg(e.target.value)} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-brand" />
            </Field>
            <Field label="Role">
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm">
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <button
              onClick={handleAdd}
              disabled={saving}
              className="w-full rounded-lg bg-brand py-2 text-sm font-semibold text-brand-foreground disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </Modal>
      )}

      {confirm && (
        <Modal onClose={() => setConfirm(null)} title="Confirm Delete">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <span className="font-medium text-foreground">{confirm.name}</span>? This cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setConfirm(null)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
            <button
              onClick={() => handleDelete(confirm)}
              className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-destructive-foreground"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
