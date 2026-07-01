// Component 15/61 — Direction
// Requires phase-0-variables.js and phase-0b-text-styles.js to have been
// run first.
//
// This one is a genuine edge case: shadcn's Direction is DirectionProvider
// + useDirection — a React Context Provider that sets ltr/rtl for
// descendant Radix components, and a hook to read it back. It renders
// nothing itself; there is no anatomy, no variant, no visual property to
// bind a token to. Rather than fake a box with no real design meaning,
// this is built as a small documentation note card — a title + a
// description explaining what it is and that it has no UI — so it's still
// represented in the file (per "don't skip anything") without pretending
// it has a visual spec it doesn't have.
//
// No variants, no booleans — there's nothing to toggle on a note card.

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

    const NAME = "Direction";
    const existing = figma.currentPage.findOne((n) => n.type === "COMPONENT" && n.name === NAME);
    if (existing) {
      existing.remove();
      console.log(`[Direction] Removed existing "${NAME}" — rebuilding fresh.`);
    }

    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    const titleStyle = needStyle("Body/Small Medium");
    const descriptionStyle = needStyle("Body/Small");

    const root = figma.createComponent();
    root.name = NAME;
    root.layoutMode = "VERTICAL";
    root.primaryAxisSizingMode = "AUTO";
    root.counterAxisSizingMode = "FIXED";
    root.resize(360, root.height);
    root.itemSpacing = 4;
    bindScalar(root, "itemSpacing", need(prim, "spacing/1"));
    root.paddingLeft = 16;
    root.paddingRight = 16;
    root.paddingTop = 16;
    root.paddingBottom = 16;
    bindScalar(root, "paddingLeft", need(prim, "spacing/4"));
    bindScalar(root, "paddingRight", need(prim, "spacing/4"));
    bindScalar(root, "paddingTop", need(prim, "spacing/4"));
    bindScalar(root, "paddingBottom", need(prim, "spacing/4"));
    root.cornerRadius = 8;
    bindCornerRadius(root, need(prim, "radius/md"));
    root.strokeWeight = 1;
    bindStrokeWeight(root, need(prim, "border-width/1"));
    bindStroke(root, need(sem, "border/subtle"));
    bindFill(root, need(sem, "bg/subtle"));

    const title = figma.createText();
    title.name = "Title";
    title.characters = "Direction — non-visual utility";
    await applyTextStyle(title, titleStyle, "Title");
    bindFill(title, need(sem, "fg/default"));
    root.appendChild(title);
    title.layoutSizingHorizontal = "FILL";

    const description = figma.createText();
    description.name = "Description";
    description.characters =
      "DirectionProvider + useDirection set ltr/rtl context for descendant Radix components via React Context. Renders no UI of its own, so there's nothing to theme here.";
    await applyTextStyle(description, descriptionStyle, "Description");
    bindFill(description, need(sem, "fg/muted"));
    root.appendChild(description);
    description.layoutSizingHorizontal = "FILL";

    if (root.children.length !== 2) {
      throw new Error(`"${NAME}" should have 2 children (Title, Description) but has ${root.children.length}.`);
    }

    const existingCount = figma.currentPage.children.filter(
      (n) => n.type === "COMPONENT" || n.type === "COMPONENT_SET"
    ).length;
    root.x = (existingCount - 1) * 600;
    root.y = 5400;

    console.log("[Direction] Verification report:", {
      childCount: root.children.length,
      titleFillBound: !!(title.fills[0] && title.fills[0].boundVariables && title.fills[0].boundVariables.color),
      descriptionFillBound: !!(description.fills[0] && description.fills[0].boundVariables && description.fills[0].boundVariables.color),
    });

    const summary = `"${NAME}" created — 1 documentation-note component (non-visual utility, no anatomy/variants/booleans to build). All bindings verified.`;
    console.log(summary);
    figma.notify(summary, { timeout: 6000 });
  } catch (err) {
    console.error("[Direction] Fatal error:", err);
    figma.notify(`Direction script failed: ${err.message}`, { error: true, timeout: 8000 });
  }
})();
