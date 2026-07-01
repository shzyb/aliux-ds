// Component 1/61 — Accordion
// Requires phase-0-variables.js and phase-0b-text-styles.js to have been run
// first (reads the Semantics/Primitives collections and the Body/Small(+Medium)
// text styles they create).
//
// Anatomy note: shadcn's <Accordion> wrapper itself carries no unique styling
// (it's just a plain container that stacks items) — the real reusable visual
// unit is <AccordionItem> (trigger row + collapsible content + bottom border).
// That's what's modeled here as the Figma component. To build a full accordion
// in a Figma file, stack instances of "Accordion Item" in a vertical auto-layout
// frame and turn "Show Border" off on the last instance.
//
// Variants: State = Closed / Open (drives chevron rotation + content visibility)
// Booleans: Show Border (default true), Disabled (default false)
//
// Every binding is read back immediately after being set and throws a
// precise error if it didn't actually take, instead of silently continuing
// with an unbound value. Re-running deletes any existing same-named
// "Accordion Item" component set first and rebuilds from scratch, so a
// previous partial/broken run can never get stuck.

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
    function applyTextStyle(node, style, label) {
      node.textStyleId = style.id;
      if (node.textStyleId !== style.id) {
        throw new Error(`"${node.name}" (${label}) did not take text style "${style.name}".`);
      }
    }

    const NAME = "Accordion Item";
    const existing = figma.currentPage.findOne(
      (n) => n.type === "COMPONENT_SET" && n.name === NAME
    );
    if (existing) {
      existing.remove();
      console.log(`[Accordion] Removed existing "${NAME}" component set — rebuilding fresh.`);
    }

    // Clean up any orphaned "State=Closed"/"State=Open" loose components
    // left behind by a previous run that threw before reaching
    // combineAsVariants (this is exactly the state a partial failure leaves).
    const orphans = figma.currentPage.findAll(
      (n) => n.type === "COMPONENT" && /^State=(Closed|Open)$/.test(n.name)
    );
    if (orphans.length) {
      for (const orphan of orphans) orphan.remove();
      console.log(`[Accordion] Removed ${orphans.length} orphaned loose component(s) from a previous partial run.`);
    }

    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });

    const triggerStyle = needStyle("Body/Small Medium");
    const contentStyle = needStyle("Body/Small");

    const ITEM_WIDTH = 400;

    function makeChevron(open) {
      const chevron = figma.createVector();
      chevron.name = "Chevron";
      chevron.resize(16, 16);
      chevron.vectorPaths = [{ windingRule: "NONZERO", data: "M 4 6 L 8 10 L 12 6" }];
      chevron.fills = [];
      bindStroke(chevron, need(sem, "fg/muted"));
      chevron.strokeWeight = 2;
      bindScalar(chevron, "strokeWeight", need(prim, "border-width/2"));
      chevron.strokeCap = "ROUND";
      chevron.strokeJoin = "ROUND";
      chevron.rotation = open ? 180 : 0;
      return chevron;
    }

    function buildVariant(stateName, open) {
      const item = figma.createComponent();
      item.name = `State=${stateName}`;
      item.layoutMode = "VERTICAL";
      item.primaryAxisSizingMode = "AUTO";
      item.counterAxisSizingMode = "FIXED";
      item.resize(ITEM_WIDTH, item.height);
      item.itemSpacing = 0;
      item.paddingLeft = 0;
      item.paddingRight = 0;
      item.paddingTop = 0;
      item.paddingBottom = 0;
      item.fills = [];

      // Trigger row
      const trigger = figma.createFrame();
      trigger.name = "Trigger";
      trigger.layoutMode = "HORIZONTAL";
      trigger.primaryAxisSizingMode = "FIXED";
      trigger.counterAxisSizingMode = "AUTO";
      trigger.primaryAxisAlignItems = "SPACE_BETWEEN";
      trigger.counterAxisAlignItems = "MIN";
      trigger.itemSpacing = 16;
      bindScalar(trigger, "itemSpacing", need(prim, "spacing/4"));
      trigger.paddingTop = 16;
      trigger.paddingBottom = 16;
      bindScalar(trigger, "paddingTop", need(prim, "spacing/4"));
      bindScalar(trigger, "paddingBottom", need(prim, "spacing/4"));
      trigger.paddingLeft = 0;
      trigger.paddingRight = 0;
      trigger.fills = [];
      item.appendChild(trigger);
      trigger.layoutSizingHorizontal = "FILL";

      const label = figma.createText();
      label.name = "Label";
      label.characters = "Is it accessible?";
      applyTextStyle(label, triggerStyle, "Label");
      bindFill(label, need(sem, "fg/default"));
      trigger.appendChild(label);
      label.layoutSizingHorizontal = "FILL";

      const chevron = makeChevron(open);
      trigger.appendChild(chevron);
      chevron.layoutSizingHorizontal = "FIXED";
      chevron.layoutSizingVertical = "FIXED";

      if (trigger.children.length !== 2) {
        throw new Error(`"Trigger" in "${item.name}" should have 2 children (Label, Chevron) but has ${trigger.children.length}.`);
      }

      // Content (only present in the Open variant; Closed simply omits it)
      if (open) {
        const content = figma.createFrame();
        content.name = "Content";
        content.layoutMode = "VERTICAL";
        content.primaryAxisSizingMode = "AUTO";
        content.counterAxisSizingMode = "FIXED";
        content.paddingTop = 0;
        content.paddingBottom = 16;
        bindScalar(content, "paddingBottom", need(prim, "spacing/4"));
        content.paddingLeft = 0;
        content.paddingRight = 0;
        content.fills = [];
        item.appendChild(content);
        content.layoutSizingHorizontal = "FILL";

        const desc = figma.createText();
        desc.name = "Description";
        desc.characters = "Yes. It adheres to the WAI-ARIA design pattern.";
        applyTextStyle(desc, contentStyle, "Description");
        bindFill(desc, need(sem, "fg/muted"));
        content.appendChild(desc);
        desc.layoutSizingHorizontal = "FILL";

        if (content.children.length !== 1) {
          throw new Error(`"Content" in "${item.name}" should have 1 child (Description) but has ${content.children.length}.`);
        }
      }

      // Bottom border (visibility bound to "Show Border" boolean, wired after combine)
      const border = figma.createRectangle();
      border.name = "Bottom Border";
      border.resize(ITEM_WIDTH, 1);
      bindFill(border, need(sem, "border/default"));
      item.appendChild(border);
      border.layoutSizingHorizontal = "FILL";

      // Disabled scrim (visibility bound to "Disabled" boolean, wired after combine)
      const disabledHeight = item.height;
      const overlay = figma.createRectangle();
      overlay.name = "Disabled Overlay";
      overlay.resize(ITEM_WIDTH, disabledHeight);
      bindFill(overlay, need(sem, "bg/default"));
      overlay.opacity = 0.5;
      overlay.visible = false;
      item.appendChild(overlay);
      overlay.layoutPositioning = "ABSOLUTE";
      overlay.x = 0;
      overlay.y = 0;
      overlay.constraints = { horizontal: "STRETCH", vertical: "STRETCH" };

      const expectedChildren = open ? 4 : 3; // Trigger, [Content], Bottom Border, Disabled Overlay
      if (item.children.length !== expectedChildren) {
        throw new Error(`"${item.name}" should have ${expectedChildren} children but has ${item.children.length}.`);
      }

      return item;
    }

    const closed = buildVariant("Closed", false);
    const open = buildVariant("Open", true);

    const componentSet = figma.combineAsVariants([closed, open], figma.currentPage);
    componentSet.name = NAME;

    if (componentSet.children.length !== 2) {
      throw new Error(`Combined "${NAME}" should have 2 variants but has ${componentSet.children.length}.`);
    }

    const existingSetCount = figma.currentPage.children.filter(
      (n) => n.type === "COMPONENT_SET"
    ).length;
    componentSet.x = (existingSetCount - 1) * 600;
    componentSet.y = 0;

    const showBorderKey = componentSet.addComponentProperty("Show Border", "BOOLEAN", true);
    const disabledKey = componentSet.addComponentProperty("Disabled", "BOOLEAN", false);

    for (const variant of componentSet.children) {
      const border = variant.findOne((n) => n.name === "Bottom Border");
      const overlay = variant.findOne((n) => n.name === "Disabled Overlay");
      if (!border) throw new Error(`"${variant.name}" is missing its "Bottom Border" node.`);
      if (!overlay) throw new Error(`"${variant.name}" is missing its "Disabled Overlay" node.`);
      border.componentPropertyReferences = { visible: showBorderKey };
      overlay.componentPropertyReferences = { visible: disabledKey };
    }

    // Final self-check, printed regardless of success, so the console is
    // always proof of the real end state rather than an assumption.
    console.log(
      "[Accordion] Verification report:",
      componentSet.children.map((variant) => {
        const label = variant.findOne((n) => n.name === "Label");
        const border = variant.findOne((n) => n.name === "Bottom Border");
        return {
          variant: variant.name,
          childCount: variant.children.length,
          labelStyleId: label && label.textStyleId,
          labelFillBound: !!(label && label.fills[0] && label.fills[0].boundVariables && label.fills[0].boundVariables.color),
          borderFillBound: !!(border && border.fills[0] && border.fills[0].boundVariables && border.fills[0].boundVariables.color),
        };
      })
    );

    const summary = `"${NAME}" created — 2 variants (State: Closed/Open), 2 boolean props (Show Border, Disabled). All bindings verified.`;
    console.log(summary);
    figma.notify(summary, { timeout: 6000 });
  } catch (err) {
    console.error("[Accordion] Fatal error:", err);
    figma.notify(`Accordion script failed: ${err.message}`, { error: true, timeout: 8000 });
  }
})();
