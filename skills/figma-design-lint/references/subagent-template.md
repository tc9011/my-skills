# Subagent Prompt Template for Multi-Page Audit

Use this template when dispatching parallel subagents in Phase 2 of the pipeline workflow.

## Template

```
TASK: Audit {N} Figma design pages using the fixed checklist and return structured results.

PIPELINE: reports/pipeline.md — your pages are listed under "## 评估中".

FIGMA DEEP LINK BASE: https://www.figma.com/design/{FILE_KEY}/{FILE_NAME}?node-id=
(Use this to construct deep links for every failed check. Replace `:` with `-` in node IDs.)

PAGES TO AUDIT:
{table of page name, node ID, dimensions}

METADATA (for your pages):
{extracted XML subtrees for each assigned page}

DESIGN TOKENS:
{token definitions from get_variable_defs}

AUDIT RUBRIC — Read `references/audit-rubric.md` for the full 9-category checklist with fixed check items, severity levels, and scoring tiers. Execute EVERY check item per page. Record Pass/Fail with evidence for each.

IMPORTANT: Do NOT compute scores. Only return checklist results (Pass/Fail + evidence per item). The main agent computes all scores using the weighted algorithm.

OUTPUT FORMAT: Return a structured markdown summary ONLY (no HTML files):
- Per-page checklist results table (all check items with Pass/Fail + evidence)
- Per-page failed check details (location with breadcrumb + deep link, evidence, fix)
- Cross-batch patterns (same check items failing across multiple pages)

Do NOT generate per-page HTML reports — the main agent handles HTML generation.
Do NOT modify reports/pipeline.md — the main agent handles pipeline state.
Do NOT compute scores — the main agent handles scoring.
```

## Batching rules

See `references/pipeline-template.md` for the full batching table. Summary:

- ≤3 pages → **NO subagents** — audit inline in the main agent
- 4-20 pages → 2 subagents (~10 pages each)
- 21-40 pages → 3 subagents (~12 pages each)
- 40+ pages → ceil(N/4) subagents, max 4

## What each subagent receives

- The full metadata XML for its assigned pages (extract the relevant `<frame>` subtrees)
- The shared design token definitions
- The 9-category audit checklist (from `references/audit-rubric.md`)
- The list of page names, node IDs, and dimensions for its batch

> ⛔ **Subagents have NO MCP access.** They cannot call `get_metadata`, `get_variable_defs`, `get_design_context`, or any other Figma tool. All Figma data must be pre-fetched by the main agent in Phase 1 and passed into the subagent prompt.

## What each subagent produces

Return a structured markdown summary with this EXACT structure per page:

```markdown
### {Page Name} ({node_id})

#### Checklist Results

| ID | Check Item | Result | Evidence |
|----|-----------|--------|----------|
| 1.1 | Nesting depth ≤6 levels | ✅ Pass | Max depth: 4 |
| 1.2 | No abandoned hidden nodes | ❌ Fail (P2) | 3 hidden nodes found |
| 1.3 | Logical grouping | ✅ Pass | — |
| 1.4 | No empty frames | ✅ Pass | — |
| 2.1 | No default names (5+) | ❌ Fail (P1) | 8 default-named nodes |
| 2.2 | No default names (1-4) | ✅ Pass | (N/A — 2.1 failed) |
| ... | ... | ... | ... |

#### Failed Check Details

1. **[1.2] No abandoned hidden nodes** (P2, File & Layer Organization)
   - Location: `{page_name} › {parent_name} › {node_name}` (`{node_id}`, {W}×{H}px) [🔗 Open in Figma]({deep_link_base}{node_id_with_dashes})
   - Evidence: {what the metadata shows}
   - Fix: {recommended action}

2. **[2.1] No default names (5+)** (P1, Naming Conventions)
   - Location: `{page_name} › {parent}` — 8 nodes: Frame 12, Rectangle 45, Group 8, ...
     [🔗 Open in Figma]({deep_link_base}{example_node_id_with_dashes})
   - Evidence: {list of default names found}
   - Fix: {recommended action}

### Cross-Batch Patterns

{Check items failing across multiple pages in this batch — list check ID + affected pages}
```

All check items from `references/audit-rubric.md` MUST appear in the checklist table per page.

Do NOT generate per-page HTML report files — the main agent handles all HTML output.
Do NOT modify `reports/pipeline.md` — only the main agent updates pipeline state.
Do NOT compute per-category or overall scores — the main agent handles all score calculation.
