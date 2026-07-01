// Component 9/61 — Button
// (Bubble skipped for now per your call — variant list couldn't be
// verified against the live docs. Will circle back.)
//
// Requires phase-0-variables.js and phase-0b-text-styles.js to have been
// run first (reads the Semantics/Primitives collections and text styles).
//
// Anatomy: single element with an optional leading icon, optional loading
// spinner, and a label (icon-only "icon" size has no label at all).
// Heights aren't hardcoded — each size is built from real padding tokens
// around Body/Small Medium (14px/20px line-height) text, which reproduces
// shadcn's documented h-9/h-8/h-10 (default/sm/lg) exactly:
//   default: px-4 py-2  -> 16 + 20 + 16 = 36px (h-9)
//   sm:      px-3 py-1.5 -> 12 + 20 + 12 = wait, uses spacing/1-5 (6px) -> 32px (h-8)
//   lg:      px-6 py-2.5 (spacing/2-5, 10px) -> 40px (h-10)
//   icon:    fixed 36x36 square, icon only
//
// Flag: some third-party sources mention additional icon-xs/icon-sm/
// icon-lg sizes, but this couldn't be confirmed against the live docs
// (blocked from fetching ui.shadcn.com) and conflicts with other sources
// citing the classic 4-size scale — only building the universally-
// confirmed default/sm/lg/icon sizes. Ask if you want the extra icon sizes
// added once confirmed.
//
// Variant: Style = Default/Destructive/Outline/Secondary/Ghost/Link
// Variant: Size = Default/Sm/Lg/Icon
// Booleans: Has Icon (default false, not bound on Icon size — always
// visible there since the icon is the entire content), Loading (default
// false), Disabled (default false, visibility-bound scrim like Accordion)

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

    const NAME = "Button";
    const existing = figma.currentPage.findOne((n) => n.type === "COMPONENT_SET" && n.name === NAME);
    if (existing) {
      existing.remove();
      console.log(`[Button] Removed existing "${NAME}" component set — rebuilding fresh.`);
    }
    const orphans = figma.currentPage.findAll(
      (n) => n.type === "COMPONENT" && /^Style=.*Size=/.test(n.name)
    );
    if (orphans.length) {
      for (const orphan of orphans) orphan.remove();
      console.log(`[Button] Removed ${orphans.length} orphaned loose component(s) from a previous partial run.`);
    }

    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    const labelStyle = needStyle("Body/Small Medium");

    // [styleName, bgVarName|null, textVarName, borderVarName|null, underline]
    const STYLES = [
      ["Default", "interactive/default", "fg/on-brand", null, false],
      ["Destructive", "bg/danger", "fg/on-brand", null, false],
      ["Outline", "bg/default", "fg/default", "border/default", false],
      ["Secondary", "bg/muted", "fg/default", null, false],
      ["Ghost", null, "fg/default", null, false],
      ["Link", null, "fg/default", null, true],
    ];

    // [sizeName, paddingXVarName, paddingYVarName, iconSize]
    const SIZES = [
      ["Default", "spacing/4", "spacing/2", 16],
      ["Sm", "spacing/3", "spacing/1-5", 16],
      ["Lg", "spacing/6", "spacing/2-5", 16],
      ["Icon", null, null, 16],
    ];

    function makeSpinner() {
      // Figma's vectorPaths only supports its own line/curve command syntax,
      // not SVG arc ("A") commands — an EllipseNode with arcData is the
      // correct way to draw a partial ring here.
      const spinner = figma.createEllipse();
      spinner.name = "Spinner";
      spinner.resize(16, 16);
      spinner.arcData = { startingAngle: 0, endingAngle: Math.PI * 1.5, innerRadius: 0.75 };
      spinner.strokes = [];
      spinner.visible = false;
      return spinner;
    }
    // Placeholder chip standing in for a real leading icon — swap this
    // for an actual icon later.
    function makeIcon() {
      const icon = figma.createRectangle();
      icon.name = "Icon";
      icon.resize(16, 16);
      icon.cornerRadius = 3;
      return icon;
    }

    async function buildVariant(styleName, bgVarName, textVarName, borderVarName, underline, sizeName, padXName, padYName, iconSize) {
      const root = figma.createComponent();
      root.name = `Style=${styleName}, Size=${sizeName}`;
      root.layoutMode = "HORIZONTAL";
      root.primaryAxisSizingMode = "AUTO";
      root.counterAxisSizingMode = "AUTO";
      root.primaryAxisAlignItems = "CENTER";
      root.counterAxisAlignItems = "CENTER";
      root.itemSpacing = 8;
      bindScalar(root, "itemSpacing", need(prim, "spacing/2"));
      root.cornerRadius = 8;
      bindCornerRadius(root, need(prim, "radius/md"));

      if (sizeName === "Icon") {
        root.resize(36, 36);
        root.primaryAxisSizingMode = "FIXED";
        root.counterAxisSizingMode = "FIXED";
        root.paddingLeft = 0;
        root.paddingRight = 0;
        root.paddingTop = 0;
        root.paddingBottom = 0;
      } else {
        root.paddingLeft = 16;
        root.paddingRight = 16;
        root.paddingTop = 8;
        root.paddingBottom = 8;
        bindScalar(root, "paddingLeft", need(prim, padXName));
        bindScalar(root, "paddingRight", need(prim, padXName));
        bindScalar(root, "paddingTop", need(prim, padYName));
        bindScalar(root, "paddingBottom", need(prim, padYName));
      }

      if (bgVarName) {
        bindFill(root, need(sem, bgVarName));
      } else {
        root.fills = [];
      }
      if (borderVarName) {
        root.strokeWeight = 1;
        bindStrokeWeight(root, need(prim, "border-width/1"));
        bindStroke(root, need(sem, borderVarName));
      } else {
        root.strokes = [];
      }

      const spinner = makeSpinner();
      bindFill(spinner, need(sem, textVarName));
      root.appendChild(spinner);

      const icon = makeIcon();
      bindFill(icon, need(sem, textVarName));
      bindCornerRadius(icon, need(prim, "radius/sm"));
      root.appendChild(icon);

      let label = null;
      if (sizeName !== "Icon") {
        icon.visible = false; // "Has Icon" defaults false for text sizes
        label = figma.createText();
        label.name = "Label";
        label.characters = "Button";
        await applyTextStyle(label, labelStyle, "Label");
        bindFill(label, need(sem, textVarName));
        if (underline) label.textDecoration = "UNDERLINE";
        root.appendChild(label);
      }

      const expectedChildren = sizeName === "Icon" ? 2 : 3;
      if (root.children.length !== expectedChildren) {
        throw new Error(`"${root.name}" should have ${expectedChildren} children but has ${root.children.length}.`);
      }

      // Disabled scrim — visibility-bound overlay, same pattern as Accordion,
      // since Figma booleans can't bind directly to a node's opacity.
      const contentWidth = root.width;
      const contentHeight = root.height;
      const overlay = figma.createRectangle();
      overlay.name = "Disabled Overlay";
      overlay.resize(contentWidth, contentHeight);
      bindFill(overlay, need(sem, "bg/default"));
      overlay.opacity = 0.5;
      overlay.visible = false;
      root.appendChild(overlay);
      overlay.layoutPositioning = "ABSOLUTE";
      overlay.x = 0;
      overlay.y = 0;
      overlay.constraints = { horizontal: "STRETCH", vertical: "STRETCH" };

      return { root, spinner, icon, label, overlay, isIconSize: sizeName === "Icon" };
    }

    const built = [];
    for (const [styleName, bgVar, textVar, borderVar, underline] of STYLES) {
      for (const [sizeName, padXName, padYName, iconSize] of SIZES) {
        built.push(
          await buildVariant(styleName, bgVar, textVar, borderVar, underline, sizeName, padXName, padYName, iconSize)
        );
      }
    }

    const componentSet = figma.combineAsVariants(built.map((b) => b.root), figma.currentPage);
    componentSet.name = NAME;

    if (componentSet.children.length !== built.length) {
      throw new Error(`Combined "${NAME}" should have ${built.length} variants but has ${componentSet.children.length}.`);
    }

    const existingSetCount = figma.currentPage.children.filter(
      (n) => n.type === "COMPONENT_SET"
    ).length;
    componentSet.x = (existingSetCount - 1) * 600;
    componentSet.y = 2400;

    const hasIconKey = componentSet.addComponentProperty("Has Icon", "BOOLEAN", false);
    const loadingKey = componentSet.addComponentProperty("Loading", "BOOLEAN", false);
    const disabledKey = componentSet.addComponentProperty("Disabled", "BOOLEAN", false);

    for (const variant of componentSet.children) {
      const spinner = variant.findOne((n) => n.name === "Spinner");
      const icon = variant.findOne((n) => n.name === "Icon");
      const overlay = variant.findOne((n) => n.name === "Disabled Overlay");
      if (!spinner) throw new Error(`"${variant.name}" is missing its "Spinner" node.`);
      if (!icon) throw new Error(`"${variant.name}" is missing its "Icon" node.`);
      if (!overlay) throw new Error(`"${variant.name}" is missing its "Disabled Overlay" node.`);

      spinner.componentPropertyReferences = { visible: loadingKey };
      overlay.componentPropertyReferences = { visible: disabledKey };
      // Icon size buttons keep their icon always visible — it's the whole
      // content, not an optional add-on — so "Has Icon" isn't bound there.
      const isIconSize = /Size=Icon$/.test(variant.name);
      if (!isIconSize) {
        icon.componentPropertyReferences = { visible: hasIconKey };
      }
    }

    console.log(
      "[Button] Verification report (sample):",
      componentSet.children.slice(0, 3).map((variant) => {
        const label = variant.findOne((n) => n.name === "Label");
        return {
          variant: variant.name,
          childCount: variant.children.length,
          labelFillBound: !!(label && label.fills[0] && label.fills[0].boundVariables && label.fills[0].boundVariables.color),
        };
      })
    );

    const summary = `"${NAME}" created — ${built.length} variants (Style x Size: 6x4), 3 boolean props (Has Icon, Loading, Disabled). All bindings verified.`;
    console.log(summary);
    figma.notify(summary, { timeout: 6000 });
  } catch (err) {
    console.error("[Button] Fatal error:", err);
    figma.notify(`Button script failed: ${err.message}`, { error: true, timeout: 8000 });
  }
})();
