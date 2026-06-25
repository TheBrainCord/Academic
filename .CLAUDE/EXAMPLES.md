# Real-World Examples: Token Optimization in Action

## Example 1: Simple Bug Fix

### The Bug
Students can see each other's research projects (RLS not working)

---

### ❌ WITHOUT Optimization (2,500 tokens)

**Request:**
```
"I think there's a bug in the research page. 
Students can see other students' projects. 
Can you fix this?"
```

**My response cycle:**
1. "Where is the research page?" → 300 tokens searching
2. Read all related files to understand data flow → 800 tokens
3. Find the bug in query (missing WHERE clause) → 400 tokens
4. Ask: "What data should students see?" → 200 tokens (clarification)
5. Implement fix → 400 tokens
6. You run tests, find edge case → 300 tokens (more back-and-forth)
7. Fix edge case → 300 tokens

**Total: 2,500 tokens, multiple round-trips**

---

### ✅ WITH Optimization (800 tokens)

**Request:**
```
Bug: Students see all research projects, not just their own

File: /app/student/research/page.tsx (line 35-45)

Current code:
  const projects = await getStudentResearch();

Should be:
  const projects = await getStudentResearch(studentId);

Reference:
- Similar fix in /app/student/missions/page.tsx (line 20-25)
- Check RLS: research_projects table should filter by user_id

Test plan:
- ✅ Student A sees only their projects
- ✅ Student B sees only their projects (not A's)
- ✅ npm run type-check passes
- ✅ npm run lint passes
```

**My response:**
1. Implement fix (already clear what to do) → 400 tokens
2. Run type-check output → 200 tokens
3. Done

**Total: 800 tokens, one round-trip**

**Savings: 2,500 - 800 = 1,700 tokens (68% reduction)**

---

## Example 2: Medium Feature - Student Progress Card

### The Feature
"Add a progress card showing student XP, rank, and achievement count on the dashboard"

---

### ❌ WITHOUT Optimization (5,500 tokens)

**Initial Request:**
```
"Can you add a student progress card? 
It should show XP, rank, and badges. 
Make it look nice and mobile-friendly."
```

**My response cycle:**

1. **Search & Discovery (800 tokens)**
   - Where should this go? (ask user)
   - What data do we have? (grep for existing progress queries)
   - What components exist? (search shadcn/ui usage)
   - User clarifies: "Add to dashboard"

2. **Architecture Question (400 tokens)**
   - "Should I create a new component or reuse?"
   - "Do we need a new database table?"
   - "Should it be a server component?"
   - Back-and-forth clarifications

3. **Implementation #1 (800 tokens)**
   - Create component based on assumptions
   - Missing: styling, accessibility, mobile layout
   - You test, finds issues

4. **Rework #1 (600 tokens)**
   - Fix styling issues
   - Add mobile layout
   - Check design tokens
   - More iterations...

5. **Rework #2 (500 tokens)**
   - You notice it doesn't match existing patterns
   - Asks to update to match missions card
   - More changes...

6. **Final Review (600 tokens)**
   - Edge cases (what if student has 0 XP?)
   - Performance (N+1 query issue?)
   - Security (RLS confirmed?)

**Total: 5,500 tokens, ~5 round-trips, frustration**

---

### ✅ WITH Optimization (2,500 tokens)

**Request:**
```
Feature: Add student progress card to dashboard

Location: /app/student/dashboard/page.tsx, after line 45

Data needed: studentId, XP, rank, achievement_count
- Fetch from existing server action: /app/actions/student.ts → getStudentProgress
- Reference: /app/student/missions/page.tsx uses same server action (line 20)

UI Component: /components/student-progress-card.tsx

Structure (reuse mission-card pattern):
- Container: gradient background (christ-blue to dark)
- Header: "Your Progress"
- Content rows:
  ├─ XP: {count} (gold color)
  ├─ Rank: {rank} (blue badge)
  └─ Achievements: {count} (icons)
- Footer: "View detailed progress" link

Styling rules (from CLAUDE.md):
- Mobile: flex-col at 375px breakpoint
- Colors: christ-blue (#1565C0), christ-gold (#B7791F)
- Font: Source Serif 4 (body), Courier Prime (numbers)
- No new CSS (use Tailwind only)

Reference existing patterns:
- Card component: /components/mission-card.tsx (lines 1-50)
- Server action usage: /app/student/missions/page.tsx (lines 15-25)
- Responsive grid: /app/student/dashboard/page.tsx (lines 30-45)

Acceptance criteria:
✅ Renders at 375px (mobile) and 1920px (desktop)
✅ Uses getStudentProgress server action (no new queries)
✅ Shows XP as formatted number (e.g., "1,250")
✅ Rank uses correct XP tiers from CLAUDE.md
✅ npm run type-check passes
✅ npm run lint passes
✅ Component exported in /components/index.ts
```

**My response:**
1. Read patterns from reference files → 300 tokens
2. Create component following existing patterns → 800 tokens
3. Style using Tailwind + design tokens → 600 tokens
4. Add to dashboard layout → 400 tokens
5. Lint/type-check output → 200 tokens
6. Done

**Total: 2,500 tokens, one round-trip, clear output**

**Savings: 5,500 - 2,500 = 3,000 tokens (55% reduction)**

---

## Example 3: Complex Feature - Milestone System

### The Feature
"Track research milestones for each project. When students complete assignments, mark milestones as done. Show progress on dashboard."

---

### ❌ WITHOUT Optimization (12,000 tokens)

**Initial Request:**
```
"We need a milestone system for research projects. 
Can you help design it?"
```

**Messy journey:**
1. "What's a milestone?" → clarification → 300 tokens
2. "How does it connect to assignments?" → architecture discussion → 500 tokens
3. "New table or extend existing?" → multiple options → 600 tokens
4. "How do we auto-complete milestones?" → triggers or logic? → 400 tokens
5. Start DB schema → 800 tokens
6. You question RLS → redo schema → 600 tokens
7. Create API endpoint → 1,000 tokens
8. Question: "API or server action?" → clarification → 300 tokens
9. Create component → 900 tokens
10. Component doesn't match designs → rework → 800 tokens
11. Edge case: "What if milestone is marked complete twice?" → fix → 400 tokens
12. "Does teacher see all milestones?" → add teacher view → 1,200 tokens
13. Final review and fixes → 800 tokens

**Total: 12,000 tokens, 13+ round-trips, scope creep**

---

### ✅ WITH Optimization (5,000 tokens)

**Request (with Architect decomposition):**
```
Feature: Research Project Milestone Tracking System

User story:
Teachers create milestones for research projects (e.g., "Phase 1 Draft", "Peer Review").
System auto-marks milestones complete when students submit related assignments.
Students see progress bar: "3/5 milestones complete" with XP rewards.

Scope decision needed from Architect:
- New table vs. extend research_projects?
- Auto-completion via trigger or server action?
- Should milestones have individual XP rewards?
- Teacher dashboard: manage milestones or read-only?

Constraints (from CLAUDE.md):
- Mobile-first at 375px
- RLS: student sees own, teacher sees all
- Design tokens: christ-gold for achievements
- Existing patterns: subject → units → sessions (hierarchy)

Rough decomposition I'm thinking:
1. Database: New milestone table (or extend?)
2. API: POST /api/milestone/create, PATCH /api/milestone/complete
3. UI: Teacher page for milestone management
4. UI: Student component showing progress bar
5. Logic: Check assignment completion → auto-mark milestone

Can you decompose this into a task graph before I code?
```

**My response (Architect agent):**
→ Returns task decomposition:
```json
{
  "task_graph": [
    {
      "node_id": "1_db_schema",
      "objective": "Create research_milestones table",
      "inputs": ["research_projects table", "RLS patterns"],
      "acceptance": ["Migration valid", "Indexes on FK", "RLS enabled"],
      "tier": "standard"
    },
    {
      "node_id": "2_server_action",
      "objective": "Create server action: completeResearchMilestone",
      "inputs": ["node_1 output", "assignment submission logic"],
      "acceptance": ["Auth check", "Idempotent", "Updates milestone + student_progress"]
    },
    {
      "node_id": "3_teacher_ui",
      "objective": "Create /app/teacher/research/[projectId]/milestones page",
      "inputs": ["existing teacher layout", "CRUD form patterns"],
      "acceptance": ["Creates/edits/deletes milestones", "Mobile-safe"]
    },
    {
      "node_id": "4_student_component",
      "objective": "Create MilestoneProgressCard component",
      "inputs": ["design tokens", "existing card patterns"],
      "acceptance": ["Shows progress bar", "375px mobile", "Matches designs"]
    }
  ]
}
```

Then for each node:

**Node 1 (Database): 1,200 tokens**
```
I'll create migration based on:
- research_projects table structure
- RLS patterns from student_progress table
- Indexes on foreign keys
- Check CLAUDE.md constraints
```

**Node 2 (Server Action): 1,200 tokens**
```
I'll implement:
- Auth check (teacher only)
- Idempotent update (if already marked, skip)
- Update milestone.completed_at and student_progress.xp
- Reference similar pattern from /app/actions/grading.ts
```

**Node 3 (Teacher UI): 1,200 tokens**
```
I'll create:
- /app/teacher/research/[projectId]/milestones/page.tsx
- Form to create/edit/delete milestones
- Reference: /app/teacher/grading/page.tsx pattern
```

**Node 4 (Student Component): 1,000 tokens**
```
I'll create:
- /components/milestone-progress.tsx
- Progress bar (0-100%)
- List of milestones with checkmarks
- Match /components/mission-card.tsx styling
```

**Final: 800 tokens**
- Code review, verify in browser, create PR

**Total: 5,000 tokens, clear path forward, zero re-architecture**

**Savings: 12,000 - 5,000 = 7,000 tokens (58% reduction)**

---

## Example 4: Database Optimization

### The Problem
"Research queries are slow, especially when loading milestones with projects and student data"

---

### ❌ WITHOUT Optimization (3,500 tokens)

**Request:**
```
"The research page is slow. Can you optimize it?"
```

**Bad journey:**
1. "What page? What's slow?" → clarification → 300 tokens
2. Look at query → find N+1 problem → 500 tokens
3. "Should I add indexes? Change the query?" → options discussion → 400 tokens
4. Implement one solution → 800 tokens
5. You run EXPLAIN → finds another bottleneck → 500 tokens
6. Rework query again → 600 tokens
7. Still not optimal → check RLS impact → 400 tokens

**Total: 3,500 tokens**

---

### ✅ WITH Optimization (1,500 tokens)

**Request:**
```
Performance issue: Research page N+1 queries

File: /app/actions/research.ts (line 45-65)

Current code:
  const projects = await getProjects();
  const milestones = await Promise.all(projects.map(p => getMilestones(p.id)));

Problem:
- For each project, fetch milestones separately (N+1)
- For each milestone, fetch student progress separately (N+1 x N+1)
- Loads 100+ queries for 10 projects

Fix approach:
- Use single JOIN query instead of loop
- Reference: /app/actions/missions.ts uses similar pattern (lines 30-45)
- Check: /agents/skills/supabase-postgres-best-practices/references/data-n-plus-one.md

Need:
- Single query with projects + milestones + student_progress joined
- RLS still filters by student_id (maintain security)
- EXPLAIN output to verify improvement

Test:
- ✅ Page loads 10 projects + 50 milestones in <500ms
- ✅ Network tab shows 2-3 requests vs. 100+
- ✅ Student sees only their data (RLS)
```

**My response:**
1. Check existing join patterns → 200 tokens
2. Rewrite with single JOIN query → 600 tokens
3. Add EXPLAIN ANALYZE output → 300 tokens
4. Verify in browser (npm run dev) → 200 tokens
5. Benchmarks: before/after → 200 tokens

**Total: 1,500 tokens, one clear optimization**

**Savings: 3,500 - 1,500 = 2,000 tokens (57% reduction)**

---

## Token Savings Summary

| Task | Without Opt. | With Opt. | Savings | % |
|------|------------|----------|---------|-----|
| Bug Fix | 2,500 | 800 | 1,700 | 68% |
| Medium Feature | 5,500 | 2,500 | 3,000 | 55% |
| Complex Feature | 12,000 | 5,000 | 7,000 | 58% |
| DB Optimization | 3,500 | 1,500 | 2,000 | 57% |
| **Average** | **5,875** | **2,450** | **3,425** | **58%** |

**For 20 features/month:**
- Without optimization: ~117,500 tokens
- With optimization: ~49,000 tokens
- **Savings: ~68,500 tokens/month (58%)**

---

## Key Takeaways

1. **Exact file paths** save 300-500 tokens per request
2. **Reading CLAUDE.md first** prevents 1,000-2,000 token clarifications
3. **Local type-check/lint** prevents 500-1,500 token review cycles
4. **Architect for complex features** saves 3,000-5,000 tokens on rework
5. **Reference patterns** prevent architectural back-and-forth

**Simple formula:** 
```
Vague request = 3-5 round-trips = 1,500-3,000 tokens
Clear request = 1 round-trip = 500-1,000 tokens
Difference = 2-2,500 tokens per feature
```

For 20 features: **40,000-50,000 tokens in wasted clarifications** if you don't optimize.

---

## Next Steps

1. **Save this file** for reference
2. **Use QUICK_START.md** as your request template
3. **Check WORKFLOW.md** to choose the right approach
4. **Reference TOKEN_OPTIMIZATION.md** for detailed explanations
5. **Track your actual token usage** to improve estimates

**Remember:** The first request takes 2-3 minutes to write clearly. It saves 30+ minutes of back-and-forth clarifications. **Always optimize upfront.**
