// /login — and its role entries: /login/student, /login/teacher, /login/admin.
// One gate, three doors. The role in the URL is an audience hint (copy, demo
// credentials, shareable entry point) — the account's real role still decides
// where the visitor lands.

import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import { normalizeLoginRole } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Sign in — VivaMentor",
  description:
    "Sign in to your VivaMentor workspace — student classroom, faculty panel or administration control room.",
};

export default async function LoginPage({
  params,
}: {
  params: Promise<{ role?: string[] }>;
}) {
  const { role } = await params;
  const segments = role ?? [];
  if (segments.length > 1) notFound();

  if (segments.length === 1 && !normalizeLoginRole(segments[0])) notFound();
  const initialRole = normalizeLoginRole(segments[0]) ?? "student";

  return (
    <Suspense fallback={<div className="min-h-[26rem]" aria-hidden="true" />}>
      <LoginForm initialRole={initialRole} />
    </Suspense>
  );
}
