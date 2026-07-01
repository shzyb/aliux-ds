# shadcn/ui → Figma Builder — Progress

Console scripts in `figma-scripts/` are pasted directly into Figma's developer
console (Plugins > Development > Open Console). No manifest, no plugin UI.

## Phase 0 — Variables Foundation

Status: **script written, awaiting your approval before Phase 1 starts.**

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

**Do not proceed to Phase 1 until this is explicitly approved.**

## Phase 1 — Component Loop

Completed: **0 / 61**

Remaining (in doc order):
Accordion, Alert, Alert Dialog, Aspect Ratio, Attachment, Avatar, Badge,
Breadcrumb, Bubble, Button, Button Group, Calendar, Card, Carousel, Chart,
Checkbox, Collapsible, Combobox, Command, Context Menu, Data Table, Date Picker,
Dialog, Direction, Drawer, Dropdown Menu, Empty, Field, Hover Card, Input,
Input Group, Input OTP, Item, Kbd, Label, Marker, Menubar, Message,
Message Scroller, Native Select, Navigation Menu, Pagination, Popover, Progress,
Radio Group, Resizable, Scroll Area, Select, Separator, Sheet, Sidebar,
Skeleton, Slider, Sonner, Spinner, Switch, Table, Tabs, Textarea, Toast,
Toggle, Toggle Group, Tooltip, Typography
