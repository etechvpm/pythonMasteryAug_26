export type QuestionType = "mcq" | "debug" | "coding";

export type AssessmentStatus = "draft" | "published" | "closed";

export interface McqOption {
  id: string;
  text: string;
}

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  points: number;
  explanation?: string;
}

export interface McqQuestion extends BaseQuestion {
  type: "mcq";
  options: McqOption[];
  correctOptionId: string;
}

export interface DebugQuestion extends BaseQuestion {
  type: "debug";
  language: "python";
  buggyCode: string;
  /** Normalized correct fixed code (whitespace-insensitive comparison fallback). */
  correctCode: string;
  /** Optional multiple acceptable fix snippets (substring checks). */
  acceptContains?: string[];
  hint?: string;
}

export interface CodingTestCase {
  id: string;
  name: string;
  /** Python expression that calls the student function, e.g. `add(2, 3)` */
  call: string;
  expected: string;
  hidden?: boolean;
}

export interface CodingQuestion extends BaseQuestion {
  type: "coding";
  language: "python";
  starterCode: string;
  functionName: string;
  testCases: CodingTestCase[];
  timeLimitSeconds?: number;
}

export type Question = McqQuestion | DebugQuestion | CodingQuestion;

export interface Assessment {
  id: string;
  title: string;
  concept: string;
  description: string;
  accessCode: string;
  durationMinutes: number;
  status: AssessmentStatus;
  questions: Question[];
  createdAt: string;
}

export interface StudentProfile {
  name: string;
  studentId: string;
}

export interface AnswerPayload {
  questionId: string;
  /** mcq: optionId; debug/coding: source text */
  value: string;
}

export interface QuestionResult {
  questionId: string;
  type: QuestionType;
  earned: number;
  max: number;
  correct: boolean;
  feedback: string;
  studentAnswer: string;
  details?: {
    passedTests?: number;
    totalTests?: number;
    testResults?: Array<{
      name: string;
      passed: boolean;
      expected?: string;
      actual?: string;
      error?: string;
      hidden?: boolean;
    }>;
  };
}

export interface Attempt {
  id: string;
  assessmentId: string;
  student: StudentProfile;
  startedAt: string;
  submittedAt?: string;
  answers: AnswerPayload[];
  results?: QuestionResult[];
  score?: number;
  maxScore?: number;
  percent?: number;
  status: "in_progress" | "submitted";
}

export interface AssessmentSummary {
  id: string;
  title: string;
  concept: string;
  description: string;
  accessCode: string;
  durationMinutes: number;
  status: AssessmentStatus;
  questionCount: number;
  totalPoints: number;
  types: QuestionType[];
}

export interface InstructorStats {
  totalAttempts: number;
  submitted: number;
  averagePercent: number;
  passRate: number;
  recent: Array<{
    attemptId: string;
    studentName: string;
    studentId: string;
    percent: number;
    submittedAt: string;
  }>;
}
