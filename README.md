# IoT at CHRIST

Open-source academic platform for IoT education.
Built for Christ University MSc CSA programme.

## What it does

- Story-driven IoT missions (Defence, Healthcare, Smart City, Agriculture)
- AI-assisted research lab with IEEE paper export
- Google Classroom integration for roster sync and grade import
- Automated session reminder emails 24h before each class
- Extensible subject system — add any course via a single YAML file

## Tech stack

Next.js 14 · TypeScript · Tailwind · Supabase · Resend · Google Classroom API

## Setup

[setup instructions...]

## Adding a new subject

Drop a `.yaml` file in `/content/subjects/` and run `npm run seed`.
No code changes required.

## Curriculum authority

The official, institution-issued syllabus is the authoritative source for course
scope, learning outcomes, assessment requirements, and prescribed topics. Course
Studio content must be reconciled with that syllabus; if the application and the
official syllabus differ, the official syllabus takes precedence.

Interactive activities, simulations, current technologies, case studies, and
other modern additions are **living-curriculum supplements**. They help teachers
explain IoT concepts and help students explore how modules work together, but do
not replace or silently amend the official syllabus. Source availability and
verification are tracked in
[`iot-at-christ/content/course/source-materials/`](iot-at-christ/content/course/source-materials/README.md).

## License

MIT — free to use, fork, and deploy at any university.
