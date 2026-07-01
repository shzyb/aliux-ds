// Component 18/61 — Empty
// Requires phase-0-variables.js and phase-0b-text-styles.js to have been
// run first.
//
// Anatomy: Empty > EmptyHeader(EmptyMedia + EmptyTitle + EmptyDescription)
// + EmptyContent(action placeholder). EmptyMedia's documented variant is
// "icon" (a circular muted surface holding an icon) — that's the one
// modeled here; no other variant names for EmptyMedia could be confirmed
// against the live docs, so this isn't presented as a Figma Variant axis
// to avoid inventing options that may not exist.
//
// Single Component, no variant axis.
// Booleans: Has Description (default true), Has Action (default true)

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

    const NAME = "Empty";
    const existing = figma.currentPage.findOne((n) => n.type === "COMPONENT" && n.name === NAME);
    if (existing) {
      existing.remove();
      console.log(`[Empty] Removed existing "${NAME}" — rebuilding fresh.`);
    }

    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
    const titleStyle = needStyle("Heading/H4");
    const descriptionStyle = needStyle("Body/Small");
    const buttonLabelStyle = needStyle("Body/Small Medium");

    const root = figma.createComponent();
    root.name = NAME;
    root.layoutMode = "VERTICAL";
    root.primaryAxisSizingMode = "AUTO";
    root.counterAxisSizingMode = "FIXED";
    root.primaryAxisAlignItems = "CENTER";
    root.counterAxisAlignItems = "CENTER";
    root.resize(320, root.height);
    root.itemSpacing = 24;
    bindScalar(root, "itemSpacing", need(prim, "spacing/6"));
    root.paddingLeft = 32;
    root.paddingRight = 32;
    root.paddingTop = 32;
    root.paddingBottom = 32;
    bindScalar(root, "paddingLeft", need(prim, "spacing/8"));
    bindScalar(root, "paddingRight", need(prim, "spacing/8"));
    bindScalar(root, "paddingTop", need(prim, "spacing/8"));
    bindScalar(root, "paddingBottom", need(prim, "spacing/8"));
    root.fills = [];

    // Header
    const header = figma.createFrame();
    header.name = "Header";
    header.layoutMode = "VERTICAL";
    header.primaryAxisSizingMode = "AUTO";
    header.counterAxisSizingMode = "FIXED";
    header.primaryAxisAlignItems = "CENTER";
    header.counterAxisAlignItems = "CENTER";
    header.itemSpacing = 12;
    bindScalar(header, "itemSpacing", need(prim, "spacing/3"));
    header.paddingLeft = 0;
    header.paddingRight = 0;
    header.paddingTop = 0;
    header.paddingBottom = 0;
    header.fills = [];
    root.appendChild(header);
    header.layoutSizingHorizontal = "FILL";

    // EmptyMedia (variant="icon") — a circular muted surface with a
    // placeholder chip standing in for the real icon.
    const media = figma.createFrame();
    media.name = "Media";
    media.layoutMode = "HORIZONTAL";
    media.primaryAxisSizingMode = "FIXED";
    media.counterAxisSizingMode = "FIXED";
    media.primaryAxisAlignItems = "CENTER";
    media.counterAxisAlignItems = "CENTER";
    media.resize(48, 48);
    bindFill(media, need(sem, "bg/muted"));
    media.cornerRadius = 24;
    bindCornerRadius(media, need(prim, "radius/full"));
    header.appendChild(media);

    const mediaIcon = figma.createRectangle();
    mediaIcon.name = "Icon";
    mediaIcon.resize(20, 20);
    bindFill(mediaIcon, need(sem, "fg/muted"));
    mediaIcon.cornerRadius = 4;
    bindCornerRadius(mediaIcon, need(prim, "radius/sm"));
    media.appendChild(mediaIcon);

    const title = figma.createText();
    title.name = "Title";
    title.characters = "No results found";
    await applyTextStyle(title, titleStyle, "Title");
    bindFill(title, need(sem, "fg/default"));
    header.appendChild(title);

    const description = figma.createText();
    description.name = "Description";
    description.characters = "Try adjusting your search or filter to find what you're looking for.";
    description.textAlignHorizontal = "CENTER";
    await applyTextStyle(description, descriptionStyle, "Description");
    bindFill(description, need(sem, "fg/muted"));
    header.appendChild(description);
    description.layoutSizingHorizontal = "FILL";

    if (header.children.length !== 3) {
      throw new Error(`"Header" should have 3 children (Media, Title, Description) but has ${header.children.length}.`);
    }

    // EmptyContent — action button placeholder
    const content = figma.createFrame();
    content.name = "Content";
    content.layoutMode = "HORIZONTAL";
    content.primaryAxisSizingMode = "AUTO";
    content.counterAxisSizingMode = "AUTO";
    content.primaryAxisAlignItems = "CENTER";
    content.counterAxisAlignItems = "CENTER";
    content.paddingLeft = 16;
    content.paddingRight = 16;
    content.paddingTop = 8;
    content.paddingBottom = 8;
    bindScalar(content, "paddingLeft", need(prim, "spacing/4"));
    bindScalar(content, "paddingRight", need(prim, "spacing/4"));
    bindScalar(content, "paddingTop", need(prim, "spacing/2"));
    bindScalar(content, "paddingBottom", need(prim, "spacing/2"));
    content.cornerRadius = 8;
    bindCornerRadius(content, need(prim, "radius/md"));
    bindFill(content, need(sem, "interactive/default"));
    root.appendChild(content);

    const actionLabel = figma.createText();
    actionLabel.name = "Label";
    actionLabel.characters = "Reset filters";
    await applyTextStyle(actionLabel, buttonLabelStyle, "Label");
    bindFill(actionLabel, need(sem, "fg/on-brand"));
    content.appendChild(actionLabel);

    if (root.children.length !== 2) {
      throw new Error(`"${NAME}" should have 2 children (Header, Content) but has ${root.children.length}.`);
    }

    const existingCount = figma.currentPage.children.filter(
      (n) => n.type === "COMPONENT" || n.type === "COMPONENT_SET"
    ).length;
    root.x = (existingCount - 1) * 600;
    root.y = 6300;

    const hasDescriptionKey = root.addComponentProperty("Has Description", "BOOLEAN", true);
    const hasActionKey = root.addComponentProperty("Has Action", "BOOLEAN", true);
    description.componentPropertyReferences = { visible: hasDescriptionKey };
    content.componentPropertyReferences = { visible: hasActionKey };

    console.log("[Empty] Verification report:", {
      childCount: root.children.length,
      titleFillBound: !!(title.fills[0] && title.fills[0].boundVariables && title.fills[0].boundVariables.color),
      mediaFillBound: !!(media.fills[0] && media.fills[0].boundVariables && media.fills[0].boundVariables.color),
      contentFillBound: !!(content.fills[0] && content.fills[0].boundVariables && content.fills[0].boundVariables.color),
    });

    const summary = `"${NAME}" created — 1 component (EmptyMedia variant="icon"), 2 boolean props (Has Description, Has Action). All bindings verified.`;
    console.log(summary);
    figma.notify(summary, { timeout: 6000 });
  } catch (err) {
    console.error("[Empty] Fatal error:", err);
    figma.notify(`Empty script failed: ${err.message}`, { error: true, timeout: 8000 });
  }
})();
