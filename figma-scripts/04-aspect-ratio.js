// Component 4/61 — Aspect Ratio
// Requires phase-0-variables.js to have been run first (reads Primitives).
// No text styles needed — this component has no text.
//
// Anatomy: shadcn's AspectRatio just constrains its children's box to a
// given ratio (default 1, i.e. square, per the docs; the docs example
// itself uses 16/9). There's no documented variant/state — the ratio is an
// arbitrary number, not an enum — but a Figma component needs concrete
// frame dimensions, so this models the common documented/typical ratios as
// a Variant axis rather than trying to represent "any number."
//
// Variant: Ratio = 1:1 / 4:3 / 16:9 / 21:9
// Content is a plain placeholder rectangle representing where an
// image/video would go (shadcn's own example literally renders an <Image>
// inside), bound to bg/muted + radius/md (matching the doc example's
// "rounded-md object-cover" on the inner image).

(async () => {
  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const primitives = collections.find((c) => c.name === "Primitives");
    const semantics = collections.find((c) => c.name === "Semantics");
    if (!primitives || !semantics) {
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
    const prim = await collectionVarMap(primitives);
    const sem = await collectionVarMap(semantics);

    function need(map, name) {
      const v = map.get(name);
      if (!v) throw new Error(`Missing variable "${name}" — check Phase 0 setup.`);
      return v;
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

    const NAME = "Aspect Ratio";
    const existing = figma.currentPage.findOne((n) => n.type === "COMPONENT_SET" && n.name === NAME);
    if (existing) {
      existing.remove();
      console.log(`[Aspect Ratio] Removed existing "${NAME}" component set — rebuilding fresh.`);
    }
    const orphans = figma.currentPage.findAll(
      (n) => n.type === "COMPONENT" && /^Ratio=/.test(n.name)
    );
    if (orphans.length) {
      for (const orphan of orphans) orphan.remove();
      console.log(`[Aspect Ratio] Removed ${orphans.length} orphaned loose component(s) from a previous partial run.`);
    }

    const CONTAINER_WIDTH = 400;
    const RATIOS = [
      ["1:1", 1 / 1],
      ["4:3", 4 / 3],
      ["16:9", 16 / 9],
      ["21:9", 21 / 9],
    ];

    function buildVariant(label, ratio) {
      const root = figma.createComponent();
      root.name = `Ratio=${label}`;
      root.resize(CONTAINER_WIDTH, CONTAINER_WIDTH / ratio);
      root.fills = [];
      root.clipsContent = true;

      const placeholder = figma.createRectangle();
      placeholder.name = "Content";
      placeholder.resize(CONTAINER_WIDTH, CONTAINER_WIDTH / ratio);
      placeholder.x = 0;
      placeholder.y = 0;
      bindFill(placeholder, need(sem, "bg/muted"));
      placeholder.cornerRadius = 8;
      bindCornerRadius(placeholder, need(prim, "radius/md"));
      placeholder.constraints = { horizontal: "STRETCH", vertical: "STRETCH" };
      root.appendChild(placeholder);

      if (root.children.length !== 1) {
        throw new Error(`"${root.name}" should have 1 child (Content) but has ${root.children.length}.`);
      }

      return root;
    }

    const builtVariants = RATIOS.map(([label, ratio]) => buildVariant(label, ratio));

    const componentSet = figma.combineAsVariants(builtVariants, figma.currentPage);
    componentSet.name = NAME;

    if (componentSet.children.length !== RATIOS.length) {
      throw new Error(`Combined "${NAME}" should have ${RATIOS.length} variants but has ${componentSet.children.length}.`);
    }

    const existingSetCount = figma.currentPage.children.filter(
      (n) => n.type === "COMPONENT_SET"
    ).length;
    componentSet.x = (existingSetCount - 1) * 600;
    componentSet.y = 900;

    console.log(
      "[Aspect Ratio] Verification report:",
      componentSet.children.map((variant) => {
        const content = variant.findOne((n) => n.name === "Content");
        return {
          variant: variant.name,
          size: `${variant.width}x${variant.height}`,
          contentFillBound: !!(content && content.fills[0] && content.fills[0].boundVariables && content.fills[0].boundVariables.color),
        };
      })
    );

    const summary = `"${NAME}" created — ${RATIOS.length} variants (Ratio: 1:1/4:3/16:9/21:9), no booleans. All bindings verified.`;
    console.log(summary);
    figma.notify(summary, { timeout: 6000 });
  } catch (err) {
    console.error("[Aspect Ratio] Fatal error:", err);
    figma.notify(`Aspect Ratio script failed: ${err.message}`, { error: true, timeout: 8000 });
  }
})();
