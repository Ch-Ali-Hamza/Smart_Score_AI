import { createFileRoute } from "@tanstack/react-router";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { teacherNav } from "@/lib/nav-config";
import { Card, PageHeader } from "@/components/ui-kit";
import { useState } from "react";

export const Route = createFileRoute("/teacher/report")({
  head: () => ({ meta: [{ title: "Generate Report — SmartScore AI" }] }),
  component: GenerateReport,
});

function GenerateReport() {
  const [preview, setPreview] = useState(false);
  return (
    <AppShell role="teacher" nav={teacherNav}>
      <PageHeader title="Generate Report" icon={<FileText className="h-5 w-5 text-brand" />} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Report Type"><select className="select"><option>Individual Student</option><option>Full Class</option><option>Monthly</option><option>Semester</option></select></Field>
            <Field label="Class"><select className="select"><option>BCS-3A</option><option>BCS-3B</option></select></Field>
            <Field label="Subject"><select className="select"><option>All Subjects</option><option>Mathematics</option></select></Field>
            <Field label="From"><input type="date" className="select" /></Field>
            <Field label="To"><input type="date" className="select" /></Field>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => setPreview(true)} className="rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-accent">Preview Report</button>
            <button onClick={() => toast.success("PDF download started")} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">
              <Download className="h-4 w-4" /> Download PDF
            </button>
          </div>
        </Card>

        <Card title="Preview">
          <div className="rounded-lg border border-dashed border-border bg-surface p-4">
            <div className="mb-3 h-3 w-2/3 rounded bg-muted" />
            <div className="mb-1 h-2 w-full rounded bg-muted" />
            <div className="mb-1 h-2 w-5/6 rounded bg-muted" />
            <div className="mb-3 h-2 w-3/4 rounded bg-muted" />
            <div className="h-24 rounded bg-info-soft" />
          </div>
        </Card>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" onClick={() => setPreview(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl border border-border bg-card p-8 shadow-lg">
            <h2 className="mb-4 text-2xl font-bold">Class Performance Report — BCS-3A</h2>
            <p className="mb-4 text-sm text-muted-foreground">Generated 08 May 2026</p>
            <div className="h-40 rounded bg-info-soft" />
            <p className="mt-6 text-sm">Average class score: 67/100 — 12% improvement over last term.</p>
            <button onClick={() => setPreview(false)} className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">Close</button>
          </div>
        </div>
      )}

      <style>{`.select{width:100%;border:1px solid var(--input);background:var(--card);border-radius:.5rem;padding:.5rem .75rem;font-size:.875rem;outline:none}`}</style>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
