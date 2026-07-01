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

Completed: **10 / 61** (+ 1 pending: Bubble, skipped per your call — see below)

**Bugs found and fixed while building Alert (2026-07-01), in order surfaced:** the original
script left an incomplete build — only `Style=Default` existed as a loose component (never
wrapped into a set), its title used the wrong text style, and colors weren't bound. Root cause:
no verification, so it threw partway through the first variant and nothing downstream ran.
Fixed by rewriting the binding helpers to read back every fill/stroke/scalar/text-style bind and
throw immediately if it didn't take. That surfaced three real, per-node-type Figma API gaps,
fixed one at a time as each was hit:
1. `cornerRadius` isn't bindable as a single field on frame-like nodes — only the four
   `topLeftRadius`/`topRightRadius`/`bottomLeftRadius`/`bottomRightRadius` fields are.
2. Same gap for `strokeWeight` → `strokeTopWeight`/`strokeRightWeight`/`strokeBottomWeight`/`strokeLeftWeight`.
3. `textStyleId =` (sync setter) is blocked entirely on dynamic-page documents (the current
   default for Figma files) — must use `await node.setTextStyleIdAsync(id)`.
4. `vectorPaths` only supports Figma's own line/curve command syntax, not SVG arc (`A`)
   commands — hit this on Button's loading spinner, fixed by using an `EllipseNode` with
   `arcData` instead of a hand-drawn path for the ring.

All scripts from Alert onward use `bindCornerRadius()`, `bindStrokeWeight()`, and async
`applyTextStyle()` from the start. `01-accordion.js` has the corner-radius/stroke-weight fix
applied but *not yet* the dynamic-page `textStyleId` fix, per your request to leave it alone —
it will hit the same `setTextStyleIdAsync` error the first time it's run in a dynamic-page file.

**2026-07-01, later:** per your call, every hand-drawn icon glyph (chevrons, checkmarks,
x's, dots, plus signs) across all scripts so far was replaced with a plain placeholder chip
(a small rounded rectangle bound to the same semantic color) — you'll swap these for real
icons yourself. This also removes the `vectorPaths` fragility above as a recurring risk for
every future component. The Button loading spinner is the one exception, kept as a real
`arcData` ring since it's a functional state indicator, not a swappable content icon.

| # | Component | Script | Anatomy / variants / booleans |
|---|---|---|---|
| 1 | Accordion | [`figma-scripts/01-accordion.js`](figma-scripts/01-accordion.js) | Built as reusable "Accordion Item" (trigger + collapsible content + bottom border) since shadcn's `<Accordion>` wrapper has no unique styling of its own. Variant `State`: Closed/Open (drives chevron rotation + content visibility). Booleans: `Show Border`, `Disabled` (visibility-bound scrim, since Figma booleans can't bind to opacity directly). Chevron is a placeholder chip (rotation still applied per variant), per your call to stop hand-drawing icon glyphs. **Not yet re-run since the `textStyleId` fix — expect one more error until it is.** |
| 2 | Alert | [`figma-scripts/02-alert.js`](figma-scripts/02-alert.js) | Icon + Title/Description text column, bordered card. Variant `Style`: Default/Destructive (only text/icon color changes — border & background stay the same, matching shadcn's actual CVA classes). Booleans: `Has Icon`, `Has Description`. Icon is a generic stroked circle placeholder, not a specific Lucide icon. |
| 3 | Alert Dialog | [`figma-scripts/03-alert-dialog.js`](figma-scripts/03-alert-dialog.js) | Header (Title+Description) + Footer (Cancel/Action) card. No variant axis — shadcn's AlertDialog has no documented `variant` prop, so this is a single Component rather than a ComponentSet. Boolean: `Has Description`. Cancel/Action are plain styled placeholders (not Button instances — Button hasn't been built yet in the loop). Flagged: Title uses `Heading/H4` (20px/Semibold) as the nearest existing text style to shadcn's actual 18px/Semibold — Phase 0b has no 18px+Semibold combination. |
| 4 | Aspect Ratio | [`figma-scripts/04-aspect-ratio.js`](figma-scripts/04-aspect-ratio.js) | Single placeholder rectangle constrained to a ratio. Variant `Ratio`: 1:1/4:3/16:9/21:9 — shadcn's actual `ratio` prop takes an arbitrary number, modeled here as the common documented ratios since Figma variants need concrete dimensions. No booleans. |
| 5 | Attachment | [`figma-scripts/05-attachment.js`](figma-scripts/05-attachment.js) | Media thumbnail + Title/Description + Actions card. Deliberately scoped down: shadcn's real Attachment crosses 5 states x 3 sizes x 2 orientations (30 combos) — only `State` (Idle/Uploading/Processing/Error/Done) is modeled as a Variant axis; size and orientation are **not modeled**, flagged in the file header rather than half-building either. Boolean: `Has Actions`. Shimmer/progress animation has no static Figma equivalent, so Uploading/Processing are differentiated by description text/color only. |
| 6 | Avatar | [`figma-scripts/06-avatar.js`](figma-scripts/06-avatar.js) | Circular Image placeholder layered over an always-present Fallback (initials) — toggling `Has Image` off reveals the fallback, avoiding the need for an inverse boolean. Variant `Size`: Sm(24)/Default(32)/Lg(40), matching shadcn's documented `size-6`/`size-8`/`size-10` scale. Boolean: `Has Image`. Flagged: fallback initials use one fixed text style at every size rather than scaling with avatar size. |
| 7 | Badge | [`figma-scripts/07-badge.js`](figma-scripts/07-badge.js) | Single inline pill, no sub-parts. Variant `Style`: Default/Secondary/Destructive/Outline. Boolean: `Has Icon` (leading icon slot, now a placeholder chip). Flagged: shadcn's badge text is 12px/Semibold; Phase 0b has no Semibold at 12px, so `Caption/Medium` (12px/Medium) is used as the nearest existing style. |
| 8 | Breadcrumb | [`figma-scripts/08-breadcrumb.js`](figma-scripts/08-breadcrumb.js) | Built as reusable "Breadcrumb Item" (entry + trailing separator) since `<Breadcrumb>`/`<BreadcrumbList>` are unstyled wrappers, same reasoning as Accordion. Variant `Type`: Link/Page/Ellipsis. Boolean: `Show Separator` (turn off on the last item in an assembled trail). Separator and ellipsis dots are placeholder chips. |
| — | ~~Bubble~~ | *(skipped)* | **Skipped per your call.** Couldn't verify its variant list against the live docs (search summaries suggested 7 variants — Primary/Secondary/Muted/Tinted/Outlined/Destructive/Ghost — but this wasn't a confirmed quote from the source). Circle back when you can paste the doc content, or when live fetching is available. |
| 9 | Button | [`figma-scripts/09-button.js`](figma-scripts/09-button.js) | Icon/Spinner/Label, sizes built from real padding tokens rather than hardcoded heights (reproduces shadcn's documented h-9/h-8/h-10 exactly). Variant `Style`: Default/Destructive/Outline/Secondary/Ghost/Link. Variant `Size`: Default/Sm/Lg/Icon. Variant `State`: Default/Hover/Focused/Disabled — modeled as a real variant (not a boolean) per your feedback, matching shadcn's actual hover/focus-visible/disabled CSS: Hover fades bg-colored styles to 90% paint opacity or tints bg-less styles to `bg/muted` (whichever matches the style, since fading an already-transparent bg would show nothing); Focused adds a 2px `border/focus` ring; Disabled sets `root.opacity = 0.5`, matching shadcn's literal `disabled:opacity-50` — replaces the earlier visibility-bound scrim hack entirely. 6x4x4 = 96 variants total. Booleans: `Has Icon` (placeholder chip, not bound on Icon size), `Loading` (a real ring via `EllipseNode.arcData` — Figma's `vectorPaths` doesn't support SVG arc commands, which is what first broke this). Flagged: some sources mention additional icon-xs/icon-sm/icon-lg sizes that couldn't be confirmed against live docs — not built; ask if you want them added. |
| 10 | Button Group | [`figma-scripts/10-button-group.js`](figma-scripts/10-button-group.js) | One outer bordered/rounded frame (clipped) containing 3 generic ghost-style segments divided by thin separator lines — follows shadcn's own `ButtonGroupSeparator` pattern rather than trying to collapse individual button borders. Variant `Orientation`: Horizontal/Vertical. No booleans (structural anatomy piece; mixing in real Button/Input instances is left to actual usage). |

No new semantic tokens were needed for any of these — all bind exclusively to existing
`fg/*`, `bg/*`, `border/*`, `interactive/*`, `surface/*` and `spacing/*`, `radius/*`, `border-width/*` primitives.

Remaining (51, + Bubble pending):
Calendar, Card, Carousel, Chart,
Checkbox, Collapsible, Combobox, Command, Context Menu, Data Table, Date Picker,
Dialog, Direction, Drawer, Dropdown Menu, Empty, Field, Hover Card, Input,
Input Group, Input OTP, Item, Kbd, Label, Marker, Menubar, Message,
Message Scroller, Native Select, Navigation Menu, Pagination, Popover, Progress,
Radio Group, Resizable, Scroll Area, Select, Separator, Sheet, Sidebar,
Skeleton, Slider, Sonner, Spinner, Switch, Table, Tabs, Textarea, Toast,
Toggle, Toggle Group, Tooltip, Typography
