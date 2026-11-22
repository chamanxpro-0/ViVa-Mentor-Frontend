// (auth) group layout — /login and /register share one building:
// the brand rail, the theme toggle and the light of the landing page.

import AuthFrame from "@/components/auth/AuthFrame";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthFrame>{children}</AuthFrame>;
}
