---
description: Summarizes the current conversation and saves key insights to agent memory to keep future contexts lean
---

Analyze the current conversation and compress it into structured memory entries. Follow these steps exactly:

## Step 1 – Extract insights

Go through the entire conversation and identify:

- **Project facts**: architecture decisions, conventions, tech stack, build commands, folder structure, naming patterns
- **User preferences**: coding style, tools, workflows, communication preferences, things to avoid
- **Decisions made**: what was tried, what worked, what didn't, and why
- **Open tasks**: anything unresolved or explicitly noted as "todo"

Ignore small talk, repeated questions, and anything already obvious from the codebase.

## Step 2 – Check existing memory

Before writing, read the current memory files to avoid duplicates and identify outdated entries that should be replaced.

## Step 3 – Write to memory

Save each insight to the correct scope:

| Scope | What goes here |
|---|---|
| **User memory** | Personal preferences, coding style, general workflow patterns |
| **Repository memory** | Project-specific facts, conventions, decisions tied to this codebase |

Use short, dense bullet points. No prose. No redundancy.

Example format for repository memory:
```
- Uses conventional commits (feat/fix/chore/docs)
- API endpoints require JWT auth via Authorization header
- Repository pattern for all data access (no direct DB calls in controllers)
- Build: `npm run build`, Test: `npm test`, Dev: `npm run dev`
```

## Step 4 – Confirm

After writing, output a short summary of:
- What was saved (and where)
- What was skipped (and why)
- Whether anything outdated was replaced
