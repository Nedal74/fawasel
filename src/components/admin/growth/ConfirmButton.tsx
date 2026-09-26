"use client";

/**
 * A small icon/text button that submits a bound server action, optionally
 * behind a confirm() prompt.
 */
export function ConfirmButton({
  action,
  confirmText,
  label,
  className,
  children,
}: {
  action: () => Promise<void>;
  confirmText?: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (confirmText && !confirm(confirmText)) event.preventDefault();
      }}
    >
      <button type="submit" aria-label={label} title={label} className={className}>
        {children}
      </button>
    </form>
  );
}
