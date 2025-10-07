import { cn } from "@/lib/utils";

type AlertTone = "success" | "error" | "info";

const toneStyles: Record<AlertTone, string> = {
  success: "border-emerald-400/50 bg-emerald-400/10 text-emerald-200",
  error: "border-rose-400/60 bg-rose-500/10 text-rose-200",
  info: "border-slate-500/60 bg-slate-500/10 text-slate-200",
};

export function Alert({
  tone = "info",
  title,
  message,
  action,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  message: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-2xl border px-5 py-4 text-sm backdrop-blur",
        toneStyles[tone],
        className,
      )}
    >
      <div className="flex-1">
        {title ? (
          <p className="text-xs uppercase tracking-wide text-white/70">
            {title}
          </p>
        ) : null}
        <p className="leading-relaxed text-white/90">{message}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
