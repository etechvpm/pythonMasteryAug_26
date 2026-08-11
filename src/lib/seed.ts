import type { Assessment } from "./types";

/** Change this in production with env INSTRUCTOR_PIN on Vercel. */
export const INSTRUCTOR_PIN = process.env.INSTRUCTOR_PIN || "teach2026";

export const seedAssessments: Assessment[] = [
  {
    id: "asm-vars-types",
    title: "Variables & Data Types",
    concept: "Week 1 · Foundations",
    description:
      "Check your grip on Python variables, types, casting, and basic expressions before moving on.",
    accessCode: "VARS01",
    durationMinutes: 20,
    status: "published",
    createdAt: "2026-08-01T10:00:00.000Z",
    questions: [
      {
        id: "q1",
        type: "mcq",
        prompt: "What is the type of the expression `3 / 2` in Python 3?",
        points: 2,
        options: [
          { id: "a", text: "int" },
          { id: "b", text: "float" },
          { id: "c", text: "str" },
          { id: "d", text: "decimal" },
        ],
        correctOptionId: "b",
        explanation:
          "In Python 3, `/` always performs true division and returns a float (1.5).",
      },
      {
        id: "q2",
        type: "mcq",
        prompt: "Which assignment correctly creates an integer variable named `count`?",
        points: 2,
        options: [
          { id: "a", text: "count := 10" },
          { id: "b", text: "int count = 10" },
          { id: "c", text: "count = 10" },
          { id: "d", text: "count <- 10" },
        ],
        correctOptionId: "c",
        explanation: "Python uses dynamic typing with simple `name = value` assignment.",
      },
      {
        id: "q3",
        type: "mcq",
        prompt: "What does `bool(\"\")` evaluate to?",
        points: 2,
        options: [
          { id: "a", text: "True" },
          { id: "b", text: "False" },
          { id: "c", text: "None" },
          { id: "d", text: "Error" },
        ],
        correctOptionId: "b",
        explanation: "Empty strings are falsy in Python, so `bool(\"\")` is False.",
      },
      {
        id: "q4",
        type: "debug",
        prompt:
          "This snippet should print the sum of two numbers entered by the user, but it crashes or prints incorrectly. Fix the bug.",
        points: 4,
        language: "python",
        buggyCode: `a = input("Enter a: ")
b = input("Enter b: ")
print("Sum =", a + b)`,
        correctCode: `a = int(input("Enter a: "))
b = int(input("Enter b: "))
print("Sum =", a + b)`,
        acceptContains: ["int(input"],
        hint: "Remember: `input()` returns a string.",
        explanation:
          "`input()` returns strings, so `+` concatenates. Cast both values to `int` (or `float`) before adding.",
      },
      {
        id: "q5",
        type: "coding",
        prompt:
          "Write a function `classify(n)` that returns `\"even\"` if n is even, otherwise `\"odd\"`.",
        points: 5,
        language: "python",
        functionName: "classify",
        starterCode: `def classify(n):
    # return "even" or "odd"
    pass
`,
        testCases: [
          { id: "t1", name: "Even number", call: "classify(4)", expected: "even" },
          { id: "t2", name: "Odd number", call: "classify(7)", expected: "odd" },
          { id: "t3", name: "Zero", call: "classify(0)", expected: "even", hidden: true },
          { id: "t4", name: "Negative odd", call: "classify(-3)", expected: "odd", hidden: true },
        ],
        explanation: "Use the modulo operator: `n % 2 == 0` means even.",
      },
    ],
  },
];
