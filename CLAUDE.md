# CLAUDE AI ASSISTANT RULES

## CRITICAL RULES (never violate)

**NEVER rename `proxy.ts` to `middleware.ts`.** Next.js 16 renamed Middleware to Proxy. `proxy.ts` with a named `proxy` export is correct.

**NEVER change LLM model names or configurations without explicit authorization.** Model reference: `/.koda/memory/tech-stack.md`. Ask first if you think there's an error.

**Ask before adding dependencies or altering core workflows.** This is a solo dev MVP — no surprises.

## PROJECT MEMORY — START PROCEDURE

Project knowledge lives in `/.koda/memory/` (one topic per note, indexed in `MEMORY.md`). Koda sessions auto-load the index + active context; in any other session, read these first:
1. `/.koda/memory/MEMORY.md` — index of all notes (one line each — open only what the task needs)
2. `/.koda/memory/active-context.md` — current focus + next steps
3. `/.koda/memory/quickstart.md` — situational awareness, commands, milestones
4. `/.koda/memory/tech-stack.md` — stack, deployments, LLM models
5. `/.koda/memory/changelog.md` — recently shipped work (one line per change; add a line when you ship)

**Read on demand (not every session):** the other notes in the index — `data-schema`, `llm-data-flow`, `project-brief`, `dev-context` (migrations + deploy state), `clawdbot` (Anton), `intelligence-pages`, `blog-editorial-voice`. Frozen history (Mar–Apr 2026 progress table, build-phase plans) is in `/.koda/memory/archive/`. RB's readable research and plans are in `/Documents/` (research/, plans/).

**Update the memory** when you finish a feature, shift architecture/tooling, or discover a reusable pattern: update the existing topic note (a new note is earned only by a genuinely new system or decision), keep its `description:` frontmatter and `MEMORY.md` index line in sync, and update `Last-Updated` headers.

**Changelog discipline** (`/.koda/memory/changelog.md`):
- When work ships (commit / deploy / publish), add its entry **in the same session** — not at tidy time.
- ONE line per change: what changed + why it matters, ending with the commit hash. Detail lives in the commit message or the relevant topic doc, never in the changelog.
- Newest date first. Check whether today's `## YYYY-MM-DD` section already exists before adding one — append to it, don't create a duplicate section.
- Docs-only or trivial commits don't need a line; anything a future session would want to know about does.
- Do not add new rows to the frozen milestone table in `archive/progress-2026-03.md`.

## BEHAVIORAL RULES

### Solo Developer MVP Context
- Prioritize working solutions over perfect architecture
- Skip enterprise patterns unless explicitly needed
- Safe and solid beats premature optimization

### Minimal First Implementation
1. Ask: "What is the smallest change that solves this?"
2. Implement only that minimum
3. Stop and check in before layering abstractions or advanced error handling
4. KISS and YAGNI — do not build for hypothetical futures

### Modify, Don't Multiply
**The default action is EDIT, not CREATE.**

- Search before creating — extend existing files rather than creating parallel structures
- Clean as you go — remove dead code, unused imports, orphaned files
- If you replace something, delete the old one. No `ComponentOld.tsx` or `utils-backup.ts`
- After any file operation, verify imports and references still resolve

**Red flags:** Creating `NewThing.tsx` when `Thing.tsx` could be extended. Adding `utils2.ts`. Leaving old implementations "for reference."

## SUBAGENTS

### Design Hierarchy
```
brand-guardian → ui-designer → frontend-developer → code-reviewer
```
brand-guardian is the north star. All visual, copy, and positioning decisions flow through it. Others implement — they don't override it.

### When to Use (Pragmatic for Solo Dev)

| Agent | Use for | Skip for |
|-------|---------|----------|
| brand-guardian | Design decisions, copy tone, color, positioning | - |
| ui-designer | New screens, major component decisions | Button tweaks |
| frontend-developer | Complex React components, animations, email templates | One-line edits |
| backend-architect | Schema changes, pipeline architecture, new API design | Routine CRUD |
| code-architect | New feature modules, folder structure | Adding to existing files |
| code-reviewer | After significant features or refactors | One-line fixes |
| legal-compliance-checker | Privacy policy, ToS, disclaimers, AI disclosure | - |
| trend-researcher | Competitive research, data source discovery | - |
| visual-storyteller | Marketing assets, pitch materials, diagrams | - |

**Under 50 lines following existing patterns → just ship it with type checking.** Subagents for anything with real design, architecture, or correctness stakes.

### Subagent Feedback
- **Fix**: Critical/medium issues (security, correctness, brand consistency)
- **Consider**: Minor suggestions — skip if they add complexity without clear value
- **Ignore**: Over-engineering, premature optimization, enterprise patterns
- When in doubt, ask the user

### Workflows (condensed)
- **Frontend**: brand-guardian → ui-designer → frontend-developer → code-reviewer
- **Backend**: backend-architect (major) or just build (minor) → code-reviewer
- **Copy/Legal**: legal-compliance-checker → brand-guardian → implement

### Keeping Agent Files Current
Update `.claude/agents/*.md` files when you finish a feature, add dependencies, change schema, or adopt new patterns. Stale agent files produce bad suggestions.

## QUALITY GATES

- Run `npm run type-check` before handoff
- Run `npm run test:e2e` before marking features complete (use `test:e2e:ui` for visual dev)
- Use code-reviewer subagent after significant changes; fix Critical issues before handoff
- Keep diffs surgical — strip logs, commented code, unused exports
- Update `.koda/memory/` notes as part of definition of done — including the one-line changelog entry for anything shipped

## DESIGN AUTHORITY

For visual/aesthetic decisions, authority order:
1. `.claude/agents/brand-guardian.md`
2. `.claude/agents/ui-designer.md`
3. `.claude/skills/frontend-design/SKILL.md` (secondary — brand-guardian wins on conflicts)

## DESIGN PATTERNS

- **Repository Pattern** — abstract database access through repository classes
- **Service Layer** — business logic in single-purpose services
- **Result Type** — explicit success/failure handling without exceptions
- **Schema Validation** — runtime type validation with Zod for external data
