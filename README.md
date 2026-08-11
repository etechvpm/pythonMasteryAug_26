# Python Mastery — Online Concept Checks

Free, fully online quiz / debug / coding tests for college students in different locations. **You create the questions.** Students join from home with a link or access code.

## What you can do

- Create assessments with **quiz**, **debug**, and **coding** questions
- Share a link like `https://your-app.vercel.app/join?code=LISTS04`
- Students take tests on phone or laptop from anywhere
- See scores and submissions on the instructor desk

---

## Put it online for free (recommended)

You need two free accounts: **Vercel** (hosts the website) and **Neon** (saves your questions & scores). Both have free plans.

### Step 1 — Push this project to GitHub
If it is already on GitHub, skip this. Otherwise create a repo and push the code.

### Step 2 — Create a free database (Neon)
1. Go to [https://neon.tech](https://neon.tech) and sign up (free).
2. Create a project (any name, e.g. `python-mastery`).
3. Copy the **connection string** (`DATABASE_URL`). It looks like:
   `postgresql://user:pass@ep-xxxx.neon.tech/neondb?sslmode=require`

### Step 3 — Deploy on Vercel (free)
1. Go to [https://vercel.com](https://vercel.com) and sign up with GitHub.
2. Click **Add New… → Project** and import `pythonMasteryAug_26`.
3. Before deploying, open **Environment Variables** and add:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | *(paste Neon connection string)* |
| `INSTRUCTOR_PIN` | *(your private PIN, e.g. `MyClass2026`)* |

4. Click **Deploy**.
5. When it finishes, Vercel gives you a public URL, for example:
   `https://python-mastery-xxxx.vercel.app`

That URL is what students use from anywhere.

### Step 4 — Create your questions
1. Open `https://YOUR-APP.vercel.app/instructor`
2. Enter your `INSTRUCTOR_PIN`
3. Click **New assessment**
4. Add quiz / debug / coding questions → **Save**
5. Click **Copy student link** and send it in WhatsApp / email / LMS

Students only need the link (or the access code). No classroom Wi‑Fi.

---

## Run on your laptop (optional / testing)

```bash
git clone https://github.com/etechvpm/pythonMasteryAug_26.git
cd pythonMasteryAug_26
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- Without `DATABASE_URL`, data is stored in a local `data/` folder (fine for testing).
- Coding tests use your local Python if available; online deploy uses a free public runner (Piston).

Default local instructor PIN: `teach2026` (override with `INSTRUCTOR_PIN`).

---

## Student flow
1. Open the share link from the instructor
2. Enter name + student ID
3. Complete the timed check (quiz / debug / coding)
4. See score and explanations

## Instructor flow
1. Unlock desk with PIN
2. **New assessment** → write your own questions
3. Publish → copy link → share with class
4. Watch submissions come in live

---

## Notes
- Free Vercel + free Neon is enough for a class under ~100 students.
- Change `INSTRUCTOR_PIN` in Vercel env vars so students cannot open the desk.
- Coding auto-grading online uses the free [Wandbox](https://wandbox.org/) Python runner (no paid judge needed).
