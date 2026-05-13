import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/morse/Header";
import { CourseHome } from "@/components/morse/learn/CourseHome";
import { LessonSession } from "@/components/morse/learn/LessonSession";
import { buildSession, buildSingleCharDrill, type Session } from "@/lib/morse/lessonEngine";
import {
  loadCourse,
  saveCourse,
  raiseCharacterSpeed,
  type CourseState,
} from "@/lib/morse/progress";
import { loadSettings } from "@/lib/morse/storage";
import { withViewTransition } from "@/lib/morse/viewTransition";
import { useApplyTheme } from "@/hooks/use-theme";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Learn — MorseType" },
      {
        name: "description",
        content:
          "Learn Morse code by ear with the Koch & Farnsworth method: one character at a time, full speed, with picture-and-rhythm mnemonics that fade as you improve.",
      },
      { property: "og:title", content: "Learn Morse code — MorseType" },
      {
        property: "og:description",
        content:
          "A real Morse course: hear it, don't count it. Daily 7-minute sessions, spaced repetition, head-copy training.",
      },
    ],
  }),
  component: LearnPage,
});

function LearnPage() {
  const [settings] = useState(() => loadSettings());
  const [course, setCourse] = useState<CourseState>(() => loadCourse());
  const [session, setSession] = useState<Session | null>(null);
  useApplyTheme(settings.theme);

  useEffect(() => {
    function onChange() {
      if (!session) setCourse(loadCourse());
    }
    window.addEventListener("morsetype:course-changed", onChange);
    return () => window.removeEventListener("morsetype:course-changed", onChange);
  }, [session]);

  function commit(c: CourseState) {
    setCourse(c);
    saveCourse(c);
  }
  function patch(p: Partial<CourseState>) {
    commit({ ...course, ...p });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-start justify-center py-10 px-6 sm:px-8">
        {session ? (
          <LessonSession
            session={session}
            course={course}
            settings={settings}
            speechHints={course.kidMode}
            onExit={(c) => {
              commit(c);
              withViewTransition(() => setSession(null));
            }}
            onComplete={(c, _summary, again) => {
              commit(c);
              withViewTransition(() => setSession(again ? buildSession(c) : null));
            }}
          />
        ) : (
          <CourseHome
            course={course}
            onStartSession={(s) => withViewTransition(() => setSession(s))}
            onDrillChar={(ch) =>
              withViewTransition(() => setSession(buildSingleCharDrill(course, ch)))
            }
            onPatch={patch}
            onRaiseSpeed={() => commit(raiseCharacterSpeed(course))}
          />
        )}
      </main>
      <footer className="px-8 py-4 text-center text-[11px] text-(--color-sub-faint) border-t border-(--color-hairline) lowercase tracking-wide">
        hear it · don't count it
      </footer>
    </div>
  );
}
