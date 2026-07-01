// Component 17/61 — Dropdown Menu
// Requires phase-0-variables.js and phase-0b-text-styles.js to have been
// run first.
//
// Anatomy note: unlike Accordion/Breadcrumb, DropdownMenuContent (the
// floating panel) actually has real styling of its own (bordered,
// rounded, padded popover surface) — it isn't a bare wrapper — so this
// builds the full panel as one static demonstration piece covering every
// real item kind: Label, Item (with shortcut), Separator, CheckboxItem
// (checked), RadioItem (selected), and a destructive Item (shadcn's real
// documented `variant="destructive"` on DropdownMenuItem). No shadow
// effect is added, matching the other floating-surface components already
// built (Alert Dialog/Dialog/Drawer) which also go without one — Phase 0
// has no shadow/elevation tokens.
//
// Single Component, no variant axis, no booleans — this is a structural
// anatomy demonstration, same treatment as Data Table.

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

    const NAME = "Dropdown Menu";
    const existing = figma.currentPage.findOne((n) => n.type === "COMPONENT" && n.name === NAME);
    if (existing) {
      existing.remove();
      console.log(`[Dropdown Menu] Removed existing "${NAME}" — rebuilding fresh.`);
    }

    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    const labelStyle = needStyle("Body/Small Medium");
    const itemStyle = needStyle("Body/Small");

    const PANEL_WIDTH = 220;

    const root = figma.createComponent();
    root.name = NAME;
    root.layoutMode = "VERTICAL";
    root.primaryAxisSizingMode = "AUTO";
    root.counterAxisSizingMode = "FIXED";
    root.resize(PANEL_WIDTH, root.height);
    root.itemSpacing = 2;
    bindScalar(root, "itemSpacing", need(prim, "spacing/0-5"));
    root.paddingLeft = 4;
    root.paddingRight = 4;
    root.paddingTop = 4;
    root.paddingBottom = 4;
    bindScalar(root, "paddingLeft", need(prim, "spacing/1"));
    bindScalar(root, "paddingRight", need(prim, "spacing/1"));
    bindScalar(root, "paddingTop", need(prim, "spacing/1"));
    bindScalar(root, "paddingBottom", need(prim, "spacing/1"));
    root.cornerRadius = 8;
    bindCornerRadius(root, need(prim, "radius/md"));
    root.strokeWeight = 1;
    bindStrokeWeight(root, need(prim, "border-width/1"));
    bindStroke(root, need(sem, "border/default"));
    bindFill(root, need(sem, "bg/default"));

    async function makeRow(name, options) {
      const row = figma.createFrame();
      row.name = name;
      row.layoutMode = "HORIZONTAL";
      row.primaryAxisSizingMode = "FIXED";
      row.counterAxisSizingMode = "AUTO";
      row.primaryAxisAlignItems = "SPACE_BETWEEN";
      row.counterAxisAlignItems = "CENTER";
      row.resize(PANEL_WIDTH - 8, row.height);
      row.itemSpacing = 8;
      bindScalar(row, "itemSpacing", need(prim, "spacing/2"));
      row.paddingLeft = options.inset ? 32 : 8;
      row.paddingRight = 8;
      row.paddingTop = 6;
      row.paddingBottom = 6;
      bindScalar(row, "paddingLeft", need(prim, options.inset ? "spacing/8" : "spacing/2"));
      bindScalar(row, "paddingRight", need(prim, "spacing/2"));
      bindScalar(row, "paddingTop", need(prim, "spacing/1-5"));
      bindScalar(row, "paddingBottom", need(prim, "spacing/1-5"));
      row.cornerRadius = 4;
      bindCornerRadius(row, need(prim, "radius/sm"));
      row.fills = [];

      const label = figma.createText();
      label.name = "Label";
      label.characters = options.label;
      await applyTextStyle(label, options.bold ? labelStyle : itemStyle, "Label");
      bindFill(label, need(sem, options.destructive ? "fg/danger" : "fg/default"));
      row.appendChild(label);

      if (options.shortcut) {
        const shortcut = figma.createText();
        shortcut.name = "Shortcut";
        shortcut.characters = options.shortcut;
        await applyTextStyle(shortcut, itemStyle, "Shortcut");
        bindFill(shortcut, need(sem, "fg/subtle"));
        row.appendChild(shortcut);
      }

      if (options.indicator) {
        const indicator = figma.createRectangle();
        indicator.name = "Indicator";
        indicator.resize(8, 8);
        bindFill(indicator, need(sem, "fg/default"));
        indicator.cornerRadius = options.indicator === "round" ? 4 : 2;
        indicator.x = 8;
        indicator.y = row.paddingTop + 2;
        indicator.layoutPositioning = "ABSOLUTE";
        row.appendChild(indicator);
      }

      return row;
    }

    function makeSeparator() {
      const sep = figma.createRectangle();
      sep.name = "Separator";
      sep.resize(PANEL_WIDTH - 8, 1);
      bindFill(sep, need(sem, "border/default"));
      return sep;
    }

    const rows = [];
    rows.push(await makeRow("Label", { label: "My Account", bold: true }));
    rows.push(await makeRow("Item", { label: "Profile", shortcut: "⇧⌘P" }));
    rows.push(await makeRow("Item", { label: "Billing", shortcut: "⌘B" }));
    rows.push(makeSeparator());
    rows.push(await makeRow("CheckboxItem", { label: "Show status bar", inset: true, indicator: "square" }));
    rows.push(await makeRow("RadioItem", { label: "Compact", inset: true, indicator: "round" }));
    rows.push(makeSeparator());
    rows.push(await makeRow("Item Destructive", { label: "Log out", destructive: true }));

    for (const row of rows) {
      root.appendChild(row);
      row.layoutSizingHorizontal = "FILL";
    }

    if (root.children.length !== rows.length) {
      throw new Error(`"${NAME}" should have ${rows.length} children but has ${root.children.length}.`);
    }

    const existingCount = figma.currentPage.children.filter(
      (n) => n.type === "COMPONENT" || n.type === "COMPONENT_SET"
    ).length;
    root.x = (existingCount - 1) * 600;
    root.y = 6000;

    console.log("[Dropdown Menu] Verification report:", {
      childCount: root.children.length,
      rowNames: rows.map((r) => r.name),
    });

    const summary = `"${NAME}" created — 1 component (structural anatomy demo, no variant axis/booleans). All bindings verified.`;
    console.log(summary);
    figma.notify(summary, { timeout: 6000 });
  } catch (err) {
    console.error("[Dropdown Menu] Fatal error:", err);
    figma.notify(`Dropdown Menu script failed: ${err.message}`, { error: true, timeout: 8000 });
  }
})();
