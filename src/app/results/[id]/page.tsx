"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Attempt } from "@/lib/types";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/attempts/${params.id}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Not found");
        setAttempt(d.attempt);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }, [params.id]);

  if (error) {
    return <div className="flex flex-1 items-center justify-center p-8 text-rose-300">{error}</div>;
  }

  if (!attempt) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 p-8 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading results…
      </div>
    );
  }

  if (attempt.status !== "submitted") {
    return (
      <div className="mx-auto max-w-lg flex-1 px-4 py-16 text-center">
        <p className="text-slate-300">This attempt is still in progress.</p>
        <Link href={`/assess/${attempt.assessmentId}?attempt=${attempt.id}`} className="mt-4 inline-block text-teal-300">
          Continue assessment
        </Link>
      </div>
    );
  }

  const percent = attempt.percent ?? 0;
  const passed = percent >= 60;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs uppercase tracking-[0.2em] text-teal-300/80">Results</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white sm:text-4xl">
          {attempt.student.name}
        </h1>
        <p className="mt-1 text-slate-400">
          {attempt.student.studentId} · submitted{" "}
          {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : ""}
        </p>

        <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Score</p>
              <p className="font-[family-name:var(--font-display)] text-5xl text-white">
                {attempt.score}
                <span className="text-2xl text-slate-500">/{attempt.maxScore}</span>
              </p>
            </div>
            <div
              className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                passed
                  ? "bg-teal-400/15 text-teal-200 ring-1 ring-teal-400/30"
                  : "bg-amber-400/15 text-amber-100 ring-1 ring-amber-400/30"
              }`}
            >
              {percent}% · {passed ? "Passing" : "Needs review"}
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-300"
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-white">Breakdown</h2>
          {(attempt.results ?? []).map((r, idx) => (
            <div
              key={r.questionId}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-start gap-3">
                {r.correct ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-300" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-white">Question {idx + 1}</span>
                    <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs uppercase text-slate-400">
                      {r.type}
                    </span>
                    <span className="text-xs text-slate-500">
                      {r.earned}/{r.max} pts
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{r.feedback}</p>
                  {r.details?.testResults ? (
                    <ul className="mt-2 space-y-1 text-xs text-slate-400">
                      {r.details.testResults.map((t) => (
                        <li key={t.name}>
                          {t.passed ? "✓" : "✗"} {t.name}
                          {t.hidden ? " (hidden)" : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/join"
            className="rounded-2xl bg-teal-400 px-5 py-3 text-sm font-semibold text-slate-950"
          >
            Take another check
          </Link>
          <Link
            href="/"
            className="rounded-2xl px-5 py-3 text-sm text-slate-200 ring-1 ring-white/15"
          >
            Home
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
