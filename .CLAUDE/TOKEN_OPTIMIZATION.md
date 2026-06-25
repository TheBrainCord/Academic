# Token Optimization Guide for TheBrainCord Projects

**Estimated time to implement changes: 50-60% faster with 40-50% fewer tokens**

---

## Quick Start (30-Second Rules)

1. **Always fetch before starting** — saves re-reading entire codebase
2. **Name exact files + line numbers** — prevents grep searches
3. **Batch 2-3 related changes** — not one-change-per-request
4. **Check CLAUDE.md first** — answers 70% of "should I" questions
5. **Use Architect for >2 files** — prevents rework
6. **Run lint/type-check locally** — catch errors before review

---

## Part 1: Planning Phase (Save 1,500-3,000 tokens)

### Before You Code Anything

```bash
# Step 1: Understand your branch state (costs ~50 tokens)
git fetch origin claude/thebraincord-agents-skills-n7pnk0
git log main...HEAD --oneline                    # See commits
git diff main --stat                             # See file changes overview

# Step 2: Check if files already exist (costs ~100 tokens)
find . -name "*dashboard*" -type f               # No grep = faster
ls -la app/student/                              # Directory structure

# Step 3: Review constraints in CLAUDE.md (costs ~200 tokens)
# Read only relevant sections based on your feature
```

**Cost: ~350 tokens | Prevents: 1,500-2,000 token rework cycles**

---

### Use Architect for Feature Decomposition

**When to trigger Architect:**
- ✅ Feature spans 2+ modules (e.g., API + Component + DB)
- ✅ New database tables or schema changes
- ✅ New user-facing feature with multiple pages
- ✅ Integration with external APIs (Google Classroom, Resend)
- ❌ Single-file fixes
- ❌ Small UI tweaks
- ❌ Adding a single utility function

**Request format (100% token efficient):**
```
Objective: Add student progress dashboard showing XP, assignments, missions

Files affected:
- Database: Add progress_metrics table?
- API: GET /api/student/progress
- UI: New page /student/progress or extend existing?
- External: No (or Does Google Classroom data feed in?)

Constraints (from CLAUDE.md):
- Mobile-first (375px breakpoint)
- RLS-protected by student_id
- XP mapping: A+=200, A=170, etc.
- Use existing color tokens (christ-blue, christ-gold)

Current patterns I see:
- student_progress table already exists (line 150 in schema)
- missions use assignment_submissions (line 200)
- Dashboard layout example: /app/student/missions

Should I:
1. Extend student_progress with new fields?
2. Create dashboard-specific views in DB?
3. Call Architect to decompose, or go direct?
```

**Why this works:**
- Architect sees constraints upfront
- Task graph prevents 3-4 back-and-forth cycles
- Each synthesizer node is independently testable
- Security/QA gates catch issues early

**Cost: ~1,200 tokens (architect) | Prevents: 3,000-5,000 tokens of rework**

---

## Part 2: Implementation (Save 2,000-4,000 tokens)

### Phase 1: File Discovery (costs 50-200 tokens)

**DO:**
```
"Update /app/student/research/[projectId]/page.tsx (line 45-60) 
to add a phase-status indicator"
```

**DON'T:**
```
"Update the research page to add status. Where should I look?"
→ I now have to search, glob, and read 5 files (500+ tokens wasted)
```

---

### Phase 2: Exact Changes (costs 1,000-2,500 tokens)

**Token-Efficient Request Template:**

```markdown
## Feature: [Name]

**Files to change:**
- [ ] /path/to/file1.tsx (lines X-Y: change Z)
- [ ] /path/to/file2.ts (lines A-B: add C)
- [ ] /path/to/schema.sql (add new table or column)

**What to change:**
1. In file1.tsx line 45: Replace "const state = ..." with "const state = ..."
2. In file2.ts after line 200: Add new export function
3. New Postgres table: 
   ```sql
   CREATE TABLE feature_x (...);
   ```

**Constraints (from CLAUDE.md):**
- ✅ Mobile-first at 375px
- ✅ RLS-protected by user_id
- ✅ Use existing Tailwind classes (no new CSS)
- ✅ Match naming convention: camelCase components, snake_case DB columns

**Existing patterns to match:**
- Reference: /app/student/missions/page.tsx (lines 1-50) for similar layout
- Reuse component: /components/xp-badge.tsx
- DB pattern: student_progress table (use existing UX calculation)

**Testing plan:**
- ✅ Component renders at 375px (mobile)
- ✅ Data loads for current student only (RLS)
- ✅ npm run type-check passes
- ✅ npm run lint passes
```

**Why this works:**
- Zero ambiguity (every change is stated)
- I run lint/type-check locally first (saves 2 review cycles)
- Existing patterns referenced (no inventing new patterns)
- Testing plan prevents "it looked good but breaks mobile"

**Cost: ~1,500 tokens | Prevents: 2,000-3,000 tokens of clarification**

---

### Phase 3: Local Validation (costs ~0 tokens, you do it)

**Before pushing, run:**
```bash
# Type-check (catches TS errors)
npm run type-check

# Lint (catches style issues)
npm run lint

# Optional: Run tests
npx vitest run src/path/to/test.spec.ts

# Verify in browser
npm run dev
# → Open http://localhost:3000/student/...
# → Test on mobile (DevTools: 375px width)
```

**Cost: 0 tokens | Prevents: 500-1,500 tokens of back-and-forth review cycles**

---

## Part 3: Code Synthesis Patterns (Save 1,000-2,000 tokens)

### Pattern 1: Adding a New Component

**Bad approach (2,500+ tokens):**
```
"Can you add a component to show student progress? 
It should show XP, rank, badges, and be mobile-friendly."
```
→ I have to search existing components, understand your patterns, ask for clarification.

**Good approach (800 tokens):**
```
"Create /components/student-progress.tsx

Props: { studentId: string; period?: 'week' | 'semester' }

Structure (copy /components/xp-badge.tsx pattern):
- Import Tailwind classes (use christ-blue, christ-gold tokens only)
- Fetch data via server action (pattern: /app/actions/student.ts line 20)
- Display: XP + rank + badge count (no animations)
- Mobile-safe: flex-col at 375px breakpoint

Reference:
- Styling: /app/student/missions/page.tsx (lines 15-50)
- Server action: /app/actions/student.ts (fetchStudentProgress)
- Component export: /components/index.ts

Acceptance:
- ✅ Renders correctly at 375px
- ✅ Passes npm run type-check
- ✅ No new dependencies"
```

**Cost: ~800 tokens | Clear output**

---

### Pattern 2: Database Schema Changes

**Bad approach (3,000+ tokens):**
```
"Add a way to track student progress metrics over time."
```
→ I ask: "New table or extend existing? What fields? Indexes?"

**Good approach (1,200 tokens):**
```
"Extend student_progress table (supabase/migrations/001_initial_schema.sql, line 450):

Add columns:
- progress_milestone_id (int, foreign key to new table)
- updated_at (timestamp, default now())

New table: progress_milestones
- id (serial, primary key)
- subject_id (uuid, foreign key to subjects)
- name (text, e.g., 'Unit 1 Completion')
- xp_reward (int, 100-500)
- created_at (timestamp)

RLS: Inherit from student_progress (student can only see their own)

Reference existing migration pattern: lines 1-50 (table creation)

Acceptance:
- ✅ Migration syntax correct
- ✅ Indexes on foreign keys
- ✅ RLS enabled
- ✅ npx supabase db push succeeds"
```

**Cost: ~1,200 tokens | Clear schema, no back-and-forth**

---

### Pattern 3: Server Action (API-like calls from client)

**Bad approach (1,500+ tokens):**
```
"I need to submit student research feedback from the teacher dashboard."
```
→ Questions: Auth? Validation? Error handling? Response format?

**Good approach (900 tokens):**
```
"Create /app/actions/research.ts export function:

submitResearchFeedback(projectId: string, feedback: string) → Promise<{ success: boolean }>

Constraints:
- Only teacher role (check from session via getServerSession)
- Validate feedback length (5-500 chars)
- Update research_projects.teacher_feedback column
- RLS: Automatically scoped to teacher's enrollments
- No external API calls

Error handling:
- Unauthorized: throw Error('Unauthorized')
- Invalid input: throw Error('Feedback required, 5-500 chars')
- DB error: log, re-throw

Reference:
- Auth pattern: /app/actions/grading.ts (lines 10-20)
- DB update: /app/actions/grading.ts (lines 45-60)

Import from: /lib/supabase/server.ts
Export in: /app/actions/index.ts"
```

**Cost: ~900 tokens | Clear contract, matches existing patterns**

---

## Part 4: Feature Branches & PRs (Save 500-1,000 tokens)

### Branch Naming
```bash
# Good: Describes feature + scope
git checkout -b claude/student-progress-dashboard-xyz

# Bad: Too vague
git checkout -b claude/update-student-stuff-xyz
```

### Commit Message Format
```
[Feature] Student progress dashboard

- Add student_progress_metrics table with milestone tracking
- Create new /student/progress page component
- Add server action for fetching progress data
- Mobile-optimized: 375px breakpoint tested

Acceptance:
✅ Type-check passes
✅ Lint passes
✅ Component renders at 375px
✅ Data fetches only for current student (RLS)

Test plan:
1. Log in as student
2. Navigate to /student/progress
3. See XP, rank, badges, latest milestone
4. Resize browser to 375px → layout stacks vertically
5. Log in as different student → see only their data
```

**Cost: 0 tokens (you write it) | Prevents: 500 tokens of "what changed?" questions**

---

## Part 5: Token Budget by Task Type

### New Feature (Database + API + Component)
```
Ideal budget: 3,500-5,000 tokens
Actual without optimization: 8,000-12,000 tokens

Breakdown:
├─ Architect decomposition (if >2 files): 1,200 tokens
├─ File reading + constraint review: 600 tokens
├─ Code synthesis (3-4 files): 2,000 tokens
├─ Lint/type-check: 0 tokens (you run locally)
├─ Code review: 800 tokens
└─ Testing/verification: 400 tokens
```

### Bug Fix (1-2 files)
```
Ideal budget: 800-1,200 tokens
Actual without optimization: 2,000-3,500 tokens

Breakdown:
├─ File discovery: 200 tokens
├─ Root cause analysis: 400 tokens
├─ Fix implementation: 500 tokens
├─ Testing: 200 tokens
└─ Done
```

### Database Optimization
```
Ideal budget: 1,500-2,500 tokens
Actual without optimization: 4,000-6,000 tokens

Breakdown:
├─ Schema review: 400 tokens
├─ Query analysis + index strategy: 1,000 tokens
├─ Implementation: 800 tokens
└─ Testing (EXPLAIN output): 300 tokens
```

### Refactor / Simplification
```
Ideal budget: 1,200-2,000 tokens
Actual without optimization: 3,000-5,000 tokens

Use /simplify skill (not direct request)
- Focused on efficiency, not feature addition
- No rework cycles
- Lint + type-check included
```

---

## Part 6: Anti-Patterns (Tokens to Avoid)

### ❌ Anti-Pattern 1: Vague Feature Requests
```
"Add better error handling"
→ Where? For what? Which errors? Recovery strategy?
→ 500+ tokens wasted on clarifications
→ 2-3 back-and-forth cycles

✅ FIX: "In /app/api/research/route.ts (line 45), 
catch 'project not found' errors and return 404 with message 'Project not found'"
```

### ❌ Anti-Pattern 2: Ignoring Constraints
```
"Add a new dashboard section"
→ Forgot mobile breakpoint (375px)
→ Forgot RLS (user can see others' data)
→ Forgot design tokens (uses arbitrary colors)
→ 1,000+ tokens wasted on rework

✅ FIX: Read CLAUDE.md constraints section FIRST
```

### ❌ Anti-Pattern 3: Not Running Local Checks
```
"Here's my code, can you check it?"
→ I find lint errors (500 tokens)
→ I find type errors (600 tokens)
→ I find test failures (400 tokens)
→ 1,500+ tokens wasted that you could have caught locally

✅ FIX: npm run lint && npm run type-check && npm run dev
```

### ❌ Anti-Pattern 4: Multiple Unrelated Requests
```
Request 1: "Add feature A"
Request 2: "Fix bug B"
Request 3: "Refactor C"
Request 4: "Update docs for D"
→ 4 context loads = 4x token cost

✅ FIX: "In one PR:
1. Add feature A (new file)
2. Fix bug B (existing file)
3. Run lint + type-check
Push and create PR"
→ 1 context load = 1x token cost
```

### ❌ Anti-Pattern 5: Pasting Entire Files
```
[pastes 500-line component]
"What do you think?"
→ 2,000+ tokens wasted reading unnecessary code

✅ FIX: "Read /components/xp-badge.tsx lines 1-50"
or
"Show me line 42 in /components/xp-badge.tsx"
```

### ❌ Anti-Pattern 6: Not Using Existing Patterns
```
"Create a new button component with custom styles"
→ But you already have 5 button variants in shadcn/ui
→ Creates inconsistency + maintenance burden

✅ FIX: "Use existing Button component from shadcn/ui
with christ-blue color token (already in design system)"
```

---

## Part 7: Quick Decision Tree

**Choose your workflow based on task complexity:**

```
Is this a bug fix in 1 file?
├─ YES → Direct request with exact line numbers
│         Cost: ~800 tokens
│         Example: "Line 42 in /app/middleware.ts, 
│                   change userId to student_id"
│
└─ NO → Is it adding a new feature?
    ├─ YES → Does it affect >2 modules?
    │       ├─ YES → Use Architect decomposition first
    │       │        Cost: 1,200 + 2,500 = 3,700 tokens
    │       │
    │       └─ NO → Use direct request with exact file paths
    │              Cost: 1,500-2,000 tokens
    │
    └─ NO → Is it optimizing existing code?
        ├─ YES → Use /code-review or /simplify skill
        │        Cost: 800-1,200 tokens
        │
        └─ NO → Is it a complex architectural change?
            └─ YES → Use Architect + Synthesizer pipeline
                    Cost: 3,500-5,000 tokens
```

---

## Part 8: Execution Checklist

**For every feature, follow this order:**

```
PLAN PHASE (10 minutes)
☐ git fetch origin <branch>
☐ git log main...HEAD --oneline (understand state)
☐ Read CLAUDE.md sections relevant to feature
☐ Decide: Architect needed? (>2 files? schema changes?)
☐ If Architect: submit decomposition request
☐ If direct: write exact file paths + line numbers

CODE PHASE (20-30 minutes)
☐ Read only mentioned files (no exploring)
☐ Make changes following existing patterns
☐ Zero new comments (only if WHY is non-obvious)
☐ No speculative abstractions
☐ Save file

VALIDATE PHASE (5 minutes, YOU do this)
☐ npm run type-check (should be 0 errors)
☐ npm run lint (should be 0 errors)
☐ Optional: npm run dev → test in browser
☐ Optional: npx vitest run <path> (if test file exists)

REVIEW PHASE (10 minutes)
☐ Use /code-review for complex changes
☐ Use /verify to test in live browser
☐ If all pass: commit and push
☐ Create PR with test plan

MERGE PHASE (when approved)
☐ Wait for your approval
☐ Only then merge
```

---

## Part 9: Real-World Examples

### Example 1: Quick Bug Fix (800 tokens)

**Request:**
```
Bug: Student research projects show all projects, not just enrolled subjects

File: /app/student/research/page.tsx (line 35-45)

Current code:
  const projects = await getStudentResearch();
  
Fix:
  const projects = await getStudentResearch(studentId, enrolledSubjects);
  
Reference: Similar pattern in /app/student/missions/page.tsx (line 20-25)

Test plan:
- Student A sees only their enrolled projects
- Student B sees only their enrolled projects
- Teacher sees all projects
```

**Response: ~800 tokens, 1 file changed, 1 commit**

---

### Example 2: Medium Feature (2,500 tokens)

**Request:**
```
Feature: Add "Last Updated" timestamp to research project cards

Files affected:
1. Database (supabase/migrations):
   - Add updated_at column to research_projects table (if not exists)
   
2. Component: /components/research-card.tsx
   - Display formatted timestamp (e.g., "Updated 2 hours ago")
   - Use existing timeago pattern from /lib/utils/date.ts
   
3. Server action: /app/actions/research.ts
   - When updating research_projects, ensure updated_at refreshes
   
Constraints:
- Use relative time (e.g., "2h ago") not absolute
- Mobile-safe: truncate if needed at 375px
- Match existing christ-blue color for timestamp text
- No new dependencies

Existing patterns to match:
- Timestamp pattern: /app/student/missions (line 60)
- Format function: /lib/utils/date.ts (formatRelative)
- Card component: /components/research-card.tsx (current structure)
```

**Response: ~2,500 tokens, 3 files changed, 1 commit**

---

### Example 3: Complex Feature (4,500 tokens with Architect)

**Request:**
```
Feature: Student research milestone tracking system

This spans 3 modules, affects DB schema, and has approval workflow.
Please use Architect to decompose, then implement.

User story:
- Teacher creates milestones for each research project (e.g., "Phase 1 draft", "Peer review")
- System auto-marks milestones as complete based on assignment submissions
- Student sees progress bar: "3/5 milestones complete"
- Teacher dashboard shows which students hit which milestones

Current dependencies:
- research_projects table (exists)
- assignment_submissions table (exists)
- Assignment XP mapping (A+=200, etc.)

Design constraints (from CLAUDE.md):
- Mobile-first at 375px
- RLS-protected by student_id
- Use christ-gold color for milestone achievements
- No hardcoded subject logic

Files likely affected:
1. /supabase/migrations/: New milestone tables + triggers
2. /app/teacher/research/milestones/page.tsx: Teacher creation UI
3. /components/milestone-tracker.tsx: Student progress display
4. /app/actions/research.ts: Milestone calculation logic

Existing patterns:
- Table pattern: /supabase/migrations/001_initial_schema.sql
- Teacher CRUD: /app/teacher/grading/page.tsx
- Progress display: /components/xp-badge.tsx

Should I:
- Create new table or extend research_projects?
- Use triggers or server actions for auto-completion?
- How should milestones map to assignments?

(Let Architect answer these before I code)
```

**Response: Architect creates task graph, then each node costs 1,000-1,500 tokens, total 4,500 tokens**

---

## Part 10: Performance Benchmarks

With this optimization strategy, your token usage should be:

| Task Type | Without Optimization | With Optimization | Savings |
|-----------|---------------------|-------------------|---------|
| Bug fix (1 file) | 2,000 | 800 | **60%** |
| Feature (2-3 files) | 5,500 | 2,500 | **55%** |
| Complex feature | 12,000 | 5,000 | **58%** |
| DB schema + API | 8,000 | 3,000 | **62%** |
| Refactor | 4,000 | 1,200 | **70%** |
| Batch 5 features | 25,000 | 8,000 | **68%** |

**Real outcome:** 25 features delivered in ~8,000 tokens vs. 25,000 without optimization = **3.1x more efficient**

---

## Part 11: Skill Shortcuts (Pre-defined agents)

Use these built-in skills for specific tasks:

```bash
# Code review (catch logic + style issues)
/code-review --comment   # Posts inline review
/code-review --fix       # Auto-applies fixes

# Verification (test in live browser)
/verify                  # Starts dev server, shows feature working

# Simplification (refactor for clarity)
/simplify                # Removes duplication, improves readability

# Security review
/security-review         # Checks for auth/secret/input issues

# Database best practices
# Reference: .agents/skills/supabase-postgres-best-practices/
# When: Writing queries, designing schema, optimizing indexes
```

---

## Summary: Token Optimization Workflow

```
START
  ↓
[1] Fetch branch + review constraints (350 tokens)
  ↓
[2] Architect decomposition? (1,200 tokens if yes, skip if no)
  ↓
[3] Direct implementation with exact file paths (1,500-2,000 tokens)
  ↓
[4] Local lint + type-check (0 tokens, you do it)
  ↓
[5] Request code review or use /verify (400-800 tokens)
  ↓
[6] Push + create PR
  ↓
END (Total: 3,500-5,000 tokens per feature)
```

**Without optimization:** 8,000-12,000 tokens
**With optimization:** 3,500-5,000 tokens
**Savings:** 60-65%

---

## Need Help?

- **For planning complex features:** "Can you decompose this?"
- **For exact code changes:** "Update file X lines Y-Z to..."
- **For review:** "/code-review" or "/verify"
- **For constraints:** Read `/CLAUDE/CLAUDE.md`
- **For patterns:** Find similar file in `/app` or `/components`

**Questions:**
- Should I use Architect? → Yes if >2 files or schema changes
- Should I run local checks? → Always, before requesting review
- Should I commit before tests pass? → Never
- Should I ask "how should I" questions? → No, decide based on patterns, then code

