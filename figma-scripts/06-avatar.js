// Component 6/61 — Avatar
// Requires phase-0-variables.js and phase-0b-text-styles.js to have been run
// first (reads the Semantics/Primitives collections and text styles).
//
// Anatomy: circular frame with an AvatarImage placeholder layered on top of
// an always-present AvatarFallback (initials). Toggling "Has Image" off
// reveals the fallback underneath — Figma boolean properties can only bind
// to a single layer's `visible`, not an inverse pair, so the fallback is
// simply always present as the base layer rather than needing its own
// boolean.
//
// Variant: Size = sm (24px) / default (32px) / lg (40px) — shadcn's own
// documented size-6/size-8/size-10 scale via data-[size].
// Boolean: Has Image (default true)
//
// Flag: fallback initials use "Body/Small Medium" at every size rather than
// scaling text size with the avatar (Phase 0b's scale doesn't have a
// per-avatar-size text style, and inventing one felt like overkill for a
// 2-character initials label).

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

    const NAME = "Avatar";
    const existing = figma.currentPage.findOne((n) => n.type === "COMPONENT_SET" && n.name === NAME);
    if (existing) {
      existing.remove();
      console.log(`[Avatar] Removed existing "${NAME}" component set — rebuilding fresh.`);
    }
    const orphans = figma.currentPage.findAll(
      (n) => n.type === "COMPONENT" && /^Size=(Sm|Default|Lg)$/.test(n.name)
    );
    if (orphans.length) {
      for (const orphan of orphans) orphan.remove();
      console.log(`[Avatar] Removed ${orphans.length} orphaned loose component(s) from a previous partial run.`);
    }

    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    const initialsStyle = needStyle("Body/Small Medium");

    const SIZES = [
      ["Sm", 24],
      ["Default", 32],
      ["Lg", 40],
    ];

    async function buildVariant(label, size) {
      const root = figma.createComponent();
      root.name = `Size=${label}`;
      root.resize(size, size);
      root.clipsContent = true;
      bindFill(root, need(sem, "bg/muted"));
      root.cornerRadius = size / 2;
      bindCornerRadius(root, need(prim, "radius/full"));
      root.strokeWeight = 1;
      bindStrokeWeight(root, need(prim, "border-width/1"));
      bindStroke(root, need(sem, "border/subtle"));

      // Fallback sits underneath as the base layer — always present, so
      // toggling "Has Image" off simply reveals it without needing an
      // inverse boolean binding.
      const fallback = figma.createFrame();
      fallback.name = "Fallback";
      fallback.layoutMode = "HORIZONTAL";
      fallback.primaryAxisSizingMode = "FIXED";
      fallback.counterAxisSizingMode = "FIXED";
      fallback.primaryAxisAlignItems = "CENTER";
      fallback.counterAxisAlignItems = "CENTER";
      fallback.resize(size, size);
      fallback.fills = [];
      root.appendChild(fallback);

      const initials = figma.createText();
      initials.name = "Initials";
      initials.characters = "CN";
      await applyTextStyle(initials, initialsStyle, "Initials");
      bindFill(initials, need(sem, "fg/muted"));
      fallback.appendChild(initials);

      const image = figma.createRectangle();
      image.name = "Image";
      image.resize(size, size);
      image.x = 0;
      image.y = 0;
      bindFill(image, need(sem, "bg/subtle"));
      image.constraints = { horizontal: "STRETCH", vertical: "STRETCH" };
      root.appendChild(image);

      if (root.children.length !== 2) {
        throw new Error(`"${root.name}" should have 2 children (Fallback, Image) but has ${root.children.length}.`);
      }

      return { root, image };
    }

    const built = [];
    for (const [label, size] of SIZES) {
      built.push(await buildVariant(label, size));
    }

    const componentSet = figma.combineAsVariants(built.map((b) => b.root), figma.currentPage);
    componentSet.name = NAME;

    if (componentSet.children.length !== SIZES.length) {
      throw new Error(`Combined "${NAME}" should have ${SIZES.length} variants but has ${componentSet.children.length}.`);
    }

    const existingSetCount = figma.currentPage.children.filter(
      (n) => n.type === "COMPONENT_SET"
    ).length;
    componentSet.x = (existingSetCount - 1) * 600;
    componentSet.y = 1200;

    const hasImageKey = componentSet.addComponentProperty("Has Image", "BOOLEAN", true);
    for (const variant of componentSet.children) {
      const image = variant.findOne((n) => n.name === "Image");
      if (!image) throw new Error(`"${variant.name}" is missing its "Image" node.`);
      image.componentPropertyReferences = { visible: hasImageKey };
    }

    console.log(
      "[Avatar] Verification report:",
      componentSet.children.map((variant) => {
        const image = variant.findOne((n) => n.name === "Image");
        const initials = variant.findOne((n) => n.name === "Initials");
        return {
          variant: variant.name,
          size: `${variant.width}x${variant.height}`,
          imageFillBound: !!(image && image.fills[0] && image.fills[0].boundVariables && image.fills[0].boundVariables.color),
          initialsStyleId: initials && initials.textStyleId,
        };
      })
    );

    const summary = `"${NAME}" created — 3 variants (Size: Sm/Default/Lg), 1 boolean prop (Has Image). All bindings verified.`;
    console.log(summary);
    figma.notify(summary, { timeout: 6000 });
  } catch (err) {
    console.error("[Avatar] Fatal error:", err);
    figma.notify(`Avatar script failed: ${err.message}`, { error: true, timeout: 8000 });
  }
})();
