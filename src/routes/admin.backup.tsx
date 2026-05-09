import { createFileRoute } from "@tanstack/react-router";
import { Database } from "lucide-react";
import { CheckCircle2, Download } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/lib/nav-config";
import { Card, PageHeader } from "@/components/ui-kit";

export const Route = createFileRoute("/admin/backup")({
  head: () => ({ meta: [{ title: "Backup Data — SmartScore AI" }] }),
  component: BackupPage,
});

function BackupPage() {
  return (
    <AppShell role="admin" nav={adminNav}>
      <PageHeader title="Backup Data" icon={<Database className="h-5 w-5 text-brand" />} />
      <Card>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-success-foreground" />
          <div className="text-base font-semibold">Last Backup: 07 May 2026 — 11:45 PM</div>
          <button
            onClick={() => toast.success("Backup started")}
            className="mt-2 rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground"
          >
            Backup Now
          </button>
          <a href="#" className="inline-flex items-center gap-1 text-sm text-teal hover:underline">
            <Download className="h-4 w-4" /> Download Last Backup
          </a>
        </div>
      </Card>
    </AppShell>
  );
}
