"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bug, Code2, ClipboardList, Smartphone } from "lucide-react";

export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col">
      <section className="relative mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-6xl flex-col justify-center px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-14">
        <motion.div
          initial={{ opacity: 0.01, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          <p className="mb-4 font-[family-name:var(--font-display)] text-4xl leading-none tracking-tight text-white sm:text-6xl md:text-7xl brand-glow">
            Python
            <br />
            <span className="text-teal-300">Mastery</span>
          </p>
          <h1 className="max-w-xl text-lg leading-relaxed text-slate-300 sm:text-xl">
            Fully online concept checks — you write the questions, students join from home with a
            link. Quizzes, bug hunts, and coding tests on any phone.
          </h1>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/join"
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-300"
            >
              Enter access code
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/instructor"
              className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium text-slate-200 ring-1 ring-white/15 transition hover:bg-white/5"
            >
              Instructor desk
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="pointer-events-none absolute right-4 top-24 hidden w-[280px] rotate-3 md:block lg:right-10 lg:w-[340px]"
          aria-hidden
        >
          <div className="rounded-[28px] border border-teal-300/20 bg-[#0B1620]/80 p-4 shadow-2xl shadow-teal-950/40 backdrop-blur">
            <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
              <span>coding · q3</span>
              <span className="text-teal-300">02:48</span>
            </div>
            <pre className="overflow-hidden rounded-2xl bg-black/40 p-3 font-mono text-[11px] leading-5 text-teal-100/90">{`def count_vowels(text):
    vowels = "aeiou"
    return sum(
      1 for ch in text.lower()
      if ch in vowels
    )`}</pre>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <motion.div
                className="h-full bg-gradient-to-r from-teal-500 to-cyan-300"
                initial={{ width: "35%" }}
                animate={{ width: "72%" }}
                transition={{ delay: 0.8, duration: 1.4, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>
      </section>

      <section className="border-t border-white/10 bg-black/20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3">
          {[
            {
              icon: ClipboardList,
              title: "Concept quizzes",
              text: "Tight multiple-choice checks after each topic — auto-scored with explanations.",
            },
            {
              icon: Bug,
              title: "Debug challenges",
              text: "Students repair broken Python snippets the way they would in lab hours.",
            },
            {
              icon: Code2,
              title: "Coding tests",
              text: "Write functions, run visible tests on device, hidden cases grade on submit.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <item.icon className="mb-3 h-5 w-5 text-teal-300" />
              <h2 className="font-[family-name:var(--font-display)] text-xl text-white">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-white sm:text-3xl">
              Built for classes under 100
            </h2>
            <p className="mt-2 max-w-xl text-slate-400">
              Join with a short access code, resume mid-test, and review results instantly. Instructors
              open a PIN-protected desk to watch submissions come in.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300 ring-1 ring-white/10">
            <Smartphone className="h-4 w-4 text-teal-300" />
            Responsive from pocket to projector
          </div>
        </div>
      </section>
    </main>
  );
}
