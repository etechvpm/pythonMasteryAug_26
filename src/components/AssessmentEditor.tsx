"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import type {
  Assessment,
  AssessmentStatus,
  CodingQuestion,
  DebugQuestion,
  McqQuestion,
  Question,
} from "@/lib/types";
import { CodeEditor } from "@/components/CodeEditor";
import {
  ArrowLeft,
  Bug,
  Code2,
  HelpCircle,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import Link from "next/link";

type Props = {
  pin: string;
  initial?: Assessment | null;
};

function blankMcq(): McqQuestion {
  return {
    id: `q-${nanoid(6)}`,
    type: "mcq",
    prompt: "",
    points: 2,
    options: [
      { id: "a", text: "" },
      { id: "b", text: "" },
      { id: "c", text: "" },
      { id: "d", text: "" },
    ],
    correctOptionId: "a",
    explanation: "",
  };
}

function blankDebug(): DebugQuestion {
  return {
    id: `q-${nanoid(6)}`,
    type: "debug",
    prompt: "Fix the bug in this Python snippet.",
    points: 4,
    language: "python",
    buggyCode: "# buggy code here\n",
    correctCode: "# fixed code here\n",
    acceptContains: [],
    hint: "",
    explanation: "",
  };
}

function blankCoding(): CodingQuestion {
  return {
    id: `q-${nanoid(6)}`,
    type: "coding",
    prompt: "Write a Python function that…",
    points: 5,
    language: "python",
    functionName: "solve",
    starterCode: "def solve():\n    pass\n",
    testCases: [
      { id: "t1", name: "Sample", call: "solve()", expected: "", hidden: false },
      { id: "t2", name: "Hidden", call: "solve()", expected: "", hidden: true },
    ],
    explanation: "",
  };
}

export function AssessmentEditor({ pin, initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title || "");
  const [concept, setConcept] = useState(initial?.concept || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [accessCode, setAccessCode] = useState(initial?.accessCode || "");
  const [durationMinutes, setDurationMinutes] = useState(initial?.durationMinutes || 20);
  const [status, setStatus] = useState<AssessmentStatus>(initial?.status || "published");
  const [questions, setQuestions] = useState<Question[]>(initial?.questions || []);
  const [activeIdx, setActiveIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const active = questions[activeIdx] || null;
  const totalPoints = useMemo(
    () => questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0),
    [questions]
  );

  const updateQuestion = (idx: number, next: Question) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? next : q)));
  };

  const addQuestion = (type: Question["type"]) => {
    const q = type === "mcq" ? blankMcq() : type === "debug" ? blankDebug() : blankCoding();
    setQuestions((prev) => [...prev, q]);
    setActiveIdx(questions.length);
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    setActiveIdx((i) => Math.max(0, Math.min(i, questions.length - 2)));
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (!title.trim()) throw new Error("Title is required");
      if (questions.length === 0) throw new Error("Add at least one question");
      const res = await fetch("/api/instructor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-instructor-pin": pin,
        },
        body: JSON.stringify({
          action: "save",
          assessment: {
            id: initial?.id,
            title,
            concept,
            description,
            accessCode: accessCode || undefined,
            durationMinutes,
            status,
            questions,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      const code = data.assessment.accessCode as string;
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setShareUrl(`${origin}/join?code=${encodeURIComponent(code)}`);
      if (!initial?.id) {
        router.replace(`/instructor/assessments/${data.assessment.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/instructor"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to desk
        </Link>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-400 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save assessment
        </button>
      </div>

      <h1 className="font-[family-name:var(--font-display)] text-3xl text-white">
        {initial ? "Edit assessment" : "Create assessment"}
      </h1>
      <p className="mt-1 text-slate-400">
        Add your own quiz, debug, and coding questions. Students join from anywhere with the access
        code.
      </p>

      <div className="mt-6 grid gap-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
        <label className="space-y-1.5 sm:col-span-2 lg:col-span-2">
          <span className="text-xs uppercase tracking-wide text-slate-500">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-teal-400/40"
            placeholder="Lists & Dictionaries check"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs uppercase tracking-wide text-slate-500">Concept / week</span>
          <input
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-teal-400/40"
            placeholder="Week 4 · Collections"
          />
        </label>
        <label className="space-y-1.5 sm:col-span-2 lg:col-span-3">
          <span className="text-xs uppercase tracking-wide text-slate-500">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-teal-400/40"
            placeholder="Short note students see before starting"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs uppercase tracking-wide text-slate-500">Access code</span>
          <input
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 font-mono tracking-widest text-teal-200 outline-none focus:ring-2 focus:ring-teal-400/40"
            placeholder="AUTO"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs uppercase tracking-wide text-slate-500">Duration (minutes)</span>
          <input
            type="number"
            min={5}
            max={180}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-teal-400/40"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs uppercase tracking-wide text-slate-500">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AssessmentStatus)}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-teal-400/40"
          >
            <option value="published">Published (students can join)</option>
            <option value="draft">Draft (hidden)</option>
            <option value="closed">Closed</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-400">
        <span>
          {questions.length} questions · {totalPoints} pts
        </span>
        {shareUrl ? (
          <button
            type="button"
            className="rounded-lg bg-teal-400/10 px-2.5 py-1 text-teal-200 ring-1 ring-teal-400/30"
            onClick={() => navigator.clipboard.writeText(shareUrl)}
          >
            Copy student link
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Questions</p>
          <ul className="space-y-2">
            {questions.map((q, idx) => (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm ${
                    idx === activeIdx
                      ? "border-teal-400/40 bg-teal-400/10 text-white"
                      : "border-white/10 bg-white/[0.03] text-slate-300"
                  }`}
                >
                  <span className="block font-medium">
                    Q{idx + 1} · {q.type}
                  </span>
                  <span className="line-clamp-1 text-xs text-slate-500">
                    {q.prompt || "(no prompt yet)"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="grid gap-2 pt-2">
            <button
              type="button"
              onClick={() => addQuestion("mcq")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-200 ring-1 ring-white/10"
            >
              <HelpCircle className="h-4 w-4 text-teal-300" />
              Add quiz
            </button>
            <button
              type="button"
              onClick={() => addQuestion("debug")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-200 ring-1 ring-white/10"
            >
              <Bug className="h-4 w-4 text-teal-300" />
              Add debug
            </button>
            <button
              type="button"
              onClick={() => addQuestion("coding")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-200 ring-1 ring-white/10"
            >
              <Code2 className="h-4 w-4 text-teal-300" />
              Add coding
            </button>
          </div>
        </aside>

        <section className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          {!active ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-slate-400">
              <Plus className="h-6 w-6" />
              <p>Add your first question to begin.</p>
            </div>
          ) : (
            <QuestionEditor
              question={active}
              onChange={(q) => updateQuestion(activeIdx, q)}
              onDelete={() => removeQuestion(activeIdx)}
            />
          )}
        </section>
      </div>
    </div>
  );
}

function QuestionEditor({
  question,
  onChange,
  onDelete,
}: {
  question: Question;
  onChange: (q: Question) => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm uppercase tracking-wide text-teal-300/80">{question.type} question</p>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 text-sm text-rose-300"
        >
          <Trash2 className="h-4 w-4" />
          Remove
        </button>
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs text-slate-500">Prompt</span>
        <textarea
          value={question.prompt}
          onChange={(e) => onChange({ ...question, prompt: e.target.value })}
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-teal-400/40"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs text-slate-500">Points</span>
          <input
            type="number"
            min={1}
            value={question.points}
            onChange={(e) => onChange({ ...question, points: Number(e.target.value) || 1 })}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white outline-none"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs text-slate-500">Explanation (shown after submit)</span>
          <input
            value={question.explanation || ""}
            onChange={(e) => onChange({ ...question, explanation: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white outline-none"
          />
        </label>
      </div>

      {question.type === "mcq" ? (
        <McqFields question={question} onChange={onChange} />
      ) : null}
      {question.type === "debug" ? (
        <DebugFields question={question} onChange={onChange} />
      ) : null}
      {question.type === "coding" ? (
        <CodingFields question={question} onChange={onChange} />
      ) : null}
    </div>
  );
}

function McqFields({
  question,
  onChange,
}: {
  question: McqQuestion;
  onChange: (q: Question) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">Options</p>
      {question.options.map((opt, idx) => (
        <div key={opt.id} className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...question, correctOptionId: opt.id })}
            className={`mt-1 h-8 w-8 shrink-0 rounded-full text-xs font-semibold ${
              question.correctOptionId === opt.id
                ? "bg-teal-400 text-slate-950"
                : "bg-slate-800 text-slate-300"
            }`}
            title="Mark as correct"
          >
            {opt.id.toUpperCase()}
          </button>
          <input
            value={opt.text}
            onChange={(e) => {
              const options = question.options.map((o, i) =>
                i === idx ? { ...o, text: e.target.value } : o
              );
              onChange({ ...question, options });
            }}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
            placeholder={`Option ${opt.id.toUpperCase()}`}
          />
        </div>
      ))}
      <p className="text-xs text-slate-500">Tap the letter to set the correct answer.</p>
    </div>
  );
}

function DebugFields({
  question,
  onChange,
}: {
  question: DebugQuestion;
  onChange: (q: Question) => void;
}) {
  return (
    <div className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-xs text-slate-500">Hint (optional)</span>
        <input
          value={question.hint || ""}
          onChange={(e) => onChange({ ...question, hint: e.target.value })}
          className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
        />
      </label>
      <div>
        <p className="mb-2 text-xs text-slate-500">Buggy starter code (students see this)</p>
        <CodeEditor
          value={question.buggyCode}
          onChange={(buggyCode) => onChange({ ...question, buggyCode })}
          label="Buggy code"
          minRows={8}
        />
      </div>
      <div>
        <p className="mb-2 text-xs text-slate-500">Correct fixed code (for grading)</p>
        <CodeEditor
          value={question.correctCode}
          onChange={(correctCode) => onChange({ ...question, correctCode })}
          label="Correct code"
          minRows={8}
        />
      </div>
      <label className="block space-y-1.5">
        <span className="text-xs text-slate-500">
          Accept if answer contains (comma-separated snippets, optional)
        </span>
        <input
          value={(question.acceptContains || []).join(", ")}
          onChange={(e) =>
            onChange({
              ...question,
              acceptContains: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
          placeholder="int(input, total +="
        />
      </label>
    </div>
  );
}

function CodingFields({
  question,
  onChange,
}: {
  question: CodingQuestion;
  onChange: (q: Question) => void;
}) {
  return (
    <div className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-xs text-slate-500">Function name</span>
        <input
          value={question.functionName}
          onChange={(e) => {
            const functionName = e.target.value.trim() || "solve";
            onChange({
              ...question,
              functionName,
              starterCode: question.starterCode.includes(`def ${question.functionName}`)
                ? question.starterCode.replace(
                    `def ${question.functionName}`,
                    `def ${functionName}`
                  )
                : question.starterCode,
            });
          }}
          className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-mono text-teal-200 outline-none"
        />
      </label>
      <div>
        <p className="mb-2 text-xs text-slate-500">Starter code</p>
        <CodeEditor
          value={question.starterCode}
          onChange={(starterCode) => onChange({ ...question, starterCode })}
          label="Starter"
          minRows={8}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-slate-500">Test cases</p>
          <button
            type="button"
            className="text-xs text-teal-300"
            onClick={() =>
              onChange({
                ...question,
                testCases: [
                  ...question.testCases,
                  {
                    id: `t-${nanoid(4)}`,
                    name: `Test ${question.testCases.length + 1}`,
                    call: `${question.functionName}()`,
                    expected: "",
                    hidden: false,
                  },
                ],
              })
            }
          >
            + Add test
          </button>
        </div>
        {question.testCases.map((t, idx) => (
          <div key={t.id} className="grid gap-2 rounded-xl border border-white/10 p-3 sm:grid-cols-2">
            <input
              value={t.name}
              onChange={(e) => {
                const testCases = question.testCases.map((c, i) =>
                  i === idx ? { ...c, name: e.target.value } : c
                );
                onChange({ ...question, testCases });
              }}
              className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-sm text-white"
              placeholder="Name"
            />
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={Boolean(t.hidden)}
                onChange={(e) => {
                  const testCases = question.testCases.map((c, i) =>
                    i === idx ? { ...c, hidden: e.target.checked } : c
                  );
                  onChange({ ...question, testCases });
                }}
              />
              Hidden from students
            </label>
            <input
              value={t.call}
              onChange={(e) => {
                const testCases = question.testCases.map((c, i) =>
                  i === idx ? { ...c, call: e.target.value } : c
                );
                onChange({ ...question, testCases });
              }}
              className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 font-mono text-sm text-teal-100 sm:col-span-1"
              placeholder="classify(4)"
            />
            <div className="flex gap-2">
              <input
                value={t.expected}
                onChange={(e) => {
                  const testCases = question.testCases.map((c, i) =>
                    i === idx ? { ...c, expected: e.target.value } : c
                  );
                  onChange({ ...question, testCases });
                }}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 font-mono text-sm text-white"
                placeholder="expected output"
              />
              <button
                type="button"
                className="text-rose-300"
                onClick={() =>
                  onChange({
                    ...question,
                    testCases: question.testCases.filter((_, i) => i !== idx),
                  })
                }
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
