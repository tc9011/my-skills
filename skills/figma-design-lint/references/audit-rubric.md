# Audit Rubric — Checklist-Driven 9-Category System

## Overview

Audit ALL 9 categories using the **fixed checklists** below. Every check item is answered Pass/Fail with evidence. Scores are computed mechanically from checklist results — no subjective scoring.

**Use these EXACT category names — do NOT substitute or rename:**

| # | Category Name (use verbatim) | Weight |
|---|------------------------------|--------|
| 1 | File & Layer Organization | 10% |
| 2 | Naming Conventions | 12% |
| 3 | Layout Structure | 15% |
| 4 | Component Usage | 12% |
| 5 | Typography | 10% |
| 6 | Color & Style Tokens | 10% |
| 7 | Images, Icons & Assets | 6% |
| 8 | State Completeness | 10% |
| 9 | MCP/Codegen Readiness | 15% |

## Severity Definitions

| Severity | Meaning | Used for |
|----------|---------|----------|
| **P0** | Blocks code generation — must fix | Category score tier |
| **P1** | Causes incorrect or messy code | Category score tier |
| **P2** | Reduces maintainability | Category score tier |
| **P3** | Minor improvement | Category score tier |

## Scoring Algorithm

### Step 1: Per-category score (from worst failed severity)

For each category, find the **worst severity** among all failed check items:

| Worst Failed Severity | Category Score |
|-----------------------|---------------|
| All Pass (no failures) | **100** |
| P3 only | **75** |
| P2 (no P1/P0) | **60** |
| P1 (no P0) | **40** |
| 1 P0 | **15** |
| 2+ P0 | **0** |

### Step 2: Overall score (weighted average)

```
Overall = Σ(category_score × category_weight)
```

Round to nearest integer. This produces a 0-100 score.

### Step 3: Verdict

| Score Range | Verdict |
|-------------|---------|
| 80-100 | **Ready** for code generation |
| 50-79 | **Needs Work** — fix P0/P1 first |
| 0-49 | **Not Ready** — significant structural problems |

---

## Deterministic Scoring Rules (Token Compliance)

To reduce variance across runs, apply these **fixed severity mappings** for CDS v2 token compliance findings. If a finding matches one listed here, use the listed severity. Cross-reference `token-scale-reference.md` for all allowed values.

| Finding | Severity | Category | Notes |
|---------|----------|----------|-------|
| Color hex matches nothing in token system (off-system) | P0 | Color & Style Tokens | Completely unknown color — likely mistake or outdated |
| Color hex matches global primitive but no semantic binding | P1 | Color & Style Tokens | Using raw palette without semantic intent |
| Color hex matches semantic token but not variable-bound | P2 | Color & Style Tokens | Correct value, should be linked |
| Spacing/padding value off token scale — 5+ instances | P1 | Color & Style Tokens | Scale: 0,1,2,4,8,12,16,20,24,32,40,48,56,64,72,80 |
| Spacing/padding value off token scale — 1-4 instances | P2 | Color & Style Tokens | Same scale |
| Border-radius value off token scale | P1 | Color & Style Tokens | Scale: 0,2,4,8,12,16,24,999999 or 50% |
| Font-size value off token scale | P1 | Color & Style Tokens | Scale: 10,12,14,16,18,23,32,41,62,100 |
| Font-family not in allowed set | P1 | Color & Style Tokens | Allowed: LEGO Typewell, LEGO Typewell SC, PingFang SC |
| Font-weight off token scale | P2 | Color & Style Tokens | Scale: 400,600,700,900 |
| Line-height off token scale | P2 | Color & Style Tokens | Scale: 15,18,21,24,26,34,37,48,62,72,115 |
| Border-width off token scale | P2 | Color & Style Tokens | Scale: 0,1,1.5,2,3 |
| Blur off token scale | P2 | Color & Style Tokens | Scale: 4,12,24 |

For findings NOT in this table, use the standard severity definitions above.

---

## Category Checklists

Every check item has: ID, description, severity, and verification method. Execute EVERY item — do not skip.

### 1. File & Layer Organization (10%)

| ID | Check Item | Severity | How to verify |
|----|-----------|----------|---------------|
| 1.1 | Nesting depth ≤6 levels for all branches | P2 | `get_metadata`: trace deepest nesting path, count levels |
| 1.2 | No abandoned hidden/invisible nodes | P2 | `get_metadata`: find `visible="false"` nodes that appear unused |
| 1.3 | Logical grouping — one business module per major frame | P3 | `get_metadata`: check top-level frame structure maps to UI sections |
| 1.4 | No empty frames (0 children, no fill, no purpose) | P3 | `get_metadata`: find frames with no children and no visual properties |

### 2. Naming Conventions (12%)

| ID | Check Item | Severity | How to verify |
|----|-----------|----------|---------------|
| 2.1 | No default-named nodes (5+ instances of `Frame N`, `Rectangle N`, `Group N`, etc.) | P1 | `get_metadata`: regex match `^(Frame\|Rectangle\|Group\|Ellipse\|Line\|Vector\|Polygon\|Star\|Boolean)\s*\d*(\s*copy\s*\d*)?$`, count matches |
| 2.2 | No default-named nodes (1-4 instances) | P2 | Same regex as 2.1, count 1-4 |
| 2.3 | Component names follow pattern (e.g., `Type/Variant/State`) | P2 | `get_metadata`: check INSTANCE and COMPONENT node naming patterns |
| 2.4 | Image/icon nodes have descriptive names (not `image 1`, `icon`) | P3 | `get_metadata`: check naming of image fill nodes and icon frames |

> **Note on 2.1 vs 2.2**: These are mutually exclusive. If 5+ default names exist, fail 2.1 (P1) and pass 2.2. If 1-4 exist, pass 2.1 and fail 2.2 (P2). If 0 exist, both pass.

### 3. Layout Structure (15%)

| ID | Check Item | Severity | How to verify |
|----|-----------|----------|---------------|
| 3.1 | All frames with 3+ children use Auto Layout | P1 | `get_metadata`: check `layoutMode` on frames with ≥3 children |
| 3.2 | No elements overflow parent bounds | P1 | `get_metadata`: compare child x/y/width/height with parent bounds |
| 3.3 | Spacing values are on the CDS v2 token scale (0,1,2,4,8,12,16,20,24,32,40,48,56,64,72,80) | P1 | `get_metadata`: check `itemSpacing` and `padding` values against allowed scale. Off-scale values (e.g., 10, 11, 13, 15, 22, 30) fail. See `token-scale-reference.md` |
| 3.4 | No sub-pixel (decimal) dimension values | P2 | `get_metadata`: check width/height for non-integer values |
| 3.5 | Elements have intentional sizing rules (fill/hug/fixed) | P3 | `get_metadata`: check `layoutSizingHorizontal`/`layoutSizingVertical` |

### 4. Component Usage (12%)

| ID | Check Item | Severity | How to verify |
|----|-----------|----------|---------------|
| 4.1 | Repeated visual patterns (3+) are componentized | P1 | `get_metadata`: find structurally similar frame subtrees that are not INSTANCE type |
| 4.2 | No detached instances (same structure as component but not linked) | P2 | `get_metadata`: find frames matching known component patterns without INSTANCE type |
| 4.3 | Component sets cover key states (default/hover/pressed/disabled) | P2 | `get_metadata`: check variant coverage in COMPONENT_SET nodes |
| 4.4 | Uses shared library components where available | P3 | `get_metadata`: check if INSTANCE refs point to external libraries or are all local |

### 5. Typography (10%)

| ID | Check Item | Severity | How to verify |
|----|-----------|----------|---------------|
| 5.1 | No flattened/outlined text (vectors instead of editable text) | P0 | `get_metadata`: find VECTOR nodes where text content is expected (labels, headings) |
| 5.2 | Text nodes use shared text styles (5+ unstyled = fail) | P1 | `get_metadata` + `get_variable_defs`: check if text nodes reference style IDs |
| 5.3 | Text nodes use shared text styles (1-4 unstyled = fail) | P2 | Same check as 5.2, count 1-4 |
| 5.4 | Font family is from allowed set (`LEGO Typewell`, `LEGO Typewell SC`, `PingFang SC`) | P1 | `get_metadata`: collect all fontFamily values, flag any not in allowed set. See `token-scale-reference.md` |
| 5.5 | Font sizes are on the CDS v2 type scale (10,12,14,16,18,23,32,41,62,100) | P1 | `get_metadata`: collect all fontSize values, flag off-scale values (e.g., 11, 13, 15, 20, 28). See `token-scale-reference.md` |
| 5.6 | Font weights are on token scale (400,600,700,900) | P2 | `get_metadata`: collect all fontWeight values, flag off-scale values |
| 5.7 | Line heights are on token scale (15,18,21,24,26,34,37,48,62,72,115) | P2 | `get_metadata`: collect all lineHeight values, flag off-scale values |

> **Note on 5.2 vs 5.3**: Mutually exclusive — same logic as 2.1/2.2.

### 6. Color & Style Tokens (10%)

**Reference**: Read `token-scale-reference.md` for the complete CDS v2 token inventory and allowed values.

#### 6a. Variable Binding Check (Primary — from `get_variable_defs`)

| ID | Check Item | Severity | How to verify |
|----|-----------|----------|---------------|
| 6.1 | Token system exists (variables/styles defined for colors) | P1 | `get_variable_defs`: check if color variables/styles are defined |
| 6.2 | Colors bound to semantic variables — 5+ raw hex not matching any semantic token = fail | P0 | `get_metadata` + `get_variable_defs`: count fills/strokes with hex not matching ANY semantic token in `token-scale-reference.md` |
| 6.3 | Colors bound to semantic variables — 1-4 raw hex not matching semantic tokens = fail | P1 | Same check as 6.2, count 1-4 |
| 6.4 | No raw hex that matches semantic token but isn't variable-bound (5+ = fail) | P1 | Hex matches a semantic token value but isn't bound to the variable — should be linked |
| 6.5 | No raw hex that matches semantic token but isn't variable-bound (1-4 = fail) | P2 | Same check as 6.4, count 1-4 |
| 6.6 | No direct use of Global Colors primitives in UI (e.g., `core/red/500` instead of `color/text/negative`) | P2 | `get_variable_defs`: check if bound variables reference Global Colors collection directly |

> **Note on 6.2 vs 6.3**: Mutually exclusive — same logic as 2.1/2.2. **6.4 vs 6.5**: Same mutual exclusion.

#### 6b. Token Scale Compliance (Layout Values)

| ID | Check Item | Severity | How to verify |
|----|-----------|----------|---------------|
| 6.7 | Spacing (padding, gap) values on scale: `0,1,2,4,8,12,16,20,24,32,40,48,56,64,72,80` | P1 | `get_metadata`: check `itemSpacing`, `paddingLeft/Right/Top/Bottom`. Flag off-scale values (e.g., 10, 13, 15, 22, 30) |
| 6.8 | Border-radius values on scale: `0,2,4,8,12,16,24` (+ 999999 pill / 50% circle) | P1 | `get_metadata`: check `cornerRadius` values against allowed set |
| 6.9 | Border-width values on scale: `0,1,1.5,2,3` | P2 | `get_metadata`: check `strokeWeight` values against allowed set |
| 6.10 | Blur values on scale: `4,12,24` | P2 | `get_metadata`: check blur effect values against allowed set |

#### 6c. Color Hex Matching (when variable binding unavailable)

When `get_variable_defs` returns no data or for nodes without bindings, check raw hex values:

- **Hex matches semantic token** (from `token-scale-reference.md` semantic tables) → P2 (correct value, should be bound)
- **Hex matches global primitive only** (not in any semantic table) → P1 (raw palette color, no semantic intent)
- **Hex matches nothing** in any token table → P0 (off-system color — likely outdated or incorrect)

#### 6d. Legacy checks (always apply)

| ID | Check Item | Severity | How to verify |
|----|-----------|----------|---------------|
| 6.11 | Tokens use semantic naming (`primary`, `error`, not `blue-500`) | P2 | `get_variable_defs`: check variable names for semantic vs raw naming patterns |
| 6.12 | Consistent border radius values (not random per-element) | P3 | `get_metadata`: collect cornerRadius values, flag wildly varying values not on scale |

> **Note on 3.3 overlap**: Check 6.7 (spacing on scale) and check 3.3 (spacing on scale) assess the same values. Score the finding in **one** category only — whichever has the lower current score (to maximally penalize the weaker area). Do not double-count.

### 7. Images, Icons & Assets (6%)

| ID | Check Item | Severity | How to verify |
|----|-----------|----------|---------------|
| 7.1 | Icons in same context share consistent dimensions | P2 | `get_metadata`: compare icon sizes within same parent/section |
| 7.2 | Key assets have export settings configured | P3 | `get_metadata`: check export settings on image/icon nodes |
| 7.3 | No excessively complex vectors (100+ points when simpler shapes suffice) | P3 | `get_metadata`: check vector point counts |

### 8. State Completeness (10%)

| ID | Check Item | Severity | How to verify |
|----|-----------|----------|---------------|
| 8.1 | Interactive elements (buttons/inputs) have hover/pressed/disabled states | P1 | `get_metadata`: check for variant frames or component sets covering states |
| 8.2 | Key screens have error/empty/loading states | P2 | `get_metadata`: look for state variant frames or dedicated state screens |
| 8.3 | States are expressed as component variants (not disconnected frames) | P3 | `get_metadata`: check if state frames are inside COMPONENT_SET vs standalone |

### 9. MCP/Codegen Readiness (15%)

| ID | Check Item | Severity | How to verify |
|----|-----------|----------|---------------|
| 9.1 | Frame structure maps cleanly to a component tree | P1 | `get_metadata`: check if frame hierarchy represents logical component boundaries |
| 9.2 | Node names are meaningful for code generation | P2 | `get_metadata`: check if node names could serve as class/component names |
| 9.3 | Non-visual behavior is annotated (interactions, conditionals) | P3 | `get_metadata`: check for annotation frames or notes describing behavior |
| 9.4 | Generated code avoids absolute positioning (only if `get_design_context` was called successfully) | P1 | `get_design_context`: check output for absolute position patterns |

> **Note on 9.4**: Only evaluate if `get_design_context` was called and succeeded. If the tool was not called or failed, mark this item as **Skipped** (does not count as Pass or Fail).

---

## Execution Rules

1. **Execute EVERY check item** in order. Do not skip items.
2. **Record Pass/Fail + evidence** for each item. Evidence = specific node IDs, names, counts from MCP output.
3. **For failures, include location**: breadcrumb path + Figma deep link (see report-format.md).
4. **Mutually exclusive items** (2.1/2.2, 5.2/5.3, 6.2/6.3, 6.4/6.5): only one can fail per pair.
5. **Skipped items** (e.g., 9.4 when tool unavailable): excluded from scoring — do not count as Pass or Fail.
6. **Score calculation is mechanical**: worst-severity-per-category → tier → weight → sum. No subjective adjustment.
