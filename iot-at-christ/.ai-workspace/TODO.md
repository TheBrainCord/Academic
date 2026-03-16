# Current work — Session focus

## STATUS: Building Step 7 (Google Classroom integration)

Steps 1–6 are complete and working. Do not rebuild them.

## THIS SESSION — complete these in order

### Task 1: /lib/google/classroom.ts

Create this file with three functions:

- getCourseRoster(courseId: string): Promise<ClassroomStudent[]>
  → calls courses.students.list from Google Classroom API
  → returns array of { googleId, fullName, email, photoUrl }
- getCourseAssignments(courseId: string): Promise<ClassroomAssignment[]>
  → calls courses.courseWork.list
- getStudentGrades(courseId: string, studentId: string): Promise<ClassroomGrade[]>
  → calls courses.courseWork.studentSubmissions.list filtered by userId
  Use the Google access token stored in profiles.google_access_token.
  Handle token refresh via /lib/google/oauth.ts (already exists).

### Task 2: Supabase Edge Function sync-classroom

File: /supabase/functions/sync-classroom/index.ts
Logic:

1. Accept { courseId: string, teacherId: string } in request body
2. Fetch roster from getCourseRoster
3. For each student: upsert profile, upsert enrollment
4. Fetch grades from getCourseAssignments + getStudentGrades
5. Update assignment_submissions where google_classroom_submission_id matches
6. Insert sync_log row with { timestamp, student_count, grade_count, status }
7. Return { synced: n, errors: [] }
   Make it idempotent — safe to run multiple times.

### Task 3: /app/api/classroom/sync/route.ts

POST endpoint. Verifies teacher session.
Calls the Edge Function. Returns JSON result.
Add rate limiting: max 1 sync per 5 minutes per teacher (use Supabase KV).

### Task 4: Add sync UI to /teacher/students

Below the page title, add:

- "Last synced: X minutes ago" (read from sync_log table)
- "Sync with Classroom" button → calls POST /api/classroom/sync
- Loading state while syncing
- Show count of students synced on success
- Students in Classroom but not yet logged in shown with "Invited" badge (grey dot)

## NEXT SESSION (do not start these yet)

- Step 8: Reminder email system
- /emails/session-reminder.tsx template
- send-session-reminders Edge Function

## BLOCKED — do not touch

- /app/student/research — design decision pending (see DECISIONS.md)
- Puppeteer PDF export — needs Supabase paid plan for Edge Function memory
