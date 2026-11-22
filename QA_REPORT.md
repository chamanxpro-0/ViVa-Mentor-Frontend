# VivaMentor cleanup and QA report

## Delivered architecture

- Preserved the Next.js App Router frontend, React screens, UI components, styling, and public assets.
- Replaced backend/database calls with a centralized browser-local demo data layer (`src/lib/client.ts`).
- Removed server API handlers, Prisma/database code, authentication/token code, AI/provider integrations, PDF server generation, and database-only utilities.
- Removed the local SQLite database, `.env`, Git history, tests, seed scripts, tool logs, temporary runtime scripts, sample server, proposal PDF, and build/runtime extras.
- Updated npm scripts for Windows/macOS/Linux and removed the configuration that suppressed TypeScript build errors.
- Added installation/run instructions and demo account credentials in `README.md`.

## Verification results

| Check | Result | Notes |
|---|---|---|
| Project source audit | PASS | Traced frontend imports before removing backend modules. |
| Local import resolution | PASS | No unresolved relative or `@/` source imports found. |
| TypeScript/TSX syntax parse | PASS | Parsed all 83 source `.ts` and `.tsx` files with zero syntax diagnostics. |
| Demo data layer strict typecheck | PASS | `src/lib/client.ts` passed standalone strict TypeScript checking. |
| Student demo flow | PASS | Login, subject loading, session creation, questions, answer evaluation, report, progress, and revision review exercised. |
| Teacher demo flow | PASS | Subject analytics, question-bank read/write, and calibration paths exercised. |
| Admin demo flow | PASS | User listing, usage-limit update, and statistics paths exercised. |
| Registration and sign-out | PASS | Registration, local session hydration, sign-out, and document metadata save/delete exercised. |
| Dependency installation | BLOCKED | Attempted `npm install`; the environment could not resolve/reach `registry.npmjs.org` (`EAI_AGAIN`). No `node_modules` or partial lockfile is included. |
| Full project typecheck | BLOCKED | Requires the project's npm dependencies, which could not be installed here. |
| ESLint | BLOCKED | Requires the project's npm dependencies. |
| Next.js production build | BLOCKED | Requires the project's npm dependencies; therefore a production build cannot be truthfully marked as passing. |
| Browser/device E2E | NOT RUN | No browser automation/runtime dependencies were available. |

## Important demo limitations

- Authentication is simulated and is not production-secure.
- Application records are stored in the browser's `localStorage`; they do not sync across devices or users.
- Interview scoring is a local heuristic, not a live AI model.
- Document upload stores filename/metadata only; file contents are not sent, extracted, or embedded.
- Report export opens the browser print dialog so the user can select “Save as PDF”.

## Run on a development machine

```bash
npm install
npm run dev
```

For checks and production mode:

```bash
npm run typecheck
npm run lint
npm run build
npm run start
```

Use Node.js 20.9+ (Node.js 22 LTS recommended). See `README.md` for demo credentials and additional details.
