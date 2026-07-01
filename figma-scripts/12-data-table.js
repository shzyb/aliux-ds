// Component 12/61 — Data Table
// Requires phase-0-variables.js and phase-0b-text-styles.js to have been
// run first.
//
// Anatomy note: shadcn's "Data Table" isn't actually a standalone styled
// component — the docs page is a *recipe* combining TanStack Table's
// sorting/filtering/pagination logic with the plain <Table> component
// (a separate, not-yet-built item on the 61 list) plus Button/Input/
// Checkbox for the toolbar, row selection, and pager. There's no
// documented variant prop for "Data Table" itself, so this is built as a
// single Component showing the canonical anatomy: toolbar (filter input +
// column-visibility button placeholders) -> table (header row + 3 data
// rows, each with a row-selection placeholder) -> footer (selection count +
// Previous/Next pager placeholders).
//
// Per your call, the row-selection cell is a plain placeholder chip rather
// than a real Checkbox component instance — swap it for your own Checkbox
// reference later.
//
// Boolean: Show Toolbar (default true)

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

    const NAME = "Data Table";
    const existing = figma.currentPage.findOne((n) => n.type === "COMPONENT" && n.name === NAME);
    if (existing) {
      existing.remove();
      console.log(`[Data Table] Removed existing "${NAME}" — rebuilding fresh.`);
    }

    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    const headerStyle = needStyle("Body/Small Medium");
    const cellStyle = needStyle("Body/Small");

    const TABLE_WIDTH = 640;

    async function makeText(name, characters, style, colorVarName) {
      const text = figma.createText();
      text.name = name;
      text.characters = characters;
      await applyTextStyle(text, style, name);
      bindFill(text, need(sem, colorVarName));
      return text;
    }

    async function makePillButton(label) {
      const button = figma.createFrame();
      button.name = "PillButton";
      button.layoutMode = "HORIZONTAL";
      button.primaryAxisSizingMode = "AUTO";
      button.counterAxisSizingMode = "AUTO";
      button.primaryAxisAlignItems = "CENTER";
      button.counterAxisAlignItems = "CENTER";
      button.paddingLeft = 12;
      button.paddingRight = 12;
      button.paddingTop = 6;
      button.paddingBottom = 6;
      bindScalar(button, "paddingLeft", need(prim, "spacing/3"));
      bindScalar(button, "paddingRight", need(prim, "spacing/3"));
      bindScalar(button, "paddingTop", need(prim, "spacing/1-5"));
      bindScalar(button, "paddingBottom", need(prim, "spacing/1-5"));
      button.cornerRadius = 8;
      bindCornerRadius(button, need(prim, "radius/md"));
      button.strokeWeight = 1;
      bindStrokeWeight(button, need(prim, "border-width/1"));
      bindStroke(button, need(sem, "border/default"));
      bindFill(button, need(sem, "bg/default"));

      const text = await makeText("Label", label, headerStyle, "fg/default");
      button.appendChild(text);
      return button;
    }

    // ---- Toolbar ----
    const toolbar = figma.createFrame();
    toolbar.name = "Toolbar";
    toolbar.layoutMode = "HORIZONTAL";
    toolbar.primaryAxisSizingMode = "FIXED";
    toolbar.counterAxisSizingMode = "AUTO";
    toolbar.primaryAxisAlignItems = "SPACE_BETWEEN";
    toolbar.counterAxisAlignItems = "CENTER";
    toolbar.resize(TABLE_WIDTH, toolbar.height);
    toolbar.paddingLeft = 0;
    toolbar.paddingRight = 0;
    toolbar.paddingTop = 0;
    toolbar.paddingBottom = 0;
    toolbar.fills = [];

    const searchBox = figma.createFrame();
    searchBox.name = "SearchBox";
    searchBox.layoutMode = "HORIZONTAL";
    searchBox.primaryAxisSizingMode = "FIXED";
    searchBox.counterAxisSizingMode = "AUTO";
    searchBox.counterAxisAlignItems = "CENTER";
    searchBox.resize(240, searchBox.height);
    searchBox.paddingLeft = 12;
    searchBox.paddingRight = 12;
    searchBox.paddingTop = 8;
    searchBox.paddingBottom = 8;
    bindScalar(searchBox, "paddingLeft", need(prim, "spacing/3"));
    bindScalar(searchBox, "paddingRight", need(prim, "spacing/3"));
    bindScalar(searchBox, "paddingTop", need(prim, "spacing/2"));
    bindScalar(searchBox, "paddingBottom", need(prim, "spacing/2"));
    searchBox.cornerRadius = 8;
    bindCornerRadius(searchBox, need(prim, "radius/md"));
    searchBox.strokeWeight = 1;
    bindStrokeWeight(searchBox, need(prim, "border-width/1"));
    bindStroke(searchBox, need(sem, "border/default"));
    bindFill(searchBox, need(sem, "bg/default"));
    const searchText = await makeText("Placeholder", "Filter emails...", cellStyle, "fg/muted");
    searchBox.appendChild(searchText);
    toolbar.appendChild(searchBox);

    const columnsButton = await makePillButton("Columns");
    toolbar.appendChild(columnsButton);

    if (toolbar.children.length !== 2) {
      throw new Error(`"Toolbar" should have 2 children (SearchBox, Columns button) but has ${toolbar.children.length}.`);
    }

    // ---- Table ----
    const COLUMNS = [
      { name: "Status", width: 90 },
      { name: "Email", width: 280, fill: true },
      { name: "Amount", width: 90 },
      { name: "Actions", width: 40 },
    ];
    const ROWS = [
      ["Success", "ken99@example.com", "$316.00"],
      ["Processing", "abe45@example.com", "$242.00"],
      ["Failed", "monserrat44@example.com", "$837.00"],
    ];

    async function makeTableRow(name, isHeader, cellValues) {
      const row = figma.createFrame();
      row.name = name;
      row.layoutMode = "HORIZONTAL";
      row.primaryAxisSizingMode = "FIXED";
      row.counterAxisSizingMode = "AUTO";
      row.counterAxisAlignItems = "CENTER";
      row.resize(TABLE_WIDTH, row.height);
      row.itemSpacing = 12;
      bindScalar(row, "itemSpacing", need(prim, "spacing/3"));
      row.paddingLeft = 16;
      row.paddingRight = 16;
      row.paddingTop = 12;
      row.paddingBottom = 12;
      bindScalar(row, "paddingLeft", need(prim, "spacing/4"));
      bindScalar(row, "paddingRight", need(prim, "spacing/4"));
      bindScalar(row, "paddingTop", need(prim, "spacing/3"));
      bindScalar(row, "paddingBottom", need(prim, "spacing/3"));
      if (isHeader) {
        bindFill(row, need(sem, "bg/muted"));
      } else {
        row.fills = [];
      }

      // Placeholder chip standing in for a real Checkbox instance — swap
      // this for your own Checkbox reference later.
      const checkboxPlaceholder = figma.createRectangle();
      checkboxPlaceholder.name = "Checkbox";
      checkboxPlaceholder.resize(16, 16);
      bindFill(checkboxPlaceholder, need(sem, "bg/default"));
      checkboxPlaceholder.strokeWeight = 1;
      bindStrokeWeight(checkboxPlaceholder, need(prim, "border-width/1"));
      bindStroke(checkboxPlaceholder, need(sem, "border/default"));
      checkboxPlaceholder.cornerRadius = 4;
      bindCornerRadius(checkboxPlaceholder, need(prim, "radius/sm"));
      row.appendChild(checkboxPlaceholder);
      checkboxPlaceholder.layoutSizingHorizontal = "FIXED";
      checkboxPlaceholder.layoutSizingVertical = "FIXED";

      for (let i = 0; i < COLUMNS.length; i++) {
        const col = COLUMNS[i];
        const cell = await makeText(
          col.name,
          isHeader ? col.name : cellValues[i] || "",
          isHeader ? headerStyle : cellStyle,
          isHeader ? "fg/default" : "fg/default"
        );
        row.appendChild(cell);
        if (col.fill) {
          cell.layoutSizingHorizontal = "FILL";
        } else {
          // Text nodes ignore resize() while textAutoResize is
          // WIDTH_AND_HEIGHT (the default) — switch to auto-height-only
          // first so a manual fixed width actually takes.
          cell.textAutoResize = "HEIGHT";
          cell.resize(col.width, cell.height);
          cell.layoutSizingHorizontal = "FIXED";
          if (Math.round(cell.width) !== col.width) {
            throw new Error(`"${cell.name}" cell did not take fixed width ${col.width} (got ${cell.width}).`);
          }
        }
      }

      const expected = COLUMNS.length + 1;
      if (row.children.length !== expected) {
        throw new Error(`"${name}" should have ${expected} children but has ${row.children.length}.`);
      }

      return row;
    }

    const tableFrame = figma.createFrame();
    tableFrame.name = "Table";
    tableFrame.layoutMode = "VERTICAL";
    tableFrame.primaryAxisSizingMode = "AUTO";
    tableFrame.counterAxisSizingMode = "FIXED";
    tableFrame.resize(TABLE_WIDTH, tableFrame.height);
    tableFrame.itemSpacing = 0;
    tableFrame.paddingLeft = 0;
    tableFrame.paddingRight = 0;
    tableFrame.paddingTop = 0;
    tableFrame.paddingBottom = 0;
    tableFrame.clipsContent = true;
    tableFrame.cornerRadius = 10;
    bindCornerRadius(tableFrame, need(prim, "radius/lg"));
    tableFrame.strokeWeight = 1;
    bindStrokeWeight(tableFrame, need(prim, "border-width/1"));
    bindStroke(tableFrame, need(sem, "border/default"));
    bindFill(tableFrame, need(sem, "bg/default"));

    const headerRow = await makeTableRow("Header Row", true, []);
    tableFrame.appendChild(headerRow);
    headerRow.layoutSizingHorizontal = "FILL";

    for (let i = 0; i < ROWS.length; i++) {
      const dataRow = await makeTableRow(`Row ${i + 1}`, false, ROWS[i]);
      tableFrame.appendChild(dataRow);
      dataRow.layoutSizingHorizontal = "FILL";

      const divider = figma.createRectangle();
      divider.name = "Divider";
      divider.resize(TABLE_WIDTH, 1);
      bindFill(divider, need(sem, "border/default"));
      tableFrame.appendChild(divider);
      divider.layoutSizingHorizontal = "FILL";
    }

    // Header row + (data row + trailing divider) for every row, including
    // the last — a bottom divider under the final row is fine visually
    // since the whole table already has its own outer border.
    const expectedTableChildren = 1 + ROWS.length * 2;
    if (tableFrame.children.length !== expectedTableChildren) {
      throw new Error(`"Table" should have ${expectedTableChildren} children but has ${tableFrame.children.length}.`);
    }

    // ---- Footer ----
    const footer = figma.createFrame();
    footer.name = "Footer";
    footer.layoutMode = "HORIZONTAL";
    footer.primaryAxisSizingMode = "FIXED";
    footer.counterAxisSizingMode = "AUTO";
    footer.primaryAxisAlignItems = "SPACE_BETWEEN";
    footer.counterAxisAlignItems = "CENTER";
    footer.resize(TABLE_WIDTH, footer.height);
    footer.paddingLeft = 0;
    footer.paddingRight = 0;
    footer.paddingTop = 0;
    footer.paddingBottom = 0;
    footer.fills = [];

    const selectionText = await makeText("SelectionCount", "0 of 3 row(s) selected.", cellStyle, "fg/muted");
    footer.appendChild(selectionText);

    const pager = figma.createFrame();
    pager.name = "Pager";
    pager.layoutMode = "HORIZONTAL";
    pager.primaryAxisSizingMode = "AUTO";
    pager.counterAxisSizingMode = "AUTO";
    pager.itemSpacing = 8;
    bindScalar(pager, "itemSpacing", need(prim, "spacing/2"));
    pager.paddingLeft = 0;
    pager.paddingRight = 0;
    pager.paddingTop = 0;
    pager.paddingBottom = 0;
    pager.fills = [];
    const prevButton = await makePillButton("Previous");
    const nextButton = await makePillButton("Next");
    pager.appendChild(prevButton);
    pager.appendChild(nextButton);
    footer.appendChild(pager);

    if (footer.children.length !== 2) {
      throw new Error(`"Footer" should have 2 children (SelectionCount, Pager) but has ${footer.children.length}.`);
    }

    // ---- Root ----
    const root = figma.createComponent();
    root.name = NAME;
    root.layoutMode = "VERTICAL";
    root.primaryAxisSizingMode = "AUTO";
    root.counterAxisSizingMode = "FIXED";
    root.resize(TABLE_WIDTH, root.height);
    root.itemSpacing = 16;
    bindScalar(root, "itemSpacing", need(prim, "spacing/4"));
    root.paddingLeft = 0;
    root.paddingRight = 0;
    root.paddingTop = 0;
    root.paddingBottom = 0;
    root.fills = [];

    root.appendChild(toolbar);
    toolbar.layoutSizingHorizontal = "FILL";
    root.appendChild(tableFrame);
    tableFrame.layoutSizingHorizontal = "FILL";
    root.appendChild(footer);
    footer.layoutSizingHorizontal = "FILL";

    if (root.children.length !== 3) {
      throw new Error(`"${NAME}" should have 3 children (Toolbar, Table, Footer) but has ${root.children.length}.`);
    }

    const existingCount = figma.currentPage.children.filter(
      (n) => n.type === "COMPONENT" || n.type === "COMPONENT_SET"
    ).length;
    root.x = (existingCount - 1) * 800;
    root.y = 4200;

    const showToolbarKey = root.addComponentProperty("Show Toolbar", "BOOLEAN", true);
    toolbar.componentPropertyReferences = { visible: showToolbarKey };

    console.log("[Data Table] Verification report:", {
      childCount: root.children.length,
      tableChildCount: tableFrame.children.length,
      checkboxPlaceholdersCreated: ROWS.length + 1,
      headerFillBound: !!(headerRow.fills[0] && headerRow.fills[0].boundVariables && headerRow.fills[0].boundVariables.color),
    });

    const summary = `"${NAME}" created — 1 component (no documented variant axis), 1 boolean prop (Show Toolbar), ${ROWS.length + 1} checkbox placeholder chips. All bindings verified.`;
    console.log(summary);
    figma.notify(summary, { timeout: 6000 });
  } catch (err) {
    console.error("[Data Table] Fatal error:", err);
    figma.notify(`Data Table script failed: ${err.message}`, { error: true, timeout: 8000 });
  }
})();
