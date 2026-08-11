"use client";

import type { CodingQuestion, DebugQuestion, McqQuestion, Question } from "@/lib/types";
import { CodeEditor } from "./CodeEditor";
import { useState } from "react";
import { Bug, CheckCircle2, Code2, HelpCircle, Loader2, Play } from "lucide-react";

type CommonProps = {
  index: number;
  total: number;
  value: string;
  onChange: (value: string) => void;
};

export function QuestionShell({
  question,
  index,
  total,
  children,
}: {
  question: Question;
  index: number;
  total: number;
  children: React.ReactNode;
}) {
  const icon =
    question.type === "mcq" ? (
      <HelpCircle className="h-4 w-4" />
    ) : question.type === "debug" ? (
      <Bug className="h-4 w-4" />
    ) : (
      <Code2 className="h-4 w-4" />
    );

  const label =
    question.type === "mcq" ? "Quiz" : question.type === "debug" ? "Debug" : "Coding";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-400/10 px-2.5 py-1 text-teal-300 ring-1 ring-teal-400/20">
          {icon}
          {label}
        </span>
        <span className="rounded-lg bg-white/5 px-2.5 py-1 text-slate-400 ring-1 ring-white/10">
          Question {index + 1} of {total}
        </span>
        <span className="rounded-lg bg-white/5 px-2.5 py-1 text-slate-400 ring-1 ring-white/10">
          {question.points} pts
        </span>
      </div>
      <div className="prose-invert">
        <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-100 sm:text-lg">
          {question.prompt}
        </p>
      </div>
      {children}
    </div>
  );
}

export function McqView({
  question,
  value,
  onChange,
  index,
  total,
}: CommonProps & { question: McqQuestion }) {
  return (
    <QuestionShell question={question} index={index} total={total}>
      <div className="grid gap-2.5">
        {question.options.map((opt) => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${
                selected
                  ? "border-teal-400/50 bg-teal-400/10 text-white"
                  : "border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/20 hover:bg-white/[0.05]"
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  selected ? "bg-teal-400 text-slate-950" : "bg-slate-800 text-slate-300"
                }`}
              >
                {opt.id.toUpperCase()}
              </span>
              <span className="text-sm leading-relaxed sm:text-base">{opt.text}</span>
            </button>
          );
        })}
      </div>
    </QuestionShell>
  );
}

export function DebugView({
  question,
  value,
  onChange,
  index,
  total,
}: CommonProps & { question: DebugQuestion }) {
  return (
    <QuestionShell question={question} index={index} total={total}>
      <div className="space-y-3">
        <p className="text-sm text-slate-400">
          Buggy starter code is loaded below. Edit it until the behavior matches the prompt.
        </p>
        {question.hint ? (
          <p className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
            Hint: {question.hint}
          </p>
        ) : null}
        <CodeEditor
          value={value || question.buggyCode}
          onChange={onChange}
          label="Fix the bug"
          minRows={10}
        />
      </div>
    </QuestionShell>
  );
}

export function CodingView({
  question,
  value,
  onChange,
  index,
  total,
  assessmentId,
}: CommonProps & { question: CodingQuestion; assessmentId: string }) {
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<{
    passed: number;
    total: number;
    feedback: string;
    testResults: Array<{
      name: string;
      passed: boolean;
      expected?: string;
      actual?: string;
      error?: string;
    }>;
  } | null>(null);

  const runVisible = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId,
          questionId: question.id,
          code: value || question.starterCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Run failed");
      setRunResult(data);
    } catch (err) {
      setRunResult({
        passed: 0,
        total: 0,
        feedback: err instanceof Error ? err.message : "Run failed",
        testResults: [],
      });
    } finally {
      setRunning(false);
    }
  };

  const visibleCases = question.testCases.filter((t) => !t.hidden);

  return (
    <QuestionShell question={question} index={index} total={total}>
      <div className="space-y-4">
        <CodeEditor
          value={value || question.starterCode}
          onChange={onChange}
          label={`Implement ${question.functionName}()`}
          minRows={12}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={runVisible}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:opacity-60"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run visible tests
          </button>
          <p className="text-xs text-slate-500">
            Hidden tests also run on final submit. Built for phones and laptops.
          </p>
        </div>

        {visibleCases.length > 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Sample tests
            </p>
            <ul className="space-y-1.5 font-mono text-xs text-slate-300 sm:text-sm">
              {visibleCases.map((t) => (
                <li key={t.id} className="flex flex-wrap gap-x-2 gap-y-1">
                  <span className="text-slate-500">{t.name}:</span>
                  <span>{t.call}</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-teal-300">{t.expected}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {runResult ? (
          <div className="rounded-2xl border border-white/10 bg-[#0B1620] p-3 sm:p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-200">
              <CheckCircle2 className="h-4 w-4 text-teal-300" />
              {runResult.feedback || `${runResult.passed}/${runResult.total} passed`}
            </div>
            <ul className="space-y-2">
              {runResult.testResults.map((t) => (
                <li
                  key={t.name}
                  className={`rounded-xl px-3 py-2 text-xs sm:text-sm ${
                    t.passed ? "bg-teal-400/10 text-teal-100" : "bg-rose-500/10 text-rose-100"
                  }`}
                >
                  <div className="font-medium">
                    {t.passed ? "Passed" : "Failed"} · {t.name}
                  </div>
                  {t.error ? <div className="mt-1 font-mono opacity-90">{t.error}</div> : null}
                  {!t.passed && t.expected !== undefined ? (
                    <div className="mt-1 font-mono opacity-90">
                      expected {t.expected}
                      {t.actual !== undefined ? ` · got ${t.actual}` : ""}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </QuestionShell>
  );
}
