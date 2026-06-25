# Quick Reference: Token-Optimized Workflow (30-second version)

## Before Every Task
```bash
git fetch origin claude/thebraincord-agents-skills-n7pnk0
git diff main --stat                    # See changes
```

## Request Template (Copy & Paste)

### For Bug Fixes (1 file)
```
Bug: [Description of problem]

File: /path/to/file.tsx (lines X-Y)

Current: [What's wrong]
Fix: [Change to this]
Why: [Brief reason]

Reference: [Similar pattern in another file]

Test: [How to verify]
```

### For New Features (2+ files)
```
Feature: [Name]

Files affected:
- [ ] /path/file1.tsx (lines X-Y: add/change Z)
- [ ] /path/file2.ts (add new function)
- [ ] /supabase/migrations/: [table/column change]

Constraints (from CLAUDE.md):
- ✅ Mobile: 375px breakpoint
- ✅ Auth: RLS by user_id
- ✅ Design: christ-blue + christ-gold
- ✅ Patterns: Match /app/student/missions/

Test plan:
1. [Action]
2. [Verify result]
3. npm run type-check && npm run lint

Ready to code? (Y/N)
```

### For Decomposition (Complex features)
```
Feature: [Name - 1 sentence]

User story: [What problem does it solve]

Files affected: [Rough list]

Constraints: [From CLAUDE.md]

Questions for Architect:
- [Specific decision needed]
- [Specific decision needed]

(Let Architect decompose first)
```

## Quick Decisions

| Situation | Action | Cost |
|-----------|--------|------|
| 1-file bug fix | Direct request + exact lines | 800 |
| 2-3 file feature | Direct request + file paths | 2,000 |
| 3+ files or DB change | Ask Architect first | 1,200 |
| Code quality issue | Use `/code-review` | 600 |
| Uncertain if it works | Use `/verify` | 400 |
| Wants clean code | Use `/simplify` | 800 |

## Local Checks (Do These Before Asking)

```bash
# Type errors?
npm run type-check

# Lint errors?
npm run lint

# Tests pass?
npx vitest run src/...

# Looks good in browser?
npm run dev
# → http://localhost:3000
# → Test at 375px width (DevTools)
```

**Cost: 0 tokens | Saves: 500-1,500 tokens on reviews**

## Commit Message Format

```
[Feature/Fix/Refactor] Short title

- What changed
- Why it matters
- Constraints checked (mobile, RLS, design)

Test: ✅ type-check ✅ lint ✅ browser
```

## Token Budget Tracker

```
✅ Bug fix: ~800 tokens
✅ Medium feature: ~2,500 tokens
✅ Complex feature: ~5,000 tokens
⚠️  Vague request: +1,000-2,000 tokens (clarifications)
⚠️  Missing local checks: +500-1,500 tokens (review cycles)
⚠️  Ignoring CLAUDE.md: +1,000-3,000 tokens (rework)
```

## Most Common Mistakes (Avoid These)

| Mistake | Cost | Fix |
|---------|------|-----|
| "Can you help me design X?" | +1,500 | Read CLAUDE.md first, then ask exact questions |
| Pasting entire files | +1,000 | Say "lines 10-50 in file.tsx" |
| Forgetting mobile breakpoint | +800 | Check CLAUDE.md constraints |
| Not running lint locally | +600 | `npm run lint` before asking |
| Multiple unrelated requests | +1,500 | Batch related changes in one PR |
| "Where should I put this?" | +400 | Check `/app` or `/components` for patterns |

## File Locations (Copy exact paths)

```
Components:        /components/*.tsx
Pages:             /app/student/* or /app/teacher/*
Server Actions:    /app/actions/
Database Schema:   /supabase/migrations/001_initial_schema.sql
Migrations:        /supabase/migrations/
Design System:     CLAUDE.md (Design Tokens section)
Content Schema:    /content/subjects/_schema.ts
Utils:             /lib/utils/
Supabase Client:   /lib/supabase/
```

## Feature Checklist (Before Pushing)

```
CODE:
☐ npm run type-check (0 errors)
☐ npm run lint (0 errors)
☐ Existing patterns matched
☐ No new comments (only why)
☐ CLAUDE.md constraints met (mobile, auth, design)

BROWSER:
☐ Feature works at 375px width (mobile)
☐ Feature works at 1920px width (desktop)
☐ Can't see other users' data (RLS working)
☐ Design tokens match (christ-blue, etc.)

GIT:
☐ Commit message follows format
☐ Pushed to claude/* branch only
☐ PR includes test plan
```

## When to Use Agents

| Agent | When | Cost |
|-------|------|------|
| **Architect** | 3+ files affected or DB changes | 1,200 |
| **Code Synthesizer** | Direct implementation of task | Included |
| **Security Warden** | Auth, secrets, or input changes | 1,000 |
| **QA** | Complex business logic or edge cases | 800 |

## Emergency Checklist (If stuck)

```
❌ "I don't know what to code"
✅ Read CLAUDE.md and find similar pattern in codebase

❌ "This feature spans too many files"
✅ Ask Architect to decompose first

❌ "I'm getting type errors"
✅ Run npm run type-check locally

❌ "Code looks good but UI is broken"
✅ Use /verify to test in live browser

❌ "Not sure about architecture"
✅ Check CLAUDE.md architecture section

❌ "Don't know if my change is secure"
✅ Use /security-review before pushing
```

## Token Budget (Monthly)

**Optimal:** 100 features in 10,000 tokens = **100 tokens per feature**
- 30 bug fixes × 700 = 21,000 tokens
- 40 medium features × 2,200 = 88,000 tokens  
- 20 complex features × 4,500 = 90,000 tokens
- **Total with optimization:** ~100,000-120,000 tokens for 100 features

**Without optimization:** 250,000-300,000 tokens for same 100 features

**Savings: 60-65% = 150,000 tokens/month**

---

See `TOKEN_OPTIMIZATION.md` for detailed explanations and examples.
