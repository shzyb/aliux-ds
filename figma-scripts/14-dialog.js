// Component 14/61 — Dialog
// Requires phase-0-variables.js and phase-0b-text-styles.js to have been
// run first.
//
// Anatomy: same Header(Title+Description)/Footer(action placeholders) card
// pattern as Alert Dialog, plus the close "X" button Dialog actually has
// that AlertDialog doesn't (AlertDialog forces an explicit Cancel/Action
// choice; Dialog can be dismissed freely). Cancel/Save are plain styled
// placeholders, not Button instances, same reasoning as Alert Dialog.
//
// No documented variant prop, so this is a single Component.
// Booleans: Show Close Button (default true — matches shadcn's actual
// documented showCloseButton prop), Has Description (default true),
// Has Footer (default true).
//
// Flag: same as Alert Dialog — shadcn's DialogTitle is 18px/Semibold;
// Phase 0b has no 18px+Semibold combination, so Heading/H4 (20px/Semibold)
// is used as the nearest existing style.

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

    const NAME = "Dialog";
    const existing = figma.currentPage.findOne((n) => n.type === "COMPONENT" && n.name === NAME);
    if (existing) {
      existing.remove();
      console.log(`[Dialog] Removed existing "${NAME}" — rebuilding fresh.`);
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

    // Close button — placeholder chip standing in for the real "X" icon,
    // positioned absolutely in the top-right corner.
    const closeButton = figma.createRectangle();
    closeButton.name = "Close Button";
    closeButton.resize(16, 16);
    bindFill(closeButton, need(sem, "fg/muted"));
    closeButton.cornerRadius = 3;
    bindCornerRadius(closeButton, need(prim, "radius/sm"));
    root.appendChild(closeButton);
    closeButton.layoutPositioning = "ABSOLUTE";
    closeButton.x = CARD_WIDTH - 24 - 16;
    closeButton.y = 24;
    closeButton.constraints = { horizontal: "MAX", vertical: "MIN" };

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
    title.characters = "Edit profile";
    await applyTextStyle(title, titleStyle, "Title");
    bindFill(title, need(sem, "fg/default"));
    header.appendChild(title);
    title.layoutSizingHorizontal = "FILL";

    const description = figma.createText();
    description.name = "Description";
    description.characters = "Make changes to your profile here. Click save when you're done.";
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
    const saveButton = await makeButtonPlaceholder("Save", "Save changes", true);
    footer.appendChild(saveButton);

    if (footer.children.length !== 2) {
      throw new Error(`"Footer" should have 2 children (Cancel, Save) but has ${footer.children.length}.`);
    }
    if (root.children.length !== 3) {
      throw new Error(`"${NAME}" should have 3 children (Close Button, Header, Footer) but has ${root.children.length}.`);
    }

    const existingCount = figma.currentPage.children.filter(
      (n) => n.type === "COMPONENT" || n.type === "COMPONENT_SET"
    ).length;
    root.x = (existingCount - 1) * 600;
    root.y = 5100;

    const showCloseKey = root.addComponentProperty("Show Close Button", "BOOLEAN", true);
    const hasDescriptionKey = root.addComponentProperty("Has Description", "BOOLEAN", true);
    const hasFooterKey = root.addComponentProperty("Has Footer", "BOOLEAN", true);
    closeButton.componentPropertyReferences = { visible: showCloseKey };
    description.componentPropertyReferences = { visible: hasDescriptionKey };
    footer.componentPropertyReferences = { visible: hasFooterKey };

    console.log("[Dialog] Verification report:", {
      childCount: root.children.length,
      titleStyleId: title.textStyleId,
      titleFillBound: !!(title.fills[0] && title.fills[0].boundVariables && title.fills[0].boundVariables.color),
      descriptionFillBound: !!(description.fills[0] && description.fills[0].boundVariables && description.fills[0].boundVariables.color),
      saveFillBound: !!(saveButton.fills[0] && saveButton.fills[0].boundVariables && saveButton.fills[0].boundVariables.color),
    });

    const summary = `"${NAME}" created — 1 component (no documented variant axis), 3 boolean props (Show Close Button, Has Description, Has Footer). All bindings verified.`;
    console.log(summary);
    figma.notify(summary, { timeout: 6000 });
  } catch (err) {
    console.error("[Dialog] Fatal error:", err);
    figma.notify(`Dialog script failed: ${err.message}`, { error: true, timeout: 8000 });
  }
})();
