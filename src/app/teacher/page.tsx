// /teacher — the faculty panel. Guarded by middleware (TEACHER role) and
// re-checked inside the shell itself.

import type { Metadata } from "next";
import Workspace from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Faculty panel — VivaMentor",
};

export default function TeacherPage() {
  return <Workspace role="TEACHER" />;
}
