import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workspaceUrl = new URL("../app/learning-workspace.tsx", import.meta.url);
const graphUrl = new URL("../app/knowledge-graph.tsx", import.meta.url);
const layoutUrl = new URL("../app/layout.tsx", import.meta.url);
const cssUrl = new URL("../app/globals.css", import.meta.url);

test("provides deep-linked learning workspace views and lazy heavy panels", async () => {
  const page = await readFile(workspaceUrl, "utf8");

  assert.match(page, /type WorkspaceView = "learn" \| "lab" \| "map" \| "notes"/);
  assert.match(page, /href=\{`#\$\{view\.id\}`\}/);
  assert.match(page, /workspaceViewFromHash\(window\.location\.hash\)/);
  assert.match(page, /openedViews\.includes\("map"\) && <DynamicKnowledgeGraph/);
  assert.match(page, /openedViews\.includes\("lab"\) && <StableSandbox/);
  assert.match(page, /hidden=\{activeView !== "learn"\}/);
});

test("loads React Flow only after the graph view is requested", async () => {
  const [page, graph] = await Promise.all([
    readFile(workspaceUrl, "utf8"),
    readFile(graphUrl, "utf8"),
  ]);

  assert.doesNotMatch(page, /from "@xyflow\/react"/);
  assert.doesNotMatch(page, /@xyflow\/react\/dist\/style\.css/);
  assert.match(page, /dynamic<KnowledgeGraphProps>/);
  assert.match(page, /\(\) => import\("\.\/knowledge-graph"\)/);
  assert.match(page, /\{ ssr: false, loading: KnowledgeGraphLoading \}/);
  assert.match(graph, /from "@xyflow\/react"/);
  assert.match(graph, /import "@xyflow\/react\/dist\/style\.css"/);
  assert.match(graph, /<ReactFlowProvider>/);
  assert.match(graph, /function GraphDocumentExport\(\)/);
});

test("keeps search modal focus contained and restores the opener", async () => {
  const page = await readFile(workspaceUrl, "utf8");

  assert.match(page, /searchReturnFocusRef\.current = document\.activeElement/);
  assert.match(page, /searchReturnFocusRef\.current\?\.focus\(\)/);
  assert.match(page, /event\.key !== "Tab"/);
  assert.match(page, /last\.focus\(\)/);
  assert.match(page, /first\.focus\(\)/);
  assert.match(page, /inert=\{searchOpen \? true : undefined\}/);
  assert.match(page, /hidden=\{!searchOpen\}/);
});

test("adds skip navigation, mobile chapter selection, and persistent paging", async () => {
  const [layout, page, css] = await Promise.all([
    readFile(layoutUrl, "utf8"),
    readFile(workspaceUrl, "utf8"),
    readFile(cssUrl, "utf8"),
  ]);

  assert.match(layout, /className="skip-link" href="#main-content"/);
  assert.match(layout, /id="main-content" tabIndex=\{-1\}/);
  assert.match(page, /id="mobile-chapter-select"/);
  assert.match(page, /className="mobile-lesson-pager glass"/);
  assert.match(css, /\.mobile-lesson-pager\{[\s\S]*?position:fixed/);
  assert.match(css, /bottom:max\(12px,env\(safe-area-inset-bottom\)\)/);
  assert.match(css, /@media\(pointer:coarse\)/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});
