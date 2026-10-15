import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

// Minimal accessible primitives for the pro space and the console (vol. 07 §2, §7):
// 48 px touch targets, visible focus, design tokens only.

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'accent';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-brand-fg hover:bg-brand-hover',
  secondary: 'border border-line bg-surface text-fg hover:bg-brand-soft',
  danger: 'bg-st-danger text-white hover:opacity-90',
  ghost: 'text-fg hover:bg-brand-soft',
  success: 'bg-st-ready text-white hover:opacity-90',
  accent: 'bg-accent text-accent-fg hover:opacity-90',
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'md' | 'lg' | 'sm' }>(
  function Button({ variant = 'primary', size = 'md', className, type = 'button', ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          size === 'lg' ? 'min-h-14 px-5 text-lg' : size === 'sm' ? 'min-h-10 px-3 text-sm' : 'min-h-12 px-4',
          variants[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn('min-h-12 w-full rounded-lg border border-line bg-surface px-3 text-fg placeholder:text-muted', className)}
      {...props}
    />
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn('w-full rounded-lg border border-line bg-surface p-3 text-fg', className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...props }, ref) {
  return <select ref={ref} className={cn('min-h-12 w-full rounded-lg border border-line bg-surface px-3 text-fg', className)} {...props} />;
});

export function Field({ label, htmlFor, help, error, children }: { label: string; htmlFor: string; help?: string; error?: string | null; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block font-medium">
        {label}
      </label>
      {children}
      {help && !error && <p className="text-sm text-muted">{help}</p>}
      {error && (
        <p className="text-sm font-medium text-st-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-xl border border-line bg-surface p-4', className)} {...props}>
      {children}
    </div>
  );
}

export function Alert({ tone = 'info', children }: { tone?: 'info' | 'danger' | 'warning' | 'success'; children: React.ReactNode }) {
  const tones = {
    info: 'bg-st-accepted-soft',
    danger: 'bg-st-danger-soft',
    warning: 'bg-st-warning-soft',
    success: 'bg-st-ready-soft',
  };
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('rounded-lg p-3 text-sm font-medium text-fg', tones[tone])}>
      {children}
    </div>
  );
}

/** Large on/off switch with a text label (vol. 07 §5.6: 56 × 32 px minimum). */
export function Switch({
  checked,
  onChange,
  label,
  onLabel,
  offLabel,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  onLabel: string;
  offLabel: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex min-h-12 items-center gap-2 rounded-full disabled:opacity-50"
    >
      <span className={cn('relative inline-flex h-8 w-14 shrink-0 rounded-full transition-colors', checked ? 'bg-st-ready' : 'bg-line')}>
        <span className={cn('absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-7' : 'translate-x-1')} />
      </span>
      <span className="min-w-20 text-left text-sm font-medium">{checked ? onLabel : offLabel}</span>
    </button>
  );
}
