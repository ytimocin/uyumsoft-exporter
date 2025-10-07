export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.3em] text-brand-200/70">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-3xl font-semibold text-white sm:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
