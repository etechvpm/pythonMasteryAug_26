# Python Mastery — Concept Checks

Mobile-friendly assessment app for college Python courses (designed for cohorts under 100). Students take **quizzes**, **debugging challenges**, and **coding tests** after each concept. Instructors monitor submissions from a PIN-protected desk.

## Features

- **Student join** with name, student ID, and short access code
- **Timed assessments** with auto-save and auto-submit when time runs out
- **MCQ quizzes** with explanations on results
- **Debug challenges** — repair buggy Python snippets
- **Coding tests** — write functions, run visible tests in-browser, hidden tests on final grade
- **Instructor desk** — open/close assessments, live submission list, class averages
- **Responsive UI** tuned for phones and laptops

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo access codes

| Concept | Code |
| --- | --- |
| Variables & Data Types | `VARS01` |
| Control Flow & Loops | `LOOP02` |
| Functions & Problem Solving | `FUNC03` |

### Instructor PIN

```
teach2026
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Run production server |
| `npm run lint` | ESLint |

## How it works

- Assessment content and attempts are stored as JSON under `data/` (created automatically on first request).
- Coding answers are graded by running student Python in a short-lived subprocess with a time limit and basic safety checks (blocked imports / `open` / `exec`).
- Suitable for classroom concept checks; not a hardened contest judge for untrusted internet-scale traffic.

## Suggested classroom flow

1. Teach a concept in lecture or lab.
2. Share the access code (and optional time window).
3. Students join from phones or laptops and complete the check.
4. Review scores and common misses on the instructor desk.
