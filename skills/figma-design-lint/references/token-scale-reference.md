# Token Scale Reference — CDS v2 (Creator Design System)

Source: `@creator/design-token` v2, generated from Figma DTCG exports.
Figma library: `CDS | Comps | CN Retail` (file `y4ObhbD37kdo6qve0iMikL`)

Use this reference when `get_variable_defs` is unavailable or as a cross-check for token compliance.

---

## How to Use This in Audits

### Priority 1: Check Variable Bindings (from `get_variable_defs`)

When Figma MCP returns variable data, the **best** check is:
- Does the node's fill/stroke/spacing **bind** to a variable? (bound = compliant)
- Is the bound variable from the semantic layer (theme-colors, theme-layout) and not a raw primitive (global-colors)?

### Priority 2: Numeric Value Matching (fallback)

When variable binding data is unavailable, match raw values against the scales below. Flag values that don't appear on any scale.

---

## Semantic Color Tokens (theme-colors)

Designers should use **these** — not global primitives.

### text.*

| Token | Hex |
|-------|-----|
| text/default | `#141414` |
| text/subdued | `#747474` |
| text/muted | `#b0b0b0` |
| text/primary | `#e96f14` |
| text/accent | `#ffd502` |
| text/informative | `#006fe3` |
| text/positive | `#00a843` |
| text/warning | `#e96f14` |
| text/negative | `#bd0000` |
| text/inverse | `#ffffff` |
| text/static-dark | `#000000` |
| text/static-light | `#ffffff` |

### icon.*

| Token | Hex |
|-------|-----|
| icon/default | `#141414` |
| icon/subdued | `#747474` |
| icon/muted | `#b0b0b0` |
| icon/primary | `#e96f14` |
| icon/accent | `#ffd502` |
| icon/informative | `#006fe3` |
| icon/positive | `#00a843` |
| icon/warning | `#e96f14` |
| icon/negative | `#bd0000` |
| icon/inverse | `#ffffff` |
| icon/static-dark | `#000000` |
| icon/static-light | `#ffffff` |

### border.*

| Token | Hex |
|-------|-----|
| border/strong | `#141414` |
| border/disabled | `#cbcbcb` |
| border/inverse | `#ffffff` |
| border/default | `#ededed` |
| border/informative/default | `#006fe3` |
| border/positive/primary | `#ffd502` |
| border/positive/secondary | `#00a843` |
| border/warning/primary | `#e96f14` |
| border/negative/primary | `#bd0000` |

### action.*

| Token | Hex |
|-------|-----|
| action/default | `#ffd502` |
| action/secondary | `#e5e5e5` |
| action/accent | `#00a843` |
| action/negative | `#bd0000` |
| action/static-dark | `#141414` |
| action/static-light | `#ffffff` |
| action/primary | `#e96f14` |
| action/disabled | `#cbcbcb` |

### interactive.*

| Token | Hex |
|-------|-----|
| interactive/enabled | `#006fe3` |
| interactive/disabled | `#cbcbcb` |

### layer.* (surfaces/backgrounds)

| Token | Hex / RGBA |
|-------|------------|
| page/background | `#ffffff` |
| layer/default | `#ffffff` |
| layer/muted | `#f2f2f2` |
| layer/subdued | `#d9d9d9` |
| layer/inverse | `#141414` |
| layer/static-dark/default | `#141414` |
| layer/static-light/default | `#ffffff` |
| layer/transparent/light/subdued | `rgba(255,255,255, 0.34)` |
| layer/transparent/light/default | `rgba(255,255,255, 0.53)` |
| layer/transparent/light/strong | `rgba(255,255,255, 0.80)` |
| layer/transparent/dark/subdued | `rgba(0,0,0, 0.20)` |
| layer/transparent/dark/default | `rgba(0,0,0, 0.48)` |
| layer/transparent/dark/strong | `rgba(0,0,0, 0.74)` |

---

## Layout Scales (theme-layout)

### Spacing

| Token | Value |
|-------|-------|
| none | 0 |
| 4xs | 1px |
| 3xs | 2px |
| 2xs | 4px |
| xs | 8px |
| sm | 12px |
| md | 16px |
| lg | 20px |
| xl | 24px |
| 2xl | 32px |
| 3xl | 40px |
| 4xl | 48px |
| 5xl | 56px |
| 6xl | 64px |
| 7xl | 72px |
| 8xl | 80px |

**Allowed spacing values (px):** `0, 1, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 72, 80`

Fluid spacings (responsive): 16, 20, 24, 32, 40 — same values as fixed but used in fluid contexts.

### Size (component dimensions)

| Token | Value |
|-------|-------|
| 4xs | 2px |
| 3xs | 4px |
| 2xs | 8px |
| xs | 12px |
| sm | 16px |
| md | 24px |
| lg | 32px |
| xl | 40px |
| 2xl | 48px |
| 3xl | 56px |
| 4xl | 64px |
| 5xl | 80px |

**Allowed size values (px):** `2, 4, 8, 12, 16, 24, 32, 40, 48, 56, 64, 80`

### Border Radius

| Token | Value |
|-------|-------|
| xs | 2px |
| sm | 4px |
| md | 8px |
| lg | 12px |
| xl | 16px |
| 2xl | 24px |
| pill | 999999px |
| round | 50% |

**Allowed border-radius values (px):** `0, 2, 4, 8, 12, 16, 24` (plus `999999` for pill / `50%` for circle)

### Border Width

| Token | Value |
|-------|-------|
| none | 0 |
| sm | 1px |
| md | 1.5px |
| lg | 2px |
| xl | 3px |

**Allowed border-width values (px):** `0, 1, 1.5, 2, 3`

### Blur (backdrop/layer blur)

| Token | Value |
|-------|-------|
| 1 | 4px |
| 2 | 12px |
| 3 | 24px |

**Allowed blur values (px):** `4, 12, 24`

---

## Typography Scale (theme-layout/text)

### Font Size

| Token | Value |
|-------|-------|
| 25 | 10px |
| 50 | 12px |
| 100 | 14px |
| 200 | 16px |
| 300 | 18px |
| 400 | 23px |
| 500 | 32px |
| 600 | 41px |
| 700 | 62px |
| 800 | 100px |

**Allowed font-size values (px):** `10, 12, 14, 16, 18, 23, 32, 41, 62, 100`

### Line Height

| Token | Value |
|-------|-------|
| 50 | 15px |
| 100 | 18px |
| 200 | 21px |
| 300 | 24px |
| 400 | 26px |
| 500 | 34px |
| 600 | 37px |
| 700 | 48px |
| 800 | 62px |
| 900 | 72px |
| 1000 | 115px |

**Allowed line-height values (px):** `15, 18, 21, 24, 26, 34, 37, 48, 62, 72, 115`

### Font Weight

| Token | Value |
|-------|-------|
| regular | 400 |
| semibold | 600 |
| bold | 700 |
| black | 900 |

**Allowed font-weight values:** `400, 600, 700, 900`

### Font Family

| Token | Value |
|-------|-------|
| brand-en | LEGO Typewell |
| brand-cn | LEGO Typewell SC |
| ui | PingFang SC |

**Allowed font families:** `LEGO Typewell`, `LEGO Typewell SC`, `PingFang SC`

---

## Global Colors (primitives — reference only)

These are the **primitive palette**. Designers should NOT use these directly in UI — they should be consumed through semantic tokens above.

If a Figma node uses a hex value that matches a global primitive but is NOT bound to a semantic variable, that's a **P2** issue ("should be bound to semantic token").

### Core Neutrals
- gray: 10→1300 scale (13 steps)
- slate: 10→1300 scale (13 steps)

### Core Hues
- red, orange, yellow, green, teal, azur, blue, purple, pink: each 50→1300 scale (14 steps)

### Transparent Scales
- white: 0→1300 (opacity 0%→94%)
- black: 0→1300 (opacity 2%→83%)

### Brand Colors
- LEGO brand palette (white, grays, blues, oranges, pinks, purples, greens, yellows, reds)
- Partner palettes (BTS, Fortnite, Super Mario)
- Social colors (Facebook, Twitter)

---

## Figma Variable Collection Mapping

Expected Figma variable collections (from DTCG source files):

| Collection | Source File | Contents |
|------------|------------|----------|
| Global Colors | `Default.tokens.json` | Primitive color palette |
| Theme Colors | `Default.tokens 2.json` | Semantic color assignments |
| Theme Layout | `Theme_ Layout.json` | Spacing, size, radius, border-width, blur, typography |

When running `get_variable_defs`, expect to see these collections. If the target design file references this library, variables will show as "remote" references.

---

## Quick Validation Checklist

For each design node, check:

1. **Fill color** → bound to `color/{text,icon,action,layer,page}/*` variable? Or matches hex in semantic table?
2. **Stroke color** → bound to `color/border/*` variable? Or matches hex?
3. **Spacing (padding, gap)** → value ∈ `{0,1,2,4,8,12,16,20,24,32,40,48,56,64,72,80}`?
4. **Border radius** → value ∈ `{0,2,4,8,12,16,24,999999}` or `50%`?
5. **Border width** → value ∈ `{0,1,1.5,2,3}`?
6. **Font size** → value ∈ `{10,12,14,16,18,23,32,41,62,100}`?
7. **Font weight** → value ∈ `{400,600,700,900}`?
8. **Font family** → one of `LEGO Typewell`, `LEGO Typewell SC`, `PingFang SC`?
9. **Line height** → value ∈ `{15,18,21,24,26,34,37,48,62,72,115}`?
10. **Blur** → value ∈ `{4,12,24}`?
