'use client';

/**
 * Small shared primitives.
 *
 * These only reference semantic theme tokens (`surface`, `accent`, `ink`, ...),
 * never raw colours, so swapping the theme file restyles them without edits
 * here — which is exactly how the space theme became the LeetCode one.
 */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const styles = {
    // Dark text on the accent: the orange is light enough that white fails contrast.
    primary:
      'bg-accent text-[#1a1a1a] hover:bg-accent-strong disabled:bg-surface-raised disabled:text-ink-faint',
    secondary:
      'bg-surface-raised text-ink border border-edge hover:border-accent disabled:text-ink-faint',
    ghost: 'text-ink-muted hover:text-ink',
  }[variant];

  return (
    <button
      className={`rounded-md px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${styles} ${className}`}
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
    <div className={`rounded-lg border border-edge bg-surface p-6 ${className}`}>{children}</div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-md border border-edge bg-surface-raised px-4 py-3 text-sm text-lose">
      {message}
    </p>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-ink-muted" role="status">
      <span
        aria-hidden
        className="size-4 animate-spin rounded-full border-2 border-edge border-t-accent"
      />
      {label}
    </div>
  );
}
