// Component 7/61 — Badge
// Requires phase-0-variables.js and phase-0b-text-styles.js to have been run
// first (reads the Semantics/Primitives collections and text styles).
//
// Anatomy: single inline pill, no sub-parts. shadcn's badge is
// text-xs font-semibold (12px/600) — Phase 0b has no Semibold at 12px
// (only Regular/Medium as Caption/Default and Caption/Medium). Flagging
// this and using Caption/Medium (12px/Medium) as the nearest existing style
// rather than inventing a new one.
//
// Variant: Style = Default / Secondary / Destructive / Outline
// Boolean: Has Icon (default false) — a small leading icon slot

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

    const NAME = "Badge";
    const existing = figma.currentPage.findOne((n) => n.type === "COMPONENT_SET" && n.name === NAME);
    if (existing) {
      existing.remove();
      console.log(`[Badge] Removed existing "${NAME}" component set — rebuilding fresh.`);
    }
    const orphans = figma.currentPage.findAll(
      (n) => n.type === "COMPONENT" && /^Style=(Default|Secondary|Destructive|Outline)$/.test(n.name)
    );
    if (orphans.length) {
      for (const orphan of orphans) orphan.remove();
      console.log(`[Badge] Removed ${orphans.length} orphaned loose component(s) from a previous partial run.`);
    }

    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    const labelStyle = needStyle("Caption/Medium");

    // [styleName, bgVarName|null, borderVarName|null, textVarName]
    const STYLES = [
      ["Default", "interactive/default", null, "fg/on-brand"],
      ["Secondary", "bg/muted", null, "fg/default"],
      ["Destructive", "bg/danger", null, "fg/on-brand"],
      ["Outline", null, "border/default", "fg/default"],
    ];

    async function buildVariant(styleName, bgVarName, borderVarName, textVarName) {
      const root = figma.createComponent();
      root.name = `Style=${styleName}`;
      root.layoutMode = "HORIZONTAL";
      root.primaryAxisSizingMode = "AUTO";
      root.counterAxisSizingMode = "AUTO";
      root.primaryAxisAlignItems = "CENTER";
      root.counterAxisAlignItems = "CENTER";
      root.itemSpacing = 4;
      bindScalar(root, "itemSpacing", need(prim, "spacing/1"));
      root.paddingLeft = 10;
      root.paddingRight = 10;
      root.paddingTop = 2;
      root.paddingBottom = 2;
      bindScalar(root, "paddingLeft", need(prim, "spacing/2-5"));
      bindScalar(root, "paddingRight", need(prim, "spacing/2-5"));
      bindScalar(root, "paddingTop", need(prim, "spacing/0-5"));
      bindScalar(root, "paddingBottom", need(prim, "spacing/0-5"));
      root.cornerRadius = 8;
      bindCornerRadius(root, need(prim, "radius/md"));

      if (bgVarName) {
        bindFill(root, need(sem, bgVarName));
      } else {
        root.fills = [];
      }
      if (borderVarName) {
        root.strokeWeight = 1;
        bindStrokeWeight(root, need(prim, "border-width/1"));
        bindStroke(root, need(sem, borderVarName));
      } else {
        root.strokes = [];
      }

      // Placeholder chip standing in for a real leading icon — swap this
      // for an actual icon later.
      const icon = figma.createRectangle();
      icon.name = "Icon";
      icon.resize(12, 12);
      bindFill(icon, need(sem, textVarName));
      icon.cornerRadius = 2;
      bindCornerRadius(icon, need(prim, "radius/sm"));
      icon.visible = false;
      root.appendChild(icon);

      const label = figma.createText();
      label.name = "Label";
      label.characters = "Badge";
      await applyTextStyle(label, labelStyle, "Label");
      bindFill(label, need(sem, textVarName));
      root.appendChild(label);

      if (root.children.length !== 2) {
        throw new Error(`"${root.name}" should have 2 children (Icon, Label) but has ${root.children.length}.`);
      }

      return { root, icon };
    }

    const built = [];
    for (const [styleName, bgVar, borderVar, textVar] of STYLES) {
      built.push(await buildVariant(styleName, bgVar, borderVar, textVar));
    }

    const componentSet = figma.combineAsVariants(built.map((b) => b.root), figma.currentPage);
    componentSet.name = NAME;

    if (componentSet.children.length !== STYLES.length) {
      throw new Error(`Combined "${NAME}" should have ${STYLES.length} variants but has ${componentSet.children.length}.`);
    }

    const existingSetCount = figma.currentPage.children.filter(
      (n) => n.type === "COMPONENT_SET"
    ).length;
    componentSet.x = (existingSetCount - 1) * 600;
    componentSet.y = 1800;

    const hasIconKey = componentSet.addComponentProperty("Has Icon", "BOOLEAN", false);
    for (const variant of componentSet.children) {
      const icon = variant.findOne((n) => n.name === "Icon");
      if (!icon) throw new Error(`"${variant.name}" is missing its "Icon" node.`);
      icon.componentPropertyReferences = { visible: hasIconKey };
    }

    console.log(
      "[Badge] Verification report:",
      componentSet.children.map((variant) => {
        const label = variant.findOne((n) => n.name === "Label");
        return {
          variant: variant.name,
          labelStyleId: label && label.textStyleId,
          labelFillBound: !!(label && label.fills[0] && label.fills[0].boundVariables && label.fills[0].boundVariables.color),
          fillCount: variant.fills.length,
          strokeCount: variant.strokes.length,
        };
      })
    );

    const summary = `"${NAME}" created — 4 variants (Style: Default/Secondary/Destructive/Outline), 1 boolean prop (Has Icon). All bindings verified.`;
    console.log(summary);
    figma.notify(summary, { timeout: 6000 });
  } catch (err) {
    console.error("[Badge] Fatal error:", err);
    figma.notify(`Badge script failed: ${err.message}`, { error: true, timeout: 8000 });
  }
})();
