# Claude Code Token Optimization Suite

**Your complete guide to building applications 50-60% faster with 40-50% fewer tokens.**

---

## 📚 Documentation Index

Start here based on your needs:

### **For First-Time Users**
1. **[QUICK_START.md](./QUICK_START.md)** ⭐ (5-minute read)
   - Copy-paste request templates
   - File locations and common paths
   - Decision tree for choosing workflow

### **For Detailed Learning**
2. **[TOKEN_OPTIMIZATION.md](./TOKEN_OPTIMIZATION.md)** (15-minute read)
   - Planning phase strategies
   - Implementation patterns
   - Anti-patterns to avoid
   - Token budgets by task type
   - Part 1-11: Comprehensive guide

### **For Visual Learners**
3. **[WORKFLOW.md](./WORKFLOW.md)** (10-minute read)
   - Workflow diagrams for different task types
   - Timeline estimates
   - Token budget calculator
   - Daily target tracking

### **For Real-World Examples**
4. **[EXAMPLES.md](./EXAMPLES.md)** (15-minute read)
   - Before/after comparisons
   - 4 detailed case studies
   - Token savings breakdown
   - Key takeaways

### **For Configuration**
5. **[SETTINGS_RECOMMENDATION.md](./SETTINGS_RECOMMENDATION.md)** (10-minute read)
   - Recommended settings.json
   - Pre-commit hooks
   - Terminal aliases
   - Performance optimization

### **Master Reference**
6. **[CLAUDE.md](./CLAUDE.md)** (Original - still valid)
   - Project stack overview
   - Architecture details
   - Database schema
   - Design tokens
   - Key constraints

---

## 🚀 Quick Start (2 minutes)

### Three Rules for Token Optimization

```
1. Always include exact file paths + line numbers
   ✅ "Update /app/student/page.tsx lines 45-50"
   ❌ "Update the student page somewhere"

2. Read CLAUDE.md before asking questions
   ✅ "This contradicts the mobile-first constraint in CLAUDE.md"
   ❌ "How should I handle mobile?"

3. Run npm checks before requesting review
   ✅ npm run type-check && npm run lint → 0 errors
   ❌ "Can you fix these type errors?"
```

**Impact:** 50-60% fewer tokens per feature

---

## 📊 Token Budget by Task

| Task Type | Budget | How Long | Guide |
|-----------|--------|----------|-------|
| Bug fix (1 file) | ~800 | 45 min | QUICK_START |
| Small feature (2-3 files) | ~2,500 | 2 hours | QUICK_START |
| Medium feature (4-5 files) | ~3,500 | 3 hours | TOKEN_OPTIMIZATION |
| Complex feature (3+ modules) | ~5,000 | 4-6 hours | WORKFLOW + EXAMPLES |
| Database optimization | ~1,500 | 1-2 hours | TOKEN_OPTIMIZATION |
| Code review | ~600 | 30 min | Use `/code-review` |
| Verification/testing | ~400 | 20 min | Use `/verify` |

**Monthly (20 features):**
- With optimization: ~50,000 tokens
- Without optimization: ~120,000 tokens
- **Savings: 70,000 tokens (58%)**

---

## ✅ Pre-Request Checklist

Use this every time before writing a request:

```
PREPARATION (5 minutes):
☐ git fetch origin <your-branch>
☐ git diff main --stat
☐ Read CLAUDE.md sections relevant to your task
☐ npm run type-check (locally, should pass)
☐ npm run lint (locally, should pass)

REQUEST WRITING (5 minutes):
☐ Include exact file paths
☐ Include line numbers (e.g., "lines 45-60")
☐ List constraints from CLAUDE.md
☐ Reference existing patterns in codebase
☐ Describe what should change (not vague "improve")

AFTER IMPLEMENTATION:
☐ npm run type-check (verify 0 errors)
☐ npm run lint (verify 0 errors)
☐ npm run dev (manual browser test)
☐ Test at 375px mobile width
☐ Commit with test plan
☐ Push to claude/* branch

REVIEW:
☐ Use /code-review for complex changes
☐ Use /verify to test in live browser
☐ Apply feedback and re-run checks
☐ Create PR with description
```

---

## 🎯 Common Scenarios

### "I found a bug"
→ See **QUICK_START.md** — "For Bug Fixes"

### "I'm building a new feature"
→ See **WORKFLOW.md** — Choose based on file count

### "I'm not sure how to structure this"
→ See **TOKEN_OPTIMIZATION.md** Part 1 — Ask Architect first

### "I want to optimize database queries"
→ See **EXAMPLES.md** Example 4 — Use Supabase skill

### "I want to understand token costs"
→ See **EXAMPLES.md** — Real before/after comparisons

### "I need faster development"
→ See **SETTINGS_RECOMMENDATION.md** — Configure your environment

---

## 📋 Request Templates (Copy & Paste)

### Template 1: Bug Fix
```
Bug: [One-sentence problem description]

File: /path/to/file.tsx (lines X-Y)

Current: [Show the buggy code]
Fix: [Show what it should be]
Why: [Brief explanation]

Test: [How to verify it works]
```

### Template 2: Medium Feature
```
Feature: [Name]

Files affected:
- /path/file1.tsx (lines X-Y: change Z)
- /path/file2.ts (add function abc)

Constraints: [From CLAUDE.md]
- ✅ Mobile at 375px
- ✅ RLS by user_id
- ✅ Design tokens only

Reference patterns: [Which existing files]
- Styling: /components/mission-card.tsx
- Server action: /app/actions/grading.ts
- Layout: /app/student/dashboard/page.tsx

Test plan: [Steps to verify]
```

### Template 3: Complex Feature
```
Feature: [Name - 1 sentence]

Scope question: [What to decompose first]
- [Decision 1?]
- [Decision 2?]
- [Decision 3?]

Please use Architect to decompose, then I'll code each node.
```

---

## 🎓 Learning Path

**Week 1: Understand the Basics**
1. Read QUICK_START.md (5 min)
2. Read TOKEN_OPTIMIZATION.md Part 1-2 (10 min)
3. Complete 1-2 small features using templates

**Week 2: Optimize Your Workflow**
1. Read EXAMPLES.md (15 min)
2. Read WORKFLOW.md (10 min)
3. Update your settings (15 min)
4. Complete 3-5 medium features

**Week 3: Master Complex Features**
1. Read TOKEN_OPTIMIZATION.md Part 3-5 (15 min)
2. Use Architect for next complex feature
3. Track token usage

**Week 4: Optimize and Refine**
1. Review SETTINGS_RECOMMENDATION.md
2. Set up pre-commit hooks
3. Create terminal aliases
4. Track monthly token usage

---

## 📈 Success Metrics

### You're doing it right when:

✅ **Per-feature tokens:** ~1,500-5,000 (vs. 4,000-12,000 without optimization)
✅ **First request clarity:** 90%+ chance of 1-round implementation
✅ **Local checks passing:** 100% before pushing
✅ **Review cycles:** 0-1 (vs. 3-5 without optimization)
✅ **Features per month:** 20-30 with high quality
✅ **Monthly tokens:** ~50,000-70,000 (vs. 120,000-180,000)

### Track in a spreadsheet:

```
Date | Feature | Type | Tokens | Status | Notes
-----|---------|------|--------|--------|------
6/25 | Bug fix | Fix | 850 | Done | Exact lines helped
6/25 | Card | Small | 2400 | Done | Referenced patterns
6/25 | Milestone | Complex | 5200 | Done | Used Architect
```

**Weekly goal:** Features completed / tokens spent < 1 feature per 2,500 tokens

---

## 🔗 External References

Keep these bookmarked for quick lookup:

- **[CLAUDE.md](./CLAUDE.md)** — Project stack, constraints, design tokens
- **[Supabase Postgres Best Practices](../.agents/skills/supabase-postgres-best-practices/SKILL.md)** — Query optimization
- **[Your architecture patterns](../iot-at-christ/)** — Study existing components

---

## ❓ Common Questions

**Q: Should I always use Architect?**
A: Only for 3+ files or database changes. Bug fixes and small features go direct.

**Q: What if I need clarification during implementation?**
A: That means your request wasn't clear. Go back to QUICK_START and use templates.

**Q: Can I ignore CLAUDE.md constraints?**
A: No. They exist to prevent 1,000-2,000 token rework cycles. Always check first.

**Q: How do I know if I'm wasting tokens?**
A: If you're asking 3+ clarification questions per feature, you need clearer requests.

**Q: Should I commit before tests pass?**
A: Never. Run npm run type-check && npm run lint locally first.

**Q: What's the minimum request quality?**
A: File paths + line numbers + constraints + reference patterns. No vague requests.

---

## 🎯 Your Next Steps

1. ✅ Read this README (right now - 5 min)
2. ⬜ Read QUICK_START.md (bookmark it - 5 min)
3. ⬜ Read TOKEN_OPTIMIZATION.md Part 1 (understand planning - 10 min)
4. ⬜ Try one small feature using the template (20 min)
5. ⬜ Update settings.local.json with allowlist (5 min)
6. ⬜ Review EXAMPLES.md for real comparisons (15 min)

**Total: 60 minutes → Forever better token efficiency**

---

## 📞 Need Help?

- **"Where's the X feature?"** → Check `.CLAUDE/` folder or search
- **"How do I optimize Y?"** → Read TOKEN_OPTIMIZATION.md
- **"What's the pattern for Z?"** → Check EXAMPLES.md or your codebase
- **"Am I doing this right?"** → Compare to EXAMPLES.md before/after

---

## 🏁 You're Ready!

You now have:
- ✅ Token optimization guides
- ✅ Request templates
- ✅ Workflow diagrams
- ✅ Real examples
- ✅ Settings recommendations

**Start with QUICK_START.md and reference others as needed.**

**Expected outcome: 50-60% fewer tokens, 30-40% faster delivery.**

Good luck! 🚀

---

*Last updated: 2026-06-25*
*For updates, check `.CLAUDE/` folder*
