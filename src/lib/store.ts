import { promises as fs } from "fs";
import path from "path";
import type { Assessment, Attempt } from "./types";
import { seedAssessments } from "./seed";

const DATA_DIR = path.join(process.cwd(), "data");
const ASSESSMENTS_FILE = path.join(DATA_DIR, "assessments.json");
const ATTEMPTS_FILE = path.join(DATA_DIR, "attempts.json");

async function ensureDataFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(ASSESSMENTS_FILE);
  } catch {
    await fs.writeFile(ASSESSMENTS_FILE, JSON.stringify(seedAssessments, null, 2), "utf8");
  }
  try {
    await fs.access(ATTEMPTS_FILE);
  } catch {
    await fs.writeFile(ATTEMPTS_FILE, JSON.stringify([], null, 2), "utf8");
  }
}

export async function readAssessments(): Promise<Assessment[]> {
  await ensureDataFiles();
  const raw = await fs.readFile(ASSESSMENTS_FILE, "utf8");
  return JSON.parse(raw) as Assessment[];
}

export async function writeAssessments(assessments: Assessment[]) {
  await ensureDataFiles();
  await fs.writeFile(ASSESSMENTS_FILE, JSON.stringify(assessments, null, 2), "utf8");
}

export async function getAssessment(id: string) {
  const all = await readAssessments();
  return all.find((a) => a.id === id) ?? null;
}

export async function getAssessmentByCode(code: string) {
  const all = await readAssessments();
  const normalized = code.trim().toUpperCase();
  return (
    all.find((a) => a.accessCode.toUpperCase() === normalized && a.status === "published") ??
    null
  );
}

export async function readAttempts(): Promise<Attempt[]> {
  await ensureDataFiles();
  const raw = await fs.readFile(ATTEMPTS_FILE, "utf8");
  return JSON.parse(raw) as Attempt[];
}

export async function writeAttempts(attempts: Attempt[]) {
  await ensureDataFiles();
  await fs.writeFile(ATTEMPTS_FILE, JSON.stringify(attempts, null, 2), "utf8");
}

export async function getAttempt(id: string) {
  const all = await readAttempts();
  return all.find((a) => a.id === id) ?? null;
}

export async function upsertAttempt(attempt: Attempt) {
  const all = await readAttempts();
  const idx = all.findIndex((a) => a.id === attempt.id);
  if (idx >= 0) all[idx] = attempt;
  else all.push(attempt);
  await writeAttempts(all);
  return attempt;
}

export function toSummary(assessment: Assessment) {
  const types = Array.from(new Set(assessment.questions.map((q) => q.type)));
  return {
    id: assessment.id,
    title: assessment.title,
    concept: assessment.concept,
    description: assessment.description,
    accessCode: assessment.accessCode,
    durationMinutes: assessment.durationMinutes,
    status: assessment.status,
    questionCount: assessment.questions.length,
    totalPoints: assessment.questions.reduce((sum, q) => sum + q.points, 0),
    types,
  };
}

/** Strip answer keys for student-facing payloads. */
export function sanitizeAssessmentForStudent(assessment: Assessment): Assessment {
  return {
    ...assessment,
    questions: assessment.questions.map((q) => {
      if (q.type === "mcq") {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { correctOptionId, explanation, ...rest } = q;
        return rest as typeof q;
      }
      if (q.type === "debug") {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { correctCode, acceptContains, explanation, ...rest } = q;
        return rest as typeof q;
      }
      if (q.type === "coding") {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { explanation, ...rest } = q;
        return {
          ...rest,
          testCases: q.testCases.map((t) =>
            t.hidden ? { id: t.id, name: t.name, call: "", expected: "", hidden: true } : t
          ),
        } as typeof q;
      }
      return q;
    }),
  };
}
