"use client";

import { motion } from "framer-motion";

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full">
      {label ? (
        <div className="mb-1.5 flex justify-between text-xs text-slate-400">
          <span>{label}</span>
          <span>{Math.round(clamped)}%</span>
        </div>
      ) : null}
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-300"
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}

export function TimerBadge({ remainingSeconds }: { remainingSeconds: number }) {
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const urgent = remainingSeconds <= 60;
  return (
    <div
      className={`rounded-xl px-3 py-1.5 font-mono text-sm tabular-nums ${
        urgent
          ? "bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/40"
          : "bg-white/5 text-slate-200 ring-1 ring-white/10"
      }`}
    >
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </div>
  );
}
