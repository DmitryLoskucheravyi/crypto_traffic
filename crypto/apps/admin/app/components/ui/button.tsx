'use client';

type Variant = 'primary' | 'ghost' | 'danger' | 'quiet';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-bg hover:bg-accent/90',
  ghost: 'border border-ink/15 text-ink hover:border-accent/50 hover:text-accent',
  danger: 'border border-ink/15 text-ink-muted hover:border-danger/50 hover:text-danger',
  quiet: 'text-ink-muted hover:text-ink',
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  size?: 'sm' | 'md';
};

export const Button = ({
  variant = 'ghost',
  loading = false,
  size = 'md',
  className = '',
  disabled,
  children,
  ...rest
}: Props) => (
  <button
    {...rest}
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
      size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-5 py-2.5'
    } ${VARIANTS[variant]} ${className}`}
  >
    {loading && (
      <span
        aria-hidden="true"
        className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent"
      />
    )}
    {children}
  </button>
);
