import { spawn, type ChildProcess } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import type { CodingQuestion, CodingTestCase } from "./types";

export interface TestRunResult {
  name: string;
  passed: boolean;
  expected?: string;
  actual?: string;
  error?: string;
  hidden?: boolean;
}

function normalizeOutput(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

async function runPython(
  source: string,
  timeoutMs = 2500
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pylab-"));
  const file = path.join(dir, "solution.py");
  await fs.writeFile(file, source, "utf8");

  try {
    return await new Promise((resolve) => {
      const child: ChildProcess = spawn("python3", [file], {
        cwd: dir,
        env: {
          ...process.env,
          PYTHONIOENCODING: "utf-8",
          PYTHONDONTWRITEBYTECODE: "1",
        },
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let settled = false;

      const finish = (payload: { stdout: string; stderr: string; code: number | null }) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(payload);
      };

      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        finish({ stdout, stderr: stderr || "Time limit exceeded", code: null });
      }, timeoutMs);

      child.stdout?.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
        if (stdout.length > 50_000) child.kill("SIGKILL");
      });
      child.stderr?.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
        if (stderr.length > 50_000) child.kill("SIGKILL");
      });
      child.on("close", (code: number | null) => {
        finish({ stdout, stderr, code });
      });
    });
  } finally {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

function buildHarness(studentCode: string, cases: CodingTestCase[]) {
  const blocks = cases
    .map((c, idx) => {
      const body = [
        `__result = ${c.call}`,
        `if isinstance(__result, bool):`,
        `    __actual = "True" if __result else "False"`,
        `elif isinstance(__result, (int, float)):`,
        `    __actual = str(__result)`,
        `elif __result is None:`,
        `    __actual = "None"`,
        `else:`,
        `    __actual = str(__result)`,
        `print("CASE::${idx}::OK::" + __actual)`,
      ].join("\n");
      return [
        "try:",
        ...body.split("\n").map((line) => "    " + line),
        "except Exception as __e:",
        `    print("CASE::${idx}::ERR::" + type(__e).__name__ + ": " + str(__e))`,
      ].join("\n");
    })
    .join("\n\n");

  return `${studentCode}\n\n# --- autograder ---\n${blocks}\n`;
}

export async function gradeCodingQuestion(
  question: CodingQuestion,
  studentCode: string
): Promise<{ earned: number; correct: boolean; feedback: string; testResults: TestRunResult[] }> {
  const banned = [
    /import\s+os\b/,
    /import\s+sys\b/,
    /import\s+subprocess\b/,
    /import\s+socket\b/,
    /__import__\s*\(/,
    /open\s*\(/,
    /exec\s*\(/,
    /eval\s*\(/,
  ];
  for (const pattern of banned) {
    if (pattern.test(studentCode)) {
      return {
        earned: 0,
        correct: false,
        feedback: "Code uses a disallowed operation (imports/file/exec).",
        testResults: question.testCases.map((t) => ({
          name: t.name,
          passed: false,
          error: "Disallowed code",
          hidden: t.hidden,
        })),
      };
    }
  }

  if (studentCode.includes("max(") && question.functionName === "max_of_three") {
    return {
      earned: 0,
      correct: false,
      feedback: "Do not use the built-in max() for this problem.",
      testResults: question.testCases.map((t) => ({
        name: t.name,
        passed: false,
        error: "Built-in max() is not allowed",
        hidden: t.hidden,
      })),
    };
  }

  const harness = buildHarness(studentCode, question.testCases);
  const { stdout, stderr, code } = await runPython(harness);

  if (code === null && /Time limit/i.test(stderr)) {
    return {
      earned: 0,
      correct: false,
      feedback: "Your program exceeded the time limit.",
      testResults: question.testCases.map((t) => ({
        name: t.name,
        passed: false,
        error: "Timeout",
        hidden: t.hidden,
      })),
    };
  }

  const lines = stdout.split("\n").filter(Boolean);
  const byIndex = new Map<number, { ok: boolean; value: string }>();
  for (const line of lines) {
    const match = /^CASE::(\d+)::(OK|ERR)::(.*)$/.exec(line);
    if (!match) continue;
    byIndex.set(Number(match[1]), {
      ok: match[2] === "OK",
      value: match[3],
    });
  }

  const testResults: TestRunResult[] = question.testCases.map((t, idx) => {
    const got = byIndex.get(idx);
    if (!got) {
      return {
        name: t.name,
        passed: false,
        expected: t.hidden ? undefined : t.expected,
        error: normalizeOutput(stderr) || "No result produced",
        hidden: t.hidden,
      };
    }
    if (!got.ok) {
      return {
        name: t.name,
        passed: false,
        expected: t.hidden ? undefined : t.expected,
        error: got.value,
        hidden: t.hidden,
      };
    }
    const passed = normalizeOutput(got.value) === normalizeOutput(t.expected);
    return {
      name: t.name,
      passed,
      expected: t.hidden ? undefined : t.expected,
      actual: t.hidden && !passed ? undefined : got.value,
      hidden: t.hidden,
    };
  });

  const passedCount = testResults.filter((t) => t.passed).length;
  const total = testResults.length;
  const ratio = total === 0 ? 0 : passedCount / total;
  const earned = Math.round(question.points * ratio * 100) / 100;
  const correct = passedCount === total && total > 0;

  return {
    earned,
    correct,
    feedback: correct
      ? `All ${total} tests passed.`
      : `${passedCount}/${total} tests passed.${stderr && code !== 0 ? " Check runtime errors." : ""}`,
    testResults,
  };
}

export function normalizeCode(code: string) {
  return code
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+$/g, ""))
    .join("\n")
    .trim();
}

export function gradeDebugQuestion(
  correctCode: string,
  acceptContains: string[] | undefined,
  studentCode: string
): { correct: boolean; feedback: string } {
  const student = normalizeCode(studentCode);
  const expected = normalizeCode(correctCode);

  if (student === expected) {
    return { correct: true, feedback: "Excellent fix — matches the expected solution." };
  }

  if (acceptContains && acceptContains.some((snippet) => student.includes(snippet))) {
    if (student.length > 10) {
      return {
        correct: true,
        feedback: "Your fix addresses the core bug. Nice work.",
      };
    }
  }

  return {
    correct: false,
    feedback: "Not quite — review the hint and the intended behavior of the snippet.",
  };
}
