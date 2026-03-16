# Database schema — IoT at CHRIST

## Key tables

### profiles

id uuid PK (= auth.users.id)
full_name text
email text UNIQUE
role text CHECK ('teacher' | 'student')
google_classroom_id text
google_access_token text ← encrypted
google_refresh_token text ← encrypted
avatar_url text
institution text DEFAULT 'Christ University'
created_at timestamptz

### subjects

id uuid PK
slug text UNIQUE ← e.g. 'iot', 'ml'
name text ← e.g. 'IoT at CHRIST'
config jsonb ← full parsed YAML
is_active boolean DEFAULT true

### sessions

id uuid PK
unit_id uuid → units.id
number integer
title text
scheduled_at timestamptz ← set by teacher, used by reminder system
(topics, keywords, case_study, tools, assignment, no_hw_alternative all jsonb)

### enrollments

student_id uuid → profiles.id
subject_id uuid → subjects.id
classroom_course_id text ← Google Classroom course ID
UNIQUE(student_id, subject_id)

### assignment_submissions

id uuid PK
session_id uuid → sessions.id
student_id uuid → profiles.id
status text CHECK ('pending' | 'submitted' | 'graded')
grade text ← e.g. 'A+', 'B'
xp_awarded integer
google_classroom_submission_id text ← for Classroom sync matching

### research_projects

id uuid PK
owner_id uuid → profiles.id
approval_status text CHECK ('draft' | 'pending_review' | 'approved' | 'needs_revision')
is_visible_to_class boolean DEFAULT false
teacher_feedback text

### research_phases

id uuid PK
project_id uuid → research_projects.id
number integer
status text CHECK ('planned' | 'in-progress' | 'completed')
student_observation text
ai_suggestions jsonb ← string[]
linked_assignment_id uuid → assignment_submissions.id ← grade auto-feeds phase

### paper_sections

project_id uuid → research_projects.id UNIQUE
related_work / system_design / experimental_setup /
results / discussion / introduction / abstract ← all text

### reminder_schedules

session_id uuid → sessions.id
send_at timestamptz ← = sessions.scheduled_at - 24h
status text CHECK ('pending' | 'sent' | 'failed')

## RLS rules (summary)

- profiles: read all authenticated, update own only
- research_projects: owner full access, teacher read all,
  students read WHERE is_visible_to_class = true AND owner_id != their own id
- research_phases: owner full, teacher read all (no student read of others)
- paper_sections: owner full, teacher read all
- assignment_submissions: student read own, teacher read+update all
- reminder_schedules: teacher only

## XP mapping (from Classroom grades)

A+ = 200, A = 170, A- = 150, B+ = 120, B = 100, B- = 80, C+ = 60, C = 40
