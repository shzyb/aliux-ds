// Component 10/61 — Button Group
// Requires phase-0-variables.js and phase-0b-text-styles.js to have been run
// first (reads the Semantics/Primitives collections and text styles).
//
// Anatomy: rather than trying to collapse individual button borders
// (double-border artifacts at shared edges), this follows shadcn's own
// documented pattern of ButtonGroupSeparator: one outer bordered/rounded
// frame (clipped) containing plain ghost-style segments divided by thin
// separator lines. This is a generic Button+Button+Button composition —
// shadcn's real ButtonGroup can also mix in Input or ButtonGroupText, which
// aren't modeled here since those need their own components as instances,
// not placeholders.
//
// Variant: Orientation = Horizontal / Vertical
// No booleans — this is a structural anatomy piece, not a configurable one.

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

    const NAME = "Button Group";
    const existing = figma.currentPage.findOne((n) => n.type === "COMPONENT_SET" && n.name === NAME);
    if (existing) {
      existing.remove();
      console.log(`[Button Group] Removed existing "${NAME}" component set — rebuilding fresh.`);
    }
    const orphans = figma.currentPage.findAll(
      (n) => n.type === "COMPONENT" && /^Orientation=(Horizontal|Vertical)$/.test(n.name)
    );
    if (orphans.length) {
      for (const orphan of orphans) orphan.remove();
      console.log(`[Button Group] Removed ${orphans.length} orphaned loose component(s) from a previous partial run.`);
    }

    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    const labelStyle = needStyle("Body/Small Medium");

    const SEGMENT_LABELS = ["List", "Grid", "Table"];

    async function makeSegment(label, isVertical) {
      const segment = figma.createFrame();
      segment.name = "Segment";
      segment.layoutMode = isVertical ? "VERTICAL" : "HORIZONTAL";
      segment.primaryAxisSizingMode = "AUTO";
      segment.counterAxisSizingMode = "AUTO";
      segment.primaryAxisAlignItems = "CENTER";
      segment.counterAxisAlignItems = "CENTER";
      segment.paddingLeft = 16;
      segment.paddingRight = 16;
      segment.paddingTop = 8;
      segment.paddingBottom = 8;
      bindScalar(segment, "paddingLeft", need(prim, "spacing/4"));
      bindScalar(segment, "paddingRight", need(prim, "spacing/4"));
      bindScalar(segment, "paddingTop", need(prim, "spacing/2"));
      bindScalar(segment, "paddingBottom", need(prim, "spacing/2"));
      segment.fills = [];

      const text = figma.createText();
      text.name = "Label";
      text.characters = label;
      await applyTextStyle(text, labelStyle, "Label");
      bindFill(text, need(sem, "fg/default"));
      segment.appendChild(text);

      return segment;
    }

    function makeSeparator(isVertical) {
      const sep = figma.createRectangle();
      sep.name = "Separator";
      sep.resize(1, 1);
      if (isVertical) {
        // Group is a VERTICAL stack, so the separator is a full-width
        // horizontal line between segments.
        sep.layoutSizingHorizontal = "FILL";
        sep.layoutSizingVertical = "FIXED";
      } else {
        // Group is a HORIZONTAL row, so the separator is a full-height
        // vertical line between segments.
        sep.layoutSizingHorizontal = "FIXED";
        sep.layoutSizingVertical = "FILL";
      }
      bindFill(sep, need(sem, "border/default"));
      return sep;
    }

    async function buildVariant(orientationName) {
      const isVertical = orientationName === "Vertical";
      const root = figma.createComponent();
      root.name = `Orientation=${orientationName}`;
      root.layoutMode = isVertical ? "VERTICAL" : "HORIZONTAL";
      root.primaryAxisSizingMode = "AUTO";
      root.counterAxisSizingMode = "AUTO";
      root.itemSpacing = 0;
      root.paddingLeft = 0;
      root.paddingRight = 0;
      root.paddingTop = 0;
      root.paddingBottom = 0;
      root.clipsContent = true;
      root.cornerRadius = 8;
      bindCornerRadius(root, need(prim, "radius/md"));
      root.strokeWeight = 1;
      bindStrokeWeight(root, need(prim, "border-width/1"));
      bindStroke(root, need(sem, "border/default"));
      bindFill(root, need(sem, "bg/default"));

      for (let i = 0; i < SEGMENT_LABELS.length; i++) {
        const segment = await makeSegment(SEGMENT_LABELS[i], isVertical);
        root.appendChild(segment);
        if (i < SEGMENT_LABELS.length - 1) {
          const separator = makeSeparator(isVertical);
          root.appendChild(separator);
        }
      }

      const expectedChildren = SEGMENT_LABELS.length * 2 - 1; // segments + separators between them
      if (root.children.length !== expectedChildren) {
        throw new Error(`"${root.name}" should have ${expectedChildren} children but has ${root.children.length}.`);
      }

      return root;
    }

    const horizontal = await buildVariant("Horizontal");
    const vertical = await buildVariant("Vertical");

    const componentSet = figma.combineAsVariants([horizontal, vertical], figma.currentPage);
    componentSet.name = NAME;

    if (componentSet.children.length !== 2) {
      throw new Error(`Combined "${NAME}" should have 2 variants but has ${componentSet.children.length}.`);
    }

    const existingSetCount = figma.currentPage.children.filter(
      (n) => n.type === "COMPONENT_SET"
    ).length;
    componentSet.x = (existingSetCount - 1) * 600;
    componentSet.y = 3300;

    console.log(
      "[Button Group] Verification report:",
      componentSet.children.map((variant) => ({
        variant: variant.name,
        childCount: variant.children.length,
        strokeBound: !!(variant.strokes[0] && variant.strokes[0].boundVariables && variant.strokes[0].boundVariables.color),
      }))
    );

    const summary = `"${NAME}" created — 2 variants (Orientation: Horizontal/Vertical), no booleans. All bindings verified.`;
    console.log(summary);
    figma.notify(summary, { timeout: 6000 });
  } catch (err) {
    console.error("[Button Group] Fatal error:", err);
    figma.notify(`Button Group script failed: ${err.message}`, { error: true, timeout: 8000 });
  }
})();
