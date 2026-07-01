// Component 11/61 — Checkbox
// (Calendar, Card, Carousel, Chart, Collapsible, Combobox, Command, Context
// Menu skipped for now per your request — will circle back to those.)
//
// Requires phase-0-variables.js to have been run first (reads Primitives/
// Semantics). No text styles needed — this component has no text.
//
// Anatomy: single 16x16 box. Checked/Indeterminate both fill with
// interactive/default per shadcn's actual behavior (both states use
// bg-primary) — they're visually distinguished only by their placeholder
// chip, which you'll replace with a real check/minus icon later.
//
// Variant: State = Unchecked / Checked / Indeterminate
// Boolean: Disabled (default false, visibility-bound scrim like Accordion)
//
// Flag: shadcn's checkbox uses rounded-[4px], which isn't one of Phase 0's
// radius stops — using radius/sm (6px) as the nearest existing token.

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

    const NAME = "Checkbox";
    const existing = figma.currentPage.findOne((n) => n.type === "COMPONENT_SET" && n.name === NAME);
    if (existing) {
      existing.remove();
      console.log(`[Checkbox] Removed existing "${NAME}" component set — rebuilding fresh.`);
    }
    const orphans = figma.currentPage.findAll(
      (n) => n.type === "COMPONENT" && /^State=(Unchecked|Checked|Indeterminate)$/.test(n.name)
    );
    if (orphans.length) {
      for (const orphan of orphans) orphan.remove();
      console.log(`[Checkbox] Removed ${orphans.length} orphaned loose component(s) from a previous partial run.`);
    }

    function buildVariant(stateName, filled) {
      const root = figma.createComponent();
      root.name = `State=${stateName}`;
      root.layoutMode = "HORIZONTAL";
      root.primaryAxisSizingMode = "FIXED";
      root.counterAxisSizingMode = "FIXED";
      root.primaryAxisAlignItems = "CENTER";
      root.counterAxisAlignItems = "CENTER";
      root.resize(16, 16);
      root.cornerRadius = 4;
      bindCornerRadius(root, need(prim, "radius/sm"));

      if (filled) {
        bindFill(root, need(sem, "interactive/default"));
        root.strokes = [];
      } else {
        bindFill(root, need(sem, "bg/default"));
        root.strokeWeight = 1;
        bindStrokeWeight(root, need(prim, "border-width/1"));
        bindStroke(root, need(sem, "border/default"));
      }

      // Placeholder chip standing in for the real check/minus icon — swap
      // this for an actual icon later.
      const mark = figma.createRectangle();
      mark.name = "Mark";
      mark.resize(9, 9);
      bindFill(mark, need(sem, "fg/on-brand"));
      mark.cornerRadius = 2;
      bindCornerRadius(mark, need(prim, "radius/sm"));
      mark.visible = filled;
      root.appendChild(mark);

      if (root.children.length !== 1) {
        throw new Error(`"${root.name}" should have 1 child (Mark) but has ${root.children.length}.`);
      }

      return { root, mark };
    }

    const unchecked = buildVariant("Unchecked", false);
    const checked = buildVariant("Checked", true);
    const indeterminate = buildVariant("Indeterminate", true);
    const built = [unchecked, checked, indeterminate];

    const componentSet = figma.combineAsVariants(built.map((b) => b.root), figma.currentPage);
    componentSet.name = NAME;

    if (componentSet.children.length !== built.length) {
      throw new Error(`Combined "${NAME}" should have ${built.length} variants but has ${componentSet.children.length}.`);
    }

    const existingSetCount = figma.currentPage.children.filter(
      (n) => n.type === "COMPONENT_SET"
    ).length;
    componentSet.x = (existingSetCount - 1) * 600;
    componentSet.y = 3600;

    const disabledKey = componentSet.addComponentProperty("Disabled", "BOOLEAN", false);
    for (const variant of componentSet.children) {
      const overlay = figma.createRectangle();
      overlay.name = "Disabled Overlay";
      overlay.resize(16, 16);
      bindFill(overlay, need(sem, "bg/default"));
      overlay.opacity = 0.5;
      overlay.visible = false;
      variant.appendChild(overlay);
      overlay.layoutPositioning = "ABSOLUTE";
      overlay.x = 0;
      overlay.y = 0;
      overlay.constraints = { horizontal: "STRETCH", vertical: "STRETCH" };
      overlay.componentPropertyReferences = { visible: disabledKey };
    }

    console.log(
      "[Checkbox] Verification report:",
      componentSet.children.map((variant) => {
        const mark = variant.findOne((n) => n.name === "Mark");
        return {
          variant: variant.name,
          fillBound: !!(variant.fills[0] && variant.fills[0].boundVariables && variant.fills[0].boundVariables.color),
          markVisible: mark && mark.visible,
        };
      })
    );

    const summary = `"${NAME}" created — 3 variants (State: Unchecked/Checked/Indeterminate), 1 boolean prop (Disabled). All bindings verified.`;
    console.log(summary);
    figma.notify(summary, { timeout: 6000 });
  } catch (err) {
    console.error("[Checkbox] Fatal error:", err);
    figma.notify(`Checkbox script failed: ${err.message}`, { error: true, timeout: 8000 });
  }
})();
