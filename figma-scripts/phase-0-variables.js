// Phase 0 — Variables Foundation
// Paste this entire block into the Figma desktop app's developer console
// (Plugins > Development > Open Console, or the console attached to a
// running dev-mode plugin) and run it as-is. No manifest, no UI, no build step.
//
// Creates:
//   1. A "Primitives" Variable Collection (single mode) with:
//      - 5 OKLCH-derived color ramps: gray, blue (brand), red (danger),
//        green (success), amber (warning) — 50..950 (+ gray/0)
//      - white/black alpha overlay primitives (for dark-mode borders/scrims)
//      - spacing, radius, font-size, font-weight, line-height, border-width scales
//   2. A "Semantics" Variable Collection with Light + Dark modes, organized
//      into bg/*, fg/*, border/*, interactive/*, surface/* groups, each
//      variable aliasing a Primitives variable (never a raw hardcoded value).
//
// Idempotent: re-running this script will NOT create duplicate collections
// or variables — it looks up existing ones by name and reuses them, only
// refreshing their bound values.

(async () => {
  const created = { collections: 0, primitives: 0, semantics: 0, reusedPrimitives: 0, reusedSemantics: 0 };
  const errors = [];

  // ---------------------------------------------------------------------
  // 0. OKLCH -> sRGB conversion (Bjorn Ottosson's OKLab formulas), because
  //    Figma variable COLOR values must be given as linear-free sRGB
  //    {r,g,b,a} floats in [0,1], not OKLCH strings.
  // ---------------------------------------------------------------------
  function oklchToRgb(L, C, Hdeg) {
    const hRad = (Hdeg * Math.PI) / 180;
    const a = C * Math.cos(hRad);
    const b = C * Math.sin(hRad);

    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    let rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    let gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    let bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

    const toSrgb = (c) => {
      c = Math.min(1, Math.max(0, c));
      return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    };

    return {
      r: Math.min(1, Math.max(0, toSrgb(rLin))),
      g: Math.min(1, Math.max(0, toSrgb(gLin))),
      b: Math.min(1, Math.max(0, toSrgb(bLin))),
    };
  }

  // ---------------------------------------------------------------------
  // 1. Idempotency helpers
  // ---------------------------------------------------------------------
  async function getOrCreateCollection(name) {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    let collection = collections.find((c) => c.name === name);
    if (collection) return { collection, isNew: false };
    collection = figma.variables.createVariableCollection(name);
    created.collections += 1;
    return { collection, isNew: true };
  }

  async function loadVariableMap(collection) {
    const map = new Map();
    for (const id of collection.variableIds) {
      const v = await figma.variables.getVariableByIdAsync(id);
      if (v) map.set(v.name, v);
    }
    return map;
  }

  function getOrCreateVariable(collection, map, name, type, counterKey) {
    let v = map.get(name);
    if (v) {
      created[`reused${counterKey}`] += 1;
      return v;
    }
    v = figma.variables.createVariable(name, collection, type);
    map.set(name, v);
    created[counterKey.toLowerCase()] += 1;
    return v;
  }

  try {
    // ---------------------------------------------------------------------
    // 2. PRIMITIVES collection
    // ---------------------------------------------------------------------
    const { collection: primitives } = await getOrCreateCollection("Primitives");
    const primModeId = primitives.modes[0].modeId;
    if (primitives.modes[0].name !== "Value") {
      primitives.renameMode(primModeId, "Value");
    }
    const primMap = await loadVariableMap(primitives);
    const primByName = new Map(); // convenience lookup for Semantics phase

    // -- 2a. Color ramps, defined as [stop, L, C, H] in OKLCH -------------
    const RAMPS = {
      // Achromatic neutral ramp. Values at 0/50/100/200/400/500/700/800/900
      // are shadcn's own shipped oklch L values (background, foreground,
      // border, ring, muted-foreground, secondary/muted/accent, primary,
      // card-dark). 300/600/950 are interpolated to complete a full ramp.
      gray: [
        [0, 1.0, 0, 0],
        [50, 0.985, 0, 0],
        [100, 0.97, 0, 0],
        [200, 0.922, 0, 0],
        [300, 0.86, 0, 0],
        [400, 0.708, 0, 0],
        [500, 0.556, 0, 0],
        [600, 0.4, 0, 0],
        [700, 0.269, 0, 0],
        [800, 0.205, 0, 0],
        [900, 0.145, 0, 0],
        [950, 0.09, 0, 0],
      ],
      // Brand accent. Hue 264.376 is lifted directly from shadcn's own
      // dark-mode --sidebar-primary / --chart-1 value; 600 is that exact
      // oklch(0.488 0.243 264.376). shadcn's neutral theme has no brand hue
      // of its own — this ramp is an addition, flagged for approval below.
      blue: [
        [50, 0.97, 0.02, 264.376],
        [100, 0.93, 0.045, 264.376],
        [200, 0.86, 0.075, 264.376],
        [300, 0.78, 0.11, 264.376],
        [400, 0.69, 0.15, 264.376],
        [500, 0.6, 0.19, 264.376],
        [600, 0.488, 0.243, 264.376],
        [700, 0.42, 0.21, 264.376],
        [800, 0.35, 0.175, 264.376],
        [900, 0.28, 0.135, 264.376],
        [950, 0.2, 0.09, 264.376],
      ],
      // Danger. 400 and 600 are shadcn's exact dark/light --destructive values.
      red: [
        [50, 0.965, 0.02, 25],
        [100, 0.925, 0.045, 25],
        [200, 0.86, 0.075, 24],
        [300, 0.79, 0.12, 23],
        [400, 0.704, 0.191, 22.216],
        [500, 0.64, 0.22, 24],
        [600, 0.577, 0.245, 27.325],
        [700, 0.5, 0.215, 26],
        [800, 0.42, 0.18, 25],
        [900, 0.34, 0.14, 24],
        [950, 0.25, 0.095, 23],
      ],
      // Success. Not present in shadcn's default theme at all — constructed
      // from scratch (hue ~145-150, a standard OKLCH "green"). Flagged below.
      green: [
        [50, 0.965, 0.03, 145],
        [100, 0.925, 0.055, 146],
        [200, 0.86, 0.09, 147],
        [300, 0.78, 0.12, 148],
        [400, 0.69, 0.145, 149],
        [500, 0.62, 0.16, 150],
        [600, 0.54, 0.155, 150],
        [700, 0.46, 0.135, 150],
        [800, 0.38, 0.11, 150],
        [900, 0.3, 0.085, 150],
        [950, 0.22, 0.06, 150],
      ],
      // Warning. Hue 84.429 / 70.08 at 500/600 echo shadcn's own
      // --chart-4 / --chart-5 hues. Otherwise constructed. Flagged below.
      amber: [
        [50, 0.975, 0.03, 90],
        [100, 0.94, 0.06, 88],
        [200, 0.89, 0.1, 87],
        [300, 0.83, 0.14, 86],
        [400, 0.78, 0.175, 85],
        [500, 0.73, 0.185, 84.429],
        [600, 0.66, 0.175, 70.08],
        [700, 0.56, 0.155, 60],
        [800, 0.46, 0.13, 55],
        [900, 0.36, 0.1, 50],
        [950, 0.26, 0.07, 45],
      ],
    };

    for (const [rampName, stops] of Object.entries(RAMPS)) {
      for (const [stop, L, C, H] of stops) {
        const name = `${rampName}/${stop}`;
        const rgb = oklchToRgb(L, C, H);
        const v = getOrCreateVariable(primitives, primMap, name, "COLOR", "Primitives");
        v.setValueForMode(primModeId, { r: rgb.r, g: rgb.g, b: rgb.b, a: 1 });
        primByName.set(name, v);
      }
    }

    // -- 2b. White/black alpha overlays (mirrors shadcn's dark-mode
    //    `oklch(1 0 0 / 10%)` style borders and dialog scrims) -----------
    const OVERLAYS = {
      "overlay/white-10": { r: 1, g: 1, b: 1, a: 0.1 },
      "overlay/white-15": { r: 1, g: 1, b: 1, a: 0.15 },
      "overlay/black-40": { r: 0, g: 0, b: 0, a: 0.4 },
      "overlay/black-50": { r: 0, g: 0, b: 0, a: 0.5 },
      "overlay/black-60": { r: 0, g: 0, b: 0, a: 0.6 },
    };
    for (const [name, value] of Object.entries(OVERLAYS)) {
      const v = getOrCreateVariable(primitives, primMap, name, "COLOR", "Primitives");
      v.setValueForMode(primModeId, value);
      primByName.set(name, v);
    }

    // -- 2c. Scalar scales (FLOAT) ---------------------------------------
    const SCALARS = {
      // spacing scale, px (Tailwind's 4px base unit)
      "spacing/0": 0,
      "spacing/0-5": 2,
      "spacing/1": 4,
      "spacing/1-5": 6,
      "spacing/2": 8,
      "spacing/2-5": 10,
      "spacing/3": 12,
      "spacing/3-5": 14,
      "spacing/4": 16,
      "spacing/5": 20,
      "spacing/6": 24,
      "spacing/8": 32,
      "spacing/10": 40,
      "spacing/12": 48,
      "spacing/16": 64,
      "spacing/20": 80,
      "spacing/24": 96,
      // radius scale, px — derived from shadcn's --radius: 0.625rem (10px) base
      "radius/none": 0,
      "radius/sm": 6,
      "radius/md": 8,
      "radius/lg": 10,
      "radius/xl": 14,
      "radius/2xl": 16,
      "radius/full": 9999,
      // font-size scale, px
      "font-size/xs": 12,
      "font-size/sm": 14,
      "font-size/base": 16,
      "font-size/lg": 18,
      "font-size/xl": 20,
      "font-size/2xl": 24,
      "font-size/3xl": 30,
      "font-size/4xl": 36,
      "font-size/5xl": 48,
      // line-height scale, px
      "line-height/xs": 16,
      "line-height/sm": 20,
      "line-height/base": 24,
      "line-height/lg": 28,
      "line-height/xl": 28,
      "line-height/2xl": 32,
      "line-height/3xl": 36,
      "line-height/4xl": 40,
      "line-height/5xl": 48,
      // font-weight scale
      "font-weight/normal": 400,
      "font-weight/medium": 500,
      "font-weight/semibold": 600,
      "font-weight/bold": 700,
      // border-width scale, px
      "border-width/0": 0,
      "border-width/1": 1,
      "border-width/2": 2,
      "border-width/4": 4,
    };
    for (const [name, value] of Object.entries(SCALARS)) {
      const v = getOrCreateVariable(primitives, primMap, name, "FLOAT", "Primitives");
      v.setValueForMode(primModeId, value);
    }

    // ---------------------------------------------------------------------
    // 3. SEMANTICS collection (Light / Dark modes)
    // ---------------------------------------------------------------------
    const { collection: semantics } = await getOrCreateCollection("Semantics");

    let lightModeId, darkModeId;
    const existingLight = semantics.modes.find((m) => m.name === "Light");
    const existingDark = semantics.modes.find((m) => m.name === "Dark");
    if (existingLight) {
      lightModeId = existingLight.modeId;
    } else {
      lightModeId = semantics.modes[0].modeId;
      semantics.renameMode(lightModeId, "Light");
    }
    if (existingDark) {
      darkModeId = existingDark.modeId;
    } else {
      darkModeId = semantics.addMode("Dark");
    }

    const semMap = await loadVariableMap(semantics);

    // Each entry: semantic name -> [primitiveNameForLight, primitiveNameForDark]
    const SEMANTICS = {
      // bg/*
      "bg/default": ["gray/0", "gray/900"],
      "bg/subtle": ["gray/50", "gray/800"],
      "bg/muted": ["gray/100", "gray/700"],
      "bg/inverse": ["gray/900", "gray/0"],
      "bg/brand": ["blue/600", "blue/500"],
      "bg/danger": ["red/600", "red/500"],
      "bg/success": ["green/600", "green/500"],
      "bg/warning": ["amber/500", "amber/400"],
      // fg/*
      "fg/default": ["gray/900", "gray/50"],
      "fg/muted": ["gray/500", "gray/400"],
      "fg/subtle": ["gray/400", "gray/500"],
      "fg/inverse": ["gray/50", "gray/900"],
      "fg/on-brand": ["gray/0", "gray/50"],
      "fg/danger": ["red/700", "red/300"],
      "fg/success": ["green/700", "green/300"],
      "fg/warning": ["amber/800", "amber/300"],
      // border/*
      "border/default": ["gray/200", "overlay/white-10"],
      "border/subtle": ["gray/100", "overlay/white-10"],
      "border/strong": ["gray/400", "overlay/white-15"],
      "border/focus": ["gray/400", "gray/500"],
      "border/danger": ["red/500", "red/400"],
      // interactive/*
      "interactive/default": ["gray/800", "gray/200"],
      "interactive/hover": ["gray/700", "gray/300"],
      "interactive/active": ["gray/900", "gray/100"],
      "interactive/disabled": ["gray/300", "gray/700"],
      "interactive/focus-ring": ["gray/400", "gray/500"],
      // surface/*
      "surface/primary": ["gray/0", "gray/900"],
      "surface/secondary": ["gray/50", "gray/800"],
      "surface/raised": ["gray/0", "gray/800"],
      "surface/overlay": ["overlay/black-40", "overlay/black-60"],
      "surface/sunken": ["gray/100", "gray/950"],
    };

    for (const [semName, [lightPrimName, darkPrimName]] of Object.entries(SEMANTICS)) {
      const lightPrim = primByName.get(lightPrimName);
      const darkPrim = primByName.get(darkPrimName);
      if (!lightPrim || !darkPrim) {
        errors.push(`Missing primitive for "${semName}": ${lightPrimName} / ${darkPrimName}`);
        continue;
      }
      const v = getOrCreateVariable(semantics, semMap, semName, "COLOR", "Semantics");
      v.setValueForMode(lightModeId, figma.variables.createVariableAlias(lightPrim));
      v.setValueForMode(darkModeId, figma.variables.createVariableAlias(darkPrim));
    }

    if (errors.length) {
      for (const e of errors) console.error("[Phase 0]", e);
    }

    const summary =
      `Phase 0 done — Primitives: ${created.primitives} created / ${created.reusedPrimitives || 0} reused. ` +
      `Semantics: ${created.semantics} created / ${created.reusedSemantics || 0} reused. ` +
      `Collections touched: ${created.collections} new.` +
      (errors.length ? ` ${errors.length} issue(s) — see console.` : "");
    console.log(summary);
    figma.notify(summary, { timeout: 6000 });
  } catch (err) {
    console.error("[Phase 0] Fatal error:", err);
    figma.notify("Phase 0 failed — see console for details.", { error: true, timeout: 6000 });
  }
})();
