// The public product page. Auth lives on real routes now —
// /login (role entries), /register, and the workspaces /student, /teacher,
// /admin sit behind middleware — so this route is purely the front door.

import Landing from "@/components/views/Landing";

export default function Home() {
  return <Landing />;
}
