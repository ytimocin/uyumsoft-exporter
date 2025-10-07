import LoginButton from "@/components/LoginButton";
import { Card, CardContent } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default function Landing() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Card className="w-full max-w-3xl bg-white/5 p-10 shadow-card">
        <div className="inline-flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-400/30 bg-brand-500/15 text-2xl">
            🐑
          </div>
          <span className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-200/80">
            Uyumsoft Exporter
          </span>
        </div>
        <SectionHeader
          title="Bring Uyumsoft transactions to life in Google Sheets"
          description="Sign in with Google, pick the columns that matter, and keep your finance dashboards up to date without leaving the browser."
        />
        <CardContent className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3 text-sm text-slate-300">
            <p>• Preserve idempotency by syncing only the rows that changed.</p>
            <p>• Curate the dataset per team with quick column presets.</p>
            <p>• Share-ready Google Sheet updates in seconds.</p>
          </div>
          <LoginButton />
        </CardContent>
      </Card>
    </div>
  );
}
