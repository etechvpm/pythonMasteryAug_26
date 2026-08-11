"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { AnswerPayload, Assessment, Attempt, Question } from "@/lib/types";
import { CodingView, DebugView, McqView } from "./QuestionViews";
import { ProgressBar, TimerBadge } from "./ProgressBar";
import { ChevronLeft, ChevronRight, Flag, Loader2 } from "lucide-react";

type Props = {
  assessment: Assessment;
  attempt: Attempt;
};

function initialAnswers(assessment: Assessment, attempt: Attempt) {
  const map = new Map(attempt.answers.map((a) => [a.questionId, a.value]));
  const answers: Record<string, string> = {};
  for (const q of assessment.questions) {
    if (map.has(q.id)) answers[q.id] = map.get(q.id)!;
    else if (q.type === "debug") answers[q.id] = q.buggyCode;
    else if (q.type === "coding") answers[q.id] = q.starterCode;
    else answers[q.id] = "";
  }
  return answers;
}

export function AssessmentRunner({ assessment, attempt }: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(() => initialAnswers(assessment, attempt));
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoSubmitted = useRef(false);

  const durationSec = assessment.durationMinutes * 60;
  const started = useMemo(() => new Date(attempt.startedAt).getTime(), [attempt.startedAt]);
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, durationSec - Math.floor((Date.now() - started) / 1000))
  );

  const questions = assessment.questions;
  const current = questions[index];
  const answeredCount = questions.filter((q) => {
    const v = answers[q.id];
    if (!v) return false;
    if (q.type === "mcq") return Boolean(v);
    if (q.type === "debug") return v.trim() !== q.buggyCode.trim();
    if (q.type === "coding") return v.trim() !== q.starterCode.trim() && !v.includes("pass\n");
    return Boolean(v.trim());
  }).length;

  const payload = useCallback((): AnswerPayload[] => {
    return questions.map((q) => ({ questionId: q.id, value: answers[q.id] ?? "" }));
  }, [answers, questions]);

  const persist = useCallback(
    async (submit = false) => {
      setSaving(true);
      setError(null);
      try {
        const res = await fetch(`/api/attempts/${attempt.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: payload(), submit }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Save failed");
        if (submit) {
          router.push(`/results/${attempt.id}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      } finally {
        setSaving(false);
      }
    },
    [attempt.id, payload, router]
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      const left = Math.max(0, durationSec - Math.floor((Date.now() - started) / 1000));
      setRemaining(left);
      if (left === 0) {
        window.clearInterval(id);
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [durationSec, started]);

  useEffect(() => {
    if (remaining > 0 || autoSubmitted.current) return;
    autoSubmitted.current = true;
    queueMicrotask(() => {
      setSubmitting(true);
      void persist(true).finally(() => setSubmitting(false));
    });
  }, [remaining, persist]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void persist(false);
    }, 20000);
    return () => window.clearInterval(id);
  }, [persist]);

  const setValue = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const renderQuestion = (q: Question) => {
    const value = answers[q.id] ?? "";
    if (q.type === "mcq") {
      return (
        <McqView
          question={q}
          value={value}
          onChange={(v) => setValue(q.id, v)}
          index={index}
          total={questions.length}
        />
      );
    }
    if (q.type === "debug") {
      return (
        <DebugView
          question={q}
          value={value}
          onChange={(v) => setValue(q.id, v)}
          index={index}
          total={questions.length}
        />
      );
    }
    return (
      <CodingView
        question={q}
        value={value}
        onChange={(v) => setValue(q.id, v)}
        index={index}
        total={questions.length}
        assessmentId={assessment.id}
      />
    );
  };

  const onSubmit = async () => {
    const ok = window.confirm("Submit your assessment? You cannot change answers after this.");
    if (!ok) return;
    setSubmitting(true);
    await persist(true);
    setSubmitting(false);
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col px-4 pb-28 pt-4 sm:px-6 sm:pb-32 sm:pt-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-teal-300/80">{assessment.concept}</p>
          <h1 className="font-[family-name:var(--font-display)] text-xl text-white sm:text-2xl">
            {assessment.title}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {attempt.student.name} · {attempt.student.studentId}
          </p>
        </div>
        <TimerBadge remainingSeconds={remaining} />
      </div>

      <ProgressBar
        value={(answeredCount / questions.length) * 100}
        label={`${answeredCount}/${questions.length} answered`}
      />

      <div className="mt-6 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="rounded-[28px] border border-white/10 bg-white/[0.035] p-4 sm:p-6"
          >
            {renderQuestion(current)}
          </motion.div>
        </AnimatePresence>
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#07131A]/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="inline-flex items-center gap-1 rounded-xl px-3 py-2.5 text-sm text-slate-200 ring-1 ring-white/10 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-slate-500 sm:inline">
              {saving ? "Saving…" : "Auto-saves"}
            </span>
            {index < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
                className="inline-flex items-center gap-1 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-400 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Flag className="h-4 w-4" />
                )}
                Submit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
