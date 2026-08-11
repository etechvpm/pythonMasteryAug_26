"use client";

import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { useSession } from "@/components/SessionProvider";
import type { AssessmentSummary, Attempt, InstructorStats } from "@/lib/types";
import { Loader2, Lock, LogOut, ToggleLeft, ToggleRight, Users } from "lucide-react";
import Link from "next/link";

export default function InstructorPage() {
  const { instructorPin, setInstructorPin, ready } = useSession();
  const [pinInput, setPinInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [stats, setStats] = useState<InstructorStats | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [detailStats, setDetailStats] = useState<InstructorStats | null>(null);

  const authed = Boolean(instructorPin);

  const loadDashboard = async (pin: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/instructor", {
        headers: { "x-instructor-pin": pin },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unauthorized");
      setAssessments(data.assessments ?? []);
      setStats(data.stats ?? null);
    } catch (err) {
      setInstructorPin(null);
      setAuthError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready || !instructorPin) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void loadDashboard(instructorPin);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, instructorPin]);

  useEffect(() => {
    if (!instructorPin || !selectedId) return;
    let cancelled = false;
    queueMicrotask(() => {
      void fetch(`/api/instructor?assessmentId=${selectedId}`, {
        headers: { "x-instructor-pin": instructorPin },
      })
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return;
          setAttempts(d.attempts ?? []);
          setDetailStats(d.stats ?? null);
        })
        .catch(() => undefined);
    });
    return () => {
      cancelled = true;
    };
  }, [instructorPin, selectedId]);

  const onLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/instructor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", pin: pinInput }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error("Incorrect PIN");
      setInstructorPin(pinInput);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string) => {
    if (!instructorPin) return;
    const res = await fetch("/api/instructor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-instructor-pin": instructorPin,
      },
      body: JSON.stringify({ action: "toggle", assessment: { id } }),
    });
    const data = await res.json();
    if (res.ok) {
      setAssessments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: data.assessment.status } : a))
      );
    }
  };

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-400/10 text-teal-300 ring-1 ring-teal-400/20">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-white">
            Instructor desk
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Enter the course PIN to publish checks and review submissions.
          </p>
          <form onSubmit={onLogin} className="mt-6 space-y-3">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Course PIN"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:ring-2 focus:ring-teal-400/40"
              required
            />
            {authError ? <p className="text-sm text-rose-300">{authError}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-teal-400 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              {loading ? "Checking…" : "Unlock desk"}
            </button>
          </form>
          <p className="mt-6 text-xs text-slate-500">
            Demo PIN for this course build: <code className="text-teal-300">teach2026</code>
          </p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-teal-300/80">Instructor</p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-white">
            Class desk
          </h1>
          <p className="mt-1 text-slate-400">Live view for concept checks across your cohort.</p>
        </div>
        <button
          type="button"
          onClick={() => setInstructorPin(null)}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 ring-1 ring-white/10"
        >
          <LogOut className="h-4 w-4" />
          Lock
        </button>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Attempts", value: stats?.totalAttempts ?? 0 },
          { label: "Submitted", value: stats?.submitted ?? 0 },
          { label: "Avg score", value: `${stats?.averagePercent ?? 0}%` },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-white">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-white">Assessments</h2>
          <ul className="mt-4 space-y-3">
            {assessments.map((a) => (
              <li
                key={a.id}
                className={`rounded-2xl border p-4 transition ${
                  selectedId === a.id
                    ? "border-teal-400/40 bg-teal-400/5"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setSelectedId(a.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white">{a.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {a.concept} · code{" "}
                        <span className="font-mono text-teal-300">{a.accessCode}</span> ·{" "}
                        {a.questionCount} questions · {a.durationMinutes} min
                      </p>
                      <p className="mt-1 text-xs capitalize text-slate-400">Status: {a.status}</p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => toggleStatus(a.id)}
                  className="mt-3 inline-flex items-center gap-2 text-xs text-slate-300"
                >
                  {a.status === "published" ? (
                    <ToggleRight className="h-4 w-4 text-teal-300" />
                  ) : (
                    <ToggleLeft className="h-4 w-4" />
                  )}
                  {a.status === "published" ? "Close for students" : "Publish"}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-300" />
            <h2 className="font-[family-name:var(--font-display)] text-xl text-white">
              Submissions
            </h2>
          </div>
          {!selectedId ? (
            <p className="mt-4 text-sm text-slate-500">Select an assessment to inspect attempts.</p>
          ) : (
            <>
              <p className="mt-2 text-sm text-slate-400">
                {detailStats
                  ? `${detailStats.submitted} submitted · avg ${detailStats.averagePercent}% · pass rate ${detailStats.passRate}%`
                  : "Loading…"}
              </p>
              <ul className="mt-4 max-h-[28rem] space-y-2 overflow-auto pr-1">
                {attempts.length === 0 ? (
                  <li className="text-sm text-slate-500">No attempts yet.</li>
                ) : (
                  attempts
                    .slice()
                    .sort((a, b) => (b.submittedAt || b.startedAt).localeCompare(a.submittedAt || a.startedAt))
                    .map((att) => (
                      <li
                        key={att.id}
                        className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-white">{att.student.name}</p>
                            <p className="text-xs text-slate-500">{att.student.studentId}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-teal-300">
                              {att.status === "submitted" ? `${att.percent}%` : "in progress"}
                            </p>
                            {att.status === "submitted" ? (
                              <Link
                                href={`/results/${att.id}`}
                                className="text-xs text-slate-400 hover:text-white"
                              >
                                View
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    ))
                )}
              </ul>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
