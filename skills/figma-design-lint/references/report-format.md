# Report Format Reference

Full markdown report templates for single-page and multi-page modes.

## Single-page report (`report.md`)

```markdown
# Figma Design Lint Report

**File**: [file name]
**URL**: [original URL]
**Audited**: [date] | [specific frame/page if scoped]

## Summary

- **Score**: X/100 ← MUST be out of 100, no other scale
- **P0 issues**: N (blocks codegen)
- **P1 issues**: N (causes messy code)
- **P2 issues**: N (reduces maintainability)
- **P3 issues**: N (minor improvements)
- **Verdict**: Ready / Needs Work / Not Ready

## Category Breakdown

MANDATORY: All 9 rows must appear. Score is computed from worst failed severity per category.

| # | Category | Weight | Score | Status | Failed Checks |
|---|----------|--------|-------|--------|---------------|
| 1 | File & Layer Organization | 10% | X/100 | ✅/⚠️/❌ | 1.2, 1.3 or "—" |
| 2 | Naming Conventions | 12% | X/100 | … | … |
| 3 | Layout Structure | 15% | X/100 | … | … |
| 4 | Component Usage | 12% | X/100 | … | … |
| 5 | Typography | 10% | X/100 | … | … |
| 6 | Color & Style Tokens | 10% | X/100 | … | … |
| 7 | Images, Icons & Assets | 6% | X/100 | … | … |
| 8 | State Completeness | 10% | X/100 | … | … |
| 9 | MCP/Codegen Readiness | 15% | X/100 | … | … |

**Overall = Σ(Score × Weight) = X/100**

Status mapping: ✅ Pass (100), ⚠️ Warn (60-75), ❌ Fail (0-40).

## Checklist Results

Full checklist with Pass/Fail for every item, grouped by category.

### 1. File & Layer Organization (Score: X/100)

| ID | Check Item | Result | Evidence |
|----|-----------|--------|----------|
| 1.1 | Nesting depth ≤6 levels | ✅ Pass | Max depth: 5 levels |
| 1.2 | No abandoned hidden nodes | ❌ Fail (P2) | 3 hidden nodes: Frame_abc, Group_xyz |
| 1.3 | Logical grouping | ✅ Pass | — |
| 1.4 | No empty frames | ✅ Pass | — |

### 2. Naming Conventions (Score: X/100)

| ID | Check Item | Result | Evidence |
|----|-----------|--------|----------|
| 2.1 | No default names (5+) | ❌ Fail (P1) | 12 default-named nodes found |
| 2.2 | No default names (1-4) | ✅ Pass | (N/A — 2.1 failed) |
| ... | ... | ... | ... |

(repeat for all 9 categories, all check items)

## Failed Check Details

For each failed check, provide full issue detail:

### [ID] [Check item description]

- **Category**: [which of the 9 categories — use exact name]
- **Severity**: P0/P1/P2/P3
- **Location**: `PageName › ParentFrame › NodeName` (ID: `2422:61196`, 400×855px)
  [🔗 Open in Figma](https://www.figma.com/design/{FILE_KEY}/{FILE_NAME}?node-id=2422-61196)
- **Evidence**: [exact data from MCP tool output proving the issue]
- **Problem**: [what's wrong and why it matters for codegen]
- **Fix**: [specific action to take in Figma]

> ⚠️ **Every failed check MUST have a Location field with breadcrumb path + Figma deep link.**
> - **Node-specific issues**: full breadcrumb from page root → node, plus dimensions and deep link
> - **Page-wide issues**: page name + ID + deep link. Example: `完整页面` (ID: `2422:61194`) [🔗 Open in Figma](…)
> - **Cross-cutting patterns**: list 2-3 example nodes with breadcrumbs and deep links
>
> **Deep link format**: `https://www.figma.com/design/{FILE_KEY}/{FILE_NAME}?node-id={NODE_ID}` — replace `:` with `-` in node IDs (e.g., `2422:61196` → `2422-61196`). The FILE_KEY and FILE_NAME come from the user's input URL.

## Systemic Patterns

Identify root causes that explain multiple check failures. Examples:

- "All elements use absolute positioning — suggests Auto Layout was never applied (causes 3.1, 9.1 failures)"
- "Token system shows signs of multiple design system migrations (causes 6.2, 6.4 failures)"

## Positive Findings

What the design does well. Always include this section — even problematic files have strengths.

## Quick Fix Checklist

Ordered by impact (P0 first). Reference check item IDs.

- [ ] [P0] [5.1] Fix flattened text in header section
- [ ] [P1] [3.1] Apply Auto Layout to 8 frames with 3+ children
- [ ] [P1] [2.1] Rename 12 default-named nodes
- [ ] ...

## Methodology

> ⛔ Only list tools that were ACTUALLY used. The only valid tools are: `get_metadata`, `get_variable_defs`, and `get_design_context`. Do NOT include `get_screenshot` — it does not exist.

| Tool                 | Purpose                 | Result         |
| -------------------- | ----------------------- | -------------- |
| `get_metadata`       | Layer structure         | ✅ / ❌ + note |
| `get_variable_defs`  | Design tokens           | ✅ / ❌ + note |
| `get_design_context` | Code generation context | ✅ / ❌ + note |
```

## Multi-page report (`report.md`)

Extends the single-page format with per-page breakdown and cross-page analysis.

```markdown
# Figma Design Lint Report — Multi-Page

**File**: [file name]
**Section**: [section name] ([node ID])
**URL**: [original URL]
**Audited**: [date] | [N pages audited out of M total]

## Overall Summary

- **Overall Score**: X/100 ← equal-weight average of per-page scores (skipped pages excluded)
- **Pages Audited**: N
- **Total P0 issues**: N (blocks codegen)
- **Total P1 issues**: N (causes messy code)
- **Total P2 issues**: N (reduces maintainability)
- **Total P3 issues**: N (minor improvements)
- **Verdict**: Ready / Needs Work / Not Ready

## Per-Page Scores

| #   | Page     | Node ID    | Score  | P0  | P1  | P2  | P3  | Verdict    |
| --- | -------- | ---------- | ------ | --- | --- | --- | --- | ---------- |
| 1   | 完整页面 | 2422:61194 | 38/100 | 3   | 5   | 6   | 4   | Not Ready  |
| 2   | 实际页面 | 2422:61201 | 52/100 | 1   | 3   | 4   | 2   | Needs Work |
| ... | ...      | ...        | ...    | ... | ... | ... | ... | ...        |

## Cross-Page Issues

Checklist failures that appear consistently across multiple pages — fixing them once improves all pages.

### [CROSS-N] [Check ID] [Issue title]

- **Severity**: P0/P1/P2/P3
- **Category**: [category name]
- **Check Item**: [ID and description]
- **Affected pages**: [list of page names where this check failed]
- **Evidence**: [data from MCP output]
- **Problem**: [description]
- **Fix**: [action — often a single fix at the component/style level resolves all pages]

## Page-Specific Results

Results unique to individual pages (not repeated across pages).

### Page: [page name] ([node ID]) — Score: X/100

#### Category Breakdown

| # | Category | Weight | Score | Status | Failed Checks |
|---|----------|--------|-------|--------|---------------|
| 1 | File & Layer Organization | 10% | X/100 | … | … |
| ... (all 9 categories) |

#### Checklist Results

| ID | Check Item | Result | Evidence |
|----|-----------|--------|----------|
| 1.1 | ... | ✅/❌ | ... |
| ... | ... | ... | ... |

#### Failed Check Details

##### [ID] [Issue title]

- **Category**: ...
- **Severity**: ...
- **Location**: `PageName › ParentFrame › NodeName` (ID: `node-id`, WxHpx)
  [🔗 Open in Figma](https://www.figma.com/design/{FILE_KEY}/{FILE_NAME}?node-id={node-id-with-dashes})
- **Evidence**: ...
- **Problem**: ...
- **Fix**: ...

(repeat for each page)

## Systemic Patterns

Root causes across the entire section.

## Positive Findings

What the section does well — note both file-level and per-page strengths.

## Quick Fix Checklist

Ordered by impact. Cross-page fixes first (highest leverage), then per-page fixes. Reference check item IDs.

- [ ] [CROSS] [P0] [5.1] Fix flattened text — affects all N pages
- [ ] [CROSS] [P1] [3.1] Apply Auto Layout — affects all N pages
- [ ] [完整页面] [P1] [2.1] Rename 12 default-named nodes
- [ ] ...

## Methodology

> ⛔ Only list tools that were ACTUALLY used. Do NOT include `get_screenshot`.

> ⛔ **This section is MANDATORY for multi-page reports too.**

| Data                 | Scope               | Notes                          |
| -------------------- | -------------------- | ------------------------------ |
| `get_variable_defs`  | File-level (once)   | Shared across all pages        |
| `get_metadata`       | Per-page            | Called N times                 |
| `get_design_context` | Per-page (optional) | Called on representative pages |
```

## Multi-page scoring

Each page is scored independently using the checklist-driven system:
1. Execute all check items per page
2. Compute per-category score from worst failed severity
3. Compute page score as weighted average

The **overall score** is the **equal-weight average** across all evaluated pages. Skipped pages are excluded from the average.

```
overall_score = sum(page_scores) / count(evaluated_pages)
```

Cross-page issues are counted once in the overall tally but flagged on every affected page's checklist.
