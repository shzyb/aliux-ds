# shadcn/ui → Figma Builder — Progress

Console scripts in `figma-scripts/` are pasted directly into Figma's developer
console (Plugins > Development > Open Console). No manifest, no plugin UI.

## Phase 0 — Variables Foundation

Status: **approved.** ✅

Script: [`figma-scripts/phase-0-variables.js`](figma-scripts/phase-0-variables.js)

Note on sourcing: direct `WebFetch` to `ui.shadcn.com` and `raw.githubusercontent.com`
returned HTTP 403 in this sandbox (network egress policy blocks generic fetches
to those hosts). Values below were cross-verified via multiple independent web
searches instead of one canonical page fetch — flagging this since the whole
methodology here is "verify against live source, never guess."

### Primitives collection (single mode, no theming)

| Group | Variables | Source |
|---|---|---|
| `gray/*` | `0,50,100,200,300,400,500,600,700,800,900,950` | 9 of 12 stops are shadcn's actual shipped oklch L values (background/foreground/border/ring/muted-foreground/secondary·muted·accent/primary/card-dark); `300`, `600`, `950` interpolated to fill the ramp |
| `blue/*` (brand) | `50…950` | **Addition** — shadcn's neutral theme ships no brand hue. Hue `264.376` and the `600` stop are lifted verbatim from shadcn's own dark-mode `--sidebar-primary` / `--chart-1` value; rest of ramp constructed around it |
| `red/*` (danger) | `50…950` | `400` = shadcn dark `--destructive` exactly (`oklch(0.704 0.191 22.216)`); `600` = shadcn light `--destructive` exactly (`oklch(0.577 0.245 27.325)`); rest interpolated |
| `green/*` (success) | `50…950` | **Addition** — shadcn has no success token. Constructed, hue ~145-150 |
| `amber/*` (warning) | `50…950` | **Addition** — shadcn has no warning token. Hues `84.429`/`70.08` at `500`/`600` echo shadcn's own `--chart-4`/`--chart-5`; rest constructed |
| `overlay/white-10`, `overlay/white-15`, `overlay/black-40`, `overlay/black-50`, `overlay/black-60` | alpha overlays | Mirrors shadcn's dark-mode pattern of `oklch(1 0 0 / 10%)`-style translucent borders/scrims instead of solid grays |
| `spacing/0 … spacing/24` | 17 stops | Tailwind's 4px base spacing scale |
| `radius/none, sm, md, lg, xl, 2xl, full` | 7 stops | Derived from shadcn's `--radius: 0.625rem` (10px) base: `sm = base-4, md = base-2, lg = base, xl = base+4` |
| `font-size/xs … 5xl` | 9 stops | Tailwind default type scale (px) |
| `line-height/xs … 5xl` | 9 stops | Tailwind default line-height scale (px) |
| `font-weight/normal, medium, semibold, bold` | 4 stops | `400/500/600/700` |
| `border-width/0,1,2,4` | 4 stops | px |

### Semantics collection (Light + Dark modes, every value is an alias)

| Semantic variable | Light → primitive | Dark → primitive |
|---|---|---|
| `bg/default` | `gray/0` | `gray/900` |
| `bg/subtle` | `gray/50` | `gray/800` |
| `bg/muted` | `gray/100` | `gray/700` |
| `bg/inverse` | `gray/900` | `gray/0` |
| `bg/brand` | `blue/600` | `blue/500` |
| `bg/danger` | `red/600` | `red/500` |
| `bg/success` | `green/600` | `green/500` |
| `bg/warning` | `amber/500` | `amber/400` |
| `fg/default` | `gray/900` | `gray/50` |
| `fg/muted` | `gray/500` | `gray/400` |
| `fg/subtle` | `gray/400` | `gray/500` |
| `fg/inverse` | `gray/50` | `gray/900` |
| `fg/on-brand` | `gray/0` | `gray/50` |
| `fg/danger` | `red/700` | `red/300` |
| `fg/success` | `green/700` | `green/300` |
| `fg/warning` | `amber/800` | `amber/300` |
| `border/default` | `gray/200` | `overlay/white-10` |
| `border/subtle` | `gray/100` | `overlay/white-10` |
| `border/strong` | `gray/400` | `overlay/white-15` |
| `border/focus` | `gray/400` | `gray/500` |
| `border/danger` | `red/500` | `red/400` |
| `interactive/default` | `gray/800` | `gray/200` |
| `interactive/hover` | `gray/700` | `gray/300` |
| `interactive/active` | `gray/900` | `gray/100` |
| `interactive/disabled` | `gray/300` | `gray/700` |
| `interactive/focus-ring` | `gray/400` | `gray/500` |
| `surface/primary` | `gray/0` | `gray/900` |
| `surface/secondary` | `gray/50` | `gray/800` |
| `surface/raised` | `gray/0` | `gray/800` |
| `surface/overlay` | `overlay/black-40` | `overlay/black-60` |
| `surface/sunken` | `gray/100` | `gray/950` |

Flagged for approval:
1. **`blue` (brand), `green` (success), `amber` (warning) ramps are additions** — shadcn's
   default theme is neutral + a single destructive red. The semantic spec requires
   `bg/brand`, `bg/success`, `bg/warning`, etc., so these ramps had to be constructed.
   Say if you'd rather brand/success/warning point at different hues.
2. `border/focus` and `interactive/focus-ring` are bound to the same gray values
   (mirroring shadcn's actual monochrome `--ring`) rather than a brand color —
   flag if you want focus rings colorized instead.

## Phase 0b — Text Styles

Status: **script written, ready to run.**

Script: [`figma-scripts/phase-0b-text-styles.js`](figma-scripts/phase-0b-text-styles.js)
(run `phase-0-variables.js` first — this script reads the `Primitives` collection it creates)

Font family: **Inter**, on Figma Text Styles (not variables — Figma's stable
Plugin API doesn't support binding `fontName`/font-style to a variable, only
`fontSize`, `lineHeight`, `letterSpacing`, `paragraphSpacing`, `paragraphIndent`).
`fontSize` and `lineHeight` are bound to the Phase 0 `font-size/*` / `line-height/*`
primitives; font weight is expressed via Inter's named styles.

| Text style | Size (px / line-height) | Inter weight |
|---|---|---|
| `Display` | 48 / 48 | Bold |
| `Heading/H1` | 36 / 40 | Bold |
| `Heading/H2` | 30 / 36 | Semi Bold |
| `Heading/H3` | 24 / 32 | Semi Bold |
| `Heading/H4` | 20 / 28 | Semi Bold |
| `Body/Large` | 18 / 28 | Regular |
| `Body/Base` | 16 / 24 | Regular |
| `Body/Base Medium` | 16 / 24 | Medium |
| `Body/Small` | 14 / 20 | Regular |
| `Body/Small Medium` | 14 / 20 | Medium |
| `Label/Default` | 14 / 20 | Medium |
| `Caption/Default` | 12 / 16 | Regular |
| `Caption/Medium` | 12 / 16 | Medium |

## Phase 1 — Component Loop

Completed: **2 / 61** (Alert re-verified as of the fix below; please re-run and confirm)

**2026-07-01 fix:** the original Alert script left an incomplete build in the file — only
`Style=Default` existed as a loose component (never wrapped into a "Alert" component set),
its title used the wrong text style, and its fill wasn't bound to a semantic variable. Root
cause: the script had no verification, so it likely threw partway through the first variant
(after the title, before the description) and nothing downstream ever ran or surfaced clearly.
Both `01-accordion.js` and `02-alert.js` were rewritten to:
- Read back every fill/stroke/scalar/text-style binding immediately after setting it and throw
  a precise, named error the instant one doesn't take, instead of continuing silently.
- Delete-and-rebuild instead of skip on re-run, and also sweep up orphaned loose components
  (`Style=...`/`State=...`) left behind by a prior partial failure, so re-running always starts
  from a clean slate.
- Print a verification report to console on success (variant count, style IDs, bound-variable
  booleans) so the end state is provable, not assumed.

| # | Component | Script | Anatomy / variants / booleans |
|---|---|---|---|
| 1 | Accordion | [`figma-scripts/01-accordion.js`](figma-scripts/01-accordion.js) | Built as reusable "Accordion Item" (trigger + collapsible content + bottom border) since shadcn's `<Accordion>` wrapper has no unique styling of its own. Variant `State`: Closed/Open (drives chevron rotation + content visibility). Booleans: `Show Border`, `Disabled` (visibility-bound scrim, since Figma booleans can't bind to opacity directly). Chevron is a hand-drawn vector, not an imported icon. |
| 2 | Alert | [`figma-scripts/02-alert.js`](figma-scripts/02-alert.js) | Icon + Title/Description text column, bordered card. Variant `Style`: Default/Destructive (only text/icon color changes — border & background stay the same, matching shadcn's actual CVA classes). Booleans: `Has Icon`, `Has Description`. Icon is a generic stroked circle placeholder, not a specific Lucide icon (varies per real usage — info/error/check — so left generic per the "nice-to-have, not strict requirement" guidance on icon slots). |

No new semantic tokens were needed for either — both bind exclusively to existing `fg/*`, `border/*`, `bg/default`, `surface/raised` and `spacing/*`, `radius/lg`, `border-width/*` primitives.

Remaining (59):
Alert Dialog, Aspect Ratio, Attachment, Avatar, Badge,
Breadcrumb, Bubble, Button, Button Group, Calendar, Card, Carousel, Chart,
Checkbox, Collapsible, Combobox, Command, Context Menu, Data Table, Date Picker,
Dialog, Direction, Drawer, Dropdown Menu, Empty, Field, Hover Card, Input,
Input Group, Input OTP, Item, Kbd, Label, Marker, Menubar, Message,
Message Scroller, Native Select, Navigation Menu, Pagination, Popover, Progress,
Radio Group, Resizable, Scroll Area, Select, Separator, Sheet, Sidebar,
Skeleton, Slider, Sonner, Spinner, Switch, Table, Tabs, Textarea, Toast,
Toggle, Toggle Group, Tooltip, Typography
