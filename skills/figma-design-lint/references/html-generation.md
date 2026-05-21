# HTML Report Generation Reference

Detailed instructions for generating interactive HTML reports from audit data.

## Single-page HTML (`report.html`)

### Build the HTML

Read the template from `assets/report-template.html`. Replace these placeholders:

| Placeholder               | Content                                                           |
| ------------------------- | ----------------------------------------------------------------- |
| `__TITLE__`               | File name                                                         |
| `__META__`                | File name, date, frame name, Figma link                           |
| `__SCORE_CARD__`          | Score ring SVG + severity counts + verdict                        |
| `__CATEGORY_TABLE__`      | The 9-row breakdown table                                         |
| `__ISSUE_GROUPS__`        | All issues grouped by severity                                    |
| `__SYSTEMIC__`            | Systemic patterns section                                         |
| `__POSITIVES__`           | Positive findings list                                            |
| `__CHECKLIST__`           | Quick fix checklist                                               |

### Issue card format

Every issue corresponds to a **failed check item** and MUST include the check ID and a location block:

```html
<div class="issue" data-issue="P0-1" data-check="5.1">
  <div class="issue-head">
    <span class="issue-sev p0">P0</span>
    <span class="issue-check">[5.1]</span>
    <span class="issue-title">Issue Title</span>
    <span class="issue-cat">Category Name</span>
  </div>
  <div class="issue-body">
    <div class="issue-location">📍 <code>PageName</code> › <code>ParentFrame</code> › <code>LayerName</code> (ID: <code>2422:61196</code>, 400×855px) <a href="https://www.figma.com/design/{FILE_KEY}/{FILE_NAME}?node-id=2422-61196" target="_blank" class="figma-link">🔗 Open in Figma</a></div>
    Description with <code>node IDs</code> and <strong>emphasis</strong>.
    <div class="issue-fix">Fix: What to do.</div>
  </div>
</div>
```

**Location block rules:**
- EVERY issue card MUST have a `<div class="issue-location">` as the first child of `.issue-body`
- Include: breadcrumb path from page root → node (using `›` separator), node ID, dimensions, and **clickable Figma deep link**
- Deep link format: `https://www.figma.com/design/{FILE_KEY}/{FILE_NAME}?node-id={NODE_ID_WITH_DASHES}` — replace `:` with `-` in node IDs
- The `<a>` tag MUST have `target="_blank"` and class `figma-link`
- For issues without a specific node (e.g., "no interactive states defined"), use the page/frame level: `📍 Scope: <code>完整页面</code> (ID: <code>2422:61194</code>) <a href="..." target="_blank" class="figma-link">🔗 Open in Figma</a>`
- For cross-cutting issues, list 2-3 example nodes each with their own deep link: `📍 Examples: <code>Page › Title</code> (<a href="...">🔗</a>), <code>Page › Subtitle</code> (<a href="...">🔗</a>), +N more`

### Score ring SVG

Adjust `stroke-dashoffset` based on score — full circle is ~213.6 for r=34:

```html
<div class="score-ring">
  <svg viewBox="0 0 80 80" width="80" height="80">
    <circle cx="40" cy="40" r="34" fill="none" stroke="#2e3240" stroke-width="6" />
    <circle
      cx="40"
      cy="40"
      r="34"
      fill="none"
      stroke="__SCORE_COLOR__"
      stroke-width="6"
      stroke-dasharray="213.6"
      stroke-dashoffset="__OFFSET__"
      stroke-linecap="round"
    />
  </svg>
  <div class="value" style="color:__SCORE_COLOR__">__SCORE__</div>
</div>
```

Where: `offset = 213.6 × (1 - score/100)`, color = `#dc2626` (<50), `#ea580c` (50-79), `#16a34a` (80+).

**Verdict class**: `not-ready` (<50), `needs-work` (50-79), `ready` (80+).

### Save and open

Save reports to the `reports/` directory following the Output Path Convention in SKILL.md:
```
reports/{name}-{YYYY-MM-DD-HH-MM-SS}.html
reports/{name}-{YYYY-MM-DD-HH-MM-SS}.md
```
Open with `open reports/{name}-{YYYY-MM-DD-HH-MM-SS}.html`.

## Multi-page HTML output

For **multi-page** and **sample** modes, generate only `summary.html` (no per-page HTML reports).

### Summary report

Generate `summary.html` using the `assets/summary-template.html` template. Replace these placeholders:

| Placeholder         | Content                                                                   |
| ------------------- | ------------------------------------------------------------------------- |
| `__TITLE__`         | Section name                                                              |
| `__META__`          | Section name, date, page count, Figma link                                |
| `__OVERALL_SCORE__` | Overall equal-weight average score (0-100)                                |
| `__SCORE_COLOR__`   | Color based on score: `#dc2626` (<50), `#ea580c` (50-79), `#16a34a` (80+) |
| `__OFFSET__`        | SVG stroke-dashoffset: `213.6 × (1 - score/100)`                          |
| `__VERDICT__`       | "Ready" / "Needs Work" / "Not Ready"                                      |
| `__VERDICT_CLASS__` | "ready" / "needs-work" / "not-ready"                                      |
| `__TOTAL_P0__`      | Total P0 count                                                            |
| `__TOTAL_P1__`      | Total P1 count                                                            |
| `__TOTAL_P2__`      | Total P2 count                                                            |
| `__TOTAL_P3__`      | Total P3 count                                                            |
| `__PAGE_CARDS__`    | One card per page with mini score ring + issue counts                     |
| `__CROSS_ISSUES__`  | Cross-page issues section                                                 |
| `__SYSTEMIC__`      | Systemic patterns                                                         |
| `__CHECKLIST__`     | Combined quick fix checklist (cross-page first)                           |

### Page card format (expandable)

Each page card is an expandable panel. Clicking the summary row toggles the detail section.

```html
<div class="page-card">
  <div class="page-card-summary">
    <span class="chevron">▶</span>
    <div class="page-card-header">
      <div class="page-mini-score" style="color:{score_color}">{score}</div>
      <div class="page-info">
        <div class="page-name">{page name}</div>
        <div class="page-id">{node ID} · {width}×{height}</div>
      </div>
      <span class="verdict {verdict_class}">{verdict}</span>
    </div>
    <div class="page-card-stats">
      <span class="stat-p0">{n} P0</span>
      <span class="stat-p1">{n} P1</span>
      <span class="stat-p2">{n} P2</span>
      <span class="stat-p3">{n} P3</span>
    </div>
  </div>
  <div class="page-detail">
    <!-- 9-row category breakdown table -->
    <table class="cat-table">
      <thead><tr><th>Category</th><th>Weight</th><th>Score</th><th>Status</th><th>Failed Checks</th></tr></thead>
      <tbody>
        <tr><td>File & Layer Organization</td><td>10%</td><td>{score}</td><td class="status-{pass|warn|fail}">●</td><td>{failed check IDs or "—"}</td></tr>
        <!-- ... all 9 categories ... -->
      </tbody>
    </table>
    <!-- All issues for this page, grouped by severity -->
    {issue_groups_html}
    <!-- Positive findings for this page -->
    <div class="positives"><h3>✅ Positives</h3><ul>{positives}</ul></div>
  </div>
</div>
```

### File structure for multi-page output

```
reports/
├── {section-name}-{YYYY-MM-DD-HH-MM-SS}.md     # Combined markdown report (all detail)
└── {section-name}-{YYYY-MM-DD-HH-MM-SS}.html   # Summary overview
```

Open the `.html` file in the browser after generation.

## Completion Checklist

Before reporting the audit as done, verify ALL of these:

1. ✅ HTML string built with ALL placeholders replaced (no `__PLACEHOLDER__` text remains)
2. ✅ File written to `reports/` directory with timestamped filename
3. ✅ File opened in browser via `open reports/{name}-{YYYY-MM-DD-HH-MM-SS}.html`
4. ✅ Every issue card contains a `<div class="issue-location">` block

If any step failed, retry it. The HTML report is the primary deliverable — the audit is not complete without it.
