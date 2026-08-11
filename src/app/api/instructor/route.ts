import { NextResponse } from "next/server";
import { INSTRUCTOR_PIN } from "@/lib/seed";
import { readAssessments, readAttempts, toSummary, writeAssessments } from "@/lib/store";
import { buildAttemptStats } from "@/lib/scoring";
import type { Assessment } from "@/lib/types";
import { nanoid } from "nanoid";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function checkPin(request: Request) {
  return request.headers.get("x-instructor-pin") === INSTRUCTOR_PIN;
}

export async function GET(request: Request) {
  if (!checkPin(request)) return unauthorized();

  const url = new URL(request.url);
  const assessmentId = url.searchParams.get("assessmentId");

  const assessments = await readAssessments();
  if (assessmentId) {
    const assessment = assessments.find((a) => a.id === assessmentId);
    if (!assessment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const attempts = (await readAttempts()).filter((a) => a.assessmentId === assessmentId);
    return NextResponse.json({
      assessment,
      summary: toSummary(assessment),
      stats: buildAttemptStats(attempts),
      attempts,
    });
  }

  const attempts = await readAttempts();
  return NextResponse.json({
    assessments: assessments.map(toSummary),
    stats: buildAttemptStats(attempts),
  });
}

export async function POST(request: Request) {
  if (!checkPin(request)) return unauthorized();
  const body = (await request.json()) as { action?: string; pin?: string; assessment?: Partial<Assessment> };

  if (body.action === "verify") {
    const ok = body.pin === INSTRUCTOR_PIN;
    return NextResponse.json({ ok });
  }

  if (body.action === "toggle" && body.assessment?.id) {
    const all = await readAssessments();
    const idx = all.findIndex((a) => a.id === body.assessment!.id);
    if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const current = all[idx];
    all[idx] = {
      ...current,
      status: current.status === "published" ? "closed" : "published",
    };
    await writeAssessments(all);
    return NextResponse.json({ assessment: toSummary(all[idx]) });
  }

  if (body.action === "create" && body.assessment) {
    const all = await readAssessments();
    const created: Assessment = {
      id: `asm-${nanoid(8)}`,
      title: body.assessment.title || "Untitled Assessment",
      concept: body.assessment.concept || "Custom",
      description: body.assessment.description || "",
      accessCode: (body.assessment.accessCode || nanoid(6)).toUpperCase(),
      durationMinutes: body.assessment.durationMinutes || 20,
      status: "published",
      createdAt: new Date().toISOString(),
      questions: body.assessment.questions || [],
    };
    all.push(created);
    await writeAssessments(all);
    return NextResponse.json({ assessment: toSummary(created) });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
