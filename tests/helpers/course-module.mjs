import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

export function loadCourseModule() {
  const cache = new Map();
  function load(url) {
    if (cache.has(url.href)) return cache.get(url.href);
    const record = { exports: {} };
    cache.set(url.href, record.exports);
    const output = ts.transpileModule(readFileSync(url, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(output, {
      module: record, exports: record.exports, Object, Set, Error,
      require: (name) => {
        if (!name.startsWith(".")) throw new Error(`Unexpected course dependency: ${name}`);
        return load(new URL(`${name}.ts`, url));
      },
    }, { filename: url.pathname });
    return record.exports;
  }
  return load(new URL("../../data/course-content/index.ts", import.meta.url));
}
