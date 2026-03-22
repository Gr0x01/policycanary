# Claude Cowork: Practitioner Research & Best Practices

**Date**: 2026-03-12
**Purpose**: Real-world usage patterns, best practices, creative workflows, and limitations

---

## 1. WHAT COWORK ACTUALLY IS

Cowork is a separate tab in Claude Desktop that shifts Claude from chatbot to agent. You point it at a folder, describe an outcome, and it works autonomously -- reading files, creating documents, browsing the web, pulling data from connected tools, and writing outputs directly to your computer.

**Key architectural facts:**
- Runs in an isolated VM on your local machine (sandboxed from main OS)
- Requires Claude Desktop to stay open and computer to stay awake
- No cross-session memory (every session starts fresh)
- File access is permission-gated (you grant folder access explicitly)
- Sub-agents enable parallel workstreams within a single task
- Plugins bundle skills + connectors + commands + sub-agents into packages
- Scheduled tasks via `/schedule` command (daily, weekly, monthly cadence)
- MCP connectors for 100+ external tools (Slack, Notion, Gmail, Stripe, Supabase, etc.)

**Plans**: Available on Pro ($20/mo), Max, Team, and Enterprise tiers.

---

## 2. BEST PRACTICES: SETUP

### 2a. Global Instructions (Settings > Cowork)

These persist across ALL sessions. Use them for evergreen preferences. The consensus is: **the fix isn't better prompts -- it's better setup.**

**What to include:**
- Your role, industry, timezone, work style
- Communication preferences (bullet points vs prose, conciseness level)
- Output format defaults (markdown vs Excel vs structured)
- Behavioral rules ("always ask before deleting", "show plan before executing")
- Tool preferences ("prefer Notion over Google Docs")

**Example template structure:**
```
BEFORE EVERY TASK:
1. Read ABOUT ME/ folder. No task starts without reading both files.
2. If the task relates to a project, read everything in the matching PROJECTS/ subfolder.
3. If the task involves a content type with a matching TEMPLATES/ pattern, study the template first.

ABOUT ME:
- Role: [your role]
- Industry: [your industry]
- Timezone: [timezone]
- Work style: Direct, concise, no corporate jargon

COMMUNICATION:
- Use bullet points for lists
- Keep explanations brief
- When suggesting options, rank by recommendation
- Always show your plan before multi-step execution

SAFETY:
- Never delete files without confirmation
- Flag assumptions explicitly
- Back up before bulk operations
```

### 2b. Context Files (The Highest-ROI Setup)

Small markdown files in your working folder that Cowork reads automatically. Three are considered essential:

1. **about-me.md** -- Role, responsibilities, success metrics, industry context, tools you use, examples of quality work
2. **voice-and-style.md** (or brand-voice.md) -- Tone preferences, formatting conventions, vocabulary to avoid, writing samples you admire
3. **working-rules.md** (or working-preferences.md) -- Process preferences, output formats, file naming conventions, guardrails, behavioral rules

**Key insight**: "Every week you refine these files, Claude gets better at your specific work." They compound over time.

### 2c. Folder Structure

Recommended structure for a Cowork working directory:
```
thoughts/     -- unstructured ideas
ideas/        -- exploration-ready concepts
todo/         -- files to process
outputs/      -- Claude-generated deliverables
done/         -- completed work
references/   -- read-only context (CLAUDE.md, branding docs, memory files)
templates/    -- reusable output structures
projects/     -- project-specific subfolders with their own context
```

### 2d. The Three-Question Method (Before Every Task)

1. **What does "done" look like?** (specific end state, not vague goals)
2. **What context does Claude need?** (files, constraints, examples)
3. **What can't it guess?** (guardrails, edge cases, preferences)

**Good delegation example:**
"End state: Downloads folder sorted into ~/Sorted/photos, ~/Sorted/documents, ~/Sorted/other. Context: ~187 files, mostly .jpg/.pdf/.zip. Constraints: Move only -- no deletions. Output: what-moved.md listing counts per category."

**Bad delegation**: "Clean up my files" (too vague, no success criteria).

---

## 3. CREATIVE / POWER USER WORKFLOWS

### 3a. Solo Founder / COO Replacement

This is the use case most aligned with your situation. Key patterns:

**Morning Briefing (Daily Scheduled Task)**
- Fires at 7:30 AM
- Checks Slack channels, flags items needing response
- Summarizes overnight project activity
- Writes briefing to markdown file
- Context ready by the time you have coffee

**Content Pipeline (On-Demand)**
- Read all files in a content folder
- Extract brand voice patterns and top-performing formats
- Generate 30 content ideas ranked by estimated audience value
- Write full drafts for top 5
- Build publishing calendar in Excel with dates, platforms, repurposing plans

**Financial Monitoring**
- Stripe reporting on schedule (weekly/monthly)
- Invoice organization and bank reconciliation
- One user found a "$14,000/month pricing anomaly their data team missed for two quarters" using the Data Analysis plugin on 45,000 rows
- Subscription audit: "Most people discover $100-300/month in forgotten charges"

**Email Operations**
- Inbox zero assistant: categorizes messages, drafts responses, identifies newsletter bloat
- One example: "3,847 unread emails clearable in 15 minutes"

### 3b. MCP Server Integration Patterns

**Available connectors (as of Feb 2026):**
- Productivity: Slack, Notion, Asana, Linear, Jira, Google Calendar, Google Drive, Gmail
- Sales/Marketing: HubSpot, Apollo, Clay, Outreach, Similarweb
- Finance: Stripe, FactSet, Snowflake, BigQuery
- Legal: DocuSign, LegalZoom
- Dev: GitHub, Supabase (database ops, auth, storage, real-time)
- Content: WordPress, Canva
- General: Zapier (meta-connector)

**Supabase MCP specifically:**
- Full database ops, auth, storage, real-time features
- Manage projects, run SQL, interact with backend
- Relevant for Policy Canary: could query enrichment data, blog posts, intelligence pages directly from Cowork

**Slack MCP:**
- Surface insights, draft messages, engage teams directly
- Interactive and collaborative workflows within Slack channels

### 3c. Custom Plugin Development

**Plugin anatomy (four components):**
1. `commands/*.md` -- Slash commands (manual triggers like `/plugin:send-updates`)
2. `skills/*/SKILL.md` -- Instruction sets teaching Claude specific task execution
3. `.mcp.json` -- Connector configuration for external tools
4. `plugin.json` -- Manifest tying everything together

**Building plugins:**
- "Plugins are just files, and you can build them with Claude using simple words"
- Click "Customize" on installed plugins to iterate with Claude
- Anthropic open-sourced 11 of their internal plugins
- Enterprise admins can create private plugin marketplaces
- Pre-built templates: HR, Design, Engineering, Operations, Finance

**Real example -- Writing Plugin:**
- Consolidates polishing, structuring, and SEO optimization
- Single command: `/article-polish-pipeline:polish-article`
- Breaks complex writing process into discrete skills
- Connects to external services to reduce manual steps

### 3d. Sub-Agent Parallelization

**The big win:** "Processing 10 files in parallel instead of one-by-one turned a ~30 minute wait into about 4 minutes."

**How to trigger:** Explicitly request it:
```
Use sub-agents to process these 50 transcripts in parallel.
Extract themes, then synthesize into a unified report.
```

**Rules for effective sub-agents:**
- Tasks must be independent (no cross-dependencies)
- Each sub-agent should touch different files (no overlap)
- Request synthesis at the end (main agent combines findings)
- Be specific: "Use 5 parallel tasks" > "parallelize this"
- Test with dummy files first before processing critical data
- Each sub-agent gets its own context window (prevents quality degradation)

**Caveat:** Sub-agents cannot reliably cross-reference files. Works best for independent batch tasks, not interdependent analysis.

### 3e. Scheduled Task Workflows

**Setup:** Type `/schedule` in any Cowork task, or use sidebar > Scheduled.

**Tested workflows from practitioners:**
1. Daily morning email + calendar briefing (Gmail + Calendar connectors)
2. File organization by project (recurring, local files)
3. Apple Notes tidying (recurring cleanup)
4. Stripe reporting (weekly/monthly financial summaries)
5. Invoice organization + bank reconciliation
6. Flight price tracking (daily checks)

**Critical limitation:** Tasks only run while computer is awake and Claude Desktop is open. This is NOT a server-side cron -- it's local execution.

**Interesting behavior:** "Claude rewrites prompts based on what it learned" after the first run, optimizing instructions automatically for subsequent executions.

### 3f. Data Analysis Workflows

- CSV/Excel exploration with anomaly detection
- Can produce Excel workbooks with working formulas and multiple analysis tabs
- Connects to Snowflake/BigQuery for live data
- One practitioner analyzed 2,486 Medium articles into interactive insights
- Best for: structured data analysis, pattern detection, report generation

---

## 4. TIPS & TRICKS (Learned the Hard Way)

### What Works

1. **Always request a change-log.md** documenting every decision Claude makes
2. **Test with dummy files first** before processing critical data
3. **Stack multiple focused skills** instead of one monolithic skill (skills use ~2% of context window each; chunking prevents confusion)
4. **Use XML tags** for complex tasks to prevent mixing context, instructions, and constraints
5. **Front-load clarification** before execution (ask Claude to confirm its plan)
6. **Batch related tasks** into single sessions for efficiency
7. **Monitor token usage** weekly in Settings > Usage
8. **Use the Ideas Dashboard** for pre-filled prompts and suggested connectors
9. **Ask for source file tracing** in synthesis work (prevents hallucinated sources)
10. **Keep CLAUDE.md under 200 lines** -- longer files consume more context and reduce adherence
11. **Describe outcomes, not steps** -- tell Claude what "done" looks like, not how to get there

### What Doesn't Work

1. **Vague delegations** ("clean up my files", "help me with my business")
2. **Cross-file dependencies in sub-agents** (they can't reliably reference each other's work)
3. **Expecting cross-session memory** (every session starts completely fresh)
4. **Closing Claude Desktop mid-task** (kills the session)
5. **Sleep mode during scheduled tasks** (execution stops)
6. **Too many skills loaded** (may cause "forgot skill exists" behavior)
7. **Complex browser automation** on dynamic/JS-heavy pages (inconsistent)
8. **Heavy daily use on Pro tier** without monitoring usage (burns through allocation fast)

### Non-Obvious Capabilities

- **Claude can update folder instructions during sessions** as it learns about a project
- **Sub-agents each get their own context window** (prevents quality degradation on large tasks)
- **Conversation history stores locally** and isn't subject to Anthropic's standard data retention
- **Cowork activity is NOT captured in Audit Logs, Compliance API, or Data Exports** -- do not use for regulated workloads
- **Professional document outputs**: real Excel with working formulas, PowerPoint presentations, formatted PDFs (not just CSV dumps)
- **Network egress permissions** are respected, but web search operates independently of these restrictions

---

## 5. LIMITATIONS & GOTCHAS

### Fundamental Constraints

| Limitation | Impact | Workaround |
|-----------|--------|------------|
| No cross-session memory | Every session starts fresh | File-based context (CLAUDE.md, about-me.md, etc.) |
| Desktop must stay open | Tasks die if app closes | Don't close app mid-task; no server-side execution |
| Computer must be awake | Scheduled tasks stop on sleep | Disable sleep, or accept missed runs |
| Token consumption | Sub-agents and complex tasks burn through allocation fast | Monitor Settings > Usage; batch wisely |
| No audit logging | Activity not in compliance systems | Don't use for regulated workloads |
| Skills context budget | ~2% of window per skill; too many = degraded adherence | Fewer, more focused skills |

### Platform Bugs (as of March 2026)

- **Windows**: Significant VM/networking issues -- Cowork tab not showing, API connectivity failures, WSL2 internet breakage, reinstall button doing nothing
- **macOS**: Spinning wheel / unresponsive on macOS 26.3 requiring force quit
- **UI rendering**: Responses sometimes don't render until user types something
- **Hanging**: "Working through complex response" can hang indefinitely on sessions with many tool calls
- **30-minute heavy use**: App becomes unresponsive, requires full restart
- **Error messages mislead**: "API unreachable" may actually mean VM networking issue, not API problem

### Security Considerations

- Prompt injection risk (research preview status)
- File access limited to granted folders only (security boundary)
- VM isolation provides sandboxing, but still running on your machine
- Connector credentials stored locally

---

## 6. RELEVANCE TO POLICY CANARY

### What Could Work for Us

**Content Automation Enhancement:**
- Cowork + Supabase MCP could query enriched regulatory data directly, complementing what Anton already does
- Scheduled tasks for daily regulatory scanning summaries (but limited by desktop-must-be-open constraint)
- Plugin for blog/intelligence page drafting with brand voice enforcement

**Data Analysis:**
- Analyzing enrichment pipeline output quality
- Subscriber matching analysis
- Competitive intelligence research with structured output

**Operational Workflows:**
- Morning briefing from Slack channels (via Slack MCP)
- Weekly metrics summary from PostHog + Supabase
- Invoice/expense tracking for solo business operations

### What Won't Work for Us

- **Replacing Anton's cron jobs** -- Cowork requires desktop open + computer awake. Anton on Pi 5 runs 24/7.
- **Server-side automation** -- Cowork is fundamentally a local desktop tool, not infrastructure
- **Regulated workload processing** -- Cowork explicitly warns against this; regulatory data handling needs proper audit trails
- **Cross-session state** -- Anton's memory system (PARA + daily notes + TACIT.md) is more robust than Cowork's file-based workarounds

### Bottom Line for Solo Operator

Cowork is best as a **power multiplier for ad-hoc work** -- research, analysis, document creation, file organization, one-off data processing. It does NOT replace a persistent agent (like Anton) for scheduled, server-side automation. The two are complementary:

- **Anton**: Always-on, server-side, scheduled tasks, Slack integration, persistent memory
- **Cowork**: On-demand, local, interactive, great for complex one-off tasks with sub-agent parallelization

The setup investment (30 min for context files + global instructions) pays for itself quickly if you're doing any regular document creation, data analysis, or file organization work.

---

## Sources

### Official Documentation
- [Get Started with Cowork - Claude Help Center](https://support.claude.com/en/articles/13345190-get-started-with-cowork)
- [Schedule Recurring Tasks - Claude Help Center](https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-cowork)
- [Use Plugins in Cowork - Claude Help Center](https://support.claude.com/en/articles/13837440-use-plugins-in-cowork)
- [Plugins for Claude Code and Cowork - Anthropic](https://claude.com/plugins)
- [Cowork and Plugins Across Enterprise - Anthropic](https://claude.com/blog/cowork-plugins-across-enterprise)

### Practitioner Guides (Best Content)
- [Claude Cowork Guide for Power Users: 50+ Tips - Karo Zieminski](https://karozieminski.substack.com/p/claude-cowork-guide-plugins-memory-sub-agents-tips)
- [10 Claude Cowork Workflows That Actually Work - The AI Corner](https://www.the-ai-corner.com/p/10-claude-cowork-workflows-that-actually)
- [Claude Cowork Scheduled Tasks: 6 Ways I Automated My Work](https://aiblewmymind.substack.com/p/claude-cowork-scheduled-tasks-6-ways)
- [How to Properly Set Up Claude Cowork - Alex Banks](https://thesignal.substack.com/p/how-to-properly-set-up-claude-cowork)
- [Claude Cowork Plugins Guide](https://aiblewmymind.substack.com/p/claude-cowork-plugins-guide)
- [Turn Claude Cowork Into Your Personal COO](https://linas.substack.com/p/claudecowork)
- [Claude Cowork Setup Guide - The AI Corner](https://www.the-ai-corner.com/p/claude-cowork-setup-guide)

### Technical / Architecture
- [Claude Cowork Architecture Deep Dive: VM Isolation, MCP, and Agentic Loop](https://claudecn.com/en/blog/claude-cowork-architecture/)
- [How to Better Your Cowork Experience with MCPs - Composio](https://composio.dev/content/how-to-better-your-claude-cowork-experience-with-mcps)
- [pgEdge MCP Server for PostgreSQL with Cowork](https://www.pgedge.com/blog/how-to-use-the-pgedge-mcp-server-for-postgresql-with-claude-cowork)

### News / Analysis
- [Anthropic: Claude Code Transformed Programming, Now Cowork for Enterprise - VentureBeat](https://venturebeat.com/orchestration/anthropic-says-claude-code-transformed-programming-now-claude-cowork-is)
- [Anthropic Updates Claude Cowork - CNBC](https://www.cnbc.com/2026/02/24/anthropic-claude-cowork-office-worker.html)
- [Anthropic Launches Enterprise Agent Push with Plugins - TechCrunch](https://techcrunch.com/2026/02/24/anthropic-launches-new-push-for-enterprise-agents-with-plugins-for-finance-engineering-and-design/)
- [Claude Cowork Triggered $285B Software Selloff - The AI Corner](https://www.the-ai-corner.com/p/claude-cowork-the-tool-that-triggered)

### Bug Reports / Limitations
- [Cowork Windows Cannot Connect to API - GitHub Issue](https://github.com/anthropics/claude-code/issues/24918)
- [Cowork Tab Not Showing on Windows - GitHub Issue](https://github.com/anthropics/claude-code/issues/25136)
- [Failed to Start Workspace - GitHub Issue](https://github.com/anthropics/claude-code/issues/27801)
- [Responses Not Rendering - GitHub Issue](https://github.com/anthropics/claude-code/issues/26805)
- [Cowork Not Responding macOS - GitHub Issue](https://github.com/anthropics/claude-code/issues/32225)
- [Broken by Default: Cowork on Windows - Jonas Kamsker](https://blog.kamsker.at/blog/cowork-windows-broken/)
