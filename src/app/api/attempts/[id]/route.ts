import { NextResponse } from "next/server";
import type { AnswerPayload } from "@/lib/types";
import { getAssessment, getAttempt, upsertAttempt } from "@/lib/store";
import { gradeAttempt } from "@/lib/scoring";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const attempt = await getAttempt(id);
  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }
  return NextResponse.json({ attempt });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const attempt = await getAttempt(id);
  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }
  if (attempt.status === "submitted") {
    return NextResponse.json({ error: "Already submitted" }, { status: 400 });
  }

  const body = (await request.json()) as {
    answers?: AnswerPayload[];
    submit?: boolean;
  };

  if (body.answers) {
    attempt.answers = body.answers;
  }

  if (body.submit) {
    const assessment = await getAssessment(attempt.assessmentId);
    if (!assessment) {
      return NextResponse.json({ error: "Assessment missing" }, { status: 404 });
    }
    const graded = await gradeAttempt(assessment, attempt.answers);
    attempt.results = graded.results;
    attempt.score = graded.score;
    attempt.maxScore = graded.maxScore;
    attempt.percent = graded.percent;
    attempt.submittedAt = new Date().toISOString();
    attempt.status = "submitted";
  }

  await upsertAttempt(attempt);
  return NextResponse.json({ attempt });
}
