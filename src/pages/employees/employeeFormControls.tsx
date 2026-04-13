import { cn } from "@/lib/utils";

export const employeeFormSelectClass = cn(
  "h-8 w-full rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
);

export function SelectField({
  label,
  id,
  value,
  onChange,
  options,
  hint,
  disabled,
  required: isRequired,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
        {isRequired ? <span className="text-destructive"> *</span> : null}
      </label>
      <select
        id={id}
        className={employeeFormSelectClass}
        value={value}
        disabled={disabled}
        required={isRequired}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value === "" ? "__empty" : o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function GroupedSelectField({
  label,
  id,
  value,
  onChange,
  groups,
  hint,
  disabled,
  required: isRequired,
  placeholderLabel,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  groups: { group: string; items: { value: string; label: string }[] }[];
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  /** When set, shows as first `<option value="">` (e.g. “Select branch…”). */
  placeholderLabel?: string;
}) {
  const flatKeys = groups.flatMap((g) => g.items.map((i) => i.value));
  const inList = value !== "" && flatKeys.includes(value);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
        {isRequired ? <span className="text-destructive"> *</span> : null}
      </label>
      <select
        id={id}
        className={employeeFormSelectClass}
        value={value}
        disabled={disabled}
        required={isRequired}
        onChange={(e) => onChange(e.target.value)}
      >
        {placeholderLabel ? (
          <option value="" disabled={isRequired}>
            {placeholderLabel}
          </option>
        ) : null}
        {value && !inList ? (
          <option value={value}>
            {value} (legacy)
          </option>
        ) : null}
        {groups.map((g) => (
          <optgroup key={g.group} label={g.group}>
            {g.items.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
