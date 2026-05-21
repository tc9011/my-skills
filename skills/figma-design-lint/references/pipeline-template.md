# Pipeline-Based Multi-Page Audit

## Overview

For multi-page audits, use a `pipeline.md` file to track page evaluation status. This enables:
- Parallel subagent evaluation of pages
- Persistent state across agent turns
- Automatic continuation until all pages are evaluated

## Pipeline File Format

Create `reports/pipeline.md` alongside the report files:

```markdown
# Design Audit Pipeline

**File**: {figma_file_name}
**Section**: {section_name}
**Created**: {YYYY-MM-DD HH:MM:SS}
**Batch size**: {N pages per subagent}

## 待评估 (Pending)

- [ ] {page_name} | {node_id} | {width}×{height}
- [ ] {page_name} | {node_id} | {width}×{height}
...

## 评估中 (In Progress)

## 已评估 (Completed)

## 跳过 (Skipped)
```

## Pipeline Workflow

### Phase 1 — Setup (main agent)

1. Call `get_variable_defs` once for file-level tokens.
2. Call `get_metadata` on section root to discover all pages.
3. Filter pages using the heuristics in SKILL.md §0e.
4. Create `reports/pipeline.md` with ALL discovered pages in the `## 待评估` section.
5. Store the metadata XML and token data — subagents will need them.

### Phase 2 — Parallel Evaluation Loop

> ⛔ **ONE batch at a time.** Dispatch a batch of subagents, wait for ALL of them to complete, then check for remaining pages and dispatch the next batch. Never have two batches in flight simultaneously — this prevents race conditions on `pipeline.md`.

**Repeat until `## 待评估` is empty:**

1. **Read** `reports/pipeline.md` — count items in `## 待评估`.
2. **Batch** — pick up to N pages from `## 待评估` (see batching rules below).
3. **Move** selected pages from `## 待评估` to `## 评估中`, marking them with the subagent batch ID.
4. **Dispatch** subagents with `task(run_in_background=true)`:
   - Each subagent receives its assigned pages' metadata + shared tokens.
   - Each subagent returns structured markdown results (no HTML). See `references/subagent-template.md` for the exact output contract.
5. **Wait** for ALL subagents in this batch to complete via `background_output()`.
6. **Update** `reports/pipeline.md`:
   - Move completed pages from `## 评估中` to `## 已评估` with score: `- [x] {page_name} | {node_id} | Score: {score}/100`
   - Move failed/skipped pages to `## 跳过` with reason.
7. **Check** `## 待评估` again — if items remain, go to step 2.

### Phase 3 — Aggregation (main agent)

Only after `## 待评估` and `## 评估中` are both empty:

1. Collect all per-page results from subagent outputs.
2. Compute overall score: **equal-weight average** across all evaluated pages. Skipped pages are excluded from the average.
3. Identify cross-page patterns (issues appearing in 3+ pages).
4. Generate combined `report.md` and `summary.html`.
5. Update `reports/pipeline.md` with final status:

```markdown
## 状态 (Status)

✅ All {N} pages evaluated.
Overall Score: {score}/100
Report: reports/{name}-{timestamp}.html
```

## Batching Rules

| Pages remaining | Subagents | Pages per subagent |
|----------------|-----------|-------------------|
| 1–3            | 0 (inline) | All inline        |
| 4–20           | 2         | ~10 each          |
| 21–40          | 3         | ~12 each          |
| 40+            | 4 (max)   | ceil(N/4) each    |

## Pipeline Check Rule (MANDATORY)

> ⛔ After EVERY batch of subagent completions, you MUST re-read `reports/pipeline.md` and check for remaining items in `## 待评估`. If any remain, dispatch the next batch. Do NOT proceed to Phase 3 until both `## 待评估` and `## 评估中` are empty.

## Error Handling

- If a subagent fails, move its pages back to `## 待评估` for retry.
- After 2 retries for the same page, move to `## 跳过` with reason.
- Always proceed to Phase 3 even if some pages are skipped — report partial results.
