type FieldProps = {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
};

export function Field({ label, hint, htmlFor, children, className = "" }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label block text-stone">
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-2 text-xs leading-relaxed text-stone">{hint}</p>}
    </div>
  );
}

export const inputClass =
  "w-full border border-ink/20 bg-bone px-3.5 py-3 text-ink transition-colors placeholder:text-stone/60 focus:border-ink focus:outline-none";

type SectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
};

export function Section({ title, description, children, action }: SectionProps) {
  return (
    <section className="border-t border-ink/12 pt-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl tracking-[-0.02em]">{title}</h3>
          {description && <p className="mt-1.5 max-w-xl text-sm text-stone">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

type ToggleProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
};

export function Toggle({ checked, onChange, label, hint }: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ember ${
          checked ? "bg-ink" : "bg-ink/20"
        }`}
      >
        <span
          className={`block size-5 rounded-full bg-bone transition-transform duration-300 ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </span>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-stone">{hint}</span>}
      </span>
    </label>
  );
}
