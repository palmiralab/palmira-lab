'use client';

import { useId, useState } from 'react';

// В React нет <slot>. Его роль играют пропсы типа ReactNode:
//   children — «слот по умолчанию» (то, что написано между тегами),
//   trigger  — «именованный слот» (аналог <template #trigger> в Vue).
type TooltipProps = {
  trigger: React.ReactNode;
  children: React.ReactNode;
};

export function Tooltip({ trigger, children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const tipId = useId();

  return (
    <span className="group relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        onBlur={() => setOpen(false)}
        aria-describedby={tipId}
        aria-expanded={open}
        className="cursor-help underline decoration-dotted underline-offset-2"
      >
        {trigger}
      </button>
      <span
        id={tipId}
        role="tooltip"
        className={
          'pointer-events-none absolute bottom-full left-0 z-10 mb-2 w-64 rounded-md border border-slate-200 ' +
          'bg-white p-3 text-xs leading-relaxed text-slate-700 shadow-md transition-opacity ' +
          'group-hover:visible group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 ' +
          (open ? 'visible opacity-100' : 'invisible opacity-0')
        }
      >
        {children}
      </span>
    </span>
  );
}
