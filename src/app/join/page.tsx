"use client";

import { useEffect, useState, type FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "@/components/SessionProvider";
import type { AssessmentSummary } from "@/lib/types";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

function JoinForm() {
  const router = useRouter();
  const search = useSearchParams();
  const codeFromLink = (search.get("code") || "").toUpperCase();
  const { student, setStudent, ready } = useSession();
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [accessCode, setAccessCode] = useState(codeFromLink);
  const [catalog, setCatalog] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);
  const [codeApplied, setCodeApplied] = useState(!codeFromLink);

  if (ready && student && !prefilled) {
    setName(student.name);
    setStudentId(student.studentId);
    setPrefilled(true);
  }

  if (codeFromLink && !codeApplied) {
    setAccessCode(codeFromLink);
    setCodeApplied(true);
  }

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      void fetch("/api/assessments")
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled) setCatalog(d.assessments ?? []);
        })
        .catch(() => undefined);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const joinRes = await fetch("/api/assessments/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode }),
      });
      const joinData = await joinRes.json();
      if (!joinRes.ok) throw new Error(joinData.error || "Invalid code");

      const profile = { name: name.trim(), studentId: studentId.trim() };
      setStudent(profile);

      const attemptRes = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId: joinData.assessment.id,
          student: profile,
        }),
      });
      const attemptData = await attemptRes.json();
      if (attemptRes.status === 409 && attemptData.attemptId) {
        router.push(`/results/${attemptData.attemptId}`);
        return;
      }
      if (!attemptRes.ok) throw new Error(attemptData.error || "Could not start");

      router.push(`/assess/${joinData.assessment.id}?attempt=${attemptData.attempt.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <p className="text-xs uppercase tracking-[0.2em] text-teal-300/80">Student entry</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white sm:text-4xl">
        Join today&apos;s check
      </h1>
      <p className="mt-2 text-slate-400">
        Use the link or access code your instructor shared. Works from home on any phone or laptop.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm text-slate-300">Full name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none ring-teal-400/40 placeholder:text-slate-600 focus:ring-2"
            placeholder="Alex Rivera"
            autoComplete="name"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-slate-300">Student ID</span>
          <input
            required
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none ring-teal-400/40 placeholder:text-slate-600 focus:ring-2"
            placeholder="STU-1042"
            autoComplete="username"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-slate-300">Access code</span>
          <input
            required
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 font-mono text-lg tracking-[0.2em] text-teal-200 outline-none ring-teal-400/40 placeholder:text-slate-600 focus:ring-2"
            placeholder="VARS01"
            autoCapitalize="characters"
          />
        </label>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-400 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Start assessment
        </button>
      </form>

      {catalog.length > 0 ? (
        <div className="mt-10">
          <p className="text-xs uppercase tracking-wide text-slate-500">Open concept checks</p>
          <ul className="mt-3 space-y-2">
            {catalog.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setAccessCode(a.accessCode)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:border-teal-400/30"
                >
                  <span>
                    <span className="block text-sm text-white">{a.title}</span>
                    <span className="text-xs text-slate-500">
                      {a.concept} · {a.durationMinutes} min · {a.questionCount} questions
                    </span>
                  </span>
                  <span className="font-mono text-xs text-teal-300">{a.accessCode}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-8 text-center text-sm text-slate-500">
        Teaching?{" "}
        <Link href="/instructor" className="text-teal-300 hover:underline">
          Open instructor desk
        </Link>
      </p>
    </motion.div>
  );
}

export default function JoinPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-10 sm:px-6">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center p-8 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        }
      >
        <JoinForm />
      </Suspense>
    </main>
  );
}
