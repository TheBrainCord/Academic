# IoT at CHRIST

An interactive teaching application for explaining IoT concepts, components, and connections on classroom touchscreens. The simulator supports the learning material by helping students explore how IoT modules work together.

## Lab inventory and project tracking

Signed-in teachers can use `/teacher/inventory` to manage quantity-based hardware stock, issue items to students, link checkouts to projects, record partial returns, and track overdue, lost, or damaged equipment. The same area shows the latest progress and allocated hardware for every student project.

Students use `/student/projects` to see the equipment currently assigned to them and post timestamped project updates with progress, status, accomplishments, blockers, and next steps. Apply migration `20260829123550_inventory_project_tracking.sql` before using these pages.

## Supported framework line

This application officially targets **Next.js 15 with React 19**. It does not target Next.js 14. The framework, React runtime, React type definitions, and Next.js ESLint configuration are intentionally kept on their matching major-version lines in `package.json` and `package-lock.json`.

Next.js 15 is the required target because App Router dynamic route parameters use the asynchronous `params` API. In particular, `app/(public)/learn/[moduleId]/page.tsx` receives `params` as a promise and awaits it before resolving the lecture module. Keep that contract when changing the route so pre-generated module URLs and not-found handling continue to behave as they do today.

## Local development

Use a Node.js version allowed by `package.json` (Node.js 20–22), then install and verify the application with:

```bash
npm install
npm run dev
```

Before submitting changes, run:

```bash
npm run type-check
npm run test:run
npm run build
```
