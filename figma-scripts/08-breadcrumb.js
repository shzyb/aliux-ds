// Component 8/61 — Breadcrumb
// Requires phase-0-variables.js and phase-0b-text-styles.js to have been run
// first (reads the Semantics/Primitives collections and text styles).
//
// Anatomy note: like Accordion, shadcn's <Breadcrumb>/<BreadcrumbList> are
// plain wrapper elements with no unique styling — the real reusable unit is
// one entry + its trailing separator. Modeled here as "Breadcrumb Item"
// with a Type variant covering the three real entry kinds (Link/Page/
// Ellipsis). Build a full trail by placing instances in a horizontal
// auto-layout frame and turning "Show Separator" off on the last one.
//
// Variant: Type = Link / Page / Ellipsis
// Boolean: Show Separator (default true)

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
    async function applyTextStyle(node, style, label) {
      await node.setTextStyleIdAsync(style.id);
      if (node.textStyleId !== style.id) {
        throw new Error(`"${node.name}" (${label}) did not take text style "${style.name}".`);
      }
    }

    const NAME = "Breadcrumb Item";
    const existing = figma.currentPage.findOne((n) => n.type === "COMPONENT_SET" && n.name === NAME);
    if (existing) {
      existing.remove();
      console.log(`[Breadcrumb] Removed existing "${NAME}" component set — rebuilding fresh.`);
    }
    const orphans = figma.currentPage.findAll(
      (n) => n.type === "COMPONENT" && /^Type=(Link|Page|Ellipsis)$/.test(n.name)
    );
    if (orphans.length) {
      for (const orphan of orphans) orphan.remove();
      console.log(`[Breadcrumb] Removed ${orphans.length} orphaned loose component(s) from a previous partial run.`);
    }

    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    const entryStyle = needStyle("Body/Small");

    // Placeholder chip standing in for the real chevron-right separator
    // icon — swap this for an actual icon later.
    function makeSeparator() {
      const sep = figma.createRectangle();
      sep.name = "Separator";
      sep.resize(14, 14);
      bindFill(sep, need(sem, "fg/muted"));
      sep.cornerRadius = 3;
      bindCornerRadius(sep, need(prim, "radius/sm"));
      return sep;
    }

    async function buildLinkOrPage(typeName, label, textColorName) {
      const root = figma.createComponent();
      root.name = `Type=${typeName}`;
      root.layoutMode = "HORIZONTAL";
      root.primaryAxisSizingMode = "AUTO";
      root.counterAxisSizingMode = "AUTO";
      root.counterAxisAlignItems = "CENTER";
      root.itemSpacing = 6;
      bindScalar(root, "itemSpacing", need(prim, "spacing/1-5"));
      root.paddingLeft = 0;
      root.paddingRight = 0;
      root.paddingTop = 0;
      root.paddingBottom = 0;
      root.fills = [];

      const text = figma.createText();
      text.name = "Label";
      text.characters = label;
      await applyTextStyle(text, entryStyle, "Label");
      bindFill(text, need(sem, textColorName));
      root.appendChild(text);

      const separator = makeSeparator();
      root.appendChild(separator);

      if (root.children.length !== 2) {
        throw new Error(`"${root.name}" should have 2 children (Label, Separator) but has ${root.children.length}.`);
      }

      return { root, separator };
    }

    async function buildEllipsis() {
      const root = figma.createComponent();
      root.name = "Type=Ellipsis";
      root.layoutMode = "HORIZONTAL";
      root.primaryAxisSizingMode = "AUTO";
      root.counterAxisSizingMode = "AUTO";
      root.counterAxisAlignItems = "CENTER";
      root.itemSpacing = 6;
      bindScalar(root, "itemSpacing", need(prim, "spacing/1-5"));
      root.paddingLeft = 0;
      root.paddingRight = 0;
      root.paddingTop = 0;
      root.paddingBottom = 0;
      root.fills = [];

      // Placeholder chip standing in for the real ellipsis (horizontal
      // dots) icon — swap this for an actual icon later.
      const dots = figma.createRectangle();
      dots.name = "Dots";
      dots.resize(16, 16);
      bindFill(dots, need(sem, "fg/muted"));
      dots.cornerRadius = 3;
      bindCornerRadius(dots, need(prim, "radius/sm"));
      root.appendChild(dots);

      const separator = makeSeparator();
      root.appendChild(separator);

      if (root.children.length !== 2) {
        throw new Error(`"${root.name}" should have 2 children (Dots, Separator) but has ${root.children.length}.`);
      }

      return { root, separator };
    }

    const linkBuilt = await buildLinkOrPage("Link", "Components", "fg/muted");
    const pageBuilt = await buildLinkOrPage("Page", "Breadcrumb", "fg/default");
    const ellipsisBuilt = await buildEllipsis();
    const built = [linkBuilt, pageBuilt, ellipsisBuilt];

    const componentSet = figma.combineAsVariants(built.map((b) => b.root), figma.currentPage);
    componentSet.name = NAME;

    if (componentSet.children.length !== built.length) {
      throw new Error(`Combined "${NAME}" should have ${built.length} variants but has ${componentSet.children.length}.`);
    }

    const existingSetCount = figma.currentPage.children.filter(
      (n) => n.type === "COMPONENT_SET"
    ).length;
    componentSet.x = (existingSetCount - 1) * 600;
    componentSet.y = 2100;

    const showSeparatorKey = componentSet.addComponentProperty("Show Separator", "BOOLEAN", true);
    for (const variant of componentSet.children) {
      const separator = variant.findOne((n) => n.name === "Separator");
      if (!separator) throw new Error(`"${variant.name}" is missing its "Separator" node.`);
      separator.componentPropertyReferences = { visible: showSeparatorKey };
    }

    console.log(
      "[Breadcrumb] Verification report:",
      componentSet.children.map((variant) => {
        const label = variant.findOne((n) => n.name === "Label") || variant.findOne((n) => n.name === "Dots");
        return {
          variant: variant.name,
          childCount: variant.children.length,
          labelFillBound: !!(label && label.fills && label.fills[0] && label.fills[0].boundVariables && label.fills[0].boundVariables.color),
        };
      })
    );

    const summary = `"${NAME}" created — 3 variants (Type: Link/Page/Ellipsis), 1 boolean prop (Show Separator). All bindings verified.`;
    console.log(summary);
    figma.notify(summary, { timeout: 6000 });
  } catch (err) {
    console.error("[Breadcrumb] Fatal error:", err);
    figma.notify(`Breadcrumb script failed: ${err.message}`, { error: true, timeout: 8000 });
  }
})();
