"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

export function SessionProvider({ children }: { children: ReactNode }) {
  const [student, setStudentState] = useState<StudentProfile | null>(null);
  const [instructorPin, setPinState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setStudentState(JSON.parse(raw) as StudentProfile);
      const pin = localStorage.getItem(PIN_KEY);
      if (pin) setPinState(pin);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const setStudent = (s: StudentProfile | null) => {
    setStudentState(s);
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  };

  const setInstructorPin = (pin: string | null) => {
    setPinState(pin);
    if (pin) localStorage.setItem(PIN_KEY, pin);
    else localStorage.removeItem(PIN_KEY);
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
