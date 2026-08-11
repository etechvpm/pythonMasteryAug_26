import type {
  AnswerPayload,
  Assessment,
  Attempt,
  Question,
  QuestionResult,
} from "./types";
import { gradeCodingQuestion, gradeDebugQuestion } from "./pythonRunner";

export async function gradeAttempt(
  assessment: Assessment,
  answers: AnswerPayload[]
): Promise<{ results: QuestionResult[]; score: number; maxScore: number; percent: number }> {
  const byId = new Map(answers.map((a) => [a.questionId, a.value]));
  const results: QuestionResult[] = [];

  for (const question of assessment.questions) {
    const value = byId.get(question.id) ?? "";
    results.push(await gradeQuestion(question, value));
  }

  const score = results.reduce((sum, r) => sum + r.earned, 0);
  const maxScore = results.reduce((sum, r) => sum + r.max, 0);
  const percent = maxScore === 0 ? 0 : Math.round((score / maxScore) * 1000) / 10;

  return { results, score, maxScore, percent };
}

async function gradeQuestion(question: Question, value: string): Promise<QuestionResult> {
  if (question.type === "mcq") {
    const correct = value === question.correctOptionId;
    const selected = question.options.find((o) => o.id === value)?.text ?? "(blank)";
    const right = question.options.find((o) => o.id === question.correctOptionId)?.text ?? "";
    return {
      questionId: question.id,
      type: question.type,
      earned: correct ? question.points : 0,
      max: question.points,
      correct,
      studentAnswer: selected,
      feedback: correct
        ? question.explanation ?? "Correct."
        : `Correct answer: ${right}. ${question.explanation ?? ""}`.trim(),
    };
  }

  if (question.type === "debug") {
    const { correct, feedback } = gradeDebugQuestion(
      question.correctCode,
      question.acceptContains,
      value
    );
    return {
      questionId: question.id,
      type: question.type,
      earned: correct ? question.points : 0,
      max: question.points,
      correct,
      studentAnswer: value,
      feedback: correct
        ? `${feedback} ${question.explanation ?? ""}`.trim()
        : `${feedback} ${question.explanation ?? ""}`.trim(),
    };
  }

  const coding = await gradeCodingQuestion(question, value || question.starterCode);
  return {
    questionId: question.id,
    type: question.type,
    earned: coding.earned,
    max: question.points,
    correct: coding.correct,
    studentAnswer: value,
    feedback: `${coding.feedback}${question.explanation ? ` ${question.explanation}` : ""}`.trim(),
    details: {
      passedTests: coding.testResults.filter((t) => t.passed).length,
      totalTests: coding.testResults.length,
      testResults: coding.testResults,
    },
  };
}

export function buildAttemptStats(attempts: Attempt[]) {
  const submitted = attempts.filter((a) => a.status === "submitted" && typeof a.percent === "number");
  const averagePercent =
    submitted.length === 0
      ? 0
      : Math.round(
          (submitted.reduce((sum, a) => sum + (a.percent ?? 0), 0) / submitted.length) * 10
        ) / 10;
  const passRate =
    submitted.length === 0
      ? 0
      : Math.round((submitted.filter((a) => (a.percent ?? 0) >= 60).length / submitted.length) * 1000) /
        10;

  return {
    totalAttempts: attempts.length,
    submitted: submitted.length,
    averagePercent,
    passRate,
    recent: submitted
      .slice()
      .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""))
      .slice(0, 20)
      .map((a) => ({
        attemptId: a.id,
        studentName: a.student.name,
        studentId: a.student.studentId,
        percent: a.percent ?? 0,
        submittedAt: a.submittedAt ?? "",
      })),
  };
}
