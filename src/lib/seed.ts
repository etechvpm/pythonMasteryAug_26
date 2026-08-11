import type { Assessment } from "./types";

export const INSTRUCTOR_PIN = "teach2026";

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
  {
    id: "asm-control-flow",
    title: "Control Flow & Loops",
    concept: "Week 2 · Logic",
    description:
      "Conditionals, loops, and common off-by-one mistakes — mix of quiz, debug, and a short coding task.",
    accessCode: "LOOP02",
    durationMinutes: 25,
    status: "published",
    createdAt: "2026-08-04T10:00:00.000Z",
    questions: [
      {
        id: "c1",
        type: "mcq",
        prompt: "How many times does this loop print?\n\n```python\nfor i in range(1, 5):\n    print(i)\n```",
        points: 2,
        options: [
          { id: "a", text: "5" },
          { id: "b", text: "4" },
          { id: "c", text: "1" },
          { id: "d", text: "0" },
        ],
        correctOptionId: "b",
        explanation: "`range(1, 5)` yields 1, 2, 3, 4 — the stop value is exclusive.",
      },
      {
        id: "c2",
        type: "mcq",
        prompt: "Which keyword skips the rest of the current loop iteration?",
        points: 2,
        options: [
          { id: "a", text: "break" },
          { id: "b", text: "pass" },
          { id: "c", text: "continue" },
          { id: "d", text: "return" },
        ],
        correctOptionId: "c",
        explanation: "`continue` jumps to the next iteration; `break` exits the loop entirely.",
      },
      {
        id: "c3",
        type: "debug",
        prompt:
          "The function should return the sum of all positive numbers in a list. Fix the logic bug.",
        points: 4,
        language: "python",
        buggyCode: `def sum_positive(nums):
    total = 0
    for n in nums:
        if n > 0:
            total = n
    return total`,
        correctCode: `def sum_positive(nums):
    total = 0
    for n in nums:
        if n > 0:
            total += n
    return total`,
        acceptContains: ["total +=", "total = total +"],
        hint: "Are you accumulating, or replacing?",
        explanation: "Use `total += n` to accumulate; `total = n` keeps only the last positive value.",
      },
      {
        id: "c4",
        type: "coding",
        prompt:
          "Write `count_vowels(text)` that returns how many vowels (a, e, i, o, u) appear in `text`, case-insensitive.",
        points: 6,
        language: "python",
        functionName: "count_vowels",
        starterCode: `def count_vowels(text):
    # count a, e, i, o, u (any case)
    pass
`,
        testCases: [
          { id: "t1", name: "Simple", call: 'count_vowels("hello")', expected: "2" },
          { id: "t2", name: "Mixed case", call: 'count_vowels("AEIOU")', expected: "5" },
          { id: "t3", name: "None", call: 'count_vowels("why")', expected: "0", hidden: true },
          {
            id: "t4",
            name: "Empty",
            call: 'count_vowels("")',
            expected: "0",
            hidden: true,
          },
        ],
        explanation: "Normalize with `.lower()` and check membership in `\"aeiou\"`.",
      },
    ],
  },
  {
    id: "asm-functions",
    title: "Functions & Problem Solving",
    concept: "Week 3 · Functions",
    description:
      "Design small pure functions, fix a recursive bug, and ship a coding challenge under a soft time pressure.",
    accessCode: "FUNC03",
    durationMinutes: 30,
    status: "published",
    createdAt: "2026-08-08T10:00:00.000Z",
    questions: [
      {
        id: "f1",
        type: "mcq",
        prompt: "What is printed?\n\n```python\ndef demo(x, y=2):\n    return x * y\nprint(demo(3))\n```",
        points: 2,
        options: [
          { id: "a", text: "5" },
          { id: "b", text: "6" },
          { id: "c", text: "Error" },
          { id: "d", text: "None" },
        ],
        correctOptionId: "b",
        explanation: "Default argument `y=2` is used, so `3 * 2 = 6`.",
      },
      {
        id: "f2",
        type: "debug",
        prompt:
          "This recursive factorial function fails for normal inputs. Repair it so `factorial(5)` returns 120.",
        points: 5,
        language: "python",
        buggyCode: `def factorial(n):
    if n == 0:
        return 0
    return n * factorial(n - 1)`,
        correctCode: `def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n - 1)`,
        acceptContains: ["return 1"],
        hint: "Check the base case carefully.",
        explanation: "The base case must return 1, not 0 — otherwise every product collapses to 0.",
      },
      {
        id: "f3",
        type: "coding",
        prompt:
          "Implement `max_of_three(a, b, c)` that returns the largest of the three numbers without using the built-in `max()`.",
        points: 6,
        language: "python",
        functionName: "max_of_three",
        starterCode: `def max_of_three(a, b, c):
    # return the largest value (do not use max())
    pass
`,
        testCases: [
          { id: "t1", name: "First largest", call: "max_of_three(9, 2, 5)", expected: "9" },
          { id: "t2", name: "Last largest", call: "max_of_three(1, 4, 8)", expected: "8" },
          { id: "t3", name: "Middle largest", call: "max_of_three(3, 10, 7)", expected: "10", hidden: true },
          { id: "t4", name: "Ties", call: "max_of_three(5, 5, 2)", expected: "5", hidden: true },
        ],
        explanation: "Compare pairwise with if/elif, or nest conditionals.",
      },
      {
        id: "f4",
        type: "coding",
        prompt:
          "Write `is_palindrome(s)` that returns `True` if `s` reads the same forwards and backwards (case-sensitive), else `False`.",
        points: 5,
        language: "python",
        functionName: "is_palindrome",
        starterCode: `def is_palindrome(s):
    # return True or False
    pass
`,
        testCases: [
          { id: "t1", name: "Simple", call: 'is_palindrome("level")', expected: "True" },
          { id: "t2", name: "Not", call: 'is_palindrome("python")', expected: "False" },
          { id: "t3", name: "Single", call: 'is_palindrome("a")', expected: "True", hidden: true },
          {
            id: "t4",
            name: "Case sensitive",
            call: 'is_palindrome("Aa")',
            expected: "False",
            hidden: true,
          },
        ],
        explanation: "Compare `s` with `s[::-1]`.",
      },
    ],
  },
];
