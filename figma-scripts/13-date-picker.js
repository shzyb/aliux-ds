// Component 13/61 — Date Picker
// Requires phase-0-variables.js and phase-0b-text-styles.js to have been
// run first.
//
// Scope note: shadcn's Date Picker is literally just a composition —
// PopoverTrigger(Button with a calendar icon + formatted date) wrapping
// PopoverContent(Calendar). The calendar grid itself is Calendar's job (a
// separate, currently-skipped item on the 61 list), and the popover
// mechanics are Popover's job (not yet built either) — so building a full
// dropdown calendar here would just be duplicating Calendar's future
// component instead of Date Picker's own actual anatomy. This models only
// the trigger: an Outline-style button (matching Button's Outline variant
// exactly) with a leading calendar icon placeholder and a date label.
//
// Boolean: Has Value (default false) — toggles between the muted
// "Pick a date" placeholder and an example selected-date label, following
// the same always-present-base-layer pattern used for Avatar's Image/
// Fallback (Figma booleans can't bind an inverse pair directly).

(async () => {
  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const semantics = collections.find((c) => c.name === "Semantics");
    const primitives = collections.find((c) => c.name === "Primitives");
    if (!semantics || !primitives) {
      throw new Error('Semantics/Primitives collection missing — run phase-0-variables.js first.');
    }

    async function collectionVarMap(collection) {
      const map = new Map();
      for (const id of collection.variableIds) {
        const v = await figma.variables.getVariableByIdAsync(id);
        if (v) map.set(v.name, v);
      }
      return map;
    }
    const sem = await collectionVarMap(semantics);
    const prim = await collectionVarMap(primitives);

    function need(map, name) {
      const v = map.get(name);
      if (!v) throw new Error(`Missing variable "${name}" — check Phase 0 setup.`);
      return v;
    }

    const textStyles = await figma.getLocalTextStylesAsync();
    const textStyleByName = new Map(textStyles.map((s) => [s.name, s]));
    function needStyle(name) {
      const s = textStyleByName.get(name);
      if (!s) throw new Error(`Missing text style "${name}" — run phase-0b-text-styles.js first.`);
      return s;
    }

    function bindFill(node, variable) {
      node.fills = [
        figma.variables.setBoundVariableForPaint(
          { type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } },
          "color",
          variable
        ),
      ];
      const bound = node.fills[0] && node.fills[0].boundVariables && node.fills[0].boundVariables.color;
      if (!bound || bound.id !== variable.id) {
        throw new Error(`Fill on "${node.name}" did not bind to "${variable.name}".`);
      }
    }
    function bindStroke(node, variable) {
      node.strokes = [
        figma.variables.setBoundVariableForPaint(
          { type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } },
          "color",
          variable
        ),
      ];
      const bound = node.strokes[0] && node.strokes[0].boundVariables && node.strokes[0].boundVariables.color;
      if (!bound || bound.id !== variable.id) {
        throw new Error(`Stroke on "${node.name}" did not bind to "${variable.name}".`);
      }
    }
    function bindScalar(node, field, variable) {
      node.setBoundVariable(field, variable);
      const bound = node.boundVariables && node.boundVariables[field];
      if (!bound || bound.id !== variable.id) {
        throw new Error(`"${field}" on "${node.name}" did not bind to "${variable.name}".`);
      }
    }
    function bindCornerRadius(node, variable) {
      const fields = ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"];
      for (const field of fields) {
        node.setBoundVariable(field, variable);
        const bound = node.boundVariables && node.boundVariables[field];
        if (!bound || bound.id !== variable.id) {
          throw new Error(`"${field}" on "${node.name}" did not bind to "${variable.name}".`);
        }
      }
    }
    function bindStrokeWeight(node, variable) {
      const fields = ["strokeTopWeight", "strokeRightWeight", "strokeBottomWeight", "strokeLeftWeight"];
      for (const field of fields) {
        node.setBoundVariable(field, variable);
        const bound = node.boundVariables && node.boundVariables[field];
        if (!bound || bound.id !== variable.id) {
          throw new Error(`"${field}" on "${node.name}" did not bind to "${variable.name}".`);
        }
      }
    }
    async function applyTextStyle(node, style, label) {
      await node.setTextStyleIdAsync(style.id);
      if (node.textStyleId !== style.id) {
        throw new Error(`"${node.name}" (${label}) did not take text style "${style.name}".`);
      }
    }

    const NAME = "Date Picker";
    const existing = figma.currentPage.findOne((n) => n.type === "COMPONENT" && n.name === NAME);
    if (existing) {
      existing.remove();
      console.log(`[Date Picker] Removed existing "${NAME}" — rebuilding fresh.`);
    }

    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    const labelStyle = needStyle("Body/Small Medium");

    const root = figma.createComponent();
    root.name = NAME;
    root.layoutMode = "HORIZONTAL";
    root.primaryAxisSizingMode = "FIXED";
    root.counterAxisSizingMode = "AUTO";
    root.counterAxisAlignItems = "CENTER";
    root.resize(240, root.height);
    root.itemSpacing = 8;
    bindScalar(root, "itemSpacing", need(prim, "spacing/2"));
    root.paddingLeft = 16;
    root.paddingRight = 16;
    root.paddingTop = 8;
    root.paddingBottom = 8;
    bindScalar(root, "paddingLeft", need(prim, "spacing/4"));
    bindScalar(root, "paddingRight", need(prim, "spacing/4"));
    bindScalar(root, "paddingTop", need(prim, "spacing/2"));
    bindScalar(root, "paddingBottom", need(prim, "spacing/2"));
    root.cornerRadius = 8;
    bindCornerRadius(root, need(prim, "radius/md"));
    root.strokeWeight = 1;
    bindStrokeWeight(root, need(prim, "border-width/1"));
    bindStroke(root, need(sem, "border/default"));
    bindFill(root, need(sem, "bg/default"));

    // Placeholder chip standing in for the real calendar icon — swap this
    // for an actual icon later.
    const icon = figma.createRectangle();
    icon.name = "Icon";
    icon.resize(16, 16);
    bindFill(icon, need(sem, "fg/muted"));
    icon.cornerRadius = 3;
    bindCornerRadius(icon, need(prim, "radius/sm"));
    root.appendChild(icon);

    // Base layer, always present — "Has Value" reveals the Value label on
    // top of it rather than needing an inverse boolean binding.
    const placeholder = figma.createText();
    placeholder.name = "Placeholder";
    placeholder.characters = "Pick a date";
    await applyTextStyle(placeholder, labelStyle, "Placeholder");
    bindFill(placeholder, need(sem, "fg/muted"));
    root.appendChild(placeholder);
    placeholder.layoutSizingHorizontal = "FILL";

    const value = figma.createText();
    value.name = "Value";
    value.characters = "June 4, 2026";
    await applyTextStyle(value, labelStyle, "Value");
    bindFill(value, need(sem, "fg/default"));
    value.visible = false;
    root.appendChild(value);
    value.layoutPositioning = "ABSOLUTE";
    value.x = icon.width + 8;
    value.y = root.paddingTop;
    value.constraints = { horizontal: "STRETCH", vertical: "MIN" };

    if (root.children.length !== 3) {
      throw new Error(`"${NAME}" should have 3 children (Icon, Placeholder, Value) but has ${root.children.length}.`);
    }

    const existingCount = figma.currentPage.children.filter(
      (n) => n.type === "COMPONENT" || n.type === "COMPONENT_SET"
    ).length;
    root.x = (existingCount - 1) * 600;
    root.y = 4800;

    const hasValueKey = root.addComponentProperty("Has Value", "BOOLEAN", false);
    value.componentPropertyReferences = { visible: hasValueKey };

    console.log("[Date Picker] Verification report:", {
      childCount: root.children.length,
      placeholderFillBound: !!(placeholder.fills[0] && placeholder.fills[0].boundVariables && placeholder.fills[0].boundVariables.color),
      valueFillBound: !!(value.fills[0] && value.fills[0].boundVariables && value.fills[0].boundVariables.color),
    });

    const summary = `"${NAME}" created — 1 component (trigger only; calendar grid is Calendar's job), 1 boolean prop (Has Value). All bindings verified.`;
    console.log(summary);
    figma.notify(summary, { timeout: 6000 });
  } catch (err) {
    console.error("[Date Picker] Fatal error:", err);
    figma.notify(`Date Picker script failed: ${err.message}`, { error: true, timeout: 8000 });
  }
})();
