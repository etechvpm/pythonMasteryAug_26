"use client";

import { useMemo, useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  minRows?: number;
  readOnly?: boolean;
  label?: string;
};

export function CodeEditor({
  value,
  onChange,
  minRows = 12,
  readOnly = false,
  label = "Code editor",
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const lineCount = useMemo(() => Math.max(1, value.split("\n").length), [value]);
  const lines = useMemo(
    () => Array.from({ length: Math.max(lineCount, minRows) }, (_, i) => i + 1),
    [lineCount, minRows]
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-[#0B1620] shadow-inner">
      <div className="flex items-center justify-between border-b border-slate-700/80 px-3 py-2 text-xs text-slate-400">
        <span>{label}</span>
        <span className="font-mono text-teal-400/80">python</span>
      </div>
      <div className="flex max-h-[min(58vh,420px)] min-h-[220px] overflow-auto">
        <div
          aria-hidden
          className="select-none border-r border-slate-800 bg-[#09121A] px-2 py-3 text-right font-mono text-[12px] leading-6 text-slate-600"
        >
          {lines.map((n) => (
            <div key={n}>{n}</div>
          ))}
        </div>
        <textarea
          ref={ref}
          value={value}
          readOnly={readOnly}
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
          rows={Math.max(minRows, lineCount)}
          className="w-full resize-none bg-transparent px-3 py-3 font-mono text-[13px] leading-6 text-slate-100 outline-none sm:text-sm"
          style={{ tabSize: 4 }}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              const el = e.currentTarget;
              const start = el.selectionStart;
              const end = el.selectionEnd;
              const next = value.slice(0, start) + "    " + value.slice(end);
              onChange(next);
              requestAnimationFrame(() => {
                el.selectionStart = el.selectionEnd = start + 4;
              });
            }
          }}
        />
      </div>
    </div>
  );
}
