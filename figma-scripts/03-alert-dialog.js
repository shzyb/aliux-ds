// Component 3/61 — Alert Dialog
// Requires phase-0-variables.js and phase-0b-text-styles.js to have been run
// first (reads the Semantics/Primitives collections and text styles).
//
// Anatomy: unlike Alert, shadcn's AlertDialog has no documented `variant`
// prop — every real-world example is the same structural card (Header:
// Title+Description, Footer: Cancel+Action). So this is built as a single
// Component (not a ComponentSet) with just a boolean toggle, matching what's
// actually documented rather than inventing a Default/Destructive axis that
// doesn't exist in the API.
//
// Cancel/Action are drawn as plain styled placeholders, not Button
// instances — Button (#10 on the 61-item list) hasn't been built yet in
// this loop, so there's nothing to instance yet. Swap them for real Button
// instances once that component exists.
//
// Flag: shadcn's AlertDialogTitle is text-lg font-semibold (18px/Semibold).
// Phase 0b's text style scale has no 18px+Semibold combination — the
// nearest existing style is Heading/H4 (20px/Semibold), used here instead
// of inventing a new text style.
//
// Boolean: Has Description (default true)

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
    async function applyTextStyle(node, style, label) {
      await node.setTextStyleIdAsync(style.id);
      if (node.textStyleId !== style.id) {
        throw new Error(`"${node.name}" (${label}) did not take text style "${style.name}".`);
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

    const NAME = "Alert Dialog";
    const existing = figma.currentPage.findOne((n) => n.type === "COMPONENT" && n.name === NAME);
    if (existing) {
      existing.remove();
      console.log(`[Alert Dialog] Removed existing "${NAME}" — rebuilding fresh.`);
    }

    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });

    const titleStyle = needStyle("Heading/H4");
    const descriptionStyle = needStyle("Body/Small");
    const buttonLabelStyle = needStyle("Body/Small Medium");

    const CARD_WIDTH = 400;

    const root = figma.createComponent();
    root.name = NAME;
    root.layoutMode = "VERTICAL";
    root.primaryAxisSizingMode = "AUTO";
    root.counterAxisSizingMode = "FIXED";
    root.resize(CARD_WIDTH, root.height);
    root.itemSpacing = 16;
    bindScalar(root, "itemSpacing", need(prim, "spacing/4"));
    root.paddingLeft = 24;
    root.paddingRight = 24;
    root.paddingTop = 24;
    root.paddingBottom = 24;
    bindScalar(root, "paddingLeft", need(prim, "spacing/6"));
    bindScalar(root, "paddingRight", need(prim, "spacing/6"));
    bindScalar(root, "paddingTop", need(prim, "spacing/6"));
    bindScalar(root, "paddingBottom", need(prim, "spacing/6"));
    root.cornerRadius = 10;
    bindCornerRadius(root, need(prim, "radius/lg"));
    root.strokeWeight = 1;
    bindStrokeWeight(root, need(prim, "border-width/1"));
    bindStroke(root, need(sem, "border/default"));
    bindFill(root, need(sem, "bg/default"));

    // Header
    const header = figma.createFrame();
    header.name = "Header";
    header.layoutMode = "VERTICAL";
    header.primaryAxisSizingMode = "AUTO";
    header.counterAxisSizingMode = "FIXED";
    header.itemSpacing = 8;
    bindScalar(header, "itemSpacing", need(prim, "spacing/2"));
    header.paddingLeft = 0;
    header.paddingRight = 0;
    header.paddingTop = 0;
    header.paddingBottom = 0;
    header.fills = [];
    root.appendChild(header);
    header.layoutSizingHorizontal = "FILL";

    const title = figma.createText();
    title.name = "Title";
    title.characters = "Are you absolutely sure?";
    await applyTextStyle(title, titleStyle, "Title");
    bindFill(title, need(sem, "fg/default"));
    header.appendChild(title);
    title.layoutSizingHorizontal = "FILL";

    const description = figma.createText();
    description.name = "Description";
    description.characters =
      "This action cannot be undone. This will permanently delete your account and remove your data from our servers.";
    await applyTextStyle(description, descriptionStyle, "Description");
    bindFill(description, need(sem, "fg/muted"));
    header.appendChild(description);
    description.layoutSizingHorizontal = "FILL";

    if (header.children.length !== 2) {
      throw new Error(`"Header" should have 2 children (Title, Description) but has ${header.children.length}.`);
    }

    // Footer
    const footer = figma.createFrame();
    footer.name = "Footer";
    footer.layoutMode = "HORIZONTAL";
    footer.primaryAxisSizingMode = "AUTO";
    footer.counterAxisSizingMode = "FIXED";
    footer.primaryAxisAlignItems = "MAX";
    footer.counterAxisAlignItems = "CENTER";
    footer.itemSpacing = 8;
    bindScalar(footer, "itemSpacing", need(prim, "spacing/2"));
    footer.paddingLeft = 0;
    footer.paddingRight = 0;
    footer.paddingTop = 0;
    footer.paddingBottom = 0;
    footer.fills = [];
    root.appendChild(footer);
    footer.layoutSizingHorizontal = "FILL";

    async function makeButtonPlaceholder(name, label, isPrimary) {
      const button = figma.createFrame();
      button.name = name;
      button.layoutMode = "HORIZONTAL";
      button.primaryAxisSizingMode = "AUTO";
      button.counterAxisSizingMode = "AUTO";
      button.primaryAxisAlignItems = "CENTER";
      button.counterAxisAlignItems = "CENTER";
      button.paddingLeft = 16;
      button.paddingRight = 16;
      button.paddingTop = 8;
      button.paddingBottom = 8;
      bindScalar(button, "paddingLeft", need(prim, "spacing/4"));
      bindScalar(button, "paddingRight", need(prim, "spacing/4"));
      bindScalar(button, "paddingTop", need(prim, "spacing/2"));
      bindScalar(button, "paddingBottom", need(prim, "spacing/2"));
      button.cornerRadius = 8;
      bindCornerRadius(button, need(prim, "radius/md"));

      if (isPrimary) {
        bindFill(button, need(sem, "interactive/default"));
      } else {
        button.fills = [];
        button.strokeWeight = 1;
        bindStrokeWeight(button, need(prim, "border-width/1"));
        bindStroke(button, need(sem, "border/default"));
      }

      const text = figma.createText();
      text.name = "Label";
      text.characters = label;
      await applyTextStyle(text, buttonLabelStyle, "Label");
      bindFill(text, need(sem, isPrimary ? "fg/on-brand" : "fg/default"));
      button.appendChild(text);

      return button;
    }

    const cancelButton = await makeButtonPlaceholder("Cancel", "Cancel", false);
    footer.appendChild(cancelButton);
    const actionButton = await makeButtonPlaceholder("Action", "Continue", true);
    footer.appendChild(actionButton);

    if (footer.children.length !== 2) {
      throw new Error(`"Footer" should have 2 children (Cancel, Action) but has ${footer.children.length}.`);
    }
    if (root.children.length !== 2) {
      throw new Error(`"${NAME}" should have 2 children (Header, Footer) but has ${root.children.length}.`);
    }

    const existingCount = figma.currentPage.children.filter(
      (n) => n.type === "COMPONENT" || n.type === "COMPONENT_SET"
    ).length;
    root.x = (existingCount - 1) * 600;
    root.y = 600;

    const hasDescriptionKey = root.addComponentProperty("Has Description", "BOOLEAN", true);
    description.componentPropertyReferences = { visible: hasDescriptionKey };

    console.log("[Alert Dialog] Verification report:", {
      childCount: root.children.length,
      titleStyleId: title.textStyleId,
      titleFillBound: !!(title.fills[0] && title.fills[0].boundVariables && title.fills[0].boundVariables.color),
      descriptionFillBound: !!(description.fills[0] && description.fills[0].boundVariables && description.fills[0].boundVariables.color),
      cancelStrokeBound: !!(cancelButton.strokes[0] && cancelButton.strokes[0].boundVariables && cancelButton.strokes[0].boundVariables.color),
      actionFillBound: !!(actionButton.fills[0] && actionButton.fills[0].boundVariables && actionButton.fills[0].boundVariables.color),
    });

    const summary = `"${NAME}" created — 1 component (no documented variant axis), 1 boolean prop (Has Description). All bindings verified.`;
    console.log(summary);
    figma.notify(summary, { timeout: 6000 });
  } catch (err) {
    console.error("[Alert Dialog] Fatal error:", err);
    figma.notify(`Alert Dialog script failed: ${err.message}`, { error: true, timeout: 8000 });
  }
})();
