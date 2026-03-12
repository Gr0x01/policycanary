# HEARTBEAT

## How This Works
You're Anton. This file is your work queue. Every 30 minutes you wake up, read SESSION-STATE.md first, then this file. Work the top task, update both files, go back to sleep.

**Rules:**
- No tasks (either section) → run a business pulse (see AGENTS.md Heartbeat Protocol), then HEARTBEAT_OK if nothing needs attention
- Rashaad's tasks always come first
- Anton's Queue is for work YOU identified — patterns, opportunities, things a cofounder would notice
- One task per heartbeat. Complete it, save results, remove it from this file.
- Max 8 tool calls. Save progress and stop if you hit the limit.
- Blocked → note why in SESSION-STATE.md, demote to P3, move on. Don't retry across heartbeats.
- No search loops: 0 results → one different query → still 0 → STOP.
- After work, update SESSION-STATE.md and append to today's daily note (`memory/YYYY-MM-DD.md`).
- Spawn sub-agents for heavy work (5+ tool calls). Models: haiku (simple), flash (research), sonnet (writing), opus (complex).

**Channels (use IDs only, names don't work):**
| Channel | ID |
|---------|-----|
| #anton | `channel:C0AJX2E8087` |
| #pc-content | `channel:C0AKRB695UH` |
| #pc-outreach | `channel:C0AK62A92D9` |
| #finch-content | `channel:C0AK62AKJP5` |
| #finch-outreach | `channel:C0AK62DKGUB` |

**Notion DBs:**
| DB | ID |
|----|-----|
| Finch Prospects | `af1158fa-a062-404f-8115-3c5852bfacfd` |
| PC Outreach | `35eed485-69e4-4c67-83ef-f39b07b1e7a5` |

---

## Tasks (from Rashaad)
- P1: Expand upgrade revenue benchmark. Toll Brothers is the only 10-K with explicit data. Next: search earnings call transcripts and investor presentations for NVR, Meritage, Tri Pointe, Dream Finders — builders sometimes disclose upgrade metrics verbally. Also check ProBuilder, Builder Magazine, and John Burns Research for any published survey data. [finch]
- P2: Review the Wednesday FDA batch (expected tomorrow AM) for supplement/food warning letters. [policy-canary]

## Anton's Queue
<!-- Work you identified yourself. Lower priority than Rashaad's tasks. -->
<!-- Format: - P[1-3]: [task] — [why this matters] [pc/finch] -->

---

## Goal
5 Policy Canary pilots + 5 Finch pilots by May 5, 2026.

## Priority Order
1. Draft outreach for prospects that don't have drafts yet (Rashaad can't send what doesn't exist)
2. Expand pipelines toward 100+ each (research new prospects, add to Notion)
3. Prospect-specific research that sharpens individual outreach messages
4. Check for pipeline movement (Notion status changes, David Rice accept, Registrar Corp reply)
5. Content ONLY when the current backlog is published (don't write more if drafts are sitting in review)

## Current Numbers
- Finch: ~167 prospects, 135 drafts ready, 3 connected (David Rice, Marci Banning, Mary Mead), 1 reply (Kimberly Stanley — redirect)
- PC: ~107 prospects, 89 drafts ready, 68 with full contact data (person + LinkedIn URL + draft)
- LinkedIn send rate: 5/day max (25/week) to avoid account restrictions
- New channel: Facebook groups for Finch (Sales & Marketing Councils)
- New channel: Enforcement-triggered content for PC (inbound via SEO)

## Waiting On
- David Rice (NewHomeStar) — follow-up ~March 14
- Marci Banning (Westin Homes) — follow-up ~March 15
- Mary Mead (ICI Homes) — follow-up ~March 15
- Registrar Corp partnership — applied March 10
- James Chaukos — waiting for builder name

## Content Schedule
- Wed: PC LinkedIn post → #pc-content
- Mon: Finch LinkedIn post → #finch-content
- Fri: PC weekly roundup → #pc-content
