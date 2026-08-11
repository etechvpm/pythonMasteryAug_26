import { NextResponse } from "next/server";
import type { CodingQuestion } from "@/lib/types";
import { getAssessment } from "@/lib/store";
import { gradeCodingQuestion } from "@/lib/pythonRunner";

/** Run visible test cases while a student is working (no score saved). */
export async function POST(request: Request) {
  const body = (await request.json()) as {
    assessmentId?: string;
    questionId?: string;
    code?: string;
  };

  if (!body.assessmentId || !body.questionId || typeof body.code !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const assessment = await getAssessment(body.assessmentId);
  const question = assessment?.questions.find((q) => q.id === body.questionId);
  if (!assessment || !question || question.type !== "coding") {
    return NextResponse.json({ error: "Coding question not found" }, { status: 404 });
  }

  const visibleOnly: CodingQuestion = {
    ...question,
    testCases: question.testCases.filter((t) => !t.hidden),
  };

  const result = await gradeCodingQuestion(visibleOnly, body.code);
  return NextResponse.json({
    passed: result.testResults.filter((t) => t.passed).length,
    total: result.testResults.length,
    feedback: result.feedback,
    testResults: result.testResults,
  });
}
