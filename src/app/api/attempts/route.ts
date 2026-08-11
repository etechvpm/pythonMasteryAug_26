import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import type { Attempt, StudentProfile } from "@/lib/types";
import { getAssessment, readAttempts, upsertAttempt } from "@/lib/store";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    assessmentId?: string;
    student?: StudentProfile;
  };

  if (!body.assessmentId || !body.student?.name?.trim() || !body.student?.studentId?.trim()) {
    return NextResponse.json({ error: "Missing student or assessment" }, { status: 400 });
  }

  const assessment = await getAssessment(body.assessmentId);
  if (!assessment || assessment.status !== "published") {
    return NextResponse.json({ error: "Assessment unavailable" }, { status: 404 });
  }

  const existing = (await readAttempts()).find(
    (a) =>
      a.assessmentId === body.assessmentId &&
      a.student.studentId.trim().toLowerCase() === body.student!.studentId.trim().toLowerCase() &&
      a.status === "submitted"
  );
  if (existing) {
    return NextResponse.json(
      {
        error: "You already submitted this assessment.",
        attemptId: existing.id,
      },
      { status: 409 }
    );
  }

  const inProgress = (await readAttempts()).find(
    (a) =>
      a.assessmentId === body.assessmentId &&
      a.student.studentId.trim().toLowerCase() === body.student!.studentId.trim().toLowerCase() &&
      a.status === "in_progress"
  );
  if (inProgress) {
    return NextResponse.json({ attempt: inProgress });
  }

  const attempt: Attempt = {
    id: `att-${nanoid(10)}`,
    assessmentId: body.assessmentId,
    student: {
      name: body.student.name.trim(),
      studentId: body.student.studentId.trim(),
    },
    startedAt: new Date().toISOString(),
    answers: [],
    status: "in_progress",
  };

  await upsertAttempt(attempt);
  return NextResponse.json({ attempt });
}
