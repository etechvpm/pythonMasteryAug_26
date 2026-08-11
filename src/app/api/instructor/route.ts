import { NextResponse } from "next/server";
import { INSTRUCTOR_PIN } from "@/lib/seed";
import { readAssessments, readAttempts, toSummary, writeAssessments } from "@/lib/store";
import { buildAttemptStats } from "@/lib/scoring";
import type { Assessment, Question } from "@/lib/types";
import { nanoid } from "nanoid";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function checkPin(request: Request) {
  return request.headers.get("x-instructor-pin") === INSTRUCTOR_PIN;
}

function normalizeQuestions(questions: Question[] | undefined): Question[] {
  if (!Array.isArray(questions)) return [];
  return questions.map((q) => {
    const id = q.id || `q-${nanoid(6)}`;
    if (q.type === "mcq") {
      return {
        ...q,
        id,
        points: Number(q.points) || 1,
        options: (q.options || []).map((o, i) => ({
          id: o.id || String.fromCharCode(97 + i),
          text: o.text || "",
        })),
        correctOptionId: q.correctOptionId || "a",
      };
    }
    if (q.type === "debug") {
      return {
        ...q,
        id,
        language: "python" as const,
        points: Number(q.points) || 2,
        buggyCode: q.buggyCode || "",
        correctCode: q.correctCode || "",
        acceptContains: q.acceptContains?.filter(Boolean) || undefined,
      };
    }
    return {
      ...q,
      id,
      language: "python" as const,
      points: Number(q.points) || 3,
      functionName: q.functionName || "solve",
      starterCode: q.starterCode || `def ${q.functionName || "solve"}():\n    pass\n`,
      testCases: (q.testCases || []).map((t, i) => ({
        id: t.id || `t-${i + 1}`,
        name: t.name || `Test ${i + 1}`,
        call: t.call || "",
        expected: t.expected || "",
        hidden: Boolean(t.hidden),
      })),
    };
  });
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
  const body = (await request.json()) as {
    action?: string;
    pin?: string;
    assessment?: Partial<Assessment> & { questions?: Question[] };
  };

  if (body.action === "verify") {
    return NextResponse.json({ ok: body.pin === INSTRUCTOR_PIN });
  }

  if (!checkPin(request)) return unauthorized();

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

  if (body.action === "delete" && body.assessment?.id) {
    const all = await readAssessments();
    const next = all.filter((a) => a.id !== body.assessment!.id);
    await writeAssessments(next);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "save" && body.assessment) {
    const all = await readAssessments();
    const questions = normalizeQuestions(body.assessment.questions);
    const accessCode = (body.assessment.accessCode || nanoid(6)).toUpperCase().replace(/\s+/g, "");

    if (body.assessment.id) {
      const idx = all.findIndex((a) => a.id === body.assessment!.id);
      if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const duplicate = all.some(
        (a, i) => i !== idx && a.accessCode.toUpperCase() === accessCode
      );
      if (duplicate) {
        return NextResponse.json({ error: "Access code already used" }, { status: 400 });
      }
      all[idx] = {
        ...all[idx],
        title: body.assessment.title?.trim() || all[idx].title,
        concept: body.assessment.concept?.trim() || all[idx].concept,
        description: body.assessment.description ?? all[idx].description,
        accessCode,
        durationMinutes: Number(body.assessment.durationMinutes) || all[idx].durationMinutes,
        status: body.assessment.status || all[idx].status,
        questions,
      };
      await writeAssessments(all);
      return NextResponse.json({ assessment: all[idx], summary: toSummary(all[idx]) });
    }

    if (all.some((a) => a.accessCode.toUpperCase() === accessCode)) {
      return NextResponse.json({ error: "Access code already used" }, { status: 400 });
    }

    const created: Assessment = {
      id: `asm-${nanoid(8)}`,
      title: body.assessment.title?.trim() || "Untitled Assessment",
      concept: body.assessment.concept?.trim() || "Custom",
      description: body.assessment.description || "",
      accessCode,
      durationMinutes: Number(body.assessment.durationMinutes) || 20,
      status: body.assessment.status === "draft" ? "draft" : "published",
      createdAt: new Date().toISOString(),
      questions,
    };
    all.push(created);
    await writeAssessments(all);
    return NextResponse.json({ assessment: created, summary: toSummary(created) });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
