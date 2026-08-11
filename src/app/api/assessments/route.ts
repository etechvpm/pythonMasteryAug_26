import { NextResponse } from "next/server";
import { readAssessments, toSummary } from "@/lib/store";

export async function GET() {
  const assessments = await readAssessments();
  const published = assessments.filter((a) => a.status === "published").map(toSummary);
  return NextResponse.json({ assessments: published });
}
