# Architecture decisions

## Why Resend over SendGrid / Nodemailer

Resend has a React Email template system built in.
Templates are .tsx files — typed, composable, version-controlled.
SendGrid templates are edited in a web UI — not diffable, not in git.
DECISION: Resend is final. Do not suggest SendGrid.

## Why Supabase Edge Functions for reminders, not Vercel Cron

Vercel Cron on hobby plan is limited to 1/day.
Supabase pg_cron runs hourly — needed for 24h-before-session accuracy.
Edge Functions have direct DB access (no extra auth hop).
DECISION: All scheduled jobs live in Supabase, not Vercel.

## Why Puppeteer for IEEE PDF, not @react-pdf/renderer

react-pdf has limited CSS support — IEEE two-column layout requires
precise CSS column-count and pt units that react-pdf doesn't handle.
Puppeteer renders real HTML/CSS — IEEE format is just a print stylesheet.
DECISION: PDF generation uses Puppeteer in an Edge Function.

## Why YAML for subject content, not a CMS

Teachers are developers or near-developers.
YAML is git-diffable, reviewable, branch-able.
A CMS adds a login, a deployment, an API dependency.
DECISION: All subject content lives in /content/subjects/\*.yaml.
Any new subject = one new .yaml file + run seed script. Zero code changes.

## Why Google Classroom read-only

Writing to Classroom requires additional OAuth scope review by Google.
The risk (accidental grade corruption) outweighs the benefit.
Our platform manages its own submissions and grades independently.
DECISION: Classroom integration syncs roster and grades inbound only.

## Research Lab approval flow

Students cannot make research projects visible to classmates.
Only teacher approval triggers is_visible_to_class = true.
This prevents incomplete or incorrect research from misleading other students.
DECISION: Teacher is the single gate for class-visible research.
