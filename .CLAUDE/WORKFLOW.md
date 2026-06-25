# Token-Optimized Workflow Visual Guides

## Workflow 1: Bug Fix (Single File)

```
START: "Bug in feature X"
  │
  ├─→ Step 1: git fetch + review (50 tokens)
  │   └─→ git diff main --stat
  │
  ├─→ Step 2: Read CLAUDE.md constraints (100 tokens)
  │   └─→ Mobile? RLS? Design tokens?
  │
  ├─→ Step 3: Locate exact file + line numbers (100 tokens)
  │   └─→ "Update file.tsx line 42-45"
  │
  ├─→ Step 4: Request fix with exact line refs (200 tokens)
  │   └─→ "Current: X → Fix: Y → Why: Z"
  │
  ├─→ Step 5: YOU run local checks (0 tokens)
  │   └─→ npm run type-check ✅
  │   └─→ npm run lint ✅
  │
  ├─→ Step 6: Verify in browser (optional, 0 tokens)
  │   └─→ npm run dev → test
  │
  └─→ Step 7: Commit + Push
      └─→ Total cost: ~800 tokens ✅
```

---

## Workflow 2: Medium Feature (2-3 Files)

```
START: "Add new feature X"
  │
  ├─→ Step 1: Review scope (100 tokens)
  │   └─→ How many files? Database change? >2 files?
  │
  ├─→ Step 2: Decide: Architect or Direct?
  │   │
  │   ├─→ If >2 files + DB: Use Architect (1,200 tokens)
  │   │   └─→ Get task decomposition
  │   │   └─→ Jump to Workflow 3
  │   │
  │   └─→ If 2-3 files only: Use Direct (continue below)
  │
  ├─→ Step 3: Read affected files (400 tokens)
  │   └─→ Read only: file1.tsx + file2.ts
  │   └─→ Check existing patterns
  │
  ├─→ Step 4: Request implementation (800 tokens)
  │   └─→ File: /path/file.tsx (lines X-Y: change Z)
  │   └─→ File: /path/file.ts (add function: abc)
  │   └─→ Constraints: mobile + RLS + design
  │
  ├─→ Step 5: YOU validate locally (0 tokens)
  │   └─→ npm run type-check
  │   └─→ npm run lint
  │   └─→ npm run dev → quick test
  │
  ├─→ Step 6: Request code review (600 tokens)
  │   └─→ /code-review --comment
  │
  └─→ Step 7: Commit + Push
      └─→ Total cost: ~2,500 tokens ✅
```

---

## Workflow 3: Complex Feature (3+ Files or DB)

```
START: "Add complex feature X"
  │
  ├─→ Step 1: Prepare task description (200 tokens)
  │   ├─→ User story: what problem does it solve?
  │   ├─→ Rough files: which modules affected?
  │   ├─→ Constraints: from CLAUDE.md
  │   └─→ Questions: architectural decisions needed?
  │
  ├─→ Step 2: Ask Architect to decompose (1,200 tokens)
  │   ├─→ Receives: task graph with N nodes
  │   ├─→ Each node: objective, inputs, acceptance
  │   └─→ Some nodes tagged: security_gate or qa_required
  │
  ├─→ Step 3: Code Synthesizer per node (1,500 tokens each)
  │   ├─→ Node 1 (DB schema): 1,500 tokens
  │   │   └─→ YOU: npm run type-check (or supabase db push)
  │   │
  │   ├─→ Node 2 (Server action): 1,500 tokens
  │   │   └─→ YOU: npm run type-check
  │   │
  │   ├─→ Node 3 (Component): 1,500 tokens
  │   │   └─→ YOU: npm run type-check + lint
  │   │
  │   └─→ Node 4 (Integration): 1,000 tokens
  │       └─→ YOU: npm run dev → test
  │
  ├─→ Step 4: Security gate (if needed, 1,000 tokens)
  │   └─→ /security-review
  │
  ├─→ Step 5: QA gate (if needed, 800 tokens)
  │   └─→ Test plan review + edge cases
  │
  ├─→ Step 6: Code review (600 tokens)
  │   └─→ /code-review --comment
  │
  ├─→ Step 7: Verify feature works (400 tokens)
  │   └─→ /verify (live browser test)
  │
  └─→ Step 8: Commit + Push
      └─→ Total cost: ~5,000-7,000 tokens ✅
      └─→ For 1 complex feature vs. 12,000+ without optimization
```

---

## Decision Tree: Which Workflow?

```
┌─────────────────────────────────────────┐
│ What are you building?                  │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
  BUG FIX        NEW FEATURE
    │                │
    │         ┌──────┴──────┐
    │         │             │
    │         ▼             ▼
    │     1-2 FILES    3+ FILES
    │         │        or DATABASE
    │         │             │
    │         │      ┌──────┴────────────┐
    │         │      │                   │
    │         │      ▼                   ▼
    │         │   ARCHITECT FIRST    (too complex)
    │         │   DECOMPOSE             │
    │         │      │                  │
    │         ▼      ▼                  ▼
    │   ┌─────────────────────────────────┐
    │   │ DIRECT REQUEST                  │
    │   │ (with exact file paths + lines) │
    │   └─────────────────────────────────┘
    │            │
    └────────────┼─────────┬──────────┬────────────┐
                 │         │          │            │
                 ▼         ▼          ▼            ▼
            ┌────────┬─────────┬─────────────┬─────────────┐
            │ Fast   │ Medium  │   Complex   │ Uncertain   │
            │ (800) │ (2,500) │  (5,000)    │ → Ask       │
            └────────┴─────────┴─────────────┴─────────────┘
                     │
                     └─→ [YOU: npm run type-check]
                     └─→ [YOU: npm run lint]
                     └─→ [YOU: test locally]
                     └─→ [Git: commit + push]
                     └─→ [GitHub: create PR]
```

---

## Timeline: Single Feature (Start to Merge)

### Simple Bug Fix: 45 minutes total
```
Time │ Activity              │ Cost    │ Status
─────┼──────────────────────┼─────────┼─────────────────
0m   │ git fetch             │ 0 mins  │ 
5m   │ Read constraint       │ 5 mins  │ 
10m  │ Identify exact lines  │ 5 mins  │ 
15m  │ Request fix           │ 10 mins │ 50 tokens
25m  │ YOU: local checks     │ 10 mins │ 0 tokens
35m  │ Review in browser     │ 10 mins │ (optional)
40m  │ Commit + push         │ 5 mins  │ 0 tokens
45m  │ DONE                  │ 45 mins │ 800 tokens total
```

### Medium Feature: 2 hours total
```
Time │ Activity              │ Cost    │ Status
─────┼──────────────────────┼─────────┼──────────────────
0m   │ git fetch             │ 0 mins  │ 
5m   │ Read files + patterns │ 10 mins │ 
15m  │ Request code          │ 15 mins │ 1,200 tokens
30m  │ YOU: run checks       │ 15 mins │ 0 tokens
45m  │ Request review        │ 20 mins │ 600 tokens
65m  │ Review + test browser │ 15 mins │ 0 tokens
80m  │ Fix review feedback   │ 10 mins │ 500 tokens (if needed)
90m  │ Commit + push         │ 5 mins  │ 0 tokens
95m  │ DONE                  │ 95 mins │ 2,500 tokens total
```

### Complex Feature: 4-6 hours total
```
Time │ Activity              │ Cost    │ Status
─────┼──────────────────────┼─────────┼──────────────────
0m   │ Prepare task packet   │ 10 mins │ 0 tokens
10m  │ Architect decompose   │ 30 mins │ 1,200 tokens
40m  │ Synthesize Node 1     │ 20 mins │ 1,500 tokens
60m  │ YOU: validate Node 1  │ 15 mins │ 0 tokens
75m  │ Synthesize Node 2-3   │ 40 mins │ 3,000 tokens
115m │ YOU: full validation  │ 30 mins │ 0 tokens
145m │ Security gate (if)    │ 20 mins │ 1,000 tokens (optional)
165m │ Code review           │ 15 mins │ 600 tokens
180m │ Verify in browser     │ 15 mins │ 400 tokens
195m │ Final fixes           │ 15 mins │ 300 tokens (if needed)
210m │ Commit + push         │ 10 mins │ 0 tokens
220m │ DONE                  │ 220 min │ 5,000-7,000 tokens
      │ (3.6-4 hours)        │ (3.6h)  │
```

---

## Token Budget Dashboard

```
DAILY TARGETS (Based on 100 features/month)

Mon-Fri Target: ~500-600 tokens per day (vs. 1,200-1,500 without optimization)

Sample Day:
├─ 09:00 - 10:00: Fix bug #1 (800 tokens)
│                 └─ Done with git + direct request + tests
│
├─ 10:00 - 12:00: Medium feature #2 (2,500 tokens)
│                 └─ Read files + request + review
│
├─ 12:00 - 13:00: Lunch
│
├─ 13:00 - 15:00: Complex feature #3 setup (1,200 tokens)
│                 └─ Architect decomposition only (code tomorrow)
│
└─ 15:00 - 17:00: Synthesis + review of feature #3 (3,000 tokens)
                  └─ After Architect gives task graph

TOTAL: ~7,500 tokens = 3 complete features in 1 day
(Without optimization: ~18,000 tokens for same 3 features)
```

---

## Warning Signs (You're Wasting Tokens)

```
⚠️  "How should I structure this?"
    → You didn't read CLAUDE.md
    → Cost: +500 tokens per clarification

⚠️  "Can you add error handling for..."
    → You're already deep in implementation
    → Cost: +1,000 tokens for scope creep

⚠️  "I pasted 500 lines, can you review?"
    → You didn't use line numbers
    → Cost: +300 tokens reading unnecessary code

⚠️  "Should this be a component or a hook?"
    → You didn't check existing patterns
    → Cost: +400 tokens deciding architecture

⚠️  "Fix all the lint errors"
    → You didn't run npm run lint locally
    → Cost: +600 tokens on formatting issues

⚠️  "Does this need database changes?"
    → You didn't check the schema
    → Cost: +300 tokens understanding existing structure

⚠️  "Can you also refactor the dashboard?"
    → Scope creep during feature work
    → Cost: +2,000+ tokens for unrelated changes
```

---

## Success Metrics

### You're on track when:

✅ **Commits are atomic** (1 feature = 1 PR)
```
Good:    "Add student progress dashboard"
         "Fix research milestone calculation"
         "Optimize research query indexes"

Bad:     "Add feature + fix bug + refactor UI + update docs"
```

✅ **Commit messages have test plan**
```
Good:    "Test plan: mobile 375px ✅, RLS ✅, lint ✅"
Bad:     "Update code"
```

✅ **Local checks pass before pushing**
```
Good:    npm run type-check && npm run lint → 0 errors
Bad:     Asking for help with "type errors in my code"
```

✅ **Requests have exact file paths**
```
Good:    "/app/student/research/page.tsx lines 45-60"
Bad:     "In the research page somewhere..."
```

✅ **Token usage is 50-60% lower**
```
Good:    Bug fix: 800 tokens
         Medium: 2,500 tokens
         Complex: 5,000 tokens

Bad:     Bug fix: 2,000 tokens
         Medium: 6,000 tokens
         Complex: 12,000 tokens
```

---

## Optimization Checklist

Use this before every request:

```
PRE-REQUEST (costs 0 tokens):
☐ Did you read CLAUDE.md relevant sections?
☐ Did you check git status + git diff main --stat?
☐ Did you find similar patterns in existing code?
☐ Did you run npm run type-check locally?
☐ Did you run npm run lint locally?
☐ Can you identify exact file paths + line numbers?

REQUEST FORMAT (costs 300-800 tokens):
☐ Is request focused (1 feature, not multiple)?
☐ Did you specify exact file paths?
☐ Did you reference line numbers?
☐ Did you list constraints from CLAUDE.md?
☐ Did you show reference patterns?

POST-REQUEST (costs 0 tokens):
☐ Did you run npm run type-check?
☐ Did you run npm run lint?
☐ Did you test in browser (npm run dev)?
☐ Did you test at 375px mobile width?
☐ Did you commit with full test plan?

REVIEW (costs 300-800 tokens):
☐ Did you use /code-review?
☐ Did you use /verify for browser test?
☐ Did you apply feedback?
☐ Did you re-run checks after feedback?
```

---

## Monthly Optimization Report

Track your actual vs. target tokens:

```
Week 1-4: Features Completed
┌──────────────────────────────────────────┐
│ Feature Type │ Count │ Target  │ Actual  │
├──────────────────────────────────────────┤
│ Bug Fixes    │  10   │ 8,000   │ 8,200   │ ✅
│ Medium       │  8    │ 20,000  │ 19,800  │ ✅
│ Complex      │  2    │ 10,000  │ 11,200  │ ⚠️
├──────────────────────────────────────────┤
│ TOTAL        │  20   │ 38,000  │ 39,200  │ ✅
└──────────────────────────────────────────┘

Without Optimization Would Have Cost: ~95,000 tokens
Actual Cost With Optimization: ~39,200 tokens
Savings: ~59% 🎉
```

---

See `TOKEN_OPTIMIZATION.md` for detailed explanations and examples.
