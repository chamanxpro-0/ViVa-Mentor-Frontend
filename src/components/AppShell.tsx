// Workspace shell — the chrome each role lands in after sign-in.
// One shell, three temperaments, reached by three routes:
//   /student → classroom, /teacher → faculty authority, /admin → control room.
// The shell itself is a second line of defence behind the middleware: it
// re-checks the session and the role before painting anything.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp, type View } from "@/store/app";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { roleHome, type Role } from "@/lib/roles";
import StudentDashboard from "@/components/views/StudentDashboard";
import SessionSetup from "@/components/views/SessionSetup";
import InterviewRoom from "@/components/views/InterviewRoom";
import SessionReport from "@/components/views/SessionReport";
import ProgressView from "@/components/views/ProgressView";
import RevisionView from "@/components/views/RevisionView";
import DocumentsView from "@/components/views/DocumentsView";
import TeacherPanel from "@/components/views/TeacherPanel";
import AdminPanel from "@/components/views/AdminPanel";
import { LogOut } from "lucide-react";

type NavItem = { view: View; label: string; hint: string };

const STUDENT_NAV: NavItem[] = [
  { view: "dashboard", label: "Dashboard", hint: "your classroom" },
  { view: "setup", label: "New Session", hint: "configure a viva" },
  { view: "progress", label: "Progress", hint: "trends & badges" },
  { view: "revision", label: "Revision", hint: "cards due today" },
  { view: "documents", label: "My Documents", hint: "resume & syllabus" },
];

const TEACHER_NAV: NavItem[] = [
  { view: "teacher", label: "Faculty Panel", hint: "class & calibration" },
  { view: "progress", label: "My Activity", hint: "your marks & banks" },
];

const ADMIN_NAV: NavItem[] = [
  { view: "admin", label: "System Control", hint: "platform health" },
];

const ROLE_MASTHEAD: Record<Role, { title: string; sub: string }> = {
  STUDENT: { title: "Student", sub: "the classroom" },
  TEACHER: { title: "Faculty", sub: "authority" },
  ADMIN: { title: "Administration", sub: "control room" },
};

function NavList({
  nav,
  view,
  setView,
  dueCards,
  orientation,
}: {
  nav: NavItem[];
  view: View;
  setView: (view: View) => void;
  dueCards: number;
  orientation: "rail" | "bar";
}) {
  return (
    <nav
      aria-label="Primary"
      className={cn(
        orientation === "rail" ? "flex flex-col gap-1" : "flex items-center gap-1 overflow-x-auto vm-scroll"
      )}
    >
      {nav.map((item, i) => {
        const active = view === item.view;
        return (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            className={cn(
              "group relative text-left transition-colors duration-300",
              orientation === "rail"
                ? cn(
                    "flex items-baseline gap-3 px-4 py-3 border-l-2",
                    active
                      ? "border-primary bg-primary/[0.07] text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )
                : cn(
                    "shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm",
                    active
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )
            )}
          >
            <span
              className={cn(
                "font-mono text-[10px] tabular-nums",
                active ? "text-primary" : "text-muted-foreground/60"
              )}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-sm font-medium">{item.label}</span>
            {item.view === "revision" && dueCards > 0 && (
              <span className="ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 font-mono text-[10px] font-bold text-primary-foreground">
                {dueCards}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

export default function Workspace({ role }: { role: Role }) {
  const { me, booted, refreshMe, view, setView, logout } = useApp();
  const { toast } = useToast();
  const router = useRouter();

  // boot the session when arriving directly at the workspace URL
  useEffect(() => {
    if (!me && !booted) void refreshMe();
  }, [me, booted, refreshMe]);

  // guard — middleware is the gate, this is the second bolt on the door
  useEffect(() => {
    if (!booted) return;
    if (!me) {
      router.replace(`/login?next=/${role.toLowerCase()}`);
      return;
    }
    if (me.user.role !== role) router.replace(roleHome(me.user.role));
  }, [booted, me, role, router]);

  if (!me || me.user.role !== role) {
    // one quiet frame while the session boots / the redirect resolves
    return <div className="min-h-screen bg-background" />;
  }

  const user = me.user;
  const dueCards = me.dueCards;
  const nav = role === "TEACHER" ? TEACHER_NAV : role === "ADMIN" ? ADMIN_NAV : STUDENT_NAV;
  const masthead = ROLE_MASTHEAD[role];

  async function signOut() {
    await logout();
    router.replace("/login");
  }

  function renderView() {
    switch (view) {
      case "setup":
        return <SessionSetup />;
      case "interview":
        return <InterviewRoom />;
      case "report":
        return <SessionReport />;
      case "progress":
        return <ProgressView />;
      case "revision":
        return <RevisionView />;
      case "documents":
        return <DocumentsView />;
      case "teacher":
        return <TeacherPanel />;
      case "admin":
        return <AdminPanel />;
      default:
        return role === "TEACHER" ? <TeacherPanel /> : role === "ADMIN" ? <AdminPanel /> : <StudentDashboard />;
    }
  }

  const NavRail = (
    <NavList nav={nav} view={view} setView={setView} dueCards={dueCards} orientation="rail" />
  );
  const NavBar = (
    <NavList nav={nav} view={view} setView={setView} dueCards={dueCards} orientation="bar" />
  );

  return (
    <div
      data-role={role.toLowerCase()}
      className="min-h-screen bg-background text-foreground"
    >
      <div className="vm-grain" aria-hidden="true" />
      <div className="relative z-10 border-b border-primary/15 bg-primary/[0.04] px-4 py-2 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
        Demo mode · local browser data · simulated AI scoring
      </div>

      {/* ------------------------------------------------ rail (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="px-6 pb-6 pt-7">
          <button onClick={() => setView("dashboard")} className="block text-left">
            <span className="font-display text-2xl italic leading-none tracking-tight">
              Viva<span className="text-primary">Mentor</span>
            </span>
            <span className="mt-1.5 block font-mono text-[9px] uppercase tracking-[0.26em] text-muted-foreground">
              AI interview &amp; viva coach
            </span>
          </button>
        </div>

        <div className="mx-6 mb-5 flex items-center justify-between border-y border-sidebar-border py-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {masthead.title}
          </span>
          <span className="font-display text-sm italic text-primary">{masthead.sub}</span>
        </div>

        <div className="flex-1 overflow-y-auto vm-scroll">
          {NavRail}
        </div>

        {role === "STUDENT" && (
          <div className="mx-6 mb-4 grid grid-cols-2 gap-2 border-t border-sidebar-border pt-4">
            <div>
              <p className="font-display text-2xl leading-none">{user.streak}</p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                day streak
              </p>
            </div>
            <div>
              <p className="font-display text-2xl leading-none">{user.xp}</p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                xp earned
              </p>
            </div>
          </div>
        )}

        <div className="border-t border-sidebar-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-primary/40 bg-primary/10 font-display text-base">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-medium">{user.name}</p>
              <p className="truncate font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                {user.role.toLowerCase()}
              </p>
              {user.department && (
                <p className="truncate font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
                  {user.department}
                </p>
              )}
            </div>
            <button
              aria-label="Log out"
              title="Log out"
              onClick={signOut}
              className="text-muted-foreground transition-colors hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------ top bar (mobile) */}
      <header className="sticky top-0 z-40 border-b border-sidebar-border bg-background/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <button onClick={() => setView("dashboard")} className="font-display text-lg italic tracking-tight">
            Viva<span className="text-primary">Mentor</span>
          </button>
          <div className="flex items-center gap-3">
            {role === "STUDENT" && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {user.streak}d · {user.xp}xp
              </span>
            )}
            <button
              aria-label="Log out"
              onClick={signOut}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="border-t border-sidebar-border/60">
          {NavBar}
        </div>
      </header>

      {/* ------------------------------------------------ content */}
      <main className="lg:pl-60">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-10">{renderView()}</div>
        <footer className="border-t border-border">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-[11px] text-muted-foreground md:px-8">
            <span className="font-display italic">VivaMentor</span>
            <span>Demo feedback is illustrative, not an official grade.</span>
            <span>Demo data remains in this browser.</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
