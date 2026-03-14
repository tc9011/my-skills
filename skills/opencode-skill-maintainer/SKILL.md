---
name: opencode-skill-maintainer
description: Create, improve, and maintain personal skills through an OpenCode-first workflow, with automatic preflight checks against the canonical `skill-creator` skill before every run. Use this whenever the user wants a self-use skill optimization workflow, wants to iterate on a skill in an OpenCode-style loop, wants a skill that keeps itself aligned with `skill-creator`, or asks for a reusable process to update/evaluate/refine skills over time rather than editing one skill ad hoc.
---

# OpenCode Skill Maintainer

Use this skill to maintain other skills through a **personal iterative optimization workflow**.

This is not a generic one-off editing skill. It exists for the recurring case where the user wants to:
- create a new skill and keep refining it over time
- improve an existing skill with a stable workflow
- use an OpenCode-style working loop for drafting, revising, and validating skills
- keep that workflow aligned with the latest `skill-creator` guidance automatically

## Core contract

Every invocation starts with a **skill-creator freshness check**.
Do not skip this.

The canonical upstream reference is:
- `~/.agents/skills/skill-creator/SKILL.md`

This skill should treat `skill-creator` as the source of truth for:
- skill structure
- evaluation loop shape
- description optimization ideas
- iteration principles

## Step 0: Freshness check against `skill-creator`

Before doing any real work:

1. Read the canonical file:
   - `~/.agents/skills/skill-creator/SKILL.md`
2. Compute a fresh fingerprint
3. Read `references/state.json`
4. Compare the new fingerprint with the stored fingerprint
5. If changed:
   - re-read and absorb the current `skill-creator` guidance
   - update this skill's local assumptions, notes, workflow wording, and any stale embedded conventions as needed
   - write the new fingerprint and sync metadata back to `references/state.json`
   - record that the sync happened before continuing to the user task
6. If unchanged:
   - update only lightweight runtime metadata if useful
   - continue normally

### Required fingerprint method
Prefer a stable content hash over mtime:
- `shasum -a 256 ~/.agents/skills/skill-creator/SKILL.md`

Only fall back to file metadata if hashing is unavailable.

Store the last seen fingerprint in:
- `references/state.json`

## What “updated” means

Treat any material change in `skill-creator` as an update, especially if it changes:
- triggering advice
- eval structure
- description optimization loop
- required steps for drafting / testing / iteration
- packaging / reporting conventions
- tool assumptions or fallback policy

If `skill-creator` changed only cosmetically, do not overreact; keep this skill stable unless the workflow meaning changed.

## Step 0.5: Sync policy when upstream changed

If the `skill-creator` fingerprint changed, do this before touching any target skill:

1. Read the current `skill-creator` carefully enough to extract workflow-impacting changes
2. Identify which parts of this skill are now stale:
   - description wording
   - maintenance loop steps
   - eval guidance
   - fallback behavior
   - reporting structure
3. Update this skill first
4. Then update `references/state.json`
5. Then continue to the user's requested maintenance task

Do not silently notice an upstream change and postpone the sync. The sync comes first.

## OpenCode-first workflow

This skill is for a self-use workflow that is **more operational than ceremonial**.

When asked to improve a skill, use this working loop:

1. **Inspect the target skill**
   - read the skill's current `SKILL.md`
   - inspect bundled `evals/`, `references/`, and helper files if present
   - identify whether the task is: draft / cleanup / trigger optimization / eval expansion / structural rewrite

2. **Reduce ambiguity fast**
   - infer as much as possible from the existing skill and surrounding files
   - only ask the user for missing information that truly affects the workflow
   - prefer proposing a concrete plan over asking broad open-ended questions

3. **Draft or revise the skill**
   - improve the description for clearer triggering
   - improve the body for repeatability and reduced drift
   - preserve real lessons learned from prior runs
   - avoid bloated instructions that only fit one example

4. **Create or refine eval prompts**
   - keep 2-3 practical eval prompts for fast iteration
   - add should-not-trigger prompts when working on description quality
   - prefer realistic prompts with file paths, URLs, and colloquial wording over toy prompts

5. **Run a lightweight optimization pass**
   - if automated trigger evaluation is available and healthy, run it
   - if the automated loop is flaky or blocked, fall back to a smaller manual/semimanual pass
   - do not pretend automation succeeded if it hung or produced no trustworthy result

6. **Summarize durable changes**
   - what changed in the skill
   - what changed in the evals
   - whether the description is now stronger
   - what remains unverified

## OpenCode execution policy

If the environment has a working OpenCode toolchain, prefer it for iterative drafting / large skill rewrites.

If OpenCode is unavailable, blocked, or not installed:
- do not hallucinate execution
- fall back to direct file editing and the local toolchain
- explicitly tell the user that the workflow logic still applies, but the OpenCode execution layer was unavailable

## When to use automation vs direct editing

### Use direct editing when:
- the skill change is small
- only the description needs tightening
- you are adding a few eval prompts
- you are encoding a lesson learned from a recent run

### Use the full optimization loop when:
- trigger accuracy is poor
- the skill has become bloated or confused
- users keep correcting the same workflow issue
- there is enough evaluation data to justify iteration

## Description optimization policy

For trigger optimization, always include both:
- **should-trigger** cases that look like real user requests
- **should-not-trigger** near-misses that share vocabulary but should route elsewhere

Good near-misses include:
- translation only
- wechat-md formatting only
- cover generation only
- generic article writing without adaptation workflow
- unrelated file transformation tasks that happen to mention “公众号” or “封面” in a non-pipeline sense

## Reliability policy

If the automation loop hangs, stalls, or becomes operationally expensive:
- stop the loop
- preserve any useful intermediate artifacts
- report clearly what succeeded vs what did not
- continue with a smaller, more reliable path instead of waiting forever

This skill values **practical progress** over ritual compliance.

## Standard fallback checklist when automation stalls

Use this checklist when trigger automation, `claude -p`, or the optimization loop fails to produce timely or trustworthy results.

### Trigger conditions for fallback
Switch to fallback if any of these happen:
- the optimization/eval process hangs without producing meaningful new output
- subprocess-based trigger checks stall repeatedly
- results are partial, flaky, or operationally too expensive to trust
- the automation layer fails before producing a usable report

### Fallback sequence
1. Kill or stop the stuck automation process
2. Preserve useful artifacts already created
   - partial logs
   - eval files
   - current description draft
   - any benchmark/report output that is still readable
3. Mark automation status in `references/state.json` as `partial` or `blocked`
4. Inspect the target skill manually
5. Tighten the description by hand using the existing should-trigger / should-not-trigger set
6. If needed, strengthen the negative examples before touching the description again
7. Report explicitly that the result came from manual fallback, not successful full automation

### Minimum manual fallback deliverable
A fallback pass is only considered successful if it produces all three:
- one concrete description improvement or boundary clarification
- one update to eval quality (or a clear statement that eval quality was already sufficient)
- one explicit statement of what remains unverified because automation did not finish

### Fallback reporting language
Use wording like:
- `automation status: partial`
- `manual fallback used after automation stalled`
- `description tightened manually; full trigger score still unverified`

## Suggested file layout for maintained skills

For a target skill, prefer this structure:

```text
skill-name/
├── SKILL.md
├── evals/
│   ├── evals.json
│   └── trigger-evals.json
├── references/
│   └── any extra docs
```

For this maintainer skill itself, keep a small local state file:

```text
opencode-skill-maintainer/
├── SKILL.md
├── evals/
├── references/
│   └── state.json
```

## State tracking

Track these values in `references/state.json`:
- `skill_creator_source`
- `last_skill_creator_fingerprint`
- `last_sync_at`
- `last_sync_reason` (`initial` / `upstream_changed` / `manual_refresh`)
- `last_target_skill`
- `last_automation_status` (`success` / `partial` / `blocked` / `not_run`)
- `notes` (optional short string only when useful)

Do not overcomplicate the state file.

### Expected state update behavior
- On first run: initialize fingerprint and mark `last_sync_reason: initial`
- On upstream change: replace fingerprint and mark `last_sync_reason: upstream_changed`
- On explicit user refresh: keep or replace fingerprint as appropriate and mark `manual_refresh`

## Output style

When finishing a maintenance pass, report in this structure:

- target skill: `<path>`
- freshness check: `updated` / `unchanged`
- skill-creator fingerprint: `<hash prefix>`
- sync action: `<what was updated in this maintainer skill, or none>`
- work done: `<drafted description / added evals / revised workflow / etc.>`
- automation status: `success / partial / blocked / not_run`
- files changed: `<paths>`
- next best step: `<one concrete recommendation>`

## Triggers

Use this skill when the user says things like:
- “给我做一个自用的 skill 优化流程”
- “我想要一个专门维护 skill 的 workflow”
- “用 opencode 搞一个能长期迭代 skill 的 skill”
- “每次先检查 skill-creator 更新，再同步优化这个 skill”
- “帮我做一个维护别的 skill 的 skill”

## Non-goals

This skill is not for:
- random one-off markdown editing unrelated to skill maintenance
- generic article translation or publishing workflows
- pretending OpenCode is available when it is not
- fully autonomous self-modification without surfacing meaningful changes to the user
