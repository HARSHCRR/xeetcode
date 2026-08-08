'use client';

/**
 * Small shared primitives.
 *
 * These only ever reference semantic theme tokens (`surface`, `accent`, `ink`,
 * ...), never raw colours, so swapping the theme file restyles them without any
 * edits here. The Phase 5 visual pass replaces the internals, not the API.
 */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const styles = {
    primary:
      'bg-accent text-ink hover:bg-accent-strong disabled:bg-surface-raised disabled:text-ink-faint',
    secondary:
      'bg-surface-raised text-ink border border-edge hover:border-accent disabled:text-ink-faint',
    ghost: 'text-ink-muted hover:text-ink',
  }[variant];

  return (
    <button
      className={`rounded-lg px-5 py-3 font-medium transition-colors disabled:cursor-not-allowed ${styles} ${className}`}
      {...props}
    />
  );
}

export function Panel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-edge bg-surface p-8 ${className}`}>{children}</div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-lg border border-edge bg-surface-raised px-4 py-3 text-lose">
      {message}
    </p>
  );
}

/** Screen-reader-friendly busy indicator. */
export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-ink-muted" role="status">
      <span
        aria-hidden
        className="size-4 animate-spin rounded-full border-2 border-edge border-t-accent"
      />
      {label}
    </div>
  );
}
