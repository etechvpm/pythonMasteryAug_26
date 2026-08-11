import { NextResponse } from "next/server";
import { getAssessment, sanitizeAssessmentForStudent } from "@/lib/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const assessment = await getAssessment(id);
  if (!assessment || assessment.status !== "published") {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }
  return NextResponse.json({ assessment: sanitizeAssessmentForStudent(assessment) });
}
