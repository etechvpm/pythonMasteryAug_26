"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AssessmentRunner } from "@/components/AssessmentRunner";
import type { Assessment, Attempt } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

function AssessInner() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const attemptId = search.get("attempt");
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const missing = !params.id || !attemptId;

  useEffect(() => {
    if (missing) return;
    let cancelled = false;
    (async () => {
      try {
        const [aRes, tRes] = await Promise.all([
          fetch(`/api/assessments/${params.id}`),
          fetch(`/api/attempts/${attemptId}`),
        ]);
        const aData = await aRes.json();
        const tData = await tRes.json();
        if (!aRes.ok) throw new Error(aData.error || "Assessment missing");
        if (!tRes.ok) throw new Error(tData.error || "Attempt missing");
        if (tData.attempt.status === "submitted") {
          router.replace(`/results/${attemptId}`);
          return;
        }
        if (!cancelled) {
          setAssessment(aData.assessment);
          setAttempt(tData.attempt);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id, attemptId, missing, router]);

  if (missing) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-rose-300">
        Missing assessment or attempt.
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-rose-300">{error}</div>
    );
  }

  if (!assessment || !attempt) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 p-8 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading assessment…
      </div>
    );
  }

  return <AssessmentRunner assessment={assessment} attempt={attempt} />;
}

export default function AssessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-8 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      }
    >
      <AssessInner />
    </Suspense>
  );
}
