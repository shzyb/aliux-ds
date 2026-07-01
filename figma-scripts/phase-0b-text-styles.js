// Phase 0b — Text Styles
// Paste into Figma's developer console after phase-0-variables.js has been
// run at least once (this script reads the "Primitives" collection it
// creates). Builds a set of Figma Text Styles on the Inter font family,
// with fontSize and lineHeight bound to the Phase 0 font-size/* and
// line-height/* primitive variables — no hardcoded numeric type values.
//
// Font weight (Regular/Medium/SemiBold/Bold) is expressed via Inter's
// named font styles, not a bound variable: Figma's stable Plugin API does
// not support binding TextStyle.fontName/font-style to a variable, only
// fontSize / lineHeight / letterSpacing / paragraphSpacing / paragraphIndent.
// The font-weight/* primitives from Phase 0 remain available for other
// consumers (e.g. non-text weight-driven logic) but are not wired here.
//
// Idempotent: re-running updates existing same-named styles in place
// instead of duplicating them.

(async () => {
  const created = { styles: 0, reused: 0 };
  const missing = new Set();

  try {
    // ---------------------------------------------------------------------
    // 1. Look up the Primitives collection created by phase-0-variables.js
    // ---------------------------------------------------------------------
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const primitives = collections.find((c) => c.name === "Primitives");
    if (!primitives) {
      throw new Error(
        'Primitives collection not found. Run figma-scripts/phase-0-variables.js first.'
      );
    }

    const primByName = new Map();
    for (const id of primitives.variableIds) {
      const v = await figma.variables.getVariableByIdAsync(id);
      if (v) primByName.set(v.name, v);
    }

    function getPrimitive(name) {
      const v = primByName.get(name);
      if (!v) missing.add(name);
      return v;
    }

    // ---------------------------------------------------------------------
    // 2. Load every Inter weight we're about to use, before touching styles
    // ---------------------------------------------------------------------
    const FONT_FAMILY = "Inter";
    const WEIGHT_STYLES = ["Regular", "Medium", "SemiBold", "Bold"];
    for (const style of WEIGHT_STYLES) {
      await figma.loadFontAsync({ family: FONT_FAMILY, style });
    }

    // Fallback concrete values (mirror the Phase 0 font-size/line-height
    // primitives exactly) — used as the resolved display value alongside
    // the variable binding, per Figma's bound-variable model.
    const SIZE_VALUES = {
      xs: [12, 16],
      sm: [14, 20],
      base: [16, 24],
      lg: [18, 28],
      xl: [20, 28],
      "2xl": [24, 32],
      "3xl": [30, 36],
      "4xl": [36, 40],
      "5xl": [48, 48],
    };

    // [styleName, sizeKey, Inter font style]
    const TEXT_STYLES = [
      ["Display", "5xl", "Bold"],
      ["Heading/H1", "4xl", "Bold"],
      ["Heading/H2", "3xl", "SemiBold"],
      ["Heading/H3", "2xl", "SemiBold"],
      ["Heading/H4", "xl", "SemiBold"],
      ["Body/Large", "lg", "Regular"],
      ["Body/Base", "base", "Regular"],
      ["Body/Base Medium", "base", "Medium"],
      ["Body/Small", "sm", "Regular"],
      ["Body/Small Medium", "sm", "Medium"],
      ["Label/Default", "sm", "Medium"],
      ["Caption/Default", "xs", "Regular"],
      ["Caption/Medium", "xs", "Medium"],
    ];

    // ---------------------------------------------------------------------
    // 3. Idempotent create-or-update
    // ---------------------------------------------------------------------
    const existingStyles = await figma.getLocalTextStylesAsync();
    const existingByName = new Map(existingStyles.map((s) => [s.name, s]));

    for (const [name, sizeKey, weightStyle] of TEXT_STYLES) {
      const fontSizeVar = getPrimitive(`font-size/${sizeKey}`);
      const lineHeightVar = getPrimitive(`line-height/${sizeKey}`);
      if (!fontSizeVar || !lineHeightVar) continue; // reported via `missing` below

      const [fontSizePx, lineHeightPx] = SIZE_VALUES[sizeKey];

      let style = existingByName.get(name);
      if (style) {
        created.reused += 1;
      } else {
        style = figma.createTextStyle();
        style.name = name;
        created.styles += 1;
      }

      style.fontName = { family: FONT_FAMILY, style: weightStyle };
      style.fontSize = fontSizePx;
      style.lineHeight = { value: lineHeightPx, unit: "PIXELS" };

      style.setBoundVariable("fontSize", fontSizeVar);
      style.setBoundVariable("lineHeight", lineHeightVar);
    }

    if (missing.size) {
      console.error("[Text Styles] Missing primitives — re-check phase-0-variables.js:", [...missing]);
    }

    const summary =
      `Text styles done — ${created.styles} created / ${created.reused} reused (Inter).` +
      (missing.size ? ` ${missing.size} missing primitive(s), see console.` : "");
    console.log(summary);
    figma.notify(summary, { timeout: 6000 });
  } catch (err) {
    console.error("[Text Styles] Fatal error:", err);
    figma.notify("Text styles script failed — see console for details.", { error: true, timeout: 6000 });
  }
})();
