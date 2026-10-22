# Third-Party Content Notices

Blinga Coding 的课程正文、代码示例、测试数据和练习为独立创作内容，随项目采用 MIT License。以下资料仅用于核对事实、语言版本和课程覆盖范围，未复制其教程正文、插图、截图或课程结构。

## Python Documentation

- Source: https://docs.python.org/3.12/
- Revision: Python 3.12 documentation
- Copyright: Python Software Foundation
- License: PSF License Agreement 2.0；文档中的代码示例另可按 0BSD 使用
- License: https://docs.python.org/3.12/license.html
- Usage: fact reference only

## MDN Web Docs

- Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide
- Revision: JavaScript Guide page revision dated 2025-11-07
- Attribution: Mozilla Contributors
- License: CC BY-SA 2.5 or later for prose; code samples generally CC0
- License: https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Attrib_copyright_license
- Usage: fact reference only; no MDN prose, examples, screenshots, or page structure were copied or adapted

## Java Language Specification

- Source: https://docs.oracle.com/javase/specs/jls/se17/html/
- Revision: Java SE 17
- Copyright: Oracle and/or its affiliates
- Legal terms: https://www.oracle.com/legal/terms.html
- Usage: reference only; specification text, tables, and examples were not imported

## cppreference

- Source: https://en.cppreference.com/w/cpp
- License: CC BY-SA 3.0 and GFDL
- License: https://en.cppreference.com/w/Cppreference:Copyright/CC-BY-SA
- Usage: external reading links only; text, tables, and code were not imported

## Exercism Language Tracks

The repositories below are licensed under MIT. They were used only to audit topic coverage. Exercises, tests, and explanations were not copied.

| Track | Repository | Reviewed commit |
| --- | --- | --- |
| Python | https://github.com/exercism/python | `6105f6d9d3ef66ce3d5c8f529d2882af3d76b706` |
| JavaScript | https://github.com/exercism/javascript | `ff04f35158cdf61eebfdf18a774010495a1fd6d9` |
| Java | https://github.com/exercism/java | `8a16b1bb7fe63ab57bc57789e3fcce34063a7371` |
| C++ | https://github.com/exercism/cpp | `c45e4c6545a7d731f3bb13a78ce758bed64e9995` |

Each repository's MIT license is available from its `LICENSE` file.

## 2026-10-22 curriculum expansion

新增 28 节独立编写的课程：TypeScript 和 Go 各 10 节；Python、JavaScript、Java、C++ 各 2 节。正文、代码、练习和测试数据沿用项目 MIT；下列第三方资料仅用于事实核对，不导入或翻译其正文与示例。完整逐页登记见 `data/course-content/index.ts` 的 `contentSources` 与每节 `sourceRefs`。

- TypeScript Handbook：Microsoft and TypeScript contributors，网站文档为 **CC BY 4.0**，不是编译器项目的 Apache 2.0 许可证。许可证：https://github.com/microsoft/TypeScript-Website/blob/v2/LICENSE 。2026-10-22 核对 Everyday Types、Narrowing、More on Functions、Generics、Classes、Utility Types；示例限定为 TypeScript 5.6。
- Go Specification、Effective Go 与 errors 包：The Go Authors，**BSD-3-Clause**，许可证：https://go.dev/LICENSE 。errors 固定到 https://pkg.go.dev/errors@go1.23.5 ；官网动态参考于 2026-10-22 核对，课程仅使用 Go 1.23 已支持的功能。
- Python 3.12 itertools 与 json：https://docs.python.org/3.12/library/itertools.html 、https://docs.python.org/3.12/library/json.html ，沿用上文 PSF/0BSD 说明，仅核对协议与编码行为。
- MDN Map 与 JSON：https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map 、https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON ，Mozilla Contributors，沿用上文 CC BY-SA 事实参考说明，未改编内容。
- Java 17 Stream 与 Optional：https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/stream/package-summary.html 、https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Optional.html ，Oracle 参考资料，仅核对 API 行为，不复制正文。
- C++ Lambda 与 optional 的 cppreference 链接仍只作为外部延伸阅读，不导入任何正文、表格或代码。

## Sources intentionally not used

No content was imported from W3Schools, GeeksforGeeks, Programiz, 菜鸟教程, CSDN, 博客园, 知乎, OpenStax, paid courses, books, video transcripts, search result pages, or repositories with unclear licensing.
