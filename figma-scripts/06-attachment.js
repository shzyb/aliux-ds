// Component 6/61 — Attachment
// Requires phase-0-variables.js and phase-0b-text-styles.js to have been run
// first (reads the Semantics/Primitives collections and text styles).
//
// Anatomy: shadcn's real Attachment is genuinely large — 5 upload states
// (idle/uploading/processing/error/done) with a shimmer animation, 3 sizes,
// and horizontal/vertical orientation, plus AttachmentTrigger/
// AttachmentActions for interactive card behavior. Crossing all of that
// would mean 5 x 3 x 2 = 30 variants for one component, which fails the
// "keep the variant grid reasonably small" goal outright.
//
// Scoped down deliberately: only State is modeled as a Variant axis (it's
// the one dimension that's genuinely a different visual treatment, not
// just a toggle). Size and horizontal/vertical orientation are NOT modeled
// here — flagging this rather than silently building a partial "size" or
// "orientation" that only half-works. Ask if you want those added as
// additional variant axes.
//
// The shimmer/progress animation on Uploading/Processing has no static
// Figma equivalent, so those states are differentiated by description text
// and color only, not an animated fill.
//
// Variant: State = Idle / Uploading / Processing / Error / Done
// Boolean: Has Actions (default true)

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

    const NAME = "Attachment";
    const existing = figma.currentPage.findOne((n) => n.type === "COMPONENT_SET" && n.name === NAME);
    if (existing) {
      existing.remove();
      console.log(`[Attachment] Removed existing "${NAME}" component set — rebuilding fresh.`);
    }
    const orphans = figma.currentPage.findAll(
      (n) => n.type === "COMPONENT" && /^State=(Idle|Uploading|Processing|Error|Done)$/.test(n.name)
    );
    if (orphans.length) {
      for (const orphan of orphans) orphan.remove();
      console.log(`[Attachment] Removed ${orphans.length} orphaned loose component(s) from a previous partial run.`);
    }

    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });

    const titleStyle = needStyle("Body/Small Medium");
    const descriptionStyle = needStyle("Body/Small");

    const CARD_WIDTH = 320;

    // [stateLabel, descriptionText, descriptionColorName, mediaBorderColorName]
    const STATES = [
      ["Idle", "Ready to send", "fg/muted", "border/default"],
      ["Uploading", "Uploading… 45%", "fg/muted", "border/default"],
      ["Processing", "Processing…", "fg/muted", "border/default"],
      ["Error", "Upload failed — tap to retry", "fg/danger", "border/danger"],
      ["Done", "2.4 MB", "fg/muted", "border/default"],
    ];

    async function buildVariant(stateLabel, descriptionText, descColorName, mediaBorderName) {
      const root = figma.createComponent();
      root.name = `State=${stateLabel}`;
      root.layoutMode = "HORIZONTAL";
      root.primaryAxisSizingMode = "FIXED";
      root.counterAxisSizingMode = "AUTO";
      root.counterAxisAlignItems = "CENTER";
      root.resize(CARD_WIDTH, root.height);
      root.itemSpacing = 12;
      bindScalar(root, "itemSpacing", need(prim, "spacing/3"));
      root.paddingLeft = 12;
      root.paddingRight = 12;
      root.paddingTop = 12;
      root.paddingBottom = 12;
      bindScalar(root, "paddingLeft", need(prim, "spacing/3"));
      bindScalar(root, "paddingRight", need(prim, "spacing/3"));
      bindScalar(root, "paddingTop", need(prim, "spacing/3"));
      bindScalar(root, "paddingBottom", need(prim, "spacing/3"));
      root.cornerRadius = 10;
      bindCornerRadius(root, need(prim, "radius/lg"));
      root.strokeWeight = 1;
      bindStrokeWeight(root, need(prim, "border-width/1"));
      bindStroke(root, need(sem, "border/default"));
      bindFill(root, need(sem, "surface/raised"));

      // AttachmentMedia — generic file-thumbnail placeholder
      const media = figma.createFrame();
      media.name = "Media";
      media.resize(40, 40);
      bindFill(media, need(sem, "bg/muted"));
      media.cornerRadius = 8;
      bindCornerRadius(media, need(prim, "radius/md"));
      media.strokeWeight = 1;
      bindStrokeWeight(media, need(prim, "border-width/1"));
      bindStroke(media, need(sem, mediaBorderName));
      root.appendChild(media);
      media.layoutSizingHorizontal = "FIXED";
      media.layoutSizingVertical = "FIXED";

      // AttachmentContent
      const content = figma.createFrame();
      content.name = "Content";
      content.layoutMode = "VERTICAL";
      content.primaryAxisSizingMode = "AUTO";
      content.counterAxisSizingMode = "FIXED";
      content.itemSpacing = 2;
      bindScalar(content, "itemSpacing", need(prim, "spacing/0-5"));
      content.paddingLeft = 0;
      content.paddingRight = 0;
      content.paddingTop = 0;
      content.paddingBottom = 0;
      content.fills = [];
      root.appendChild(content);
      content.layoutSizingHorizontal = "FILL";

      const title = figma.createText();
      title.name = "Title";
      title.characters = "presentation-final.pdf";
      await applyTextStyle(title, titleStyle, "Title");
      bindFill(title, need(sem, "fg/default"));
      content.appendChild(title);
      title.layoutSizingHorizontal = "FILL";

      const description = figma.createText();
      description.name = "Description";
      description.characters = descriptionText;
      await applyTextStyle(description, descriptionStyle, "Description");
      bindFill(description, need(sem, descColorName));
      content.appendChild(description);
      description.layoutSizingHorizontal = "FILL";

      if (content.children.length !== 2) {
        throw new Error(`"Content" in "${root.name}" should have 2 children (Title, Description) but has ${content.children.length}.`);
      }

      // AttachmentActions — single generic icon-action placeholder
      const actions = figma.createFrame();
      actions.name = "Actions";
      actions.layoutMode = "HORIZONTAL";
      actions.primaryAxisSizingMode = "AUTO";
      actions.counterAxisSizingMode = "AUTO";
      actions.itemSpacing = 4;
      bindScalar(actions, "itemSpacing", need(prim, "spacing/1"));
      actions.paddingLeft = 0;
      actions.paddingRight = 0;
      actions.paddingTop = 0;
      actions.paddingBottom = 0;
      actions.fills = [];
      root.appendChild(actions);
      actions.layoutSizingHorizontal = "FIXED";
      actions.layoutSizingVertical = "FIXED";

      const action = figma.createVector();
      action.name = "Action";
      action.resize(16, 16);
      action.vectorPaths = [{ windingRule: "NONZERO", data: "M 4 4 L 12 12 M 12 4 L 4 12" }]; // simple "x" glyph
      action.fills = [];
      bindStroke(action, need(sem, "fg/muted"));
      action.strokeWeight = 1;
      bindStrokeWeight(action, need(prim, "border-width/1"));
      action.strokeCap = "ROUND";
      actions.appendChild(action);

      if (root.children.length !== 3) {
        throw new Error(`"${root.name}" should have 3 children (Media, Content, Actions) but has ${root.children.length}.`);
      }

      return { root, actions };
    }

    const built = [];
    for (const [stateLabel, descText, descColor, mediaBorder] of STATES) {
      built.push(await buildVariant(stateLabel, descText, descColor, mediaBorder));
    }

    const componentSet = figma.combineAsVariants(built.map((b) => b.root), figma.currentPage);
    componentSet.name = NAME;

    if (componentSet.children.length !== STATES.length) {
      throw new Error(`Combined "${NAME}" should have ${STATES.length} variants but has ${componentSet.children.length}.`);
    }

    const existingSetCount = figma.currentPage.children.filter(
      (n) => n.type === "COMPONENT_SET"
    ).length;
    componentSet.x = (existingSetCount - 1) * 600;
    componentSet.y = 1500;

    const hasActionsKey = componentSet.addComponentProperty("Has Actions", "BOOLEAN", true);
    for (const variant of componentSet.children) {
      const actions = variant.findOne((n) => n.name === "Actions");
      if (!actions) throw new Error(`"${variant.name}" is missing its "Actions" node.`);
      actions.componentPropertyReferences = { visible: hasActionsKey };
    }

    console.log(
      "[Attachment] Verification report:",
      componentSet.children.map((variant) => {
        const description = variant.findOne((n) => n.name === "Description");
        const media = variant.findOne((n) => n.name === "Media");
        return {
          variant: variant.name,
          childCount: variant.children.length,
          descriptionText: description && description.characters,
          descriptionFillBound: !!(description && description.fills[0] && description.fills[0].boundVariables && description.fills[0].boundVariables.color),
          mediaStrokeBound: !!(media && media.strokes[0] && media.strokes[0].boundVariables && media.strokes[0].boundVariables.color),
        };
      })
    );

    const summary = `"${NAME}" created — 5 variants (State: Idle/Uploading/Processing/Error/Done), 1 boolean prop (Has Actions). Size/orientation not modeled — see flag in file header. All bindings verified.`;
    console.log(summary);
    figma.notify(summary, { timeout: 6000 });
  } catch (err) {
    console.error("[Attachment] Fatal error:", err);
    figma.notify(`Attachment script failed: ${err.message}`, { error: true, timeout: 8000 });
  }
})();
