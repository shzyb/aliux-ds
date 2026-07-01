// Component 2/61 — Alert
// Requires phase-0-variables.js and phase-0b-text-styles.js to have been run
// first (reads the Semantics/Primitives collections and the Body/Small(+Medium)
// text styles they create).
//
// Anatomy: Alert root (bordered, rounded card) containing an optional leading
// icon and a text column of AlertTitle + optional AlertDescription. shadcn's
// border/background stay the same across variants; only the icon/title/
// description text color changes for the destructive variant.
//
// Variants: Style = Default / Destructive
// Booleans: Has Icon (default true), Has Description (default true)
//
// Every binding is read back immediately after being set and throws a
// precise error if it didn't actually take, instead of silently continuing
// with an unbound value. Re-running deletes any existing same-named
// "Alert" component set first and rebuilds from scratch, so a previous
// partial/broken run can never get stuck.

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

    // Bind + immediately read back. Throws with the exact node/variable if
    // the binding didn't actually take, instead of continuing silently.
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

    const NAME = "Alert";
    const existing = figma.currentPage.findOne(
      (n) => n.type === "COMPONENT_SET" && n.name === NAME
    );
    if (existing) {
      existing.remove();
      console.log(`[Alert] Removed existing "${NAME}" component set — rebuilding fresh.`);
    }

    // Clean up any orphaned "Style=Default"/"Style=Destructive" loose
    // components left behind by a previous run that threw before reaching
    // combineAsVariants (this is exactly the state a partial failure leaves).
    const orphans = figma.currentPage.findAll(
      (n) => n.type === "COMPONENT" && /^Style=(Default|Destructive)$/.test(n.name)
    );
    if (orphans.length) {
      for (const orphan of orphans) orphan.remove();
      console.log(`[Alert] Removed ${orphans.length} orphaned loose component(s) from a previous partial run.`);
    }

    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });

    const titleStyle = needStyle("Body/Small Medium");
    const descriptionStyle = needStyle("Body/Small");

    const ALERT_WIDTH = 400;

    function makeIcon(colorVarName) {
      const icon = figma.createEllipse();
      icon.name = "Icon";
      icon.resize(16, 16);
      icon.fills = [];
      bindStroke(icon, need(sem, colorVarName));
      icon.strokeWeight = 2;
      bindScalar(icon, "strokeWeight", need(prim, "border-width/2"));
      return icon;
    }

    function buildVariant(styleName, titleColorName, descColorName) {
      const root = figma.createComponent();
      root.name = `Style=${styleName}`;
      root.layoutMode = "HORIZONTAL";
      root.primaryAxisSizingMode = "FIXED";
      root.counterAxisSizingMode = "AUTO";
      root.counterAxisAlignItems = "MIN";
      root.resize(ALERT_WIDTH, root.height);
      root.itemSpacing = 12;
      bindScalar(root, "itemSpacing", need(prim, "spacing/3"));
      root.paddingLeft = 16;
      root.paddingRight = 16;
      bindScalar(root, "paddingLeft", need(prim, "spacing/4"));
      bindScalar(root, "paddingRight", need(prim, "spacing/4"));
      root.paddingTop = 12;
      root.paddingBottom = 12;
      bindScalar(root, "paddingTop", need(prim, "spacing/3"));
      bindScalar(root, "paddingBottom", need(prim, "spacing/3"));
      root.cornerRadius = 10;
      bindScalar(root, "cornerRadius", need(prim, "radius/lg"));
      root.strokeWeight = 1;
      bindScalar(root, "strokeWeight", need(prim, "border-width/1"));
      bindStroke(root, need(sem, "border/default"));
      bindFill(root, need(sem, "surface/raised"));

      const icon = makeIcon(titleColorName);
      root.appendChild(icon);
      icon.layoutSizingHorizontal = "FIXED";
      icon.layoutSizingVertical = "FIXED";

      const textColumn = figma.createFrame();
      textColumn.name = "Text";
      textColumn.layoutMode = "VERTICAL";
      textColumn.primaryAxisSizingMode = "AUTO";
      textColumn.counterAxisSizingMode = "FIXED";
      textColumn.itemSpacing = 2;
      bindScalar(textColumn, "itemSpacing", need(prim, "spacing/0-5"));
      textColumn.paddingLeft = 0;
      textColumn.paddingRight = 0;
      textColumn.paddingTop = 0;
      textColumn.paddingBottom = 0;
      textColumn.fills = [];
      root.appendChild(textColumn);
      textColumn.layoutSizingHorizontal = "FILL";

      const title = figma.createText();
      title.name = "Title";
      title.characters = "Success! Your changes have been saved";
      applyTextStyle(title, titleStyle, "Title");
      bindFill(title, need(sem, titleColorName));
      textColumn.appendChild(title);
      title.layoutSizingHorizontal = "FILL";

      const description = figma.createText();
      description.name = "Description";
      description.characters = "This is an alert description providing more context.";
      applyTextStyle(description, descriptionStyle, "Description");
      bindFill(description, need(sem, descColorName));
      textColumn.appendChild(description);
      description.layoutSizingHorizontal = "FILL";

      if (root.children.length !== 2) {
        throw new Error(`"${root.name}" should have 2 children (Icon, Text) but has ${root.children.length}.`);
      }
      if (textColumn.children.length !== 2) {
        throw new Error(`"Text" in "${root.name}" should have 2 children (Title, Description) but has ${textColumn.children.length}.`);
      }

      return root;
    }

    const defaultVariant = buildVariant("Default", "fg/default", "fg/muted");
    const destructiveVariant = buildVariant("Destructive", "fg/danger", "fg/danger");

    const componentSet = figma.combineAsVariants(
      [defaultVariant, destructiveVariant],
      figma.currentPage
    );
    componentSet.name = NAME;

    if (componentSet.children.length !== 2) {
      throw new Error(`Combined "${NAME}" should have 2 variants but has ${componentSet.children.length}.`);
    }

    const existingSetCount = figma.currentPage.children.filter(
      (n) => n.type === "COMPONENT_SET"
    ).length;
    componentSet.x = (existingSetCount - 1) * 600;
    componentSet.y = 300;

    const hasIconKey = componentSet.addComponentProperty("Has Icon", "BOOLEAN", true);
    const hasDescriptionKey = componentSet.addComponentProperty("Has Description", "BOOLEAN", true);

    for (const variant of componentSet.children) {
      const icon = variant.findOne((n) => n.name === "Icon");
      const description = variant.findOne((n) => n.name === "Description");
      if (!icon) throw new Error(`"${variant.name}" is missing its "Icon" node.`);
      if (!description) throw new Error(`"${variant.name}" is missing its "Description" node.`);
      icon.componentPropertyReferences = { visible: hasIconKey };
      description.componentPropertyReferences = { visible: hasDescriptionKey };
    }

    // Final self-check, printed regardless of success, so the console is
    // always proof of the real end state rather than an assumption.
    console.log(
      "[Alert] Verification report:",
      componentSet.children.map((variant) => {
        const title = variant.findOne((n) => n.name === "Title");
        const description = variant.findOne((n) => n.name === "Description");
        return {
          variant: variant.name,
          childCount: variant.children.length,
          titleStyleId: title && title.textStyleId,
          titleFillBound: !!(title && title.fills[0] && title.fills[0].boundVariables && title.fills[0].boundVariables.color),
          descriptionPresent: !!description,
          descriptionFillBound: !!(description && description.fills[0] && description.fills[0].boundVariables && description.fills[0].boundVariables.color),
        };
      })
    );

    const summary = `"${NAME}" created — 2 variants (Style: Default/Destructive), 2 boolean props (Has Icon, Has Description). All bindings verified.`;
    console.log(summary);
    figma.notify(summary, { timeout: 6000 });
  } catch (err) {
    console.error("[Alert] Fatal error:", err);
    figma.notify(`Alert script failed: ${err.message}`, { error: true, timeout: 8000 });
  }
})();
