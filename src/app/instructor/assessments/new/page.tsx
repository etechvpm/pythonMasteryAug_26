"use client";

import { useSession } from "@/components/SessionProvider";
import { AssessmentEditor } from "@/components/AssessmentEditor";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function NewAssessmentPage() {
  const { instructorPin, ready } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (ready && !instructorPin) router.replace("/instructor");
  }, [ready, instructorPin, router]);

  if (!ready || !instructorPin) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 p-8 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        Opening editor…
      </div>
    );
  }

  return (
    <main className="flex-1">
      <AssessmentEditor pin={instructorPin} />
      <p className="pb-8 text-center text-xs text-slate-600">
        <Link href="/instructor" className="hover:text-slate-400">
          Return to instructor desk
        </Link>
      </p>
    </main>
  );
}
