"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import { AssessmentEditor } from "@/components/AssessmentEditor";
import type { Assessment } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function EditAssessmentPage() {
  const params = useParams<{ id: string }>();
  const { instructorPin, ready } = useSession();
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !instructorPin) router.replace("/instructor");
  }, [ready, instructorPin, router]);

  useEffect(() => {
    if (!instructorPin || !params.id) return;
    let cancelled = false;
    queueMicrotask(() => {
      void fetch(`/api/instructor?assessmentId=${params.id}`, {
        headers: { "x-instructor-pin": instructorPin },
      })
        .then(async (r) => {
          const d = await r.json();
          if (!r.ok) throw new Error(d.error || "Failed to load");
          if (!cancelled) setAssessment(d.assessment);
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err.message : "Failed");
        });
    });
    return () => {
      cancelled = true;
    };
  }, [instructorPin, params.id]);

  if (!ready || !instructorPin || (!assessment && !error)) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 p-8 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading assessment…
      </div>
    );
  }

  if (error || !assessment) {
    return <div className="flex flex-1 items-center justify-center p-8 text-rose-300">{error}</div>;
  }

  return (
    <main className="flex-1">
      <AssessmentEditor pin={instructorPin} initial={assessment} />
    </main>
  );
}
