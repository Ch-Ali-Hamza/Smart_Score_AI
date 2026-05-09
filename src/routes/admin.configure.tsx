import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/lib/nav-config";
import { Card, PageHeader } from "@/components/ui-kit";

export const Route = createFileRoute("/admin/configure")({
  head: () => ({ meta: [{ title: "Configure System — SmartScore AI" }] }),
  component: ConfigurePage,
});

function ConfigurePage() {
  return (
    <AppShell role="admin" nav={adminNav}>
      <PageHeader title="Configure System" icon={<Settings className="h-5 w-5 text-brand" />} />
      <Card>
        <p className="text-sm text-muted-foreground">System configuration options will appear here.</p>
      </Card>
    </AppShell>
  );
}
