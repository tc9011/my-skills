---
name: figma-design-lint
description: "Audit Figma design files for MCP/code-generation readiness via Figma URL. Uses the Figma Dev Mode MCP (get_metadata, get_design_context, get_variable_defs) to inspect layer structure, naming, Auto Layout, component usage, typography/color tokens, and file hygiene. Use this skill whenever the user asks to review a Figma design, check if a design is ready for code generation, audit design file quality, lint a design, review design-to-code readiness, or mentions Figma design specs, design handoff quality, or MCP design standards. Also triggers on: 'check my Figma', 'is this design clean enough', 'design QA', 'design lint', 'review design structure', 'design file cleanup', 'review this Figma URL', or any request to evaluate whether a Figma file follows best practices for direct code output."
---

# Figma Design Lint

Audit a Figma design file against the **Figma x MCP Design-to-Code Specification** — rules that ensure designs translate cleanly into code via MCP, AI codegen, or engineering handoff.

## Skill Structure

```
figma-design-lint/
├── SKILL.md                      # This file — workflow + audit rubric
├── assets/
│   ├── report-template.html      # Per-page HTML report template
│   └── summary-template.html     # Multi-page summary template
└── references/
    ├── audit-rubric.md           # 9-category rubric with severity levels & checklists
    ├── report-format.md          # Full markdown report templates (single + multi-page)
    ├── html-generation.md        # HTML placeholder replacement + issue card format
    ├── subagent-template.md      # Subagent prompt template + batching rules
    ├── pipeline-template.md      # Pipeline-based multi-page workflow + loop logic
    └── token-scale-reference.md  # CDS v2 token scales + allowed values for compliance checks
```

## Input

The user provides a Figma URL like:

- `https://www.figma.com/design/<FILE_KEY>/Title?node-id=X-Y`
- `https://www.figma.com/file/<FILE_KEY>/...`

If the URL includes `node-id`, focus the audit on that node. Otherwise, audit the current selection or top-level frames.

### Extract FILE_KEY for deep links

Parse the Figma URL to extract `FILE_KEY` and `FILE_NAME` (the URL path segment after the key). Store these for the entire audit — every issue location needs a Figma deep link:

```
https://www.figma.com/design/{FILE_KEY}/{FILE_NAME}?node-id={NODE_ID_WITH_DASHES}
```

Replace `:` with `-` in node IDs when constructing deep links (e.g., `2422:61196` → `2422-61196`). Pass the deep link base URL to subagents in multi-page mode.

## Step 0: Scope Detection

Before gathering data, determine what the user's URL points to.

### 0a. Probe the target node

Call `get_metadata` on the `node-id`. Inspect the response:

- **Section / large container** (multiple child `<frame>` elements at screen dimensions): multi-page section.
- **Single frame** (one screen-sized frame or component): single page.

### 0b. Present findings to the user

If multi-page, list all child pages and ask:

```
I found this URL points to a section with N pages:

| # | Page Name | Node ID | Size |
|---|-----------|---------|------|
| 1 | 完整页面 | 2422:61194 | 375×1131 |
| ... | ... | ... | ... |

How would you like to audit?
1. **All pages** — full audit of every page
2. **Representative sample** — I'll pick 2-3 key pages (recommended for large sections)
3. **Specific pages** — tell me which ones
4. **Single page** — just one
```

Wait for response before proceeding.

### 0c. Scope modes

| Mode           | Output                                                              |
| -------------- | ------------------------------------------------------------------- |
| **Single**     | `reports/{name}-{YYYY-MM-DD-HH-MM-SS}.md` + `.html` |
| **Multi-page** | `reports/{name}-{YYYY-MM-DD-HH-MM-SS}.md` + `.html` |
| **Sample**     | Same as multi-page but fewer pages                                  |

> Multi-page mode generates ONE summary HTML file, not per-page HTML reports. Per-page detail lives in the `.md` only. This keeps output size manageable.

### 0d. Multi-page workflow (Pipeline-Based)

For multi-page and sample modes, follow `references/pipeline-template.md` for the full pipeline format, batching rules, loop logic, and aggregation method. Summary:

- **Phase 1 (Setup)**: Main agent calls MCP tools, creates `reports/pipeline.md`. Subagents have NO MCP access — main agent must pre-fetch all metadata and tokens.
- **Phase 2 (Evaluation)**: Dispatch ONE batch of subagents at a time. Wait for all in current batch to complete before dispatching next. See `references/subagent-template.md` for the prompt template.
- **Phase 3 (Aggregation)**: Equal-weight average across all evaluated pages. Generate combined `report.md` and `summary.html`.

### 0e. Page identification heuristics

When detecting child pages in a section:

- Child frames at screen dimensions (375×812, 375×667, 390×844, or custom scrollable heights)
- **Exclude**: `<symbol>` nodes (component definitions), frames smaller than 100px in either dimension, hidden/invisible frames, and nodes whose names suggest symbols or component definitions (e.g., names starting with `_`, or containing "symbol", "component def")
- **Deduplicate**: If two child frames share the same `node-id`, audit only once. If frames share the same name but different IDs, treat as separate pages (likely state variants)
- Frame names often describe states: "完整页面", "输入", "预览", "提示"

## Step 1: Gather Design Data

Use the **Figma Dev Mode MCP** tools:

| Tool                   | Purpose                                       | Check                                            |
| ---------------------- | --------------------------------------------- | ------------------------------------------------ |
| `get_metadata`         | Layer tree — names, types, nesting, positions | Naming quality, hierarchy, nesting depth         |
| `get_variable_defs`    | Design tokens — colors, spacing, typography   | Token system, semantic naming                    |

**Optional tools** (skip unless specifically needed — they often fail due to Figma restrictions):

| Tool                   | Purpose                                       | When to use                                      |
| ---------------------- | --------------------------------------------- | ------------------------------------------------ |
| `get_design_context`   | Generated code output                         | Only if auditing MCP/Codegen Readiness in depth  |

> `get_design_context` almost always fails with "directory not whitelisted" errors. Do NOT call it unless the user explicitly requests code generation analysis. Do NOT retry on failure — note the limitation in the Methodology section and move on. The audit can be completed fully with `get_metadata` + `get_variable_defs`.

> ⛔ **`get_screenshot` is NOT available and MUST NOT appear anywhere in the report.** Do not mention it in the Methodology table, tool list, or any other section. The only tools to list in Methodology are: `get_metadata`, `get_variable_defs`, and optionally `get_design_context`.

**Data strategy for large files**: Start with `get_metadata` on the main frame, `get_variable_defs` once for the file, then drill deeper per section as needed. Don't try to audit everything in one pass.

**Token compliance**: `get_variable_defs` is critical for Category 6 (Color & Style Tokens). It reveals which variables are defined and allows checking whether nodes are bound to semantic tokens. Cross-reference with `references/token-scale-reference.md` for the CDS v2 allowed values. If `get_variable_defs` returns nothing, fall back to numeric value matching against the scale reference.

## Step 2: Checklist-Driven Audit

Read `references/audit-rubric.md` for the full 9-category **checklist** with fixed check items (each with ID, severity, and verification method). Execute EVERY check item and record Pass/Fail with evidence. All 9 categories MUST appear in the report — never merge or skip any. The exact category names and weights are:

| # | Category | Weight |
|---|----------|--------|
| 1 | File & Layer Organization | 10% |
| 2 | Naming Conventions | 12% |
| 3 | Layout Structure | 15% |
| 4 | Component Usage | 12% |
| 5 | Typography | 10% |
| 6 | Color & Style Tokens | 10% |
| 7 | Images, Icons & Assets | 6% |
| 8 | State Completeness | 10% |
| 9 | MCP/Codegen Readiness | 15% |

Use these EXACT names in the Category Breakdown table. Do NOT rename, abbreviate, or omit any.

## Output Path Convention

All reports are saved to a `reports/` directory (created if needed) with timestamped filenames based on the Figma section/page name:

```
reports/{section-name}-{YYYY-MM-DD-HH-MM-SS}.md        # markdown report
reports/{section-name}-{YYYY-MM-DD-HH-MM-SS}.html      # HTML report (single-page: report, multi-page: summary)
```

**Examples:**
- `reports/完整页面-2026-04-22-15-30-45.md`
- `reports/定制-2026-04-22-15-30-45.md` (multi-page section)
- `reports/定制-2026-04-22-15-30-45.html` (summary HTML)

The section name comes from the root frame/section name in Figma metadata. Sanitize it for filesystem safety (replace `/`, `\`, `:` with `-`, trim whitespace). Use the current local time for the timestamp.

Create the `reports/` directory with `mkdir -p reports` before writing.

## Step 3: Generate Report

**Scoring**: Per-category scores are computed from worst failed severity (see `references/audit-rubric.md` for the tier table). Overall score = weighted average of category scores. Minimum 0, maximum 100.

- 80+: **Ready** for code generation
- 50-79: **Needs Work** — fix P0/P1 first
- Below 50: **Not Ready** — significant structural problems

**Score MUST be out of 100.** Never use /10, /20, or any other scale. All 9 categories MUST appear in the breakdown table with their weights.

Read `references/report-format.md` for the full markdown report template (single-page and multi-page formats).

## Step 4: Generate HTML Report (MANDATORY — task is NOT complete without this)

> ⛔ **The audit is INCOMPLETE until the HTML file is written to disk and opened in the browser.** Do NOT stop after the markdown report. Do NOT skip this step. The HTML report is the PRIMARY deliverable — the markdown is supplementary.

### 4a. Read the template

- **Single-page audit** → Read `assets/report-template.html`
- **Multi-page audit** → Read `assets/summary-template.html`

### 4b. Build the HTML string

Read `references/html-generation.md` for the full placeholder replacement table, issue card format with location blocks, and score ring SVG formula.

**Issue location requirement**: Every issue card MUST include a `<div class="issue-location">` block with node name, node ID, and parent path. See `references/html-generation.md` for exact format.

### 4c. Write the file to disk

Use the Write tool to save the completed HTML. Follow the Output Path Convention above:

```bash
mkdir -p reports
```

- **Single-page** → `reports/{page-name}-{YYYY-MM-DD-HH-MM-SS}.html`
- **Multi-page** → `reports/{section-name}-{YYYY-MM-DD-HH-MM-SS}.html`

Save the markdown report with the same base name: `reports/{name}-{YYYY-MM-DD-HH-MM-SS}.md`

### 4d. Open in browser

Run `open reports/{name}-{YYYY-MM-DD-HH-MM-SS}.html` (macOS) to display the report.

### 4e. Verify (completion gate)

Confirm the file exists and was opened. If the Write tool failed or the file is empty, retry. **Do NOT report completion to the user until the HTML file is confirmed written and opened.**

## Guidelines

- **Be specific.** "`Frame 123` (node `2422:61196`) inside `Header / NavBar` should be renamed to `NavBar`" — not "some layers have bad names."
- **Cite evidence.** Every issue must include the MCP tool output that proves it.
- **Include location with breadcrumb + deep link for EVERY issue.** Breadcrumb path from page root → node (using `›` separator), node ID, dimensions, and a clickable Figma deep link. No exceptions. See `references/report-format.md` for the markdown format and `references/html-generation.md` for the HTML format.
- **All 9 categories, always.** Even if a category has zero issues, include it as "✅ Pass."
- **Sample large files.** Audit 2-3 representative frames thoroughly rather than skimming everything.
- **Acknowledge good work.** Always include a "Positive Findings" section.
- **Surface systemic patterns.** Look beyond individual issues to root causes.
- **Note limitations.** If MCP data doesn't cover something, say "Unable to verify — check manually" rather than guessing.
