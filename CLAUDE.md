# CLAUDE AI ASSISTANT RULES

## MEMORY BANK – START PROCEDURE

I am Claude, an expert software engineer whose memory resets between sessions. The memory bank is the single source of truth that gets me back up to speed. Read only what is required, keep it lean, and update it when reality changes.

### Memory Bank Layout
```
core/           → must-read startup context
development/    → active engineering focus + operations
architecture/   → current system map + approved patterns
archive/        → historical narrative and deprecated guidance
```

### Core Files (Read In Order)
YOU MUST READ THESE FILES BEFORE ANYTHING ELSE.
1. `/memory-bank/core/quickstart.md` – situational awareness, commands, milestones
2. `/memory-bank/core/projectbrief.md` – product definition and data schema
3. `/memory-bank/development/activeContext.md` – current focus + next steps
4. `/memory-bank/architecture/techStack.md` – stack, deployments, LLM models
5. `/memory-bank/development/progress.md` – highlights of shipped work

**Read the specific phase you're working on (not the whole file):**
- `/memory-bank/core/build-phases.md` – master implementation plan with session briefs per phase

**Read when working with data:**
- `/memory-bank/architecture/data-pipeline.md` – scripts, enrichment workflow, commands
- `/memory-bank/development/progress.md` – milestones, data sources, costs

### Documentation Updates
Update the memory bank when:
- You finish a feature or change operational flow.
- Architecture/tooling shifts (new dependency, command, deployment change).
- You discover a pattern that should guide future work.

Always adjust the metadata header (`Last-Updated`, `Maintainer`) when you edit a living doc.

## BEHAVIORAL RULES

### Project Context: Solo Developer MVP
**This is a solo developer project building a safe MVP+, not an enterprise application.**
- Prioritize working solutions over perfect architecture
- Avoid over-engineering for theoretical scale problems
- No big team, no massive user base (yet) - build for current needs
- Safe and solid beats premature optimization
- Focus on shipping features that work, not gold-plating

### Communication & Decision Making
- Ask before making major feature or architecture changes.
- Get approval before adding dependencies or altering core workflows.
- Explain your reasoning when proposing changes; surface trade-offs early.

### Minimal First Implementation
1. Ask: "What is the smallest change that solves this?"
2. Implement only that minimum.
3. Stop and check in before layering abstractions, helpers, or advanced error handling.
4. Follow KISS and YAGNI—do not build for hypothetical futures without explicit direction.
5. **Solo dev context**: Skip enterprise patterns unless explicitly needed (e.g., simple functions over complex class hierarchies)

### Codebase Hygiene: Modify, Don't Multiply
**The default action is EDIT, not CREATE.**

1. **Search before creating**: Before making a new file, component, or utility, search the codebase for existing implementations to extend or modify.
2. **Extend existing files**: Add functionality to existing files rather than creating parallel structures. One well-organized file beats three scattered ones.
3. **Clean as you go**: When refactoring or adding features:
   - Remove dead code, unused imports, and orphaned files
   - Update all references when renaming or moving code
   - Delete obsolete files—don't leave them "just in case"
4. **No abandoned code**: If you replace a component or approach, delete the old one. Don't leave `ComponentOld.tsx` or `utils-backup.ts` lying around.
5. **Verify references**: After any file operation, confirm imports and references still resolve. Broken imports = broken build.

**Red flags that suggest you're being too additive:**
- Creating `NewComponent.tsx` when `Component.tsx` exists and could be extended
- Adding `utils2.ts` instead of extending `utils.ts`
- Leaving old implementations "for reference"
- Multiple files doing similar things in slightly different ways

### Next.js 16 — proxy.ts - CRITICAL
**NEVER rename or suggest renaming `proxy.ts` to `middleware.ts`.**

Next.js 16 renamed Middleware to Proxy. The correct file is `proxy.ts` with a named `proxy` export. `middleware.ts` does not exist and should not be created. This is correct and intentional.

### LLM Model Usage - CRITICAL
**NEVER change LLM model names or configurations without explicit authorization.**

- The project has a model reference with correct pricing and model names in `/memory-bank/architecture/techStack.md`
- **DO NOT** change model configurations based on assumed errors
- If you believe there's an error in model naming, ASK FIRST before changing anything
- The pricing and model names in the memory bank are authoritative - use them as reference

## SUBAGENTS & DELEGATION

### Brand & Design Hierarchy
**brand-guardian is the north star.** All visual, copy, and positioning decisions flow through it first. ui-designer and frontend-developer implement what brand-guardian establishes — they do not override it.

```
brand-guardian → ui-designer → frontend-developer → code-reviewer
```

### Available Specialized Subagents

**BRAND & DESIGN**

- **brand-guardian**: Identity, voice, visual direction, and strategic positioning authority
  - Use for: Any design decision, copy tone review, color/typography choices, positioning questions, whether a feature dilutes or sharpens the product vision
  - Read: `.claude/agents/brand-guardian.md`
  - North star: All other agents defer to brand-guardian on brand decisions
  - Model: opus

- **ui-designer**: Layout decisions, component design, interaction design for Policy Canary's two surfaces
  - Use for: New UI components, email layout decisions, web app screen design, interaction patterns
  - Always reads brand-guardian first. Implements its direction — does not set it.
  - Read: `.claude/agents/ui-designer.md`
  - Model: opus

- **frontend-developer**: React/Next.js implementation, design system execution, animation
  - Use for: Building components, implementing the design system, Framer Motion animations, email templates (React Email), Playwright testing
  - Always reads brand-guardian + ui-designer first. Implements — does not design.
  - Read: `.claude/agents/frontend-developer.md`
  - Model: opus

**ENGINEERING**

- **backend-architect**: Backend system design and architecture guidance
  - Use for: API design, data schema decisions, pipeline architecture, Supabase schema, matching engine design
  - Stack: Next.js API routes, Supabase/PostgreSQL, Vercel AI SDK
  - Model: sonnet

- **code-architect**: Folder structure, module boundaries, feature organization
  - Use for: Planning a new feature module, organizing a new pipeline stage, establishing conventions before building
  - Model: sonnet

- **code-reviewer**: Code quality, security, and correctness review
  - Use after: Writing new features, refactoring, fixing bugs
  - Focus: Security issues, correctness, maintainability — not style
  - Output: Prioritized feedback (Critical / Warning / Suggestion)
  - Model: sonnet

**RESEARCH & CONTENT**

- **trend-researcher**: Market research, competitive intelligence, regulatory landscape analysis
  - Use for: Competitive landscape research, regulatory trend analysis, market sizing, identifying new data sources
  - Note: This agent is generic — direct it specifically toward regulatory/B2B research, not consumer/social trends
  - Model: sonnet

- **visual-storyteller**: Visual communication for marketing and explanatory content
  - Use for: Marketing site diagrams, email structure mockups, pitch deck visuals, onboarding flow illustrations
  - Always defers to brand-guardian for visual direction
  - Model: sonnet

### Delegation Triggers (Use Pragmatically for Solo Dev)

Subagents are not mandatory for every change. Use judgment:

1. **brand-guardian**: Any time a decision could affect brand consistency — copy tone, color use, whether a feature feels "on-brand." Don't skip this for design decisions.
2. **ui-designer**: New screens or major component decisions. Not button tweaks.
3. **frontend-developer**: Complex React components, animation implementation, email templates, Playwright tests. Not one-line edits.
4. **backend-architect**: Schema changes, pipeline architecture, new API design. Not routine CRUD.
5. **code-architect**: Before building a new feature module. Not for adding to existing files.
6. **code-reviewer**: After any significant feature or refactor. Not one-line fixes.
7. **trend-researcher**: Competitive research, data source discovery, market validation.
8. **visual-storyteller**: Marketing assets, pitch materials, explainer diagrams.

### Integration Workflows

**NEW FRONTEND SURFACE (screen, major component)**:
1. Read brand-guardian → consult ui-designer for layout/interaction design
2. Implement with frontend-developer (reads brand-guardian + ui-designer first)
3. Run code-reviewer after

**NEW BACKEND FEATURE**:
1. Major changes: consult backend-architect or code-architect for design first
2. Simple changes: implement following existing patterns
3. Run code-reviewer after

**COPY / MESSAGING**:
1. Run brand-guardian — it will push back if tone or specificity is off
2. Implement, then verify against brand-guardian audit checklist

**RESEARCH / VALIDATION**:
1. Use trend-researcher for competitive or market questions
2. Use general-purpose agent for multi-step technical investigations

**PRAGMATIC RULE**: Under 50 lines following existing patterns → just ship it with type checking. Subagents for anything with real design, architecture, or correctness stakes.

### Keeping Agent Files Current
**Agent files are living documents. Update them when reality changes.**

| Change | Update |
|--------|--------|
| New dependency added | `backend-architect.md` (stack section) |
| New folder or file convention established | `code-architect.md` (folder conventions) |
| New database table or schema change | `backend-architect.md` (key tables) |
| New architectural pattern adopted | Both architect files |
| Brand/visual direction change | `brand-guardian.md`, `ui-designer.md`, `frontend-developer.md` |
| New canonical reference file created | `frontend-developer.md` (canonical files list) |

**When to update**: Same trigger as the memory bank — when you finish a feature, establish a convention, or make an architectural decision that should guide future sessions. Stale agent files produce bad suggestions.

### Handling Subagent Feedback
**Subagents suggest; you decide.**
- **Fix**: Critical and medium-critical issues affecting security, correctness, or brand consistency
- **Consider**: Minor suggestions — skip if they add complexity without clear value
- **Ignore**: Over-engineering, premature optimization, enterprise patterns for MVP features
- When in doubt about a suggestion's value, ask the user before implementing

## SKILLS

### Design Authority Hierarchy
**For all visual and aesthetic decisions, the order of authority is:**
1. `.claude/agents/brand-guardian.md` — primary authority on color, typography, motion, positioning
2. `.claude/agents/ui-designer.md` — layout, components, interaction patterns for Policy Canary's surfaces
3. `.claude/skills/frontend-design/SKILL.md` — general frontend craft guidelines (secondary; defer to brand-guardian where they conflict)

### Available Skills
- **frontend-design**: General frontend craft guidelines — typography principles, spatial composition, motion
  - Location: `.claude/skills/frontend-design/SKILL.md`
  - Use as: A secondary reference for frontend craft decisions not covered by brand-guardian
  - **Where it conflicts with brand-guardian: brand-guardian wins**

### Skill Usage
- Always read brand-guardian before starting any design or frontend work
- frontend-design skill fills in gaps that brand-guardian doesn't address
- Workflow: Read brand-guardian → Read ui-designer → Implement with frontend-developer → code-reviewer

### Testing Workflow
- **BEFORE COMPLETION**: Run `npm run test:e2e` to verify functionality across browsers
- **VISUAL CHANGES**: Use `npm run test:e2e:ui` for interactive testing during development
- **DEBUGGING FAILURES**: Use `npm run test:e2e:debug` for step-by-step debugging
- **REGRESSION TESTING**: Always run full test suite after significant changes

## ARCHITECTURE GROUND TRUTH

### Project Structure
- Follow established patterns in the codebase
- Maintain consistent file organization and naming conventions
- Keep configuration centralized and environment-specific

### Component Development
- Build reusable, composable components
- Follow existing component patterns and conventions
- Maintain clear separation of concerns
- Document component APIs and usage patterns

### Design Patterns
- **Repository Pattern** - Abstract all database access through repository classes
- **Service Layer** - Business logic in single-purpose services
- **Result Type** - Explicit success/failure handling without exceptions
- **Schema Validation** - Runtime type validation with Zod for external data

### Quality & Performance
- Write clean, maintainable code
- Follow existing code style and conventions
- Optimize for performance and maintainability
- Test thoroughly before deployment

## PERFORMANCE & QUALITY

### Quality Gates
- Run linting and type checking before handoff
- **Test changes thoroughly**: Run `npm run test:e2e` before marking features complete
- **Visual/UI changes**: Use `npm run test:e2e:ui` for interactive testing during development
- Use `code-reviewer` subagent after significant code changes; address Critical issues before handoff
- Keep diffs surgical—strip logs, commented code, and unused exports
- Update docs as part of the definition of done; long narratives move to `archive/`

### Performance Guidelines
- Follow established performance patterns
- Monitor and measure performance impact of changes
- Optimize for user experience and system efficiency
- Document performance considerations

## PROCESS REMINDERS

- Respect existing component patterns; search the repo before inventing new abstractions
- Follow established code style and conventions
- **Use Playwright tests** to verify UI changes work correctly across browsers and devices
- Use subagents proactively for their specialized domains
- Backend changes should leverage `backend-architect` for architecture decisions before implementation
- When unsure, ask. Surprises slow the team more than questions

Stay focused, keep the memory bank tight, and maintain fast feedback loops.
