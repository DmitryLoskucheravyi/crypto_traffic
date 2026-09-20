'use client';

const CONTROL =
  'w-full rounded-md border border-ink/15 bg-bg px-3 py-2 text-sm transition-colors duration-150 placeholder:text-ink-muted/60 hover:border-ink/25 focus:border-accent disabled:opacity-40';

export const Field = ({
  label,
  hint,
  children,
  className = '',
}: {
  label?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={className}>
    {label && <span className="label">{label}</span>}
    <div className={label ? 'mt-1.5' : ''}>{children}</div>
    {hint && <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>}
  </div>
);

export const Input = ({ className = '', ...rest }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...rest} className={`${CONTROL} ${className}`} />
);

export const Textarea = ({
  className = '',
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...rest} className={`${CONTROL} resize-none ${className}`} />
);

export const Select = ({
  className = '',
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...rest} className={`${CONTROL} ${className}`} />
);

// Replaces the native checkbox: a tick box cannot be styled consistently
// across browsers, and this reads as a state switch rather than a form field.
export const Switch = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="group inline-flex items-center gap-2.5 text-sm text-ink-muted transition-colors hover:text-ink"
  >
    <span
      aria-hidden="true"
      className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-150 ${
        checked ? 'border-accent/60 bg-accent/25' : 'border-ink/20 bg-ink/5'
      }`}
    >
      <span
        className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full transition-all duration-150 ${
          checked ? 'left-[18px] bg-accent' : 'left-[3px] bg-ink-muted'
        }`}
      />
    </span>
    {label}
  </button>
);
