// /register — one form, two seats. Administration is provisioned
// internally, so the gate offers student and faculty only.

import { Suspense } from "react";
import type { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create account — VivaMentor",
  description:
    "Create a free VivaMentor account as a student or faculty member — AI viva practice, rubric scoring and spaced revision.",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[26rem]" aria-hidden="true" />}>
      <RegisterForm />
    </Suspense>
  );
}
