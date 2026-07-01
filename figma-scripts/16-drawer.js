// Component 16/61 — Drawer
// Requires phase-0-variables.js and phase-0b-text-styles.js to have been
// run first.
//
// Anatomy: same Header(Title+Description)/Footer(action placeholders) card
// content as Dialog, but anchored to a screen edge per the real documented
// `direction` prop (top/right/bottom/left) rather than centered. Only the
// edge the panel is NOT anchored to gets rounded corners (e.g. a Bottom
// drawer is flush with the screen's bottom edge, so only its top corners
// round) — the anchored edge stays square. Vaul's drag handle bar only
// appears on Top/Bottom drawers, on whichever side is farthest from the
// anchor (a Bottom drawer's handle sits at its top); Left/Right drawers
// don't get one, matching real vaul/shadcn behavior.
//
// Variant: Direction = Bottom/Top/Left/Right
// Booleans: Has Description (default true), Has Footer (default true)

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
    function bindEachCorner(node, topLeft, topRight, bottomLeft, bottomRight) {
      const map = {
        topLeftRadius: topLeft,
        topRightRadius: topRight,
        bottomLeftRadius: bottomLeft,
        bottomRightRadius: bottomRight,
      };
      for (const [field, variable] of Object.entries(map)) {
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

    const NAME = "Drawer";
    const existing = figma.currentPage.findOne((n) => n.type === "COMPONENT_SET" && n.name === NAME);
    if (existing) {
      existing.remove();
      console.log(`[Drawer] Removed existing "${NAME}" component set — rebuilding fresh.`);
    }
    const orphans = figma.currentPage.findAll(
      (n) => n.type === "COMPONENT" && /^Direction=(Bottom|Top|Left|Right)$/.test(n.name)
    );
    if (orphans.length) {
      for (const orphan of orphans) orphan.remove();
      console.log(`[Drawer] Removed ${orphans.length} orphaned loose component(s) from a previous partial run.`);
    }

    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });

    const titleStyle = needStyle("Heading/H4");
    const descriptionStyle = needStyle("Body/Small");
    const buttonLabelStyle = needStyle("Body/Small Medium");

    const radiusLg = need(prim, "radius/lg");
    const radiusNone = need(prim, "radius/none");

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
      bindEachCorner(button, need(prim, "radius/md"), need(prim, "radius/md"), need(prim, "radius/md"), need(prim, "radius/md"));

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

    function makeHandle(horizontal) {
      const handle = figma.createRectangle();
      handle.name = "Handle";
      handle.resize(horizontal ? 40 : 4, horizontal ? 4 : 40);
      bindFill(handle, need(sem, "border/strong"));
      handle.cornerRadius = 2;
      return handle;
    }

    // [name, corners(topLeft,topRight,bottomLeft,bottomRight rounded?), handle("top"|"bottom"|null)]
    const DIRECTIONS = [
      { name: "Bottom", corners: [true, true, false, false], handle: "top" },
      { name: "Top", corners: [false, false, true, true], handle: "bottom" },
      { name: "Left", corners: [false, true, false, true], handle: null },
      { name: "Right", corners: [true, false, true, false], handle: null },
    ];

    async function buildVariant(direction) {
      const isSide = direction.name === "Left" || direction.name === "Right";
      const root = figma.createComponent();
      root.name = `Direction=${direction.name}`;
      root.layoutMode = "VERTICAL";
      root.primaryAxisSizingMode = isSide ? "FIXED" : "AUTO";
      root.counterAxisSizingMode = "FIXED";
      root.resize(isSide ? 320 : 400, isSide ? 480 : root.height);
      root.itemSpacing = 16;
      bindScalar(root, "itemSpacing", need(prim, "spacing/4"));
      root.paddingLeft = 24;
      root.paddingRight = 24;
      root.paddingTop = direction.handle === "top" ? 8 : 24;
      root.paddingBottom = direction.handle === "bottom" ? 8 : 24;
      bindScalar(root, "paddingLeft", need(prim, "spacing/6"));
      bindScalar(root, "paddingRight", need(prim, "spacing/6"));
      bindScalar(root, "paddingTop", need(prim, direction.handle === "top" ? "spacing/2" : "spacing/6"));
      bindScalar(root, "paddingBottom", need(prim, direction.handle === "bottom" ? "spacing/2" : "spacing/6"));

      const [tl, tr, bl, br] = direction.corners;
      bindEachCorner(
        root,
        tl ? radiusLg : radiusNone,
        tr ? radiusLg : radiusNone,
        bl ? radiusLg : radiusNone,
        br ? radiusLg : radiusNone
      );
      root.strokeWeight = 1;
      bindStrokeWeight(root, need(prim, "border-width/1"));
      bindStroke(root, need(sem, "border/default"));
      bindFill(root, need(sem, "bg/default"));
      // Handle is fixed-width while Header/Footer are FILL — this centers
      // the handle without affecting the FILL children (FILL overrides
      // alignment for itself regardless of the parent's setting).
      root.counterAxisAlignItems = "CENTER";

      let handle = null;
      if (direction.handle === "top") {
        handle = makeHandle(true);
        root.appendChild(handle);
        handle.layoutSizingHorizontal = "FIXED";
        handle.layoutSizingVertical = "FIXED";
      }

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

      const cancelButton = await makeButtonPlaceholder("Cancel", "Cancel", false);
      const saveButton = await makeButtonPlaceholder("Save", "Save changes", true);
      footer.appendChild(cancelButton);
      footer.appendChild(saveButton);

      if (direction.handle === "bottom") {
        // Content first, handle last so it sits at the bottom edge.
        root.appendChild(footer);
        footer.layoutSizingHorizontal = "FILL";
        handle = makeHandle(true);
        root.appendChild(handle);
        handle.layoutSizingHorizontal = "FIXED";
        handle.layoutSizingVertical = "FIXED";
      } else {
        root.appendChild(footer);
        footer.layoutSizingHorizontal = "FILL";
      }

      const expectedChildren = direction.handle ? 3 : 2;
      if (root.children.length !== expectedChildren) {
        throw new Error(`"${root.name}" should have ${expectedChildren} children but has ${root.children.length}.`);
      }

      return { root, description, footer };
    }

    const built = [];
    for (const direction of DIRECTIONS) {
      built.push(await buildVariant(direction));
    }

    const componentSet = figma.combineAsVariants(built.map((b) => b.root), figma.currentPage);
    componentSet.name = NAME;

    if (componentSet.children.length !== DIRECTIONS.length) {
      throw new Error(`Combined "${NAME}" should have ${DIRECTIONS.length} variants but has ${componentSet.children.length}.`);
    }

    const existingSetCount = figma.currentPage.children.filter(
      (n) => n.type === "COMPONENT_SET"
    ).length;
    componentSet.x = (existingSetCount - 1) * 600;
    componentSet.y = 5700;

    const hasDescriptionKey = componentSet.addComponentProperty("Has Description", "BOOLEAN", true);
    const hasFooterKey = componentSet.addComponentProperty("Has Footer", "BOOLEAN", true);
    for (const variant of componentSet.children) {
      const description = variant.findOne((n) => n.name === "Description");
      const footer = variant.findOne((n) => n.name === "Footer");
      if (!description) throw new Error(`"${variant.name}" is missing its "Description" node.`);
      if (!footer) throw new Error(`"${variant.name}" is missing its "Footer" node.`);
      description.componentPropertyReferences = { visible: hasDescriptionKey };
      footer.componentPropertyReferences = { visible: hasFooterKey };
    }

    console.log(
      "[Drawer] Verification report:",
      componentSet.children.map((variant) => ({
        variant: variant.name,
        childCount: variant.children.length,
        strokeBound: !!(variant.strokes[0] && variant.strokes[0].boundVariables && variant.strokes[0].boundVariables.color),
      }))
    );

    const summary = `"${NAME}" created — 4 variants (Direction: Bottom/Top/Left/Right), 2 boolean props (Has Description, Has Footer). All bindings verified.`;
    console.log(summary);
    figma.notify(summary, { timeout: 6000 });
  } catch (err) {
    console.error("[Drawer] Fatal error:", err);
    figma.notify(`Drawer script failed: ${err.message}`, { error: true, timeout: 8000 });
  }
})();
