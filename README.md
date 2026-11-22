# VivaMentor — Frontend Demo

VivaMentor is a Next.js frontend for viva and interview practice. This delivery is a **frontend-only demo**: application data is stored in the current browser using `localStorage`. It does not require a database, API server, AI provider, or environment variables.

## Requirements

- Node.js 20.9 or newer (Node.js 22 LTS recommended)
- npm 10 or newer

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production build

```bash
npm run typecheck
npm run lint
npm run build
npm run start
```

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Student | `student@vivamentor.edu` | `Study@123` |
| Faculty | `teacher@vivamentor.edu` | `Teach@1234` |
| Administrator | `admin@vivamentor.edu` | `Admin@123` |

You can also create a student or faculty account from the registration page.

## Demo behavior and limitations

- Sign-in and role selection are demo-only and are **not secure authentication**.
- Sessions, scores, revision cards, uploaded-document metadata, and admin/teacher demo data are stored in the browser that is running the site. They are not synchronized between users or devices.
- Interview scoring is a local heuristic demonstration. It does not call a real AI model.
- Document upload stores the filename and demo metadata only; it does not upload, parse, or embed the file.
- The report export opens the browser print dialog; choose **Save as PDF** to export.
- Use the browser's site data controls to reset the demo state.

This project is suitable for local demonstration and frontend review, not production deployment with real user data.
