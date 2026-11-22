// /admin — the control room. Guarded by middleware (ADMIN role) and
// re-checked inside the shell itself.

import type { Metadata } from "next";
import Workspace from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Control room — VivaMentor",
};

export default function AdminPage() {
  return <Workspace role="ADMIN" />;
}
