import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { promises as fs } from "fs";
import path from "path";
import type { Assessment, Attempt } from "./types";
import { seedAssessments } from "./seed";

const DATA_DIR = path.join(process.cwd(), "data");
const ASSESSMENTS_FILE = path.join(DATA_DIR, "assessments.json");
const ATTEMPTS_FILE = path.join(DATA_DIR, "attempts.json");

type Sql = NeonQueryFunction<false, false>;

function getSql(): Sql | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

let schemaReady: Promise<void> | null = null;

async function ensureDbSchema(sql: Sql) {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS app_data (
          id TEXT PRIMARY KEY,
          payload JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      const rows = await sql`SELECT id FROM app_data WHERE id = 'assessments'`;
      if (rows.length === 0) {
        await sql`
          INSERT INTO app_data (id, payload)
          VALUES ('assessments', ${JSON.stringify(seedAssessments)}::jsonb)
        `;
      }
      const attemptRows = await sql`SELECT id FROM app_data WHERE id = 'attempts'`;
      if (attemptRows.length === 0) {
        await sql`
          INSERT INTO app_data (id, payload)
          VALUES ('attempts', '[]'::jsonb)
        `;
      }
    })();
  }
  await schemaReady;
}

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

async function readJsonDoc<T>(id: "assessments" | "attempts", fallback: T): Promise<T> {
  const sql = getSql();
  if (sql) {
    await ensureDbSchema(sql);
    const rows = await sql`SELECT payload FROM app_data WHERE id = ${id}`;
    if (!rows[0]) return fallback;
    return rows[0].payload as T;
  }
  await ensureDataFiles();
  const file = id === "assessments" ? ASSESSMENTS_FILE : ATTEMPTS_FILE;
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw) as T;
}

async function writeJsonDoc(id: "assessments" | "attempts", payload: unknown) {
  const sql = getSql();
  if (sql) {
    await ensureDbSchema(sql);
    await sql`
      INSERT INTO app_data (id, payload, updated_at)
      VALUES (${id}, ${JSON.stringify(payload)}::jsonb, NOW())
      ON CONFLICT (id)
      DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
    `;
    return;
  }
  await ensureDataFiles();
  const file = id === "assessments" ? ASSESSMENTS_FILE : ATTEMPTS_FILE;
  await fs.writeFile(file, JSON.stringify(payload, null, 2), "utf8");
}

export async function readAssessments(): Promise<Assessment[]> {
  return readJsonDoc<Assessment[]>("assessments", seedAssessments);
}

export async function writeAssessments(assessments: Assessment[]) {
  await writeJsonDoc("assessments", assessments);
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
  return readJsonDoc<Attempt[]>("attempts", []);
}

export async function writeAttempts(attempts: Attempt[]) {
  await writeJsonDoc("attempts", attempts);
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

export function usesCloudDatabase() {
  return Boolean(process.env.DATABASE_URL);
}
