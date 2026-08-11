import { NextResponse } from "next/server";
import { getAssessmentByCode, sanitizeAssessmentForStudent } from "@/lib/store";

export async function POST(request: Request) {
  const body = (await request.json()) as { accessCode?: string };
  if (!body.accessCode?.trim()) {
    return NextResponse.json({ error: "Access code required" }, { status: 400 });
  }
  const assessment = await getAssessmentByCode(body.accessCode);
  if (!assessment) {
    return NextResponse.json({ error: "Invalid or inactive access code" }, { status: 404 });
  }
  return NextResponse.json({ assessment: sanitizeAssessmentForStudent(assessment) });
}
