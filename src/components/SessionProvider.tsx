"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { StudentProfile } from "@/lib/types";

const KEY = "pylab-student";
const PIN_KEY = "pylab-instructor-pin";

type SessionContextValue = {
  student: StudentProfile | null;
  setStudent: (s: StudentProfile | null) => void;
  instructorPin: string | null;
  setInstructorPin: (pin: string | null) => void;
  ready: boolean;
};

const SessionContext = createContext<SessionContextValue | null>(null);

let cachedStudentRaw: string | null | undefined;
let cachedStudent: StudentProfile | null = null;
let cachedPin: string | null | undefined;

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener("pylab-session", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("pylab-session", handler);
  };
}

function readStudent(): StudentProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cachedStudentRaw) return cachedStudent;
    cachedStudentRaw = raw;
    cachedStudent = raw ? (JSON.parse(raw) as StudentProfile) : null;
    return cachedStudent;
  } catch {
    cachedStudentRaw = null;
    cachedStudent = null;
    return null;
  }
}

function readPin(): string | null {
  if (typeof window === "undefined") return null;
  const pin = localStorage.getItem(PIN_KEY);
  if (pin === cachedPin) return cachedPin ?? null;
  cachedPin = pin;
  return pin;
}

function emit() {
  window.dispatchEvent(new Event("pylab-session"));
}

const emptySubscribe = () => () => undefined;

function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const student = useSyncExternalStore(subscribe, readStudent, () => null);
  const instructorPin = useSyncExternalStore(subscribe, readPin, () => null);
  const ready = useIsClient();

  const setStudent = (s: StudentProfile | null) => {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
    cachedStudentRaw = undefined;
    cachedStudent = null;
    emit();
  };

  const setInstructorPin = (pin: string | null) => {
    if (pin) localStorage.setItem(PIN_KEY, pin);
    else localStorage.removeItem(PIN_KEY);
    cachedPin = undefined;
    emit();
  };

  return (
    <SessionContext.Provider
      value={{ student, setStudent, instructorPin, setInstructorPin, ready }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
