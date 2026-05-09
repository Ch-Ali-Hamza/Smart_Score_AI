import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell, dashboardFor } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { adminNav, studentNav, teacherNav } from "@/lib/nav-config";
import { Card, PageHeader } from "@/components/ui-kit";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — SmartScore AI" }] }),
  component: NotificationsPage,
});

interface NotifRow {
  id: string;
  kind: "warning" | "info" | "success";
  title: string;
  desc: string;
  time: string;
  read: boolean;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function typeToKind(type: string): "warning" | "info" | "success" {
  if (type === "push") return "warning";
  if (type === "system") return "success";
  return "info";
}

function NotificationsPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (!auth) navigate({ to: "/" }); }, [auth, navigate]);
  if (!auth) return null;

  const nav = auth.role === "admin" ? adminNav : auth.role === "teacher" ? teacherNav : studentNav;

  const [items, setItems] = useState<NotifRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [compose, setCompose] = useState(false);
  const [composeMsg, setComposeMsg] = useState("");
  const [sending, setSending] = useState(false);

  async function loadNotifs() {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, message, type, is_read, created_at")
      .eq("user_id", auth!.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) { toast.error("Failed to load notifications"); setLoading(false); return; }

    const rows: NotifRow[] = (data ?? []).map((n: any) => {
      // message format expected: "Title | Description" — split on first pipe
      const parts = (n.message as string).split("|");
      const title = parts[0]?.trim() ?? n.message;
      const desc = parts[1]?.trim() ?? "";
      return {
        id: n.id,
        kind: typeToKind(n.type),
        title,
        desc,
        time: timeAgo(n.created_at),
        read: n.is_read,
      };
    });

    setItems(rows);
    setLoading(false);
  }

  useEffect(() => { loadNotifs(); }, [auth.id]);

  async function markAllRead() {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", auth!.id)
      .eq("is_read", false);

    if (error) { toast.error("Failed to update notifications"); return; }
    setItems((xs) => xs.map((x) => ({ ...x, read: true })));
    toast.success("All notifications marked as read");
  }

  async function sendAlert() {
    if (!composeMsg.trim()) { toast.error("Message cannot be empty"); return; }
    setSending(true);

    // Fetch all student user IDs to broadcast to
    const { data: students } = await supabase
      .from("users")
      .select("id")
      .eq("role", "student");

    if (!students?.length) { toast.error("No students found"); setSending(false); return; }

    const rows = students.map((s: any) => ({
      user_id: s.id,
      message: `Alert from ${auth!.name ?? "Teacher"} | ${composeMsg.trim()}`,
      type: "push",
      is_read: false,
    }));

    const { error } = await supabase.from("notifications").insert(rows);

    setSending(false);
    if (error) {
      toast.error("Failed to send alert");
    } else {
      toast.success("Alert sent to all students");
      setCompose(false);
      setComposeMsg("");
    }
  }

  return (
    <AppShell role={auth.role} nav={nav}>
      <PageHeader title="Notifications" icon={<Bell className="h-5 w-5 text-brand" />}>
        <button
          onClick={markAllRead}
          className="rounded-lg border border-brand px-3 py-1.5 text-sm font-semibold text-brand hover:bg-accent"
        >
          Mark All as Read
        </button>
        {auth.role !== "student" && (
          <button
            onClick={() => setCompose(true)}
            className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-brand-foreground"
          >
            Send New Alert
          </button>
        )}
      </PageHeader>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading notifications…</p>
      ) : (
        <div className="space-y-3">
          {items.length === 0 && (
            <Card>
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
            </Card>
          )}
          {items.map((n) => {
            const Icon = n.kind === "warning" ? AlertTriangle : n.kind === "info" ? Info : CheckCircle2;
            const tone =
              n.kind === "warning"
                ? "text-warning-foreground bg-warning-soft"
                : n.kind === "info"
                ? "text-info-foreground bg-info-soft"
                : "text-success-foreground bg-success-soft";
            return (
              <button
                key={n.id}
                onClick={() => setExpanded(expanded === n.id ? null : n.id)}
                className={cn(
                  "block w-full rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors",
                  !n.read && "border-l-4 border-l-brand bg-info-soft/40",
                )}
              >
                <div className="flex items-start gap-3">
                  <span className={cn("grid h-9 w-9 place-items-center rounded-lg", tone)}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{n.title}</div>
                    <p className={cn("text-sm text-muted-foreground", expanded === n.id ? "" : "line-clamp-1")}>
                      {n.desc}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{n.time}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {compose && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4"
          onClick={() => setCompose(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-lg"
          >
            <h3 className="mb-4 text-base font-semibold">Send New Alert</h3>
            <div className="space-y-3">
              <select className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm">
                <option>All Students</option>
                <option>BCS-3A</option>
              </select>
              <select className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm">
                <option>Performance</option>
                <option>Attendance</option>
                <option>Info</option>
              </select>
              <textarea
                rows={4}
                value={composeMsg}
                onChange={(e) => setComposeMsg(e.target.value)}
                className="w-full rounded-lg border border-input bg-card p-3 text-sm"
                placeholder="Message…"
              />
              <button
                onClick={sendAlert}
                disabled={sending}
                className="w-full rounded-lg bg-brand py-2 text-sm font-semibold text-brand-foreground disabled:opacity-60"
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Back to{" "}
        <button
          onClick={() => navigate({ to: dashboardFor(auth.role) })}
          className="text-teal hover:underline"
        >
          dashboard
        </button>
      </p>
    </AppShell>
  );
}
