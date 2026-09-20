export const Panel = ({
  title,
  hint,
  actions,
  children,
  className = '',
}: {
  title?: string;
  hint?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <section className={`panel rounded-xl ${className}`}>
    {(title || actions) && (
      <header className="flex items-start justify-between gap-6 border-b border-ink/8 px-6 py-4">
        <div>
          {title && <h2 className="font-medium">{title}</h2>}
          {hint && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
    )}
    <div className="px-6 py-5">{children}</div>
  </section>
);

export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-skeleton rounded bg-ink/10 ${className}`} aria-hidden="true" />
);

export const EmptyState = ({ text, action }: { text: string; action?: React.ReactNode }) => (
  <div className="flex flex-col items-center gap-4 py-12 text-center">
    <p className="text-sm text-ink-muted">{text}</p>
    {action}
  </div>
);
