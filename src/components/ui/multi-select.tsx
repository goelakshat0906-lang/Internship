"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import clsx from "clsx";

export type MultiSelectOption = { value: string; label: string };

export function MultiSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function toggle(v: string) {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
          value.length > 0
            ? "border-volt-400/40 bg-volt-400/10 text-volt-300"
            : "border-ink-500 bg-ink-900 text-ink-200 hover:bg-ink-700",
        )}
      >
        {label}
        {value.length > 0 && <span className="chip !py-0.5 !px-1.5 text-[10px]">{value.length}</span>}
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-56 rounded-lg border border-ink-500 bg-ink-800 p-1.5 shadow-xl">
          {options.map((opt) => {
            const checked = value.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-ink-100 hover:bg-ink-700"
              >
                <span
                  className={clsx(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    checked ? "border-volt-400 bg-volt-400 text-ink-950" : "border-ink-400",
                  )}
                >
                  {checked && <Check size={12} strokeWidth={3} />}
                </span>
                {opt.label}
              </button>
            );
          })}
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-xs text-ink-300 hover:bg-ink-700"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
