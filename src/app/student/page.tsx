// /student — the classroom. Guarded by middleware (STUDENT role) and
// re-checked inside the shell itself.

import type { Metadata } from "next";
import Workspace from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Your classroom — VivaMentor",
};

export default function StudentPage() {
  return <Workspace role="STUDENT" />;
}
