import { languageOrder, type Lang } from "../languages";
export { languageOrder, type Lang } from "../languages";

export type SourceUsage = "fact_reference" | "external_reading" | "coverage_audit";

export type ContentSource = {
  id: string;
  sourceName: string;
  sourceUrl: string;
  sourceRevision: string;
  license: string;
  licenseUrl: string;
  usageType: SourceUsage;
  modified: boolean;
  modificationSummary: string;
  retrievedAt: string;
  attribution?: string;
};

export type LessonExercise = {
  level: "初级" | "进阶" | "挑战";
  title: string;
  prompt: string;
  verification: string;
};

export type LessonGuide = {
  summary: string;
  principles: Array<{ badge: string; title: string; text: string }>;
  syntaxTitle: string;
  syntaxCode: string;
  syntaxNote: string;
  pitfalls: Array<{ title: string; wrong: string; right: string }>;
};

export type Course = {
  icon: string;
  color: string;
  topics: string[];
  title: string;
  kicker: string;
  desc: string;
  code: string;
  output: string;
};

export type CourseLesson = Course & {
  id: string;
  topic: string;
  objectives: string[];
  prerequisites: string[];
  mentalModel: string;
  concepts: Array<{ title: string; text: string }>;
  steps: string[];
  commonErrors: Array<{ title: string; symptom: string; fix: string }>;
  debugging: string[];
  exercises: LessonExercise[];
  summaryPoints: string[];
  furtherReading: Array<{ label: string; url: string }>;
  sourceRefs: string[];
  contentLicense: "MIT";
  lastReviewedAt: string;
  reviewedLanguageVersion: string;
  judge: { stdin: string; expected: string };
};

export type CourseDefinition = {
  slug: "python" | "c-cpp" | "javascript" | "java" | "typescript" | "go";
  name: Lang;
  queryName: Lang;
  icon: string;
  color: string;
  description: string;
  lessons: CourseLesson[];
};

const reviewedAt = "2026-10-21";

export const contentSources: ContentSource[] = [
  {
    id: "python-docs",
    sourceName: "Python 3.12 Documentation",
    sourceUrl: "https://docs.python.org/3.12/",
    sourceRevision: "Python 3.12 documentation",
    license: "PSF License Agreement 2.0; documentation code examples also available under 0BSD",
    licenseUrl: "https://docs.python.org/3.12/license.html",
    usageType: "fact_reference",
    modified: false,
    modificationSummary: "仅用于核对语言事实、标准库行为和课程覆盖范围；课程正文与示例均为原创。",
    retrievedAt: reviewedAt,
    attribution: "Python Software Foundation",
  },
  {
    id: "mdn-js",
    sourceName: "MDN Web Docs — JavaScript Guide",
    sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
    sourceRevision: "JavaScript Guide page revision dated 2025-11-07",
    license: "CC BY-SA 2.5 or later for prose; code samples generally CC0",
    licenseUrl: "https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Attrib_copyright_license",
    usageType: "fact_reference",
    modified: false,
    modificationSummary: "仅核对 ECMAScript 与 Web API 事实；没有复制或改编 MDN 正文、示例或页面结构。",
    retrievedAt: reviewedAt,
    attribution: "Mozilla Contributors",
  },
  {
    id: "java-language",
    sourceName: "Java Language Specification, Java SE 17 Edition",
    sourceUrl: "https://docs.oracle.com/javase/specs/jls/se17/html/",
    sourceRevision: "Java SE 17",
    license: "Oracle legal notices; reference use only",
    licenseUrl: "https://www.oracle.com/legal/terms.html",
    usageType: "fact_reference",
    modified: false,
    modificationSummary: "仅用于核对语言规则；不导入规范正文、表格或示例。",
    retrievedAt: reviewedAt,
    attribution: "Oracle and/or its affiliates",
  },
  {
    id: "cppreference",
    sourceName: "cppreference.com",
    sourceUrl: "https://en.cppreference.com/w/cpp",
    sourceRevision: "live reference as retrieved on 2026-10-21",
    license: "CC BY-SA 3.0 and GFDL",
    licenseUrl: "https://en.cppreference.com/w/Cppreference:Copyright/CC-BY-SA",
    usageType: "external_reading",
    modified: false,
    modificationSummary: "仅作为外部延伸阅读链接；没有复制正文、表格或代码。",
    retrievedAt: reviewedAt,
    attribution: "cppreference contributors",
  },
  {
    id: "exercism-python",
    sourceName: "Exercism Python Track",
    sourceUrl: "https://github.com/exercism/python",
    sourceRevision: "6105f6d9d3ef66ce3d5c8f529d2882af3d76b706",
    license: "MIT",
    licenseUrl: "https://github.com/exercism/python/blob/main/LICENSE",
    usageType: "coverage_audit",
    modified: false,
    modificationSummary: "仅比较知识覆盖范围；没有复制练习、测试或讲解。",
    retrievedAt: reviewedAt,
  },
  {
    id: "exercism-javascript",
    sourceName: "Exercism JavaScript Track",
    sourceUrl: "https://github.com/exercism/javascript",
    sourceRevision: "ff04f35158cdf61eebfdf18a774010495a1fd6d9",
    license: "MIT",
    licenseUrl: "https://github.com/exercism/javascript/blob/main/LICENSE",
    usageType: "coverage_audit",
    modified: false,
    modificationSummary: "仅比较知识覆盖范围；没有复制练习、测试或讲解。",
    retrievedAt: reviewedAt,
  },
  {
    id: "exercism-java",
    sourceName: "Exercism Java Track",
    sourceUrl: "https://github.com/exercism/java",
    sourceRevision: "8a16b1bb7fe63ab57bc57789e3fcce34063a7371",
    license: "MIT",
    licenseUrl: "https://github.com/exercism/java/blob/main/LICENSE",
    usageType: "coverage_audit",
    modified: false,
    modificationSummary: "仅比较知识覆盖范围；没有复制练习、测试或讲解。",
    retrievedAt: reviewedAt,
  },
  {
    id: "exercism-cpp",
    sourceName: "Exercism C++ Track",
    sourceUrl: "https://github.com/exercism/cpp",
    sourceRevision: "c45e4c6545a7d731f3bb13a78ce758bed64e9995",
    license: "MIT",
    licenseUrl: "https://github.com/exercism/cpp/blob/main/LICENSE",
    usageType: "coverage_audit",
    modified: false,
    modificationSummary: "仅比较知识覆盖范围；没有复制练习、测试或讲解。",
    retrievedAt: reviewedAt,
  },
];

contentSources.push(
{
  "id": "ts-basics",
  "sourceName": "TypeScript Handbook — Everyday Types",
  "sourceUrl": "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html",
  "sourceRevision": "Handbook retrieved 2026-10-22; examples target TypeScript 5.6",
  "license": "CC BY 4.0",
  "licenseUrl": "https://github.com/microsoft/TypeScript-Website/blob/v2/LICENSE",
  "usageType": "fact_reference",
  "modified": false,
  "modificationSummary": "仅核对语言规则，不复制或翻译原文与示例；本课程的讲解、代码和练习独立编写。",
  "retrievedAt": "2026-10-22",
  "attribution": "Microsoft and TypeScript contributors"
},
{
  "id": "ts-narrowing",
  "sourceName": "TypeScript Handbook — Narrowing",
  "sourceUrl": "https://www.typescriptlang.org/docs/handbook/2/narrowing.html",
  "sourceRevision": "Handbook retrieved 2026-10-22; examples target TypeScript 5.6",
  "license": "CC BY 4.0",
  "licenseUrl": "https://github.com/microsoft/TypeScript-Website/blob/v2/LICENSE",
  "usageType": "fact_reference",
  "modified": false,
  "modificationSummary": "仅核对语言规则，不复制或翻译原文与示例；本课程的讲解、代码和练习独立编写。",
  "retrievedAt": "2026-10-22",
  "attribution": "Microsoft and TypeScript contributors"
},
{
  "id": "ts-functions",
  "sourceName": "TypeScript Handbook — More on Functions",
  "sourceUrl": "https://www.typescriptlang.org/docs/handbook/2/functions.html",
  "sourceRevision": "Handbook retrieved 2026-10-22; examples target TypeScript 5.6",
  "license": "CC BY 4.0",
  "licenseUrl": "https://github.com/microsoft/TypeScript-Website/blob/v2/LICENSE",
  "usageType": "fact_reference",
  "modified": false,
  "modificationSummary": "仅核对语言规则，不复制或翻译原文与示例；本课程的讲解、代码和练习独立编写。",
  "retrievedAt": "2026-10-22",
  "attribution": "Microsoft and TypeScript contributors"
},
{
  "id": "ts-generics",
  "sourceName": "TypeScript Handbook — Generics",
  "sourceUrl": "https://www.typescriptlang.org/docs/handbook/2/generics.html",
  "sourceRevision": "Handbook retrieved 2026-10-22; examples target TypeScript 5.6",
  "license": "CC BY 4.0",
  "licenseUrl": "https://github.com/microsoft/TypeScript-Website/blob/v2/LICENSE",
  "usageType": "fact_reference",
  "modified": false,
  "modificationSummary": "仅核对语言规则，不复制或翻译原文与示例；本课程的讲解、代码和练习独立编写。",
  "retrievedAt": "2026-10-22",
  "attribution": "Microsoft and TypeScript contributors"
},
{
  "id": "ts-classes",
  "sourceName": "TypeScript Handbook — Classes",
  "sourceUrl": "https://www.typescriptlang.org/docs/handbook/2/classes.html",
  "sourceRevision": "Handbook retrieved 2026-10-22; examples target TypeScript 5.6",
  "license": "CC BY 4.0",
  "licenseUrl": "https://github.com/microsoft/TypeScript-Website/blob/v2/LICENSE",
  "usageType": "fact_reference",
  "modified": false,
  "modificationSummary": "仅核对语言规则，不复制或翻译原文与示例；本课程的讲解、代码和练习独立编写。",
  "retrievedAt": "2026-10-22",
  "attribution": "Microsoft and TypeScript contributors"
},
{
  "id": "ts-utilities",
  "sourceName": "TypeScript Handbook — Utility Types",
  "sourceUrl": "https://www.typescriptlang.org/docs/handbook/utility-types.html",
  "sourceRevision": "Handbook retrieved 2026-10-22; examples target TypeScript 5.6",
  "license": "CC BY 4.0",
  "licenseUrl": "https://github.com/microsoft/TypeScript-Website/blob/v2/LICENSE",
  "usageType": "fact_reference",
  "modified": false,
  "modificationSummary": "仅核对语言规则，不复制或翻译原文与示例；本课程的讲解、代码和练习独立编写。",
  "retrievedAt": "2026-10-22",
  "attribution": "Microsoft and TypeScript contributors"
},
{
  "id": "go-spec",
  "sourceName": "Go Language Specification",
  "sourceUrl": "https://go.dev/ref/spec",
  "sourceRevision": "Reference retrieved 2026-10-22; only features available in Go 1.23 used",
  "license": "BSD-3-Clause",
  "licenseUrl": "https://go.dev/LICENSE",
  "usageType": "fact_reference",
  "modified": false,
  "modificationSummary": "仅核对语言规则，不复制或翻译原文与示例；本课程的讲解、代码和练习独立编写。",
  "retrievedAt": "2026-10-22",
  "attribution": "The Go Authors"
},
{
  "id": "go-effective",
  "sourceName": "Effective Go",
  "sourceUrl": "https://go.dev/doc/effective_go",
  "sourceRevision": "Reference retrieved 2026-10-22; only features available in Go 1.23 used",
  "license": "BSD-3-Clause",
  "licenseUrl": "https://go.dev/LICENSE",
  "usageType": "fact_reference",
  "modified": false,
  "modificationSummary": "仅核对语言规则，不复制或翻译原文与示例；本课程的讲解、代码和练习独立编写。",
  "retrievedAt": "2026-10-22",
  "attribution": "The Go Authors"
},
{
  "id": "go-errors",
  "sourceName": "Go errors package",
  "sourceUrl": "https://pkg.go.dev/errors@go1.23.5",
  "sourceRevision": "go1.23.5",
  "license": "BSD-3-Clause",
  "licenseUrl": "https://go.dev/LICENSE",
  "usageType": "fact_reference",
  "modified": false,
  "modificationSummary": "仅核对语言规则，不复制或翻译原文与示例；本课程的讲解、代码和练习独立编写。",
  "retrievedAt": "2026-10-22",
  "attribution": "The Go Authors"
},
);

// Concrete references inherit the verified license record, not its retrieval date.
for (const [id, parentId, sourceName, sourceUrl, sourceRevision] of [["python-iterators","python-docs","Python — itertools","https://docs.python.org/3.12/library/itertools.html","Python 3.12"],["python-json","python-docs","Python — json","https://docs.python.org/3.12/library/json.html","Python 3.12"],["js-map","mdn-js","MDN — Map","https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map","Retrieved 2026-10-22; ECMAScript 2023"],["js-json","mdn-js","MDN — JSON","https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON","Retrieved 2026-10-22; ECMAScript 2023"],["java-stream","java-language","Java — Stream API","https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/stream/package-summary.html","Java SE 17"],["java-optional","java-language","Java — Optional","https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Optional.html","Java SE 17"]]) {
  const parent = contentSources.find((source) => source.id === parentId)!;
  contentSources.push({ ...parent, id, sourceName, sourceUrl, sourceRevision, retrievedAt: "2026-10-22" });
}

type LessonSeed = {
  id: string;
  topic: string;
  title: string;
  category: string;
  desc: string;
  code: string;
  output: string;
  mentalModel: string;
  concepts: [string, string, string];
  errors: [string, string, string];
  sourceRefs: string[];
  version: string;
  objectives?: string[];
  prerequisites?: string[];
  steps?: string[];
  fixes?: [string, string, string];
  debugging?: string[];
  exercises?: LessonExercise[];
  summaryPoints?: string[];
  reviewedAt?: string;
};

const icons: Record<Lang, { icon: string; color: string }> = {
  Python: { icon: "Py", color: "#58e6ba" },
  "C/C++": { icon: "C+", color: "#9ca8ff" },
  JavaScript: { icon: "JS", color: "#ffd36a" },
  Java: { icon: "Jv", color: "#ff9677" },
  TypeScript: { icon: "TS", color: "#78b9ed" },
  Go: { icon: "Go", color: "#6dd6dd" },
};

function makeLesson(language: Lang, index: number, seed: LessonSeed): CourseLesson {
  const visual = icons[language];
  const concepts = seed.concepts.map((text, conceptIndex) => ({
    title: ["执行规则", "数据变化", "边界意识"][conceptIndex],
    text,
  }));
  return {
    ...visual,
    topics: [],
    id: seed.id,
    topic: seed.topic,
    title: seed.title,
    kicker: `${language} · ${seed.category} · 第 ${String(index + 1).padStart(2, "0")} 节`,
    desc: seed.desc,
    code: seed.code,
    output: seed.output,
    objectives: seed.objectives ?? [
      `能用自己的话解释“${seed.topic}”解决的问题`,
      `能阅读并运行本节的完整 ${language} 示例`,
      "能识别常见边界条件，并用输出或调试信息验证结果",
    ],
    prerequisites: seed.prerequisites ?? (index === 0 ? ["会使用键盘与浏览器", "不要求编程经验"] : ["完成上一节或具备等价知识", "能运行并修改一个短程序"]),
    mentalModel: seed.mentalModel,
    concepts,
    steps: seed.steps ?? ["确认输入数据及其类型", "沿执行顺序观察状态变化", "将实际输出与预期输出逐行比较"],
    commonErrors: seed.errors.map((error, errorIndex) => ({
      title: ["语义误解", "边界遗漏", "验证不足"][errorIndex],
      symptom: error,
      fix: (seed.fixes ?? ["先写出最小示例，再逐步增加逻辑。", "补充空值、零长度和极端输入测试。", "不要只看程序是否运行，要核对输出与状态变化。"])[errorIndex],
    })),
    debugging: seed.debugging ?? ["先复现最小失败输入，并记录实际值与预期值。", "在关键分支前后输出状态；定位后删除临时日志并补充测试。"],
    exercises: seed.exercises ?? [
      { level: "初级", title: "复现主示例", prompt: `独立输入并运行“${seed.topic}”示例，再修改一个数据值。`, verification: `输出结构应与“${seed.output.replace(/\n/g, " / ")}”一致。` },
      { level: "进阶", title: "处理边界输入", prompt: "为示例增加空数据或无效输入处理，保证程序给出明确结果。", verification: "至少验证一个正常输入和两个边界输入。" },
      { level: "挑战", title: "封装可复用方案", prompt: "把核心逻辑封装为接口清晰、无隐藏副作用的可复用单元。", verification: "调用方只需提供输入即可得到结果，并能单独测试核心逻辑。" },
    ],
    summaryPoints: seed.summaryPoints ?? [`${seed.topic}的核心是明确输入、状态变化和输出。`, "语法只是表达工具，正确的边界处理和验证同样重要。", "遇到错误时先缩小问题，再检查类型、控制流和资源生命周期。"],
    furtherReading: seed.sourceRefs.map((sourceId) => {
      const source = contentSources.find((item) => item.id === sourceId);
      return { label: source?.sourceName || sourceId, url: source?.sourceUrl || "https://example.com" };
    }),
    sourceRefs: seed.sourceRefs,
    contentLicense: "MIT",
    lastReviewedAt: seed.reviewedAt ?? reviewedAt,
    reviewedLanguageVersion: seed.version,
    judge: { stdin: seed.output.startsWith("你好，学习者") ? "学习者\n" : "", expected: seed.output },
  };
}

const pythonSeeds: LessonSeed[] = [
  { id: "python-01", topic: "快速入门", title: "Python 与运行环境", category: "入门基础", desc: "从解释器、脚本文件和标准输入输出开始，建立编写、运行、观察结果的可靠反馈循环。", code: `name = input()\nprint(f"你好，{name}！")\nprint("欢迎来到 Blinga coding")`, output: "你好，学习者！\n欢迎来到 Blinga coding", mentalModel: "解释器像一位按顺序执行指令的读者：先解析当前语句，再改变程序状态。", concepts: ["脚本从上到下执行，异常会中断当前执行路径。", "input 返回字符串，print 负责把值格式化到标准输出。", "环境与代码分离，先确认解释器版本再排查语法。"], errors: ["把交互提示当成返回值使用。", "混用制表符和空格导致缩进错误。", "运行了错误目录中的同名文件。"], sourceRefs: ["python-docs", "exercism-python"], version: "Python 3.12" },
  { id: "python-02", topic: "变量与类型", title: "Python 变量与数据类型", category: "入门基础", desc: "理解名称绑定、整数、浮点数、字符串、布尔值与显式类型转换，并观察动态类型在运行时的表现。", code: `name = "Lin"\nage = 18\nscore = 92.5\nis_passed = score >= 60\nprint(type(name), type(age))\nprint(f"{name} 的成绩：{score}，通过：{is_passed}")`, output: "<class 'str'> <class 'int'>\nLin 的成绩：92.5，通过：True", mentalModel: "变量是指向对象的名称标签，而不是固定类型的盒子。", concepts: ["赋值把名称绑定到对象，重新赋值会改变绑定。", "运算结果由参与对象的类型和协议决定。", "外部输入默认是字符串，转换失败应显式处理。"], errors: ["用字符串和整数直接相加。", "用浮点数精确表示货币。", "误把 == 写成赋值语句的思维模型。"], sourceRefs: ["python-docs", "exercism-python"], version: "Python 3.12" },
  { id: "python-03", topic: "条件判断", title: "Python 条件判断", category: "入门基础", desc: "使用 if、elif、else、比较运算和布尔逻辑，根据互斥规则选择唯一执行路径。", code: `score = 86\nif score >= 90:\n    level = "优秀"\nelif score >= 60:\n    level = "合格"\nelse:\n    level = "需要复习"\nprint(level)`, output: "合格", mentalModel: "条件链像从上到下排列的闸门，第一个满足条件的分支会截住执行流。", concepts: ["if 判断真值，elif 只在前面分支未命中时检查。", "范围规则应从更具体或更严格的条件开始。", "复杂条件可先拆成有意义的布尔变量。"], errors: ["把 >= 90 的分支放在 >= 60 后面。", "使用 is 比较普通数值或字符串内容。", "遗漏边界值 60、90 的测试。"], sourceRefs: ["python-docs"], version: "Python 3.12" },
  { id: "python-04", topic: "循环结构", title: "Python 循环结构", category: "核心语法", desc: "用 for、while、range、break 与 continue 表达遍历和重复，并通过累加器完成成绩统计。", code: `scores = [86, 92, 74, 100, 65]\ntotal = 0\nfor score in scores:\n    total += score\naverage = total / len(scores)\nprint(f"平均分：{average:.1f}")`, output: "平均分：83.4", mentalModel: "循环是反复执行的状态转换，每一轮都应让程序更接近终止条件。", concepts: ["for 直接遍历可迭代对象，避免无意义的下标。", "while 适合终止次数未知但条件明确的过程。", "累加前要定义空集合策略，避免除以零。"], errors: ["循环变量未更新形成无限循环。", "range 上界不包含在结果中。", "对空列表直接计算平均值。"], sourceRefs: ["python-docs"], version: "Python 3.12" },
  { id: "python-05", topic: "函数", title: "Python 函数与作用域", category: "核心语法", desc: "通过参数、返回值、默认值、类型标注和局部作用域，把可复用逻辑组织为明确接口。", code: `def calculate_average(scores: list[int]) -> float:\n    if not scores:\n        return 0.0\n    return sum(scores) / len(scores)\nresult = calculate_average([86, 92, 74])\nprint(f"平均分：{result:.1f}")`, output: "平均分：84.0", mentalModel: "函数是一台有输入契约和输出契约的小机器，内部细节不应泄漏给调用方。", concepts: ["参数是局部名称，返回值是函数交付给调用方的结果。", "默认参数在定义时求值，可变默认值会被多次调用共享。", "类型标注帮助阅读和检查，但默认不会在运行时强制。"], errors: ["忘记 return 导致得到 None。", "使用列表作为默认参数。", "函数同时读取和修改过多全局状态。"], sourceRefs: ["python-docs"], version: "Python 3.12" },
  { id: "python-06", topic: "列表与字典", title: "Python 容器：列表、元组、集合与字典", category: "数据结构", desc: "按顺序、唯一性、可变性和键值映射选择合适容器，并使用遍历与推导式转换结构化数据。", code: `students = {"Lin": [86, 92, 74], "Mia": [95, 88, 91]}\nfor name, scores in students.items():\n    average = sum(scores) / len(scores)\n    print(name, round(average, 1))`, output: "Lin 84.0\nMia 91.3", mentalModel: "容器是带约束的数据组织方式：先确定访问模式，再决定用哪种结构。", concepts: ["列表有序可变，元组有序且通常表达固定记录。", "集合强调唯一成员，字典通过可哈希键定位值。", "推导式适合简洁转换，不适合隐藏复杂副作用。"], errors: ["遍历字典时误以为直接得到键和值。", "修改正在遍历的集合长度。", "用可变列表作为字典键。"], sourceRefs: ["python-docs", "exercism-python"], version: "Python 3.12" },
  { id: "python-07", topic: "面向对象", title: "Python 类与面向对象", category: "进阶能力", desc: "用类组织状态与行为，理解构造方法、实例属性、方法、封装、组合和继承的适用边界。", code: `class Student:\n    def __init__(self, name: str, scores: list[int]):\n        self.name = name\n        self.scores = scores\n    def average(self) -> float:\n        return sum(self.scores) / len(self.scores)\nstudent = Student("Lin", [86, 92, 74])\nprint(student.name, student.average())`, output: "Lin 84.0", mentalModel: "对象把相关状态与操作放在同一边界内，类描述这些对象共同遵循的协议。", concepts: ["self 指向当前实例，实例属性属于具体对象。", "组合通常比深层继承更容易理解和测试。", "封装的目标是保护约束，不是机械地添加 getter。"], errors: ["方法定义遗漏 self。", "把实例可变状态放在类属性中。", "为了复用少量代码建立复杂继承层级。"], sourceRefs: ["python-docs"], version: "Python 3.12" },
  { id: "python-08", topic: "文件与异常", title: "Python 文件与异常处理", category: "可靠性", desc: "使用上下文管理器读写资源，并用 try、except、else、finally 建立可预测的失败路径。", code: `from io import StringIO\nsource = StringIO("Lin,92\\nMia,88\\n")\ntotal = 0\ntry:\n    for line in source:\n        _, score = line.strip().split(",")\n        total += int(score)\nexcept (ValueError, TypeError) as error:\n    print(f"数据错误：{error}")\nelse:\n    print(f"总分：{total}")`, output: "总分：180", mentalModel: "文件是需要按时释放的资源，异常是从失败点向调用方传递的结构化信号。", concepts: ["with 会在离开代码块时关闭资源，即使发生异常。", "只捕获能处理的具体异常，并保留足够上下文。", "else 表示主操作成功，finally 表示无论结果都要清理。"], errors: ["使用 except Exception 静默吞掉所有错误。", "忘记指定文本编码。", "读取全部大文件造成内存压力。"], sourceRefs: ["python-docs"], version: "Python 3.12" },
  { id: "python-09", topic: "模块与包", title: "Python 模块与包", category: "工程组织", desc: "理解模块导入、包目录、命名空间和依赖边界，把程序拆成职责单一且可复用的文件。", code: `from statistics import mean\nscores = [86, 92, 74]\nprint(f"平均分：{mean(scores):.1f}")`, output: "平均分：84.0", mentalModel: "模块是可加载的命名空间，包是组织相关模块并明确公共接口的边界。", concepts: ["import 首次加载模块并缓存模块对象。", "绝对导入更清晰，相对导入适合包内部稳定关系。", "入口代码放在 main 守卫下，避免导入时产生副作用。"], errors: ["本地文件名遮蔽标准库模块。", "循环导入导致对象尚未完成初始化。", "依赖未记录导致环境不可复现。"], sourceRefs: ["python-docs"], version: "Python 3.12" },
  { id: "python-10", topic: "调试与测试", title: "Python 调试与基础测试", category: "工程实践", desc: "通过最小复现、断言、日志和单元测试定位失败，并把修复转化为可重复验证的行为。", code: `def normalize_score(value: int) -> int:\n    return max(0, min(100, value))\nassert normalize_score(120) == 100\nassert normalize_score(-5) == 0\nassert normalize_score(86) == 86\nprint("测试通过")`, output: "测试通过", mentalModel: "调试是在假设空间中做实验；测试则把已经确认的行为保存为长期约束。", concepts: ["先稳定复现，再用二分思路缩小可疑范围。", "断言表达程序内部必须成立的条件。", "每个缺陷至少保留一个能在修复前失败的测试。"], errors: ["一次修改多个变量导致无法判断原因。", "只测试正常路径。", "把调试输出永久混入用户输出。"], sourceRefs: ["python-docs", "exercism-python"], version: "Python 3.12" },
];

const javascriptSeeds: LessonSeed[] = [
  { id: "javascript-01", topic: "语言基础", title: "JavaScript 运行环境与语言基础", category: "入门基础", desc: "区分浏览器与 Node.js 运行环境，理解表达式、函数、对象和控制台输出。", code: `function createGreeting(name) { return \`你好，\${name}！\`; }\nconst learner = { name: "Lin", level: 1 };\nconsole.log(createGreeting(learner.name));\nconsole.log(\`当前等级：\${learner.level}\`);`, output: "你好，Lin！\n当前等级：1", mentalModel: "JavaScript 引擎执行语言代码，宿主环境提供 DOM、文件或网络等额外能力。", concepts: ["ECMAScript 定义语言，浏览器和 Node.js 提供不同宿主 API。", "表达式产生值，语句控制执行。", "严格相等避免隐式转换带来的意外匹配。"], errors: ["在 Node.js 中直接访问 document。", "混淆赋值与比较。", "忽略控制台中的堆栈信息。"], sourceRefs: ["mdn-js", "exercism-javascript"], version: "ECMAScript 2023 / Node.js 20+" },
  { id: "javascript-02", topic: "变量与作用域", title: "JavaScript 变量、类型与作用域", category: "入门基础", desc: "理解 const、let、基本类型、引用值、类型转换、词法作用域和闭包。", code: `function createCounter() {\n  let count = 0;\n  return () => { count += 1; return count; };\n}\nconst next = createCounter();\nconsole.log(next());\nconsole.log(next());`, output: "1\n2", mentalModel: "作用域像嵌套房间，函数能记住创建时可见的外层绑定。", concepts: ["默认使用 const，需要重新绑定时使用 let。", "对象变量保存引用，复制变量不会深拷贝对象。", "闭包保留词法环境，可用于封装私有状态。"], errors: ["依赖隐式类型转换。", "误以为 const 对象不可修改。", "在循环中意外共享可变闭包状态。"], sourceRefs: ["mdn-js"], version: "ECMAScript 2023 / Node.js 20+" },
  { id: "javascript-03", topic: "数组方法", title: "JavaScript 数组与对象", category: "核心语法", desc: "使用数组与对象组织数据，并通过 map、filter、reduce 表达清晰的数据转换流水线。", code: `const scores = [86, 92, 74, 100, 65];\nconst passed = scores.filter(score => score >= 80);\nconst total = passed.reduce((sum, n) => sum + n, 0);\nconsole.log(\`优秀人数：\${passed.length}\`);\nconsole.log(\`优秀组总分：\${total}\`);`, output: "优秀人数：3\n优秀组总分：278", mentalModel: "数组表达有序集合，对象表达命名字段；数组方法把输入集合转换为新集合或单个结果。", concepts: ["map 映射、filter 筛选、reduce 聚合。", "展开语法只进行浅复制。", "不可变更新能减少共享状态带来的意外影响。"], errors: ["reduce 未提供初始值。", "在 map 回调里忘记 return。", "误把浅复制当成深复制。"], sourceRefs: ["mdn-js", "exercism-javascript"], version: "ECMAScript 2023 / Node.js 20+" },
  { id: "javascript-04", topic: "DOM 操作", title: "JavaScript DOM 与事件", category: "浏览器交互", desc: "查询和修改元素、监听事件、处理事件传播，并明确 DOM 只存在于浏览器环境。", code: `const hasDom = typeof document !== "undefined";\nif (hasDom) {\n  const title = document.querySelector("#title");\n  if (title) title.textContent = "Blinga coding 已就绪";\n  console.log(title?.textContent ?? "没有找到 #title");\n} else {\n  console.log("当前为 Node.js 沙盒；浏览器中会修改 #title");\n}`, output: "当前为 Node.js 沙盒；浏览器中会修改 #title", mentalModel: "DOM 是浏览器维护的文档对象树，事件沿树传播并触发已注册的处理器。", concepts: ["查询结果可能为空，操作前要验证元素存在。", "事件委托利用冒泡在共同祖先上处理动态元素。", "文本使用 textContent，避免把不可信输入当 HTML。"], errors: ["脚本执行时元素尚未创建。", "重复注册监听器造成多次响应。", "把用户输入写入 innerHTML。"], sourceRefs: ["mdn-js"], version: "ECMAScript 2023 / modern browsers" },
  { id: "javascript-05", topic: "异步编程", title: "JavaScript Promise 与 async/await", category: "核心能力", desc: "理解任务调度、Promise 状态、async/await 和异常传播，选择顺序或并行执行。", code: `const wait = ms => new Promise(resolve => setTimeout(resolve, ms));\nasync function loadLesson() {\n  await wait(20);\n  return { id: 5, title: "异步编程" };\n}\nloadLesson().then(lesson => console.log(\`\${lesson.id}：\${lesson.title}\`));`, output: "5：异步编程", mentalModel: "异步函数先交出控制权，Promise 代表未来结果，事件循环在合适时机继续后续任务。", concepts: ["await 只暂停当前 async 函数，不阻塞整个线程。", "互不依赖的任务可用 Promise.all 并行等待。", "异步失败必须在 await 的 try/catch 或 Promise 链中处理。"], errors: ["用 forEach 搭配 async 并期待被等待。", "创建 Promise 后没有返回。", "忽略未处理的拒绝。"], sourceRefs: ["mdn-js"], version: "ECMAScript 2023 / Node.js 20+" },
  { id: "javascript-06", topic: "ES6+", title: "现代 JavaScript 与模块化", category: "现代语法", desc: "使用解构、展开、可选链、空值合并和 ES 模块组织清晰边界，同时避免过度压缩表达式。", code: `const student = { name: "Lin", profile: { city: "Shanghai" }, scores: [86, 92] };\nconst { name, scores } = student;\nconst updatedScores = [...scores, 100];\nconst city = student.profile?.city ?? "未知";\nconsole.log(\`\${name} · \${city} · \${updatedScores.join(",")}\`);`, output: "Lin · Shanghai · 86,92,100", mentalModel: "模块是显式导入与导出的依赖边界，现代语法用于更清楚地表达数据关系。", concepts: ["命名导出适合稳定公共接口。", "可选链只处理 null 或 undefined 的访问。", "空值合并不会把 0、false 和空字符串误判为缺失。"], errors: ["混用 CommonJS 与 ES 模块。", "用 || 覆盖合法的零值。", "展开嵌套对象后误以为完全独立。"], sourceRefs: ["mdn-js"], version: "ECMAScript 2023 / Node.js 20+" },
  { id: "javascript-07", topic: "工程化", title: "现代 JavaScript 工程实践", category: "工程实践", desc: "以纯函数、模块边界、静态检查、自动测试和构建流程提高代码的可维护性。", code: `function calculateAverage(values) {\n  if (!Array.isArray(values) || values.length === 0) return 0;\n  return values.reduce((sum, value) => sum + value, 0) / values.length;\n}\nif (calculateAverage([80, 90, 100]) !== 90) throw new Error("平均分测试失败");\nif (calculateAverage([]) !== 0) throw new Error("空数组测试失败");\nconsole.log("✓ 平均分");\nconsole.log("✓ 空数组");`, output: "✓ 平均分\n✓ 空数组", mentalModel: "工程工具把团队约定自动化，让错误尽可能早地在本地和持续集成中暴露。", concepts: ["纯函数更容易测试和组合。", "lint、typecheck、test、build 解决不同层次的问题。", "依赖与构建结果应可重复。"], errors: ["只依赖手工测试。", "构建脚本在不同环境结果不一致。", "工具规则过多却没有团队共识。"], sourceRefs: ["mdn-js", "exercism-javascript"], version: "ECMAScript 2023 / Node.js 20+" },
  { id: "javascript-08", topic: "条件与循环", title: "JavaScript 条件与循环", category: "基础控制", desc: "使用严格比较、逻辑运算、switch、for...of 与 while 构建清晰且可终止的控制流。", code: `const scores = [58, 76, 91];\nlet passed = 0;\nfor (const score of scores) {\n  if (score >= 60) passed += 1;\n}\nconsole.log(\`通过人数：\${passed}\`);`, output: "通过人数：2", mentalModel: "控制流是一张路径图：条件选择分支，循环重复路径，每条路径都要有明确出口。", concepts: ["优先使用 === 与 !==。", "for...of 遍历值，for...in 遍历可枚举键。", "短路运算会返回操作数，不一定返回布尔值。"], errors: ["误用 for...in 遍历数组值。", "while 条件永远不改变。", "switch 分支遗漏 break。"], sourceRefs: ["mdn-js"], version: "ECMAScript 2023 / Node.js 20+" },
  { id: "javascript-09", topic: "对象与类", title: "JavaScript 对象、原型与类", category: "对象模型", desc: "理解属性查找、原型链、class 语法和组合，让对象行为保持可预测。", code: `class Student {\n  constructor(name, score) { this.name = name; this.score = score; }\n  report() { return \`\${this.name}：\${this.score}\`; }\n}\nconsole.log(new Student("Lin", 92).report());`, output: "Lin：92", mentalModel: "对象先查找自身属性，找不到时沿原型链向上查找；class 是这套原型机制的清晰语法。", concepts: ["方法中的 this 由调用方式决定。", "私有状态应通过小而清晰的接口维护。", "组合对象通常比深继承更灵活。"], errors: ["把方法作为回调后丢失 this。", "修改共享原型上的可变对象。", "使用继承表达并非 is-a 的关系。"], sourceRefs: ["mdn-js"], version: "ECMAScript 2023 / Node.js 20+" },
  { id: "javascript-10", topic: "错误处理", title: "JavaScript 错误处理与调试", category: "可靠性", desc: "使用 Error、throw、try/catch/finally 和堆栈信息定位同步及异步失败。", code: `function parseScore(text) {\n  const value = Number(text);\n  if (!Number.isFinite(value)) throw new TypeError("成绩必须是数字");\n  return value;\n}\ntry {\n  console.log(\`成绩：\${parseScore("86")}\`);\n} catch (error) { console.error(error.message); }`, output: "成绩：86", mentalModel: "错误对象携带失败类型、信息和调用路径；捕获点应能恢复、转换或补充上下文。", concepts: ["只捕获当前层能处理的错误。", "自定义错误类型可区分不同失败类别。", "异步错误要通过 await 或 Promise 链传播。"], errors: ["catch 后什么也不做。", "抛出字符串而不是 Error。", "只记录 message 丢失堆栈和上下文。"], sourceRefs: ["mdn-js"], version: "ECMAScript 2023 / Node.js 20+" },
];

const javaSeeds: LessonSeed[] = [
  { id: "java-01", topic: "快速入门", title: "JDK、JRE、JVM 与 Java 入门", category: "入门基础", desc: "理解源码、字节码和 JVM 的关系，认识类结构、main 入口以及编译运行流程。", code: `class Main {\n  public static void main(String[] args) {\n    String learner = "Lin";\n    System.out.println("你好，" + learner + "！");\n    System.out.println("JVM 已就绪");\n  }\n}`, output: "你好，Lin！\nJVM 已就绪", mentalModel: "JDK 提供开发工具，javac 生成字节码，JVM 在具体平台上执行字节码。", concepts: ["源文件中的公共类名要与文件名一致。", "main 是普通应用的约定入口。", "编译错误与运行时异常发生在不同阶段。"], errors: ["文件名与 public 类名不一致。", "把 JRE 当成完整开发工具。", "忽略编译器给出的首个根因错误。"], sourceRefs: ["java-language", "exercism-java"], version: "Java 17" },
  { id: "java-02", topic: "变量与类型", title: "Java 类型、变量与运算符", category: "入门基础", desc: "区分基本类型与引用类型，理解类型提升、显式转换、final 常量和整数除法。", code: `class Main {\n  public static void main(String[] args) {\n    final int completed = 7;\n    final int total = 8;\n    double progress = (double) completed / total;\n    System.out.println("完成率：" + progress * 100 + "%");\n  }\n}`, output: "完成率：87.5%", mentalModel: "静态类型为每个表达式规定可接受的值和操作，编译器在运行前检查这些约束。", concepts: ["基本类型直接保存值，引用类型保存对象引用。", "窄化转换可能丢失范围或精度。", "final 禁止重新赋值，不等于对象深度不可变。"], errors: ["整数相除后再转 double。", "使用 == 比较字符串内容。", "自动拆箱 null 导致异常。"], sourceRefs: ["java-language"], version: "Java 17" },
  { id: "java-03", topic: "控制流", title: "Java 条件与循环", category: "入门基础", desc: "使用 if、switch、for、while、break 和 continue 表达业务路径并控制循环边界。", code: `class Main {\n  public static void main(String[] args) {\n    int score = 86;\n    String level;\n    if (score >= 90) level = "优秀";\n    else if (score >= 60) level = "合格";\n    else level = "需要复习";\n    System.out.println(level);\n  }\n}`, output: "合格", mentalModel: "控制结构在静态类型约束下选择和重复语句块，每个局部变量都必须在使用前确定赋值。", concepts: ["条件必须是 boolean，不能用整数代替。", "增强 for 适合只读遍历。", "switch 表达式可减少遗漏赋值的路径。"], errors: ["字符串 switch 忽略 null。", "循环边界多执行一次。", "分支后变量未必完成初始化。"], sourceRefs: ["java-language"], version: "Java 17" },
  { id: "java-04", topic: "数组与集合", title: "Java 数组、List、Set 与 Map", category: "核心能力", desc: "根据长度、顺序、唯一性和键值查找选择数组或集合接口，并安全遍历元素。", code: `import java.util.List;\nclass Main {\n  public static void main(String[] args) {\n    List<Integer> scores = List.of(86, 92, 74, 100, 65);\n    int total = 0;\n    for (int score : scores) total += score;\n    System.out.println("总分：" + total);\n  }\n}`, output: "总分：417", mentalModel: "集合接口描述能力，具体实现决定顺序、查找成本、可变性和并发特性。", concepts: ["数组长度固定，List 表达有序动态集合。", "Set 保证集合语义上的唯一性。", "Map 用键定位值，键的 equals 与 hashCode 必须一致。"], errors: ["修改 List.of 创建的不可变集合。", "遍历时直接删除引发并发修改异常。", "自定义键只实现 equals 未实现 hashCode。"], sourceRefs: ["java-language", "exercism-java"], version: "Java 17" },
  { id: "java-05", topic: "方法", title: "Java 方法与接口设计", category: "核心能力", desc: "通过参数、返回值、重载、可见性和单一职责建立清晰可测试的方法契约。", code: `class Main {\n  static double average(int... values) {\n    if (values.length == 0) return 0.0;\n    long total = 0;\n    for (int value : values) total += value;\n    return (double) total / values.length;\n  }\n  public static void main(String[] args) {\n    System.out.println("平均分：" + average(86, 92, 74));\n  }\n}`, output: "平均分：84.0", mentalModel: "方法是带静态类型契约的行为单元，调用方只依赖名称、参数和返回结果。", concepts: ["Java 按值传递，引用本身也是被复制的值。", "重载在编译期根据参数类型选择。", "可见性应从最小权限开始。"], errors: ["误以为方法能替换调用方的对象引用。", "重载组合产生歧义。", "返回 null 却没有在契约中说明。"], sourceRefs: ["java-language"], version: "Java 17" },
  { id: "java-06", topic: "类与对象", title: "Java 类、对象、继承与接口", category: "面向对象", desc: "使用封装、构造器、组合、接口和有限继承表达稳定领域模型。", code: `class Student {\n  private final String name;\n  private final int score;\n  Student(String name, int score) { this.name = name; this.score = score; }\n  String report() { return name + "：" + score; }\n}\nclass Main {\n  public static void main(String[] args) {\n    System.out.println(new Student("Lin", 92).report());\n  }\n}`, output: "Lin：92", mentalModel: "类维护对象不变量，接口描述能力，组合把多个能力连接为更大的行为。", concepts: ["构造器应建立有效对象。", "接口让调用方依赖能力而非具体实现。", "继承必须保持父类型的行为承诺。"], errors: ["构造器泄漏未完成初始化的 this。", "数据类暴露全部可变字段。", "为了复用代码滥用继承。"], sourceRefs: ["java-language"], version: "Java 17" },
  { id: "java-07", topic: "异常处理", title: "Java 异常处理", category: "可靠性", desc: "区分受检异常与运行时异常，使用 try-with-resources 和清晰的异常边界处理失败。", code: `class Main {\n  static int parseAge(String text) {\n    int age = Integer.parseInt(text);\n    if (age < 0) throw new IllegalArgumentException("年龄不能为负数");\n    return age;\n  }\n  public static void main(String[] args) {\n    try { System.out.println(parseAge("18")); }\n    catch (IllegalArgumentException error) { System.out.println(error.getMessage()); }\n  }\n}`, output: "18", mentalModel: "异常沿调用栈传播，边界层决定恢复、转换、记录或继续抛出。", concepts: ["受检异常要求调用方显式处理或声明。", "运行时异常常表示前置条件或程序缺陷。", "try-with-resources 按逆序自动关闭资源。"], errors: ["捕获 Exception 后忽略。", "用异常处理正常分支。", "丢失原始异常 cause。"], sourceRefs: ["java-language"], version: "Java 17" },
  { id: "java-08", topic: "泛型", title: "Java 泛型与类型边界", category: "类型系统", desc: "使用类型参数消除不安全转换，并通过上下界通配符表达读取与写入能力。", code: `import java.util.List;\nclass Main {\n  static <T> T first(List<T> values) {\n    if (values.isEmpty()) throw new IllegalArgumentException("列表不能为空");\n    return values.get(0);\n  }\n  public static void main(String[] args) {\n    System.out.println(first(List.of("Java", "Python")));\n  }\n}`, output: "Java", mentalModel: "泛型把类型也作为参数，让编译器验证容器与算法之间的契约。", concepts: ["类型擦除保留兼容性，也限制运行时泛型信息。", "? extends T 适合读取，? super T 适合写入。", "基本类型需要使用包装类型作为类型实参。"], errors: ["把 List<Integer> 当成 List<Number>。", "滥用原始类型绕过检查。", "尝试直接创建泛型数组。"], sourceRefs: ["java-language"], version: "Java 17" },
  { id: "java-09", topic: "文件处理", title: "Java 文件与流式 I/O", category: "标准库", desc: "理解字符流、字节流、缓冲和资源关闭，并按数据性质选择合适 I/O 抽象。", code: `import java.io.*;\nclass Main {\n  public static void main(String[] args) throws IOException {\n    try (BufferedReader reader = new BufferedReader(new StringReader("Lin\\nMia\\n"))) {\n      long count = reader.lines().count();\n      System.out.println("记录数：" + count);\n    }\n  }\n}`, output: "记录数：2", mentalModel: "流把数据看成按顺序到达的元素，缓冲减少昂贵的底层读写次数。", concepts: ["字节流处理原始数据，字符流负责文本解码。", "显式指定字符集避免平台差异。", "资源应在最小作用域内自动关闭。"], errors: ["依赖平台默认编码。", "一次读取整个大文件。", "异常路径忘记关闭流。"], sourceRefs: ["java-language"], version: "Java 17" },
  { id: "java-10", topic: "基础并发", title: "Java 基础并发概念", category: "并发基础", desc: "理解线程、任务、共享状态、可见性和 CompletableFuture，优先使用高层并发抽象。", code: `import java.util.concurrent.CompletableFuture;\nclass Main {\n  public static void main(String[] args) {\n    int result = CompletableFuture.completedFuture(21)\n      .thenApply(value -> value * 2)\n      .join();\n    System.out.println("结果：" + result);\n  }\n}`, output: "结果：42", mentalModel: "并发任务可能交错执行；正确性取决于任务之间是否共享可变状态以及如何建立可见性。", concepts: ["优先提交任务给执行器而非手工管理线程。", "不可变数据能显著减少同步需求。", "CompletableFuture 描述异步结果的组合关系。"], errors: ["多个线程无同步修改同一变量。", "持锁期间执行慢 I/O。", "join 或 get 造成意外阻塞。"], sourceRefs: ["java-language", "exercism-java"], version: "Java 17" },
];

const cppSeeds: LessonSeed[] = [
  { id: "cpp-01", topic: "环境配置", title: "C++ 编译与链接", category: "入门基础", desc: "认识预处理、编译、汇编和链接阶段，掌握 main、标准输出和首个编译命令。", code: `#include <iostream>\nint main() {\n  std::cout << "Compiler ready: C++17" << '\\n';\n  return 0;\n}`, output: "Compiler ready: C++17", mentalModel: "每个源文件先独立翻译为目标文件，链接器再解析跨文件符号并生成可执行程序。", concepts: ["头文件声明接口，源文件提供定义。", "编译错误与链接错误指向不同阶段。", "启用警告并把首个错误作为根因处理。"], errors: ["声明存在但定义未参与链接。", "同一函数出现多个定义。", "忽略编译器警告。"], sourceRefs: ["cppreference", "exercism-cpp"], version: "C++17" },
  { id: "cpp-02", topic: "数据类型", title: "C++ 类型、变量与安全转换", category: "入门基础", desc: "理解整数、浮点、字符、布尔、常量、类型推导和显式转换，避免窄化与整数除法。", code: `#include <iostream>\nint main() {\n  const int completed = 7;\n  const int total = 8;\n  const double progress = static_cast<double>(completed) / total;\n  std::cout << "完成率：" << progress * 100 << "%" << '\\n';\n}`, output: "完成率：87.5%", mentalModel: "类型决定对象的大小、表示范围、生命周期和允许操作。", concepts: ["初始化优先于先声明后赋值。", "auto 推导类型但不会改变表达式语义。", "static_cast 明确表达受控转换意图。"], errors: ["整数除法后再转换。", "有符号与无符号数混合比较。", "未初始化局部变量。"], sourceRefs: ["cppreference"], version: "C++17" },
  { id: "cpp-03", topic: "流程控制", title: "C++ 条件与循环", category: "入门基础", desc: "使用 if、switch、for、while、break 和 continue 构建可读、可终止的执行路径。", code: `#include <iostream>\nint main() {\n  const int score = 86;\n  if (score >= 90) std::cout << "优秀";\n  else if (score >= 60) std::cout << "合格";\n  else std::cout << "需要复习";\n}`, output: "合格", mentalModel: "控制结构改变下一条执行语句；每个分支和循环都要明确入口、状态变化与出口。", concepts: ["条件会转换为 bool。", "范围 for 适合遍历容器元素。", "循环边界应与容器有效范围一致。"], errors: ["条件末尾误加分号。", "下标使用 <= size。", "switch 分支意外贯穿。"], sourceRefs: ["cppreference"], version: "C++17" },
  { id: "cpp-04", topic: "数组", title: "C++ 数组与字符串", category: "核心语法", desc: "理解连续存储、下标边界、标准数组与字符串，并优先使用能表达长度的容器。", code: `#include <iostream>\nint main() {\n  int scores[] = {86, 92, 74, 100, 65};\n  int total = 0;\n  for (int score : scores) total += score;\n  std::cout << "总分：" << total << '\\n';\n}`, output: "总分：417", mentalModel: "数组是一段连续、定长、同类型的对象序列，下标只是从首地址计算偏移。", concepts: ["有效下标范围是零到长度减一。", "std::array 保留固定长度，std::vector 支持动态长度。", "std::string 管理字符存储并维护长度。"], errors: ["越界访问导致未定义行为。", "混淆字符数组容量与文本长度。", "把数组传参后仍用 sizeof 求长度。"], sourceRefs: ["cppreference", "exercism-cpp"], version: "C++17" },
  { id: "cpp-05", topic: "指针", title: "C++ 指针、引用与生命周期", category: "核心能力", desc: "从地址、解引用和引用理解对象身份，区分所有权、借用、空指针与悬空引用。", code: `#include <iostream>\nvoid addBonus(int& score, int bonus) { score += bonus; }\nint main() {\n  int score = 86;\n  int* address = &score;\n  addBonus(*address, 4);\n  std::cout << "更新后：" << score << '\\n';\n}`, output: "更新后：90", mentalModel: "指针保存对象地址，引用是已有对象的别名；二者只有在目标对象仍存活时才有效。", concepts: ["裸指针通常表达非拥有访问。", "引用必须绑定对象且不能改绑。", "离开作用域后局部对象生命周期结束。"], errors: ["解引用空指针。", "返回局部变量的引用。", "释放后继续使用地址。"], sourceRefs: ["cppreference"], version: "C++17" },
  { id: "cpp-06", topic: "函数", title: "C++ 函数与接口设计", category: "核心能力", desc: "通过值、引用、const 引用、返回值、重载和头文件组织清晰的函数契约。", code: `#include <iostream>\n#include <vector>\ndouble average(const std::vector<int>& values) {\n  if (values.empty()) return 0.0;\n  long long total = 0;\n  for (int value : values) total += value;\n  return static_cast<double>(total) / values.size();\n}\nint main() { std::cout << "平均分：" << average({86, 92, 74}) << '\\n'; }`, output: "平均分：84", mentalModel: "函数接口表达输入、输出、可变性与所有权约束，调用方不应依赖内部实现。", concepts: ["小对象按值，大只读对象常用 const 引用。", "返回值优化让按值返回对象通常高效安全。", "头文件声明应自包含并避免重复定义。"], errors: ["返回局部对象的指针或引用。", "非必要地使用输出参数。", "在头文件中放置非 inline 定义。"], sourceRefs: ["cppreference"], version: "C++17" },
  { id: "cpp-07", topic: "类与对象", title: "C++ 结构体、类与对象", category: "面向对象", desc: "使用构造函数、访问控制、const 成员、组合与有限继承维护对象不变量。", code: `#include <iostream>\n#include <string>\n#include <utility>\nclass Student {\n public:\n  Student(std::string name, int score) : name_(std::move(name)), score_(score) {}\n  void print() const { std::cout << name_ << "：" << score_ << '\\n'; }\n private:\n  std::string name_; int score_;\n};\nint main() { const Student student("Lin", 92); student.print(); }`, output: "Lin：92", mentalModel: "对象占有状态并维护不变量，构造完成后应始终处于可用状态。", concepts: ["struct 与 class 默认访问权限不同。", "成员按声明顺序初始化。", "组合优先用于 has-a 关系。"], errors: ["初始化列表顺序与声明顺序理解不一致。", "基类析构函数非虚却经基类指针删除。", "暴露可变成员破坏不变量。"], sourceRefs: ["cppreference"], version: "C++17" },
  { id: "cpp-08", topic: "RAII", title: "C++ RAII 与资源管理", category: "资源安全", desc: "把资源生命周期绑定到对象生命周期，使用容器和智能指针替代手工释放。", code: `#include <iostream>\n#include <memory>\nint main() {\n  auto score = std::make_unique<int>(92);\n  std::cout << "成绩：" << *score << '\\n';\n}`, output: "成绩：92", mentalModel: "资源由对象拥有，构造时获得，析构时释放；作用域退出就是统一清理路径。", concepts: ["unique_ptr 表达唯一所有权。", "shared_ptr 只在确需共享生命周期时使用。", "标准容器已经为内存实现 RAII。"], errors: ["new 与 delete 路径不对称。", "多个裸指针都认为自己拥有对象。", "shared_ptr 循环引用。"], sourceRefs: ["cppreference"], version: "C++17" },
  { id: "cpp-09", topic: "STL 容器", title: "C++ STL 常用容器与算法", category: "标准库", desc: "依据访问、插入、顺序和查找需求选择 vector、map、set，并使用标准算法表达意图。", code: `#include <algorithm>\n#include <iostream>\n#include <vector>\nint main() {\n  std::vector<int> scores{86, 92, 74};\n  std::sort(scores.begin(), scores.end());\n  std::cout << "最高分：" << scores.back() << '\\n';\n}`, output: "最高分：92", mentalModel: "容器负责存储，迭代器描述范围，算法在范围上执行通用操作。", concepts: ["vector 是连续动态序列的默认选择。", "map 按键排序，unordered_map 使用哈希。", "标准算法通过半开区间 [first,last) 工作。"], errors: ["容器修改后继续使用失效迭代器。", "空容器调用 front 或 back。", "未理解算法是否要求已排序输入。"], sourceRefs: ["cppreference", "exercism-cpp"], version: "C++17" },
  { id: "cpp-10", topic: "内存调试", title: "C++ 未定义行为与内存调试", category: "可靠性", desc: "识别越界、悬空、未初始化、溢出和数据竞争，使用警告、断言与 Sanitizer 缩小问题。", code: `#include <cassert>\n#include <iostream>\n#include <vector>\nint main() {\n  const std::vector<int> scores{86, 92, 74};\n  assert(!scores.empty());\n  std::cout << "元素数：" << scores.size() << '\\n';\n}`, output: "元素数：3", mentalModel: "未定义行为意味着标准不再约束程序结果；看似正常运行也不能证明代码正确。", concepts: ["越界和悬空访问可能在远离根因处崩溃。", "编译器警告与 AddressSanitizer 能提前暴露高风险问题。", "先构造最小复现，再检查生命周期和边界。"], errors: ["把偶尔正常当成没有未定义行为。", "读取未初始化变量。", "带符号整数溢出。"], sourceRefs: ["cppreference"], version: "C++17" },
];


const typescriptSeeds: LessonSeed[] = [
  {
    "id": "typescript-01",
    "topic": "类型与编译",
    "category": "入门基础",
    "desc": "TypeScript 在运行前检查类型，再生成 JavaScript。用学习时长计算区分编译错误与运行时行为；本地可使用 tsc --strict --target ES2020 main.ts 编译，再用 node main.js 运行。",
    "code": "const minutes: number = 25;\nconst sessions = 3;\nconst label: string = \"专注时长\";\nconsole.log(label + \"：\" + minutes * sessions);",
    "output": "专注时长：75",
    "mentalModel": "类型检查像出发前核对行李，能发现缺少什么，却不能保证路上所有条件都满足。浏览器最终执行的是生成的 JavaScript，类型标注不会变成运行时校验。",
    "concepts": [
      "number、string、boolean 表达值的类别；sessions 的类型可由数字初值推断，无需处处重复标注。",
      "tsc 检查赋值和调用关系；strict 打开一组更严格的检查。需要阻止错误代码输出时再加 noEmitOnError。",
      "JavaScript 依然可能因网络、无效输入或业务规则出错。通过编译不代表外部输入一定可靠。"
    ],
    "errors": [
      "将 sessions 改成字符串后仍期待数值计算。",
      "直接让普通浏览器执行含类型标注的 .ts。",
      "认为关闭 strict 就修复了类型错误。"
    ],
    "fixes": [
      "保持 number 输入；来自文本的值先转换并验证。",
      "先编译，再执行输出的 .js；在线练习已配置编译器。",
      "保留 strict，修正不满足约束的数据流。"
    ],
    "objectives": [
      "区分 TypeScript 检查与 JavaScript 执行",
      "用标注和推断表达基本类型",
      "在本地完成编译与运行"
    ],
    "prerequisites": [
      "了解 JavaScript 变量与 console.log"
    ],
    "steps": [
      "minutes 明确为 number，sessions 从 3 推断出 number。",
      "乘法得到 75，字符串拼接产生最终展示文字。",
      "尝试把 sessions 设为 true，观察编译器对乘法报错，再恢复原值。"
    ],
    "sourceRefs": [
      "ts-basics"
    ],
    "title": "TypeScript 类型与编译",
    "version": "TypeScript 5.6 / Node.js 20+",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“类型与编译”示例，先写出预测结果，再运行核对。",
        "verification": "专注时长：75"
      },
      {
        "level": "进阶",
        "title": "加入休息时长",
        "prompt": "定义每轮休息 5 分钟，只在两轮之间休息，输出总用时。",
        "verification": "3 轮得到 85，1 轮得到 25；0 轮应为 0。"
      },
      {
        "level": "挑战",
        "title": "设计时长校验",
        "prompt": "编写函数拒绝负数和非整数轮数，返回有效总用时。",
        "verification": "验证 0、1、3 和 -1、1.5；无效值不能静默参与计算。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：minutes 明确为 number，sessions 从 3 推断出 number。",
      "对照具体错误检查：保持 number 输入；来自文本的值先转换并验证。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "number、string、boolean 表达值的类别；sessions 的类型可由数字初值推断，无需处处重复标注。",
      "tsc 检查赋值和调用关系；strict 打开一组更严格的检查。需要阻止错误代码输出时再加 noEmitOnError。",
      "JavaScript 依然可能因网络、无效输入或业务规则出错。通过编译不代表外部输入一定可靠。"
    ]
  },
  {
    "id": "typescript-02",
    "topic": "数组与对象类型",
    "category": "入门基础",
    "desc": "为课程条目定义对象形状，用数组类型保证每一项满足相同契约。区分可选属性与必填属性，使用空值合并设置缺省值。",
    "code": "type Lesson = { title: string; minutes: number; done?: boolean };\nconst plan: Lesson[] = [\n  { title: \"类型\", minutes: 18, done: true },\n  { title: \"函数\", minutes: 22 }\n];\nconst total = plan.reduce((sum, item) => sum + item.minutes, 0);\nconsole.log(total);\nconsole.log(plan[1].done ?? false);",
    "output": "40\nfalse",
    "mentalModel": "对象类型是一张字段清单：必填字段必须交齐，可选字段要准备缺席时的处理方式。它描述形状，不会在运行时自动生成对象。",
    "concepts": [
      "Lesson[] 约束数组元素；type 定义可复用别名，接口也能描述对象形状。",
      "done? 表示属性可能没有提供，读取时需要处理 undefined；?? 只针对 null 和 undefined 使用默认值。",
      "readonly 用于限制经该类型进行的写入，不等于冻结运行时对象，也不是自动深拷贝。"
    ],
    "errors": [
      "缺少 minutes 却只添加类型断言。",
      "将 false 当成未提供字段。",
      "用 readonly 代替真正的数据隔离。"
    ],
    "fixes": [
      "补全数据或重新设计可选契约，不用 as 掩盖错误。",
      "使用 ?? 保留合法的 false 和 0。",
      "需要隔离时复制数据；需要运行时冻结时另行处理。"
    ],
    "objectives": [
      "定义可复用的对象类型",
      "声明对象数组并聚合字段",
      "安全读取可选属性"
    ],
    "prerequisites": [
      "TypeScript 类型与编译",
      "JavaScript 数组方法"
    ],
    "steps": [
      "两个条目都包含 title 和 minutes，第二条省略 done。",
      "reduce 以 0 开始累加，得到 18 + 22 = 40。",
      "第二条的 done 为 undefined，?? 将其替换为 false。"
    ],
    "sourceRefs": [
      "ts-basics"
    ],
    "title": "TypeScript 数组与对象类型",
    "version": "TypeScript 5.6 / Node.js 20+",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“数组与对象类型”示例，先写出预测结果，再运行核对。",
        "verification": "40 / false"
      },
      {
        "level": "进阶",
        "title": "统计已完成时长",
        "prompt": "只累加 done 为 true 的条目。",
        "verification": "原数据得到 18，空数组得到 0。"
      },
      {
        "level": "挑战",
        "title": "只读学习计划",
        "prompt": "让统计函数接收 readonly Lesson[]，避免在统计中修改条目数组。",
        "verification": "函数调用前后数据一致，传入只读数组也能通过检查。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：两个条目都包含 title 和 minutes，第二条省略 done。",
      "对照具体错误检查：补全数据或重新设计可选契约，不用 as 掩盖错误。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "Lesson[] 约束数组元素；type 定义可复用别名，接口也能描述对象形状。",
      "done? 表示属性可能没有提供，读取时需要处理 undefined；?? 只针对 null 和 undefined 使用默认值。",
      "readonly 用于限制经该类型进行的写入，不等于冻结运行时对象，也不是自动深拷贝。"
    ]
  },
  {
    "id": "typescript-03",
    "topic": "联合类型与收窄",
    "category": "入门基础",
    "desc": "使用联合类型描述多种合法输入，再根据 typeof 检查缩小当前分支的类型范围。外部输入先作为 unknown 接收，核实后再运算。",
    "code": "function parseCount(value: unknown): number {\n  if (typeof value === \"number\" && Number.isInteger(value) && value >= 0) {\n    return value;\n  }\n  if (typeof value === \"string\" && /^\\d+$/.test(value)) {\n    const count = Number(value);\n    if (Number.isSafeInteger(count)) return count;\n  }\n  return 0;\n}\nconsole.log(parseCount(\"12\"));\nconsole.log(parseCount(null));",
    "output": "12\n0",
    "mentalModel": "收窄是在每个路口增加证据：进入字符串分支后，才有资格使用字符串的方法。unknown 要求先检查；any 则让检查器放弃保护。",
    "concepts": [
      "string | number 是联合类型，只有所有成员都支持的操作才能在收窄前直接使用。",
      "typeof、相等比较和 in 等条件能帮助控制流分析。typeof null 是 object，不能只检查 object 就访问属性。",
      "类型正确与值有效不同：number 还包含 NaN、Infinity 和小数，需要业务规则进一步约束。"
    ],
    "errors": [
      "把 unknown 强转为 number 后直接计算。",
      "把空字符串 Number 转换成 0 当作有效输入。",
      "只检查 number 就接受不安全的大整数。"
    ],
    "fixes": [
      "先检查实际类型，再验证范围。",
      "先校验字符串格式，再调用 Number。",
      "需要精确整数时额外使用 Number.isSafeInteger。"
    ],
    "objectives": [
      "使用联合类型描述多类输入",
      "根据运行时证据收窄 unknown",
      "区分类型校验与业务校验"
    ],
    "prerequisites": [
      "基本类型",
      "函数和条件分支"
    ],
    "steps": [
      "输入 '12' 通过数字字符串正则，转换为安全整数 12。",
      "null 不符合两个分支，落到默认返回 0。",
      "把数值分支的 Number.isInteger 改为 isSafeInteger，可使两类输入使用相同精度约束。"
    ],
    "sourceRefs": [
      "ts-narrowing"
    ],
    "title": "TypeScript 联合类型与收窄",
    "version": "TypeScript 5.6 / Node.js 20+",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“联合类型与收窄”示例，先写出预测结果，再运行核对。",
        "verification": "12 / 0"
      },
      {
        "level": "进阶",
        "title": "统一整数边界",
        "prompt": "让数值分支也拒绝不安全整数，并拒绝 Infinity。",
        "verification": "12 保留；2 ** 53、Infinity 和 -1 返回 0。"
      },
      {
        "level": "挑战",
        "title": "区分错误和零",
        "prompt": "返回判别联合：成功含 count，失败含 reason，不再把错误和 0 混为一谈。",
        "verification": "'0' 成功得到 0，'abc' 返回失败原因。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：输入 '12' 通过数字字符串正则，转换为安全整数 12。",
      "对照具体错误检查：先检查实际类型，再验证范围。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "string | number 是联合类型，只有所有成员都支持的操作才能在收窄前直接使用。",
      "typeof、相等比较和 in 等条件能帮助控制流分析。typeof null 是 object，不能只检查 object 就访问属性。",
      "类型正确与值有效不同：number 还包含 NaN、Infinity 和小数，需要业务规则进一步约束。"
    ]
  },
  {
    "id": "typescript-04",
    "topic": "函数与回调契约",
    "category": "入门基础",
    "desc": "为函数参数、返回值及回调建立契约。把课程积分计算与具体计分规则分开，使同一遍历能够复用不同策略。",
    "code": "function totalBy(values: number[], score: (value: number) => number): number {\n  return values.reduce((sum, value) => sum + score(value), 0);\n}\nconst points = totalBy([2, 4, 1], value => value * 10);\nconsole.log(points);",
    "output": "70",
    "mentalModel": "回调也是输入，只是这个输入不是一个数字而是一段满足约定的行为。函数签名规定什么时候交入什么、应交回什么。",
    "concepts": [
      "(value: number) => number 表达函数类型；调用者提供行为，被调用者负责传入参数并使用返回值。",
      "回调参数通常能从上下文推断类型；返回值与约定不匹配时会报错。",
      "可选参数意味着调用时允许省略，不应为了模仿某次调用随意把必需参数标成可选。"
    ],
    "errors": [
      "回调使用花括号但忘记 return。",
      "将字符串计分函数传给 number 回调。",
      "给每个参数都加 ? 导致 undefined 到处传播。"
    ],
    "fixes": [
      "用表达式箭头函数，或显式 return 数值。",
      "在边界处转换数据，保持回调输出为 number。",
      "仅对真正可省略的参数加 ?，并提供缺省策略。"
    ],
    "objectives": [
      "声明回调类型",
      "利用上下文类型推断",
      "让空数组聚合有明确结果"
    ],
    "prerequisites": [
      "联合类型",
      "数组与 reduce"
    ],
    "steps": [
      "totalBy 收到数字列表和乘以 10 的函数。",
      "reduce 分别累计 20、40、10，初始值 0 确保空列表安全。",
      "最后返回 70，console.log 只负责展示。"
    ],
    "sourceRefs": [
      "ts-functions"
    ],
    "title": "TypeScript 函数与回调契约",
    "version": "TypeScript 5.6 / Node.js 20+",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“函数与回调契约”示例，先写出预测结果，再运行核对。",
        "verification": "70"
      },
      {
        "level": "进阶",
        "title": "添加封顶规则",
        "prompt": "每项得分为 value * 10，但单项最多 30。",
        "verification": "[2,4,1] 得到 60；空列表得到 0。"
      },
      {
        "level": "挑战",
        "title": "支持只读输入",
        "prompt": "把输入改成 readonly number[]，为两种计分策略编写断言。",
        "verification": "统计不修改原列表，两种策略都能复用同一函数。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：totalBy 收到数字列表和乘以 10 的函数。",
      "对照具体错误检查：用表达式箭头函数，或显式 return 数值。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "(value: number) => number 表达函数类型；调用者提供行为，被调用者负责传入参数并使用返回值。",
      "回调参数通常能从上下文推断类型；返回值与约定不匹配时会报错。",
      "可选参数意味着调用时允许省略，不应为了模仿某次调用随意把必需参数标成可选。"
    ]
  },
  {
    "id": "typescript-05",
    "topic": "泛型与键约束",
    "category": "核心能力",
    "desc": "用泛型保持输入与输出的类型关联，使用 keyof 限制字段名。泛型解决的是关系表达，不能凭空赋予未知类型任意操作。",
    "code": "function field<T, K extends keyof T>(record: T, key: K): T[K] {\n  return record[key];\n}\nconst progress = { title: \"泛型\", completed: 6 };\nconsole.log(field(progress, \"title\"));\nconsole.log(field(progress, \"completed\"));",
    "output": "泛型\n6",
    "mentalModel": "泛型像可填入的契约空位，调用时确定实际类型；K 必须来自 T 的字段集合，因此取回值的类型跟所选字段一起变化。",
    "concepts": [
      "T 保存整个对象类型，K extends keyof T 约束键，T[K] 表达对应属性值类型。",
      "泛型不是 any：没有约束时，不能假定 T 有 length 或可以相加。",
      "让编译器从参数推断类型通常更自然；只有必须消除歧义时才手动传类型参数。"
    ],
    "errors": [
      "将 key 写成任意 string 后强制断言。",
      "函数声明泛型却把结果固定成 any。",
      "给所有函数无意义地增加 T。"
    ],
    "fixes": [
      "用 keyof 约束键，拼错字段就能在编译时发现。",
      "返回 T[K]，保留调用方需要的具体类型。",
      "只有存在跨参数或返回值关系时才引入泛型。"
    ],
    "objectives": [
      "用泛型保持类型关系",
      "以 keyof 约束字段访问",
      "推断字段对应的返回类型"
    ],
    "prerequisites": [
      "对象类型",
      "函数签名"
    ],
    "steps": [
      "progress 的类型包含 title:string 和 completed:number。",
      "第一次调用令 K 为 title，返回类型为 string。",
      "第二次 K 为 completed，返回 number；尝试传入 missing 应报错。"
    ],
    "sourceRefs": [
      "ts-generics",
      "ts-utilities"
    ],
    "title": "TypeScript 泛型与键约束",
    "version": "TypeScript 5.6 / Node.js 20+",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“泛型与键约束”示例，先写出预测结果，再运行核对。",
        "verification": "泛型 / 6"
      },
      {
        "level": "进阶",
        "title": "双字段摘取",
        "prompt": "编写接收对象和两个合法键的函数，返回两个字段值。",
        "verification": "选择 title 与 completed 能保留各自类型；不存在的键被拒绝。"
      },
      {
        "level": "挑战",
        "title": "带约束的查找",
        "prompt": "实现 findById<T extends {id:number}>，查不到时返回 undefined。",
        "verification": "成功时保留原对象附加字段，失败时调用方必须处理 undefined。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：progress 的类型包含 title:string 和 completed:number。",
      "对照具体错误检查：用 keyof 约束键，拼错字段就能在编译时发现。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "T 保存整个对象类型，K extends keyof T 约束键，T[K] 表达对应属性值类型。",
      "泛型不是 any：没有约束时，不能假定 T 有 length 或可以相加。",
      "让编译器从参数推断类型通常更自然；只有必须消除歧义时才手动传类型参数。"
    ]
  },
  {
    "id": "typescript-06",
    "topic": "工具类型与更新",
    "category": "核心能力",
    "desc": "用 Pick 限定可编辑字段，再用 Partial 表达局部修改。保持原始对象不变，把更新结果作为新对象返回。",
    "code": "type Settings = { id: number; theme: \"dark\" | \"light\"; fontSize: number };\ntype SettingsPatch = Partial<Pick<Settings, \"theme\" | \"fontSize\">>;\nfunction updateSettings(current: Settings, patch: SettingsPatch): Settings {\n  return { ...current, ...patch };\n}\nconst current: Settings = { id: 7, theme: \"dark\", fontSize: 14 };\nconst next = updateSettings(current, { fontSize: 16 });\nconsole.log(current.fontSize, next.fontSize);\nconsole.log(next.id);",
    "output": "14 16\n7",
    "mentalModel": "工具类型是在类型层面裁剪字段，不是在运行时过滤数据。把更新接口限制成小范围，能让调用意图更清楚，但 API 仍须验证真实请求。",
    "concepts": [
      "Pick 选择字段；Partial 将选中字段变为可选；Readonly 限制通过该类型写入。",
      "展开语法生成浅复制。对象中若含嵌套引用，内层仍可能共享。",
      "类型只在检查阶段起作用，恶意 JSON 可以携带额外字段，服务端必须使用白名单读取。"
    ],
    "errors": [
      "直接接收 Partial<Settings> 导致 id 也可更新。",
      "认为 Partial 自动校验字体范围。",
      "把浅复制当成深复制。"
    ],
    "fixes": [
      "先 Pick 可编辑字段，再 Partial。",
      "另写运行时范围校验，如字号必须为 12 到 20。",
      "对嵌套对象只复制实际修改路径，或明确允许共享。"
    ],
    "objectives": [
      "组合 Pick 与 Partial",
      "避免无意修改标识字段",
      "区分类型转换和运行时校验"
    ],
    "prerequisites": [
      "泛型与对象展开"
    ],
    "steps": [
      "SettingsPatch 只暴露 theme 与 fontSize。",
      "展开 current 后用 patch 覆盖字号，创建新对象。",
      "current 仍为 14，next 为 16，id 保持 7。"
    ],
    "sourceRefs": [
      "ts-utilities"
    ],
    "title": "TypeScript 工具类型与更新",
    "version": "TypeScript 5.6 / Node.js 20+",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“工具类型与更新”示例，先写出预测结果，再运行核对。",
        "verification": "14 16 / 7"
      },
      {
        "level": "进阶",
        "title": "验证字号",
        "prompt": "更新前拒绝 12 到 20 之外的字号。",
        "verification": "12 和 20 可用，11 和 21 报出明确错误。"
      },
      {
        "level": "挑战",
        "title": "设计嵌套更新",
        "prompt": "为通知偏好添加嵌套对象，并只复制被修改的路径。",
        "verification": "更新后原始嵌套对象不变，未修改字段保留。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：SettingsPatch 只暴露 theme 与 fontSize。",
      "对照具体错误检查：先 Pick 可编辑字段，再 Partial。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "Pick 选择字段；Partial 将选中字段变为可选；Readonly 限制通过该类型写入。",
      "展开语法生成浅复制。对象中若含嵌套引用，内层仍可能共享。",
      "类型只在检查阶段起作用，恶意 JSON 可以携带额外字段，服务端必须使用白名单读取。"
    ]
  },
  {
    "id": "typescript-07",
    "topic": "接口与类",
    "category": "核心能力",
    "desc": "用接口表示外部可以依赖的能力，用类封装内部状态。通过只允许增加非负整数的进度计数器体验不变量。",
    "code": "interface ProgressReader { value(): number }\nclass ProgressCounter implements ProgressReader {\n  private completed = 0;\n  add(count: number): void {\n    if (!Number.isInteger(count) || count < 0) throw new Error(\"无效数量\");\n    this.completed += count;\n  }\n  value(): number { return this.completed; }\n}\nconst counter = new ProgressCounter();\ncounter.add(2);\ncounter.add(3);\nconst reader: ProgressReader = counter;\nconsole.log(reader.value());",
    "output": "5",
    "mentalModel": "接口描述能做什么，类负责怎么做以及维护哪些状态。只向读取者暴露读取接口，可以缩小代码之间的依赖。",
    "concepts": [
      "implements 检查实例是否满足接口，但不会自动为方法生成实现。",
      "private 是 TypeScript 检查层面的访问限制；需要 JavaScript 运行时私有字段时使用 # 字段。",
      "通过构造函数和方法校验维护不变量，比让所有调用者直接写字段更可靠。"
    ],
    "errors": [
      "以为接口会在运行时存在。",
      "以为 private 能隐藏网络返回的敏感数据。",
      "用继承代替简单的接口或组合。"
    ],
    "fixes": [
      "接口用于静态检查；需要运行时判断时设计明确标识。",
      "敏感数据根本不应发送到客户端。",
      "先依赖小接口，只有真实的替换关系才考虑继承。"
    ],
    "objectives": [
      "使用 implements 验证契约",
      "封装状态和不变量",
      "向调用方提供最小能力接口"
    ],
    "prerequisites": [
      "函数契约",
      "JavaScript 类基础"
    ],
    "steps": [
      "counter 的 completed 初始为 0。",
      "两次 add 验证参数后累加，得到 5。",
      "reader 仅暴露 value，读取方不需要知道内部存储字段。"
    ],
    "sourceRefs": [
      "ts-classes"
    ],
    "title": "TypeScript 接口与类",
    "version": "TypeScript 5.6 / Node.js 20+",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“接口与类”示例，先写出预测结果，再运行核对。",
        "verification": "5"
      },
      {
        "level": "进阶",
        "title": "支持撤销",
        "prompt": "增加 remove，禁止结果变为负数。",
        "verification": "从 5 减 2 得到 3，减 4 被拒绝且状态保持 3。"
      },
      {
        "level": "挑战",
        "title": "替换实现",
        "prompt": "用普通对象实现 ProgressReader，为展示函数提供测试替身。",
        "verification": "展示函数接受类实例与普通对象，不检查具体类名。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：counter 的 completed 初始为 0。",
      "对照具体错误检查：接口用于静态检查；需要运行时判断时设计明确标识。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "implements 检查实例是否满足接口，但不会自动为方法生成实现。",
      "private 是 TypeScript 检查层面的访问限制；需要 JavaScript 运行时私有字段时使用 # 字段。",
      "通过构造函数和方法校验维护不变量，比让所有调用者直接写字段更可靠。"
    ]
  },
  {
    "id": "typescript-08",
    "topic": "异步结果建模",
    "category": "进阶应用",
    "desc": "用 Promise 和判别联合将成功、失败结果表示为不同形状。避免把错误字符串和正常数据塞进同一个字段。",
    "code": "type LoadResult =\n  | { ok: true; minutes: number }\n  | { ok: false; reason: string };\nasync function loadMinutes(id: number): Promise<LoadResult> {\n  if (id < 1) return { ok: false, reason: \"课程不存在\" };\n  return { ok: true, minutes: 30 };\n}\nloadMinutes(2).then(result => {\n  if (result.ok) console.log(result.minutes);\n  else console.log(result.reason);\n});",
    "output": "30",
    "mentalModel": "Promise 表达结果何时可用，联合类型表达结果可能是什么。先等结果，再按标识分支，才能在每条路径使用正确字段。",
    "concepts": [
      "async 函数返回 Promise；Promise<LoadResult> 不代表永远不会拒绝。",
      "ok 是判别字段，检查它能把结果收窄到成功或失败形状。",
      "预期的业务失败可用结果类型表示，意外异常仍须用 catch 或 try/catch 处理。"
    ],
    "errors": [
      "忘记 await 就读取 Promise 的业务属性。",
      "在失败分支访问 minutes。",
      "以为结果联合捕获了所有异步异常。"
    ],
    "fixes": [
      "await 或 then 取得实际结果。",
      "先判断 ok，再使用该分支的字段。",
      "为异步调用补充拒绝处理，并区分业务错误与系统错误。"
    ],
    "objectives": [
      "声明异步返回类型",
      "使用判别联合处理成功和失败",
      "区分业务失败与 Promise 拒绝"
    ],
    "prerequisites": [
      "JavaScript Promise",
      "联合类型与收窄"
    ],
    "steps": [
      "loadMinutes 为合法 id 构造成功结果，async 将它包装为 Promise。",
      "then 接到结果后，ok 分支确定 minutes 存在。",
      "把参数换为 0 时走失败分支，输出课程不存在。"
    ],
    "sourceRefs": [
      "ts-narrowing",
      "ts-functions"
    ],
    "title": "TypeScript 异步结果建模",
    "version": "TypeScript 5.6 / Node.js 20+",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“异步结果建模”示例，先写出预测结果，再运行核对。",
        "verification": "30"
      },
      {
        "level": "进阶",
        "title": "并行加载",
        "prompt": "同时请求 id 0 和 2，按输入顺序显示结果。",
        "verification": "先显示失败原因，再显示 30；不要依赖完成先后顺序。"
      },
      {
        "level": "挑战",
        "title": "穷尽状态",
        "prompt": "增加 loading、success、error 三种 status，通过 never 检查所有分支。",
        "verification": "新增状态而忘记处理时，编译器应报错。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：loadMinutes 为合法 id 构造成功结果，async 将它包装为 Promise。",
      "对照具体错误检查：await 或 then 取得实际结果。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "async 函数返回 Promise；Promise<LoadResult> 不代表永远不会拒绝。",
      "ok 是判别字段，检查它能把结果收窄到成功或失败形状。",
      "预期的业务失败可用结果类型表示，意外异常仍须用 catch 或 try/catch 处理。"
    ]
  },
  {
    "id": "typescript-09",
    "topic": "JSON 边界验证",
    "category": "进阶应用",
    "desc": "将 JSON.parse 的结果立即视为 unknown，在运行时检查形状再转换成业务对象。类型断言不能让来自网络的错误字段自动变正确。",
    "code": "type ProgressData = { completed: number };\nfunction readProgress(text: string): ProgressData {\n  const value: unknown = JSON.parse(text);\n  if (typeof value !== \"object\" || value === null || !(\"completed\" in value)) {\n    throw new Error(\"缺少 completed\");\n  }\n  if (typeof value.completed !== \"number\" ||\n      !Number.isSafeInteger(value.completed) || value.completed < 0) {\n    throw new Error(\"completed 必须是非负安全整数\");\n  }\n  return { completed: value.completed };\n}\ntry {\n  console.log(readProgress('{\"completed\":4}').completed);\n  readProgress('{\"completed\":\"4\"}');\n} catch (error: unknown) {\n  console.log(error instanceof Error ? error.message : \"未知错误\");\n}",
    "output": "4\ncompleted 必须是非负安全整数",
    "mentalModel": "外部数据像未拆封的包裹，标签写着某种类型也不算证据。边界函数负责拆开检查，再交给内部可信逻辑。",
    "concepts": [
      "JSON.parse 只校验 JSON 语法，不验证业务字段。unknown 能强制后续代码先检查。",
      "先排除 null，再判断属性存在，最后验证值类型、整数精度和范围。",
      "返回新对象能明确保留哪些字段；不要把整个输入对象无条件传入数据库或页面。"
    ],
    "errors": [
      "用 JSON.parse(text) as ProgressData 跳过校验。",
      "null 通过 typeof object 后导致属性访问失败。",
      "接受小数或无穷值作为完成数量。"
    ],
    "fixes": [
      "把结果作为 unknown 并逐项检查。",
      "显式排除 null，并校验属性存在。",
      "Number.isSafeInteger 配合非负范围判断。"
    ],
    "objectives": [
      "为外部输入建立验证边界",
      "收窄对象上的 unknown 属性",
      "安全展示捕获到的错误"
    ],
    "prerequisites": [
      "类型收窄",
      "异常处理"
    ],
    "steps": [
      "第一个 JSON 语法和字段都有效，返回 4。",
      "第二个 JSON 语法有效但 completed 是字符串，触发业务错误。",
      "catch 将 unknown 收窄为 Error，输出可读的错误信息。"
    ],
    "sourceRefs": [
      "ts-narrowing"
    ],
    "title": "TypeScript JSON 边界验证",
    "version": "TypeScript 5.6 / Node.js 20+",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“JSON 边界验证”示例，先写出预测结果，再运行核对。",
        "verification": "4 / completed 必须是非负安全整数"
      },
      {
        "level": "进阶",
        "title": "补充反例",
        "prompt": "测试 null、{}、负数、小数和无效 JSON 文本。",
        "verification": "每种无效输入都被拒绝，0 被接受。"
      },
      {
        "level": "挑战",
        "title": "返回错误列表",
        "prompt": "把抛异常改为验证结果联合，支持同时报告多个字段错误。",
        "verification": "调用方必须先检查成功标识，不能直接拿到未经验证的数据。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：第一个 JSON 语法和字段都有效，返回 4。",
      "对照具体错误检查：把结果作为 unknown 并逐项检查。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "JSON.parse 只校验 JSON 语法，不验证业务字段。unknown 能强制后续代码先检查。",
      "先排除 null，再判断属性存在，最后验证值类型、整数精度和范围。",
      "返回新对象能明确保留哪些字段；不要把整个输入对象无条件传入数据库或页面。"
    ]
  },
  {
    "id": "typescript-10",
    "topic": "类型安全实战与测试",
    "category": "进阶应用",
    "desc": "把课程任务统计组合成一个小型纯函数，使用只读输入和明确返回类型，再用确定性断言覆盖空数据和混合状态。",
    "code": "type Task = { minutes: number; done: boolean };\nfunction completedMinutes(tasks: readonly Task[]): number {\n  return tasks.filter(task => task.done).reduce((sum, task) => sum + task.minutes, 0);\n}\nconst tasks: readonly Task[] = [\n  { minutes: 15, done: true },\n  { minutes: 25, done: false },\n  { minutes: 20, done: true }\n];\nif (completedMinutes(tasks) !== 35) throw new Error(\"混合状态失败\");\nif (completedMinutes([]) !== 0) throw new Error(\"空数组失败\");\nconsole.log(\"2 项测试通过\");",
    "output": "2 项测试通过",
    "mentalModel": "类型检查守住结构，测试守住行为。两道检查针对不同问题，不能互相替代：返回一个错误数字依然可能完全符合 number 类型。",
    "concepts": [
      "readonly Task[] 防止经参数增删数组，但不是对元素字段的深层只读。",
      "纯函数只由输入决定输出，测试不依赖网络或真实时钟，因此更稳定。",
      "多文件项目可 export 函数并 import 测试；本节为单文件沙盒保持自包含。本地采用 strict 与 tsc --noEmit 检查。"
    ],
    "errors": [
      "只运行 tsc 就认为统计结果正确。",
      "测试全部使用完成状态为 true 的数据。",
      "测试通过时输出太多日志掩盖失败。"
    ],
    "fixes": [
      "保留类型检查，同时断言具体输出。",
      "覆盖空数组、混合状态和全未完成三类数据。",
      "成功输出摘要，失败时抛出包含场景的错误。"
    ],
    "objectives": [
      "组合已学类型与数组方法",
      "编写确定性的行为测试",
      "识别只读数组的限制"
    ],
    "prerequisites": [
      "前九节 TypeScript",
      "数组聚合"
    ],
    "steps": [
      "filter 保留 15 与 20 分钟两项，reduce 得到 35。",
      "第二条断言验证空数组时初始值 0。",
      "任一结果不符都会抛错；全部满足才输出测试摘要。"
    ],
    "sourceRefs": [
      "ts-functions",
      "ts-utilities"
    ],
    "title": "TypeScript 类型安全实战与测试",
    "version": "TypeScript 5.6 / Node.js 20+",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“类型安全实战与测试”示例，先写出预测结果，再运行核对。",
        "verification": "2 项测试通过"
      },
      {
        "level": "进阶",
        "title": "增加第三个用例",
        "prompt": "加入全部未完成的任务，验证总时长为 0。",
        "verification": "三种场景独立断言，修改实现后能发现错误。"
      },
      {
        "level": "挑战",
        "title": "扩展统计报告",
        "prompt": "返回 completedCount、totalCount、completedMinutes，使用 Readonly<Task> 限制元素字段修改。",
        "verification": "零任务不出现除零；统计前后原数组和元素不变。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：filter 保留 15 与 20 分钟两项，reduce 得到 35。",
      "对照具体错误检查：保留类型检查，同时断言具体输出。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "readonly Task[] 防止经参数增删数组，但不是对元素字段的深层只读。",
      "纯函数只由输入决定输出，测试不依赖网络或真实时钟，因此更稳定。",
      "多文件项目可 export 函数并 import 测试；本节为单文件沙盒保持自包含。本地采用 strict 与 tsc --noEmit 检查。"
    ]
  }
];

const goSeeds: LessonSeed[] = [
  {
    "id": "go-01",
    "topic": "运行环境与程序入口",
    "category": "入门基础",
    "desc": "从 package main、导入和 main 函数认识编译型语言。将示例保存为 main.go，本地用 go run main.go 执行，用 go build main.go 生成可执行程序；在线练习使用 Go 1.23。",
    "code": "package main\n\nimport \"fmt\"\n\nfunc main() {\n    fmt.Println(\"Blinga 学习计划\")\n    fmt.Println(18 + 12)\n}",
    "output": "Blinga 学习计划\n30",
    "mentalModel": "一个 Go 程序先编译，再从 main 包的 main 函数开始执行。import 不是复制文本，而是声明本文件依赖哪些包。",
    "concepts": [
      "可执行程序使用 package main，并提供无参数无返回值的 main 函数。",
      "fmt.Println 向标准输出写入数据并换行；导入后未使用的包会产生编译错误。",
      "go run 适合快速运行，go build 适合生成程序；gofmt 统一格式。多个包的项目使用 go mod init 建立模块。"
    ],
    "errors": [
      "把普通语句写在函数外。",
      "导入 fmt 却没有使用。",
      "把 go run 命令写进源码。"
    ],
    "fixes": [
      "声明放在包级，执行语句放入 main 或其他函数。",
      "移除无用导入或实际调用它。",
      "命令在终端运行，代码编辑器仅填写 Go 源码。"
    ],
    "objectives": [
      "编写可运行的 main 包",
      "使用标准输出",
      "区分编译命令和语言语句"
    ],
    "prerequisites": [
      "会使用文本编辑器",
      "不要求 Go 经验"
    ],
    "steps": [
      "package 声明当前程序所属包。",
      "import 引入格式化输出能力。",
      "main 先输出标题，再计算 18 + 12 并输出 30。"
    ],
    "sourceRefs": [
      "go-spec",
      "go-effective"
    ],
    "title": "Go 运行环境与程序入口",
    "version": "Go 1.23",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“运行环境与程序入口”示例，先写出预测结果，再运行核对。",
        "verification": "Blinga 学习计划 / 30"
      },
      {
        "level": "进阶",
        "title": "输出学习清单",
        "prompt": "用三次 Println 输出三项课程，再输出总分钟数。",
        "verification": "每项占一行，数字总和准确。"
      },
      {
        "level": "挑战",
        "title": "比较运行与构建",
        "prompt": "在本地分别使用 go run 与 go build，运行生成的程序。",
        "verification": "两种方式输出一致；说明生成文件与源文件的区别。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：package 声明当前程序所属包。",
      "对照具体错误检查：声明放在包级，执行语句放入 main 或其他函数。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "可执行程序使用 package main，并提供无参数无返回值的 main 函数。",
      "fmt.Println 向标准输出写入数据并换行；导入后未使用的包会产生编译错误。",
      "go run 适合快速运行，go build 适合生成程序；gofmt 统一格式。多个包的项目使用 go mod init 建立模块。"
    ]
  },
  {
    "id": "go-02",
    "topic": "变量、类型与零值",
    "category": "入门基础",
    "desc": "使用 var、短变量声明和常量表达数据，观察零值以及整数除法。把单位与精度写清楚，再进行显式类型转换。",
    "code": "package main\nimport \"fmt\"\n\nfunc main() {\n    const minutesPerHour = 60\n    minutes := 95\n    var completed bool\n    hours := float64(minutes) / minutesPerHour\n    fmt.Println(completed)\n    fmt.Printf(\"%.2f\\n\", hours)\n}",
    "output": "false\n1.58",
    "mentalModel": "变量有确定类型，声明后就拥有该类型的零值。转换类型是显式操作，尤其要在除法发生前决定是否保留小数。",
    "concepts": [
      ":= 只能在函数体内使用，并且在同一作用域的声明中至少引入一个新变量。",
      "数值零值为 0，布尔为 false，字符串为空；指针、切片和 map 等零值为 nil。",
      "两个整数相除会截去小数部分；先转换参与计算的值，才能得到浮点除法。"
    ],
    "errors": [
      "在包级使用 :=。",
      "将 95 / 60 的整数结果事后转浮点。",
      "用 == 比较浮点计算是否精确相等。"
    ],
    "fixes": [
      "包级用 var 或 const。",
      "在除法前写 float64(minutes)。",
      "对近似数值使用误差容忍，货币优先使用整数最小单位。"
    ],
    "objectives": [
      "理解类型与零值",
      "使用短变量声明",
      "控制整数与浮点运算"
    ],
    "prerequisites": [
      "Go 程序入口"
    ],
    "steps": [
      "completed 未赋值，因此打印 false。",
      "minutes 转为 float64 后进行除法，得到约 1.5833。",
      "Printf 的 %.2f 将展示精度限定到两位小数。"
    ],
    "sourceRefs": [
      "go-spec"
    ],
    "title": "Go 变量、类型与零值",
    "version": "Go 1.23",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“变量、类型与零值”示例，先写出预测结果，再运行核对。",
        "verification": "false / 1.58"
      },
      {
        "level": "进阶",
        "title": "拆分时分",
        "prompt": "同时输出完整小时和剩余分钟。",
        "verification": "95 得到 1 小时 35 分；0 得到 0 和 0。"
      },
      {
        "level": "挑战",
        "title": "验证输入范围",
        "prompt": "封装转换函数拒绝负分钟数，返回结果与错误。",
        "verification": "正常值可格式化，负值不能转成看似合法的时长。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：completed 未赋值，因此打印 false。",
      "对照具体错误检查：包级用 var 或 const。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      ":= 只能在函数体内使用，并且在同一作用域的声明中至少引入一个新变量。",
      "数值零值为 0，布尔为 false，字符串为空；指针、切片和 map 等零值为 nil。",
      "两个整数相除会截去小数部分；先转换参与计算的值，才能得到浮点除法。"
    ]
  },
  {
    "id": "go-03",
    "topic": "条件与循环",
    "category": "入门基础",
    "desc": "用 if、switch 和 for 表达流程，认识 Go 只有 for 这一种循环关键字。以学习记录筛选练习范围、累加和分支。",
    "code": "package main\nimport \"fmt\"\n\nfunc main() {\n    sessions := []int{12, 0, 18, 5}\n    total := 0\n    for _, minutes := range sessions {\n        if minutes < 10 { continue }\n        total += minutes\n    }\n    switch {\n    case total >= 30:\n        fmt.Println(\"达成目标\")\n    default:\n        fmt.Println(\"继续练习\")\n    }\n    fmt.Println(total)\n}",
    "output": "达成目标\n30",
    "mentalModel": "循环每次拿到一个记录，条件决定保留还是跳过；switch 根据累加后的状态选择一个出口。每个结构负责一件事。",
    "concepts": [
      "range 切片提供索引和值，不需要索引时用 _ 忽略。",
      "for 可写成带条件循环；没有条件的 for 是无限循环，必须有退出途径。",
      "switch 默认执行匹配分支后退出，通常不需要 break，也不会像某些语言那样自动贯穿。"
    ],
    "errors": [
      "忽略 range 返回的第一个值是索引。",
      "使用 continue 后遗漏应有状态更新。",
      "为普通 switch 随意加 fallthrough。"
    ],
    "fixes": [
      "用 _, value 明确只接收值。",
      "将终止条件与更新位置一起检查。",
      "默认匹配即结束，仅在确需贯穿时显式使用。"
    ],
    "objectives": [
      "遍历切片",
      "用 continue 筛选数据",
      "用无表达式 switch 组织条件"
    ],
    "prerequisites": [
      "变量与比较运算"
    ],
    "steps": [
      "12 被累加，0 被跳过，18 被累加，5 被跳过。",
      "total 最终为 30。",
      "switch 的首个条件成立，输出达成目标。"
    ],
    "sourceRefs": [
      "go-spec",
      "go-effective"
    ],
    "title": "Go 条件与循环",
    "version": "Go 1.23",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“条件与循环”示例，先写出预测结果，再运行核对。",
        "verification": "达成目标 / 30"
      },
      {
        "level": "进阶",
        "title": "统计有效轮数",
        "prompt": "同时统计至少 10 分钟的轮数。",
        "verification": "样例轮数为 2；空切片总数与轮数均为 0。"
      },
      {
        "level": "挑战",
        "title": "可配置目标",
        "prompt": "封装函数，接收最低轮时长和目标总时长，返回是否完成。",
        "verification": "测试恰好达到目标、差 1 分钟以及空数据。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：12 被累加，0 被跳过，18 被累加，5 被跳过。",
      "对照具体错误检查：用 _, value 明确只接收值。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "range 切片提供索引和值，不需要索引时用 _ 忽略。",
      "for 可写成带条件循环；没有条件的 for 是无限循环，必须有退出途径。",
      "switch 默认执行匹配分支后退出，通常不需要 break，也不会像某些语言那样自动贯穿。"
    ]
  },
  {
    "id": "go-04",
    "topic": "切片与映射",
    "category": "入门基础",
    "desc": "区分数组与切片，使用 map 统计相同标签。特别关注切片共享底层数组以及 map 的缺失键行为。",
    "code": "package main\nimport \"fmt\"\n\nfunc main() {\n    tags := []string{\"go\", \"web\", \"go\"}\n    counts := make(map[string]int)\n    for _, tag := range tags { counts[tag]++ }\n    count, exists := counts[\"sql\"]\n    fmt.Println(counts[\"go\"])\n    fmt.Println(count, exists)\n}",
    "output": "2\n0 false",
    "mentalModel": "切片是一扇指向底层数组区间的窗口，map 是按键取值的索引。窗口复制不等于复制所有数据，缺失键返回零值也不等于键确实存在。",
    "concepts": [
      "切片包含底层数组引用、长度和容量；append 可能复用原数组，也可能分配新数组，必须接收返回值。",
      "map 读取缺失键得到值类型零值；使用 value, ok 可以区分缺失和真实的零值。",
      "nil map 可读取但不能写入；make 初始化后才能写。map 遍历顺序不保证稳定。"
    ],
    "errors": [
      "给 nil map 写入导致 panic。",
      "依赖 map 遍历得到固定输出顺序。",
      "修改子切片却没意识到原数据也变了。"
    ],
    "fixes": [
      "先 make(map[string]int)。",
      "需要确定顺序时收集键并排序。",
      "需要独立数据时分配新切片并 copy。"
    ],
    "objectives": [
      "选择切片和 map",
      "区分缺失键与零值",
      "识别共享底层数组"
    ],
    "prerequisites": [
      "range 循环"
    ],
    "steps": [
      "make 创建可写的计数 map。",
      "go 出现两次，零值 0 经两次自增变为 2。",
      "sql 不存在，读取返回 0 和 false。"
    ],
    "sourceRefs": [
      "go-spec",
      "go-effective"
    ],
    "title": "Go 切片与映射",
    "version": "Go 1.23",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“切片与映射”示例，先写出预测结果，再运行核对。",
        "verification": "2 / 0 false"
      },
      {
        "level": "进阶",
        "title": "补充空标签规则",
        "prompt": "忽略空字符串，再统计不同标签数。",
        "verification": "加入两个空字符串不改变结果；空切片得到 0 个标签。"
      },
      {
        "level": "挑战",
        "title": "稳定排行",
        "prompt": "按数量降序、同数量按标签字典序输出。",
        "verification": "重复运行顺序一致，不能直接依赖 map 的 range 顺序。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：make 创建可写的计数 map。",
      "对照具体错误检查：先 make(map[string]int)。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "切片包含底层数组引用、长度和容量；append 可能复用原数组，也可能分配新数组，必须接收返回值。",
      "map 读取缺失键得到值类型零值；使用 value, ok 可以区分缺失和真实的零值。",
      "nil map 可读取但不能写入；make 初始化后才能写。map 遍历顺序不保证稳定。"
    ]
  },
  {
    "id": "go-05",
    "topic": "函数与错误返回",
    "category": "核心能力",
    "desc": "用多返回值显式表达失败。将数据验证放在函数边界，让调用方检查 error 后再使用业务结果。",
    "code": "package main\nimport (\n    \"errors\"\n    \"fmt\"\n)\nfunc average(values []int) (float64, error) {\n    if len(values) == 0 { return 0, errors.New(\"记录为空\") }\n    total := 0\n    for _, value := range values { total += value }\n    return float64(total) / float64(len(values)), nil\n}\nfunc main() {\n    value, err := average([]int{10, 20, 15})\n    if err != nil { fmt.Println(err); return }\n    fmt.Println(value)\n    _, err = average(nil)\n    fmt.Println(err)\n}",
    "output": "15\n记录为空",
    "mentalModel": "error 是一份与结果一起返回的状态说明。调用方先确认是否成功，再决定能否信任结果；零结果值本身不代表成功或失败。",
    "concepts": [
      "函数可以返回多个值，惯例把 error 放最后；nil error 表示该调用没有报告失败。",
      "空切片和 nil 切片长度都为 0，本例用相同失败规则处理。",
      "错误可逐层添加上下文；需要判断错误链时使用 errors.Is 或 errors.As，不依赖错误文本。"
    ],
    "errors": [
      "用 _ 丢掉 error。",
      "用结果是否为 0 判断成功。",
      "对可预期输入错误使用 panic。"
    ],
    "fixes": [
      "检查 err != nil，并明确返回或降级。",
      "以 error 为准，0 可能是合法结果。",
      "把常规失败作为 error 返回给调用者。"
    ],
    "objectives": [
      "编写多返回值函数",
      "先处理 error 再读结果",
      "定义空输入契约"
    ],
    "prerequisites": [
      "切片",
      "类型转换"
    ],
    "steps": [
      "非空输入累加到 45，除以长度 3 得到 15，error 为 nil。",
      "第二次传入 nil，其长度为 0。",
      "函数立即返回记录为空，主程序打印该错误。"
    ],
    "sourceRefs": [
      "go-errors",
      "go-effective"
    ],
    "title": "Go 函数与错误返回",
    "version": "Go 1.23",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“函数与错误返回”示例，先写出预测结果，再运行核对。",
        "verification": "15 / 记录为空"
      },
      {
        "level": "进阶",
        "title": "拒绝负时长",
        "prompt": "在聚合前检查每项数值。",
        "verification": "正常数据不变，包含 -1 时返回 error。"
      },
      {
        "level": "挑战",
        "title": "保留错误身份",
        "prompt": "定义哨兵错误并用 fmt.Errorf 的 %w 添加上下文，再用 errors.Is 判断。",
        "verification": "修改展示文字后，调用方仍能识别同一错误类型。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：非空输入累加到 45，除以长度 3 得到 15，error 为 nil。",
      "对照具体错误检查：检查 err != nil，并明确返回或降级。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "函数可以返回多个值，惯例把 error 放最后；nil error 表示该调用没有报告失败。",
      "空切片和 nil 切片长度都为 0，本例用相同失败规则处理。",
      "错误可逐层添加上下文；需要判断错误链时使用 errors.Is 或 errors.As，不依赖错误文本。"
    ]
  },
  {
    "id": "go-06",
    "topic": "结构体与方法",
    "category": "核心能力",
    "desc": "使用 struct 表达课程进度，以方法维护对象约束。理解值接收者与指针接收者的修改范围。",
    "code": "package main\nimport \"fmt\"\n\ntype Progress struct { Completed int }\nfunc (p *Progress) Add(count int) {\n    if count > 0 { p.Completed += count }\n}\nfunc (p Progress) Label() string {\n    return fmt.Sprintf(\"已完成 %d 节\", p.Completed)\n}\nfunc main() {\n    progress := Progress{}\n    progress.Add(3)\n    progress.Add(-1)\n    fmt.Println(progress.Label())\n}",
    "output": "已完成 3 节",
    "mentalModel": "结构体把相关值放在一起；值接收者收到副本，指针接收者能通过地址更新原对象。是否需要修改状态决定接收者设计。",
    "concepts": [
      "Progress{} 使用字段零值，Completed 从 0 开始。",
      "指针接收者可以更新原结构体，值接收者的方法修改副本不会更新原值。",
      "大写名称可跨包访问。指针不保证非 nil，公开接口仍须定义 nil 的使用约束。"
    ],
    "errors": [
      "用值接收者更新后以为原对象已改变。",
      "误把结构体复制当成所有嵌套数据深拷贝。",
      "对 nil 指针解引用。"
    ],
    "fixes": [
      "需要修改时使用 *Progress 接收者。",
      "含切片或 map 时明确共享关系，必要时复制内部数据。",
      "构造有效实例，或在允许 nil 的接口内明确判断。"
    ],
    "objectives": [
      "定义结构体",
      "选择值或指针接收者",
      "通过方法维护状态"
    ],
    "prerequisites": [
      "函数",
      "变量"
    ],
    "steps": [
      "零值结构体的 Completed 为 0。",
      "Add(3) 更新为 3，Add(-1) 被条件忽略。",
      "Label 用值接收者读取状态并返回文本。"
    ],
    "sourceRefs": [
      "go-spec",
      "go-effective"
    ],
    "title": "Go 结构体与方法",
    "version": "Go 1.23",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“结构体与方法”示例，先写出预测结果，再运行核对。",
        "verification": "已完成 3 节"
      },
      {
        "level": "进阶",
        "title": "显示目标进度",
        "prompt": "增加 Total 字段并限制 Completed 不超过 Total。",
        "verification": "目标 5，连续增加 3 和 4 后不会超过 5。"
      },
      {
        "level": "挑战",
        "title": "显式错误契约",
        "prompt": "将忽略无效增量改成返回 error。",
        "verification": "失败操作不改变原状态，调用者能判断失败原因。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：零值结构体的 Completed 为 0。",
      "对照具体错误检查：需要修改时使用 *Progress 接收者。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "Progress{} 使用字段零值，Completed 从 0 开始。",
      "指针接收者可以更新原结构体，值接收者的方法修改副本不会更新原值。",
      "大写名称可跨包访问。指针不保证非 nil，公开接口仍须定义 nil 的使用约束。"
    ]
  },
  {
    "id": "go-07",
    "topic": "接口与组合",
    "category": "核心能力",
    "desc": "以小接口表达调用方真正需要的能力。Go 的接口通常隐式满足，不要求在类型声明处写 implements。",
    "code": "package main\nimport \"fmt\"\n\ntype Labeler interface { Label() string }\ntype Course struct { Title string }\nfunc (c Course) Label() string { return \"课程：\" + c.Title }\nfunc show(item Labeler) { fmt.Println(item.Label()) }\nfunc main() { show(Course{Title: \"接口\"}) }",
    "output": "课程：接口",
    "mentalModel": "接口是一张能力清单。调用方只要求能够 Label，就不必知道提供者具体是课程、任务还是测试对象。",
    "concepts": [
      "方法集合满足接口即实现接口，无需显式声明。",
      "值类型与指针类型的方法集合有区别：只在 *T 上定义的方法，不会让 T 自动满足对应接口。",
      "接口值包含动态类型和值，装着 nil 指针的接口自身可能不等于 nil。"
    ],
    "errors": [
      "传值实例给仅由指针实现的接口。",
      "创建包含大量不相关方法的巨大接口。",
      "把装有 nil 指针的接口当作 nil。"
    ],
    "fixes": [
      "传入指针或调整方法接收者。",
      "在使用方定义最小能力接口。",
      "避免返回带 nil 动态值的接口，必要时显式检查实际指针。"
    ],
    "objectives": [
      "定义和满足小接口",
      "用接口解耦展示逻辑",
      "理解方法集合边界"
    ],
    "prerequisites": [
      "结构体与方法"
    ],
    "steps": [
      "Course 提供 Label() string，满足 Labeler。",
      "show 接收接口，只调用 Label。",
      "方法把标题拼入文字，统一展示函数负责输出。"
    ],
    "sourceRefs": [
      "go-spec",
      "go-effective"
    ],
    "title": "Go 接口与组合",
    "version": "Go 1.23",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“接口与组合”示例，先写出预测结果，再运行核对。",
        "verification": "课程：接口"
      },
      {
        "level": "进阶",
        "title": "增加第二种实现",
        "prompt": "定义 Task 类型实现同一个 Labeler。",
        "verification": "show 对课程和任务都能工作，无需 switch 判断类型。"
      },
      {
        "level": "挑战",
        "title": "注入输出依赖",
        "prompt": "让展示函数接收 io.Writer，测试时使用 bytes.Buffer。",
        "verification": "测试能比较缓冲区内容，不依赖终端输出。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：Course 提供 Label() string，满足 Labeler。",
      "对照具体错误检查：传入指针或调整方法接收者。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "方法集合满足接口即实现接口，无需显式声明。",
      "值类型与指针类型的方法集合有区别：只在 *T 上定义的方法，不会让 T 自动满足对应接口。",
      "接口值包含动态类型和值，装着 nil 指针的接口自身可能不等于 nil。"
    ]
  },
  {
    "id": "go-08",
    "topic": "defer 与资源清理",
    "category": "进阶应用",
    "desc": "认识 defer 的注册时机与后进先出顺序，建立资源获得后立即安排释放的习惯。示例用输出模拟清理，避免依赖在线沙盒的文件权限。",
    "code": "package main\nimport \"fmt\"\n\nfunc work() {\n    defer fmt.Println(\"清理外层\")\n    defer fmt.Println(\"清理内层\")\n    fmt.Println(\"处理记录\")\n}\nfunc main() {\n    work()\n    fmt.Println(\"返回主流程\")\n}",
    "output": "处理记录\n清理内层\n清理外层\n返回主流程",
    "mentalModel": "defer 像在函数出口放一叠待办单，后放的先执行。它绑定的是函数返回，不是普通花括号块的结束。",
    "concepts": [
      "defer 的调用参数在注册时求值，真正调用延迟到当前函数返回。",
      "多个 defer 按后进先出执行，因此本例内层先清理。",
      "打开文件成功后再 defer Close；若循环处理很多资源，应拆成单次处理函数或及时关闭，避免资源累积。"
    ],
    "errors": [
      "打开失败仍对 nil 文件安排 Close。",
      "以为循环每轮结束都会执行 defer。",
      "忽略写文件时 Close 也可能报告错误。"
    ],
    "fixes": [
      "先检查 Open 返回的 error，成功后再注册清理。",
      "用小函数控制单轮资源生命周期。",
      "持久化写入场景按需要检查刷新和关闭结果。"
    ],
    "objectives": [
      "预测 defer 的执行顺序",
      "安排资源清理时机",
      "识别循环中延迟清理的风险"
    ],
    "prerequisites": [
      "函数与错误返回"
    ],
    "steps": [
      "work 注册两条清理语句，但暂不执行。",
      "正常输出处理记录后，函数即将返回。",
      "后注册的内层清理先执行，随后外层，最后 main 继续。"
    ],
    "sourceRefs": [
      "go-spec",
      "go-effective"
    ],
    "title": "Go defer 与资源清理",
    "version": "Go 1.23",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“defer 与资源清理”示例，先写出预测结果，再运行核对。",
        "verification": "处理记录 / 清理内层 / 清理外层 / 返回主流程"
      },
      {
        "level": "进阶",
        "title": "观察参数求值",
        "prompt": "注册 defer 打印变量，然后改变变量，比较直接参数与闭包的结果。",
        "verification": "解释为什么直接参数保留注册时的值。"
      },
      {
        "level": "挑战",
        "title": "设计逐条资源处理",
        "prompt": "本地实现读取多个小文件，每个文件在单独函数中打开和关闭。",
        "verification": "遇到不存在的文件时报告错误，其他资源仍按契约关闭。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：work 注册两条清理语句，但暂不执行。",
      "对照具体错误检查：先检查 Open 返回的 error，成功后再注册清理。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "defer 的调用参数在注册时求值，真正调用延迟到当前函数返回。",
      "多个 defer 按后进先出执行，因此本例内层先清理。",
      "打开文件成功后再 defer Close；若循环处理很多资源，应拆成单次处理函数或及时关闭，避免资源累积。"
    ]
  },
  {
    "id": "go-09",
    "topic": "goroutine 与 channel",
    "category": "进阶应用",
    "desc": "用 goroutine 启动并发任务，用 channel 传递结果并等待完成。先掌握有明确起点和终点的通信，再扩展到多个生产者。",
    "code": "package main\nimport \"fmt\"\n\nfunc sum(values []int, result chan<- int) {\n    total := 0\n    for _, value := range values { total += value }\n    result <- total\n}\nfunc main() {\n    result := make(chan int)\n    go sum([]int{8, 13, 9}, result)\n    fmt.Println(<-result)\n}",
    "output": "30",
    "mentalModel": "goroutine 是可并发推进的任务，channel 是同步交接点。主任务停在接收处等结果，工作任务计算后送出值，两者配合完成一次交接。",
    "concepts": [
      "go 启动并发执行，但 main 返回时程序退出，不会自动等待所有 goroutine。",
      "无缓冲 channel 的发送与接收需要配对；单向 chan<- 限定工作函数只能发送。",
      "关闭 channel 通常由发送方负责。一次明确的收发不要求关闭；range 持续接收则需要有明确终止策略。"
    ],
    "errors": [
      "启动 goroutine 后 main 立即返回。",
      "只有发送没有接收导致阻塞。",
      "多个发送者随意关闭同一 channel。"
    ],
    "fixes": [
      "用通信、WaitGroup 等等待任务结束，避免用 Sleep 猜时间。",
      "为每个阻塞点说明谁负责另一端及其退出条件。",
      "由明确的协调者在全部发送完成后关闭。"
    ],
    "objectives": [
      "启动并发任务",
      "通过 channel 等待结果",
      "识别死锁与退出问题"
    ],
    "prerequisites": [
      "函数",
      "切片"
    ],
    "steps": [
      "main 创建无缓冲 channel，并启动 sum。",
      "sum 计算 8 + 13 + 9 = 30。",
      "main 的接收与发送配对，收到后输出 30。"
    ],
    "sourceRefs": [
      "go-spec",
      "go-effective"
    ],
    "title": "Go goroutine 与 channel",
    "version": "Go 1.23",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“goroutine 与 channel”示例，先写出预测结果，再运行核对。",
        "verification": "30"
      },
      {
        "level": "进阶",
        "title": "合并两个任务",
        "prompt": "并发计算两份切片，再接收两个结果并求和。",
        "verification": "结果之和确定，不假设两个结果到达的顺序。"
      },
      {
        "level": "挑战",
        "title": "加入取消机制",
        "prompt": "使用 context 和 select，让等待方能在取消后退出。",
        "verification": "取消与正常完成两种路径都不遗留永久阻塞的 goroutine。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：main 创建无缓冲 channel，并启动 sum。",
      "对照具体错误检查：用通信、WaitGroup 等等待任务结束，避免用 Sleep 猜时间。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "go 启动并发执行，但 main 返回时程序退出，不会自动等待所有 goroutine。",
      "无缓冲 channel 的发送与接收需要配对；单向 chan<- 限定工作函数只能发送。",
      "关闭 channel 通常由发送方负责。一次明确的收发不要求关闭；range 持续接收则需要有明确终止策略。"
    ]
  },
  {
    "id": "go-10",
    "topic": "表驱动测试",
    "category": "进阶应用",
    "desc": "将输入和预期结果组织成表，用同一套检查遍历多个场景。在线示例自包含；本地可把函数移入模块，并用 _test.go、testing.T 与 go test 执行。",
    "code": "package main\nimport \"fmt\"\n\nfunc clamp(value int) int {\n    if value < 0 { return 0 }\n    if value > 100 { return 100 }\n    return value\n}\nfunc main() {\n    cases := []struct{ input, want int }{\n        {-3, 0}, {42, 42}, {120, 100}, {0, 0}, {100, 100},\n    }\n    for _, test := range cases {\n        if got := clamp(test.input); got != test.want {\n            panic(fmt.Sprintf(\"input=%d got=%d want=%d\", test.input, got, test.want))\n        }\n    }\n    fmt.Println(\"5 项测试通过\")\n}",
    "output": "5 项测试通过",
    "mentalModel": "测试表是一份行为规格：每一行表达一个输入对应的承诺。循环只是执行规格的工具，边界是否覆盖由测试数据决定。",
    "concepts": [
      "表驱动测试避免重复调用逻辑，使新增边界只需增加一行数据。",
      "本地测试文件名以 _test.go 结尾，测试函数为 TestXxx(t *testing.T)；失败使用 t.Errorf 或 t.Fatalf。",
      "go test -race 可在支持的平台帮助发现数据竞争，但测试通过不证明所有并发路径都安全。"
    ],
    "errors": [
      "只验证中间值而遗漏 0 和 100。",
      "失败消息只有失败二字，无法定位输入。",
      "把性能测试和正确性断言混在同一目标中。"
    ],
    "fixes": [
      "分别覆盖区间内、边界、上下界外。",
      "输出 input、got 和 want，便于复现。",
      "先建立正确性测试，再独立编写基准测试。"
    ],
    "objectives": [
      "组织表驱动用例",
      "覆盖边界与异常范围",
      "输出可定位的失败信息"
    ],
    "prerequisites": [
      "结构体",
      "循环与函数"
    ],
    "steps": [
      "clamp 将分数压到闭区间 0 到 100。",
      "五组数据覆盖下界外、内部、上界外和两个边界。",
      "每行比较 got 与 want，全部一致才输出通过摘要。"
    ],
    "sourceRefs": [
      "go-spec",
      "go-effective"
    ],
    "title": "Go 表驱动测试",
    "version": "Go 1.23",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“表驱动测试”示例，先写出预测结果，再运行核对。",
        "verification": "5 项测试通过"
      },
      {
        "level": "进阶",
        "title": "增加具名用例",
        "prompt": "给每个测试记录增加 name，失败时包含名称。",
        "verification": "能直接判断失败的是下界、上界还是普通值。"
      },
      {
        "level": "挑战",
        "title": "迁移到标准测试",
        "prompt": "本地建立模块，将测试拆到 score_test.go，用 t.Run 执行子测试。",
        "verification": "go test ./... 全部通过，故意改错 clamp 后至少一个用例失败。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：clamp 将分数压到闭区间 0 到 100。",
      "对照具体错误检查：分别覆盖区间内、边界、上下界外。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "表驱动测试避免重复调用逻辑，使新增边界只需增加一行数据。",
      "本地测试文件名以 _test.go 结尾，测试函数为 TestXxx(t *testing.T)；失败使用 t.Errorf 或 t.Fatalf。",
      "go test -race 可在支持的平台帮助发现数据竞争，但测试通过不证明所有并发路径都安全。"
    ]
  }
];

const extraPythonSeeds: LessonSeed[] = [
  {
    "id": "python-11",
    "topic": "迭代器与生成器",
    "category": "进阶应用",
    "desc": "用 yield 按需产生值，理解生成器的暂停、恢复和耗尽。将数据处理拆成逐条读取与消费，避免为了求和先构造完整中间列表。",
    "code": "def passing_scores(values):\n    for value in values:\n        if value >= 60:\n            yield value\n\nscores = passing_scores([52, 75, 90])\nprint(next(scores))\nprint(sum(scores))\nprint(list(scores))",
    "output": "75\n90\n[]",
    "mentalModel": "生成器像一位按需交出下一条记录的工作人员，交出一条后保存当前位置；消费完成后不会自动回到起点。",
    "concepts": [
      "调用生成器函数先得到生成器对象，实际执行在 next 或遍历时推进。",
      "yield 返回一个值并保留局部状态；迭代耗尽会以 StopIteration 表示结束，for 会处理这个信号。",
      "按需迭代减少中间集合，但结果仍依赖底层数据；多次遍历需要新建迭代器或显式保存结果。"
    ],
    "errors": [
      "打印生成器就期待全部内容。",
      "先 sum 再遍历同一生成器却得到空结果。",
      "对可能为空的生成器直接 next。"
    ],
    "fixes": [
      "用 for 逐项消费；只在数据量可控时转 list。",
      "重复使用时重新创建生成器或保存必要结果。",
      "使用 next(iterator, default) 或处理 StopIteration。"
    ],
    "objectives": [
      "编写 yield 生成器",
      "跟踪逐步消费状态",
      "处理空输入和迭代耗尽"
    ],
    "prerequisites": [
      "Python 函数与循环"
    ],
    "steps": [
      "next 跳过 52，在 75 处暂停并返回。",
      "sum 从暂停处继续，只消费剩下的 90。",
      "生成器已耗尽，所以 list 得到空列表。"
    ],
    "sourceRefs": [
      "python-iterators"
    ],
    "version": "Python 3.12",
    "title": "Python 迭代器与生成器",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“迭代器与生成器”示例，先写出预测结果，再运行核对。",
        "verification": "75 / 90 / []"
      },
      {
        "level": "进阶",
        "title": "限制读取数量",
        "prompt": "使用 itertools.islice 只消费前三个合格分数。",
        "verification": "输入不足三项时不报错；后续值在未消费前不执行。"
      },
      {
        "level": "挑战",
        "title": "流水线统计",
        "prompt": "将逐行解析、筛选、求和分成三个按需处理阶段。",
        "verification": "空输入得到定义好的结果；无效行按明确策略处理。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：next 跳过 52，在 75 处暂停并返回。",
      "对照具体错误检查：用 for 逐项消费；只在数据量可控时转 list。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "调用生成器函数先得到生成器对象，实际执行在 next 或遍历时推进。",
      "yield 返回一个值并保留局部状态；迭代耗尽会以 StopIteration 表示结束，for 会处理这个信号。",
      "按需迭代减少中间集合，但结果仍依赖底层数据；多次遍历需要新建迭代器或显式保存结果。"
    ]
  },
  {
    "id": "python-12",
    "topic": "JSON 与数据交换",
    "category": "工程实践",
    "desc": "理解 JSON 文本与 Python 对象的边界，使用 json 完成编码解码，并验证接口数据的结构、类型和取值。",
    "code": "import json\n\ndef read_minutes(text):\n    data = json.loads(text)\n    if not isinstance(data, dict):\n        raise ValueError(\"需要对象\")\n    value = data.get(\"minutes\")\n    if type(value) is not int or value < 0:\n        raise ValueError(\"minutes 必须为非负整数\")\n    return value\n\nprint(read_minutes('{\"minutes\":35}'))\nprint(json.dumps({\"title\": \"数据交换\", \"done\": True}, ensure_ascii=False))",
    "output": "35\n{\"title\": \"数据交换\", \"done\": true}",
    "mentalModel": "JSON 是跨系统运送数据的文字格式，解析只是把文字变成对象；对象是否符合学习记录的规则，还要再检查。",
    "concepts": [
      "loads 将字符串解码为对象，dumps 将支持的对象编码为字符串；文件流使用 load 与 dump。",
      "JSON 的 true、false、null 对应 Python 的 True、False、None；不能将任意 Python 对象直接序列化。",
      "bool 在 Python 中是 int 的子类；本例要拒绝布尔值，因此用 type(value) is int 检查精确整数。"
    ],
    "errors": [
      "将 JSON 文本用 eval 执行。",
      "解析成功后不校验字段就写入数据。",
      "把超大外部 JSON 无限制加载到内存。"
    ],
    "fixes": [
      "始终使用 JSON 解析器，数据不作为代码执行。",
      "验证对象形状、字段类型和范围后再使用。",
      "在入口限制大小，按需求选用流式或分批处理。"
    ],
    "objectives": [
      "区分编码与解码",
      "验证外部数据边界",
      "正确展示中文与布尔值"
    ],
    "prerequisites": [
      "字典",
      "异常处理"
    ],
    "steps": [
      "loads 生成字典，minutes 字段通过精确整数与非负校验。",
      "第一次 print 输出 35。",
      "dumps 保留中文，True 编码成 JSON 的 true。"
    ],
    "sourceRefs": [
      "python-json"
    ],
    "version": "Python 3.12",
    "title": "Python JSON 与数据交换",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“JSON 与数据交换”示例，先写出预测结果，再运行核对。",
        "verification": "35 / {\"title\": \"数据交换\", \"done\": true}"
      },
      {
        "level": "进阶",
        "title": "捕获两类错误",
        "prompt": "分别处理 JSONDecodeError 与业务 ValueError。",
        "verification": "无效 JSON 和负分钟数给出不同错误信息；true 被拒绝。"
      },
      {
        "level": "挑战",
        "title": "版本化记录",
        "prompt": "为数据增加 schemaVersion，并编写旧版到新版的纯转换函数。",
        "verification": "旧记录不会被覆盖；未知版本明确拒绝。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：loads 生成字典，minutes 字段通过精确整数与非负校验。",
      "对照具体错误检查：始终使用 JSON 解析器，数据不作为代码执行。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "loads 将字符串解码为对象，dumps 将支持的对象编码为字符串；文件流使用 load 与 dump。",
      "JSON 的 true、false、null 对应 Python 的 True、False、None；不能将任意 Python 对象直接序列化。",
      "bool 在 Python 中是 int 的子类；本例要拒绝布尔值，因此用 type(value) is int 检查精确整数。"
    ]
  }
];
pythonSeeds.push(...extraPythonSeeds);

const extraJavaScriptSeeds: LessonSeed[] = [
  {
    "id": "javascript-11",
    "topic": "Map 与 Set",
    "category": "数据结构",
    "desc": "使用 Set 去重、Map 按键聚合。根据键的类型选择对象或 Map，理解对象身份与插入顺序。",
    "code": "const visits = [\"js\", \"go\", \"js\", \"ts\", \"go\"];\nconst counts = new Map();\nfor (const language of visits) {\n  counts.set(language, (counts.get(language) ?? 0) + 1);\n}\nconsole.log([...new Set(visits)].join(\",\"));\nconsole.log(counts.get(\"go\"));\nconsole.log(counts.has(\"python\"));",
    "output": "js,go,ts\n2\nfalse",
    "mentalModel": "Set 回答这个值是否出现过，Map 回答这个键对应什么值。两者都强调键或成员的身份，不会自动把内容相同的不同对象视为同一个。",
    "concepts": [
      "Set 保存唯一值并按插入顺序迭代，适合去重与成员检查。",
      "Map 支持不同类型的键；get 缺失返回 undefined，has 可区分缺失与值本身为 undefined。",
      "对象键按身份比较。两个独立的 {id:1} 是两个键；应按稳定 id 聚合业务对象。"
    ],
    "errors": [
      "使用 map[key] 代替 map.set。",
      "期望不同对象因字段相同而自动合并。",
      "JSON.stringify(map) 后以为键值被保存。"
    ],
    "fixes": [
      "使用 set/get/has/delete 操作集合内容。",
      "按业务唯一 id 建立键。",
      "先转换成 entries 数组再编码，并明确键类型的恢复规则。"
    ],
    "objectives": [
      "用 Set 去重",
      "用 Map 做频次统计",
      "区分对象内容与身份"
    ],
    "prerequisites": [
      "数组",
      "for...of 循环"
    ],
    "steps": [
      "按访问顺序累加每种语言的计数。",
      "Set 保留首次出现的 js、go、ts。",
      "go 的计数为 2，python 不在映射中。"
    ],
    "sourceRefs": [
      "js-map"
    ],
    "version": "ECMAScript 2023 / Node.js 20+",
    "title": "JavaScript Map 与 Set",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“Map 与 Set”示例，先写出预测结果，再运行核对。",
        "verification": "js,go,ts / 2 / false"
      },
      {
        "level": "进阶",
        "title": "稳定排行榜",
        "prompt": "转换 Map 条目并按数量降序，同数量按名称排序。",
        "verification": "得到 go、js、ts；空输入得到空榜单。"
      },
      {
        "level": "挑战",
        "title": "对象访问统计",
        "prompt": "将记录改为 {userId,language}，按 userId 统计不同语言数。",
        "verification": "重复对象实例不会重复计算同一用户的同一语言。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：按访问顺序累加每种语言的计数。",
      "对照具体错误检查：使用 set/get/has/delete 操作集合内容。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "Set 保存唯一值并按插入顺序迭代，适合去重与成员检查。",
      "Map 支持不同类型的键；get 缺失返回 undefined，has 可区分缺失与值本身为 undefined。",
      "对象键按身份比较。两个独立的 {id:1} 是两个键；应按稳定 id 聚合业务对象。"
    ]
  },
  {
    "id": "javascript-12",
    "topic": "JSON 与接口契约",
    "category": "工程实践",
    "desc": "在接口边界解析 JSON，再检查结构与业务范围。用 Result 风格的数据让调用者明确区分合法值和校验失败。",
    "code": "function readProgress(text) {\n  try {\n    const value = JSON.parse(text);\n    if (!value || typeof value !== \"object\" || Array.isArray(value) ||\n        !Number.isSafeInteger(value.completed) || value.completed < 0) {\n      return { ok: false, error: \"进度格式错误\" };\n    }\n    return { ok: true, completed: value.completed };\n  } catch {\n    return { ok: false, error: \"不是有效 JSON\" };\n  }\n}\nconsole.log(JSON.stringify(readProgress('{\"completed\":3}')));\nconsole.log(JSON.stringify(readProgress('{\"completed\":-1}')));",
    "output": "{\"ok\":true,\"completed\":3}\n{\"ok\":false,\"error\":\"进度格式错误\"}",
    "mentalModel": "解析器负责判断数据的语法，验证函数负责判断数据能否进入业务。成功返回值只携带已核实字段，让后续逻辑有可靠起点。",
    "concepts": [
      "JSON.parse 会对语法错误抛出异常，但合法 JSON 可以是 null、数组或数字，不一定是对象。",
      "数值范围、整数精度和必填字段必须另外验证；只检查 truthy 会误伤合法的 0。",
      "JSON.stringify 不是完整深拷贝工具，函数、undefined、循环引用和 BigInt 等有不同限制。"
    ],
    "errors": [
      "只 catch 解析异常却忽略业务字段。",
      "把值为 0 判成未填写。",
      "未经筛选地将输入展开到业务对象。"
    ],
    "fixes": [
      "解析后检查形状和每个需要的字段。",
      "使用明确类型和范围检查。",
      "显式构建输出对象，仅保留允许字段。"
    ],
    "objectives": [
      "设计 JSON 验证函数",
      "区分语法错误与业务错误",
      "保持有效零值"
    ],
    "prerequisites": [
      "对象",
      "异常处理"
    ],
    "steps": [
      "第一条数据具有非负安全整数 3，返回成功对象。",
      "第二条数据为负数，返回格式错误。",
      "JSON.stringify 输出确定的 JSON 文本用于观察。"
    ],
    "sourceRefs": [
      "js-json"
    ],
    "version": "ECMAScript 2023 / Node.js 20+",
    "title": "JavaScript JSON 与接口契约",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“JSON 与接口契约”示例，先写出预测结果，再运行核对。",
        "verification": "{\"ok\":true,\"completed\":3} / {\"ok\":false,\"error\":\"进度格式错误\"}"
      },
      {
        "level": "进阶",
        "title": "覆盖边界",
        "prompt": "验证 null、[]、{}、0、-1 和字符串数字。",
        "verification": "仅合法对象中的非负安全整数被接受。"
      },
      {
        "level": "挑战",
        "title": "异步 API 包装",
        "prompt": "将验证函数接到 fetch 的 response.text 之后，并分别处理 HTTP、网络和数据错误。",
        "verification": "测试使用伪造响应，不依赖真实外部网络。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：第一条数据具有非负安全整数 3，返回成功对象。",
      "对照具体错误检查：解析后检查形状和每个需要的字段。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "JSON.parse 会对语法错误抛出异常，但合法 JSON 可以是 null、数组或数字，不一定是对象。",
      "数值范围、整数精度和必填字段必须另外验证；只检查 truthy 会误伤合法的 0。",
      "JSON.stringify 不是完整深拷贝工具，函数、undefined、循环引用和 BigInt 等有不同限制。"
    ]
  }
];
javascriptSeeds.push(...extraJavaScriptSeeds);

const extraJavaSeeds: LessonSeed[] = [
  {
    "id": "java-11",
    "topic": "Lambda 与 Stream",
    "category": "进阶应用",
    "desc": "用 Lambda 描述行为，用 Stream 连接筛选、映射和聚合。以完成课程的学习时长为例，理解流水线与集合存储的区别。",
    "code": "import java.util.List;\npublic class Main {\n    public static void main(String[] args) {\n        List<Integer> minutes = List.of(12, 35, 8, 20);\n        int total = minutes.stream()\n            .filter(value -> value >= 15)\n            .mapToInt(Integer::intValue)\n            .sum();\n        System.out.println(total);\n        System.out.println(minutes.size());\n    }\n}",
    "output": "55\n4",
    "mentalModel": "集合保存原始记录，流描述如何消费这些记录。中间操作像一张处理计划，终止操作才启动计算，流用完就不能重复消费。",
    "concepts": [
      "filter 等中间操作通常惰性执行；sum、collect、count 等终止操作触发消费。",
      "mapToInt 使用原始类型流，避免后续数值聚合中的装箱；空 IntStream 的 sum 为 0。",
      "回调应尽量无副作用；parallelStream 不保证加速，也不适合直接修改共享 ArrayList。"
    ],
    "errors": [
      "复用已执行终止操作的同一个 Stream。",
      "在 filter 内修改外部集合。",
      "把 parallel 当成免费的性能提升。"
    ],
    "fixes": [
      "需要再次处理时从集合重新创建流。",
      "用返回值或收集器表达结果，避免隐藏写入。",
      "先测量，确认线程安全和任务规模后再考虑并行。"
    ],
    "objectives": [
      "编写 Lambda 流水线",
      "区分中间与终止操作",
      "避免共享状态副作用"
    ],
    "prerequisites": [
      "Java 集合",
      "泛型"
    ],
    "steps": [
      "原列表有四项，筛选保留 35 与 20。",
      "mapToInt 转为整数流，sum 求得 55。",
      "原集合未被修改，size 仍为 4。"
    ],
    "sourceRefs": [
      "java-stream"
    ],
    "version": "Java 17",
    "title": "Java Lambda 与 Stream",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“Lambda 与 Stream”示例，先写出预测结果，再运行核对。",
        "verification": "55 / 4"
      },
      {
        "level": "进阶",
        "title": "计算平均值",
        "prompt": "用 average 并处理空结果。",
        "verification": "原数据筛选后的平均值为 27.5；空结果有明确默认策略。"
      },
      {
        "level": "挑战",
        "title": "分组统计",
        "prompt": "按课程类别分组统计总时长，比较循环与 collecting 实现。",
        "verification": "两种实现在空数据、单项及重复类别输入下结果相同。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：原列表有四项，筛选保留 35 与 20。",
      "对照具体错误检查：需要再次处理时从集合重新创建流。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "filter 等中间操作通常惰性执行；sum、collect、count 等终止操作触发消费。",
      "mapToInt 使用原始类型流，避免后续数值聚合中的装箱；空 IntStream 的 sum 为 0。",
      "回调应尽量无副作用；parallelStream 不保证加速，也不适合直接修改共享 ArrayList。"
    ]
  },
  {
    "id": "java-12",
    "topic": "Optional 与缺失值",
    "category": "可靠性",
    "desc": "用 Optional 明确表示查询可能没有结果。通过 map、filter 与 orElse 组织缺失值分支，避免到处散落的 null 检查。",
    "code": "import java.util.Optional;\npublic class Main {\n    static Optional<String> cleanTitle(String value) {\n        return Optional.ofNullable(value).map(String::strip).filter(text -> !text.isEmpty());\n    }\n    public static void main(String[] args) {\n        System.out.println(cleanTitle(\"  集合练习  \").orElse(\"未命名\"));\n        System.out.println(cleanTitle(\"   \").orElse(\"未命名\"));\n        System.out.println(cleanTitle(null).isEmpty());\n    }\n}",
    "output": "集合练习\n未命名\ntrue",
    "mentalModel": "Optional 把可能缺失写进返回契约。它不是一个能绕过所有空指针问题的护身符，而是提醒调用者明确选择有值与无值的路径。",
    "concepts": [
      "ofNullable 可接受 null，of 不可；方法返回 Optional 时，Optional 本身不应为 null。",
      "map 变换已存在值，filter 可将不满足规则的值变成空；flatMap 用于本身返回 Optional 的转换。",
      "orElse 的参数会先求值；昂贵或有副作用的默认值用 orElseGet 延迟计算。"
    ],
    "errors": [
      "未检查就调用 get。",
      "用 Optional.of 包装可能为 null 的输入。",
      "让方法返回 null 来表示空 Optional。"
    ],
    "fixes": [
      "用 orElse、orElseThrow 或 ifPresent 表达策略。",
      "对可空输入使用 ofNullable。",
      "返回 Optional.empty()。"
    ],
    "objectives": [
      "表达可缺失返回值",
      "组合 map 与 filter",
      "选择合适的默认值策略"
    ],
    "prerequisites": [
      "Java Lambda",
      "字符串"
    ],
    "steps": [
      "第一项先 strip 去空白，filter 保留非空标题。",
      "纯空白转换成空字符串后被 filter 去除，使用默认值。",
      "null 从开始就是空 Optional，isEmpty 为 true。"
    ],
    "sourceRefs": [
      "java-optional"
    ],
    "version": "Java 17",
    "title": "Java Optional 与缺失值",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“Optional 与缺失值”示例，先写出预测结果，再运行核对。",
        "verification": "集合练习 / 未命名 / true"
      },
      {
        "level": "进阶",
        "title": "延迟默认值",
        "prompt": "以带计数的默认值生成函数比较 orElse 与 orElseGet。",
        "verification": "有值时只有 orElseGet 能避免执行生成函数。"
      },
      {
        "level": "挑战",
        "title": "组合可选查找",
        "prompt": "先查课程再查作者，两个步骤都返回 Optional，用 flatMap 组合。",
        "verification": "任一步缺失都得到空结果，不调用未经检查的 get。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：第一项先 strip 去空白，filter 保留非空标题。",
      "对照具体错误检查：用 orElse、orElseThrow 或 ifPresent 表达策略。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "ofNullable 可接受 null，of 不可；方法返回 Optional 时，Optional 本身不应为 null。",
      "map 变换已存在值，filter 可将不满足规则的值变成空；flatMap 用于本身返回 Optional 的转换。",
      "orElse 的参数会先求值；昂贵或有副作用的默认值用 orElseGet 延迟计算。"
    ]
  }
];
javaSeeds.push(...extraJavaSeeds);

const extraCppSeeds: LessonSeed[] = [
  {
    "id": "cpp-11",
    "topic": "Lambda 与标准算法",
    "category": "进阶应用",
    "desc": "以 Lambda 表达小型判定规则，用标准算法完成计数和转换。明确半开区间、捕获方式以及算法对源数据的影响。",
    "code": "#include <algorithm>\n#include <iostream>\n#include <vector>\nint main() {\n    const std::vector<int> minutes{12, 35, 8, 20};\n    const int threshold = 15;\n    const auto count = std::count_if(minutes.begin(), minutes.end(),\n        [threshold](int value) { return value >= threshold; });\n    std::cout << count << '\\n';\n    std::cout << minutes.size() << '\\n';\n}",
    "output": "2\n4",
    "mentalModel": "算法负责遍历，Lambda 负责对一个元素做判断。捕获列表说明这段行为还依赖哪些外部状态，让依赖边界可见。",
    "concepts": [
      "count_if 接收 [begin,end) 范围和谓词，统计返回 true 的元素。",
      "[threshold] 按值捕获当前值；[&threshold] 引用外部对象，其生命周期必须覆盖使用期。",
      "不要假设算法调用谓词的细节适合维护外部计数；尽量让谓词只依赖输入与不可变配置。"
    ],
    "errors": [
      "返回后使用捕获局部变量引用的 Lambda。",
      "在谓词中修改正在遍历的 vector 长度。",
      "混淆 end 迭代器与最后一个元素。"
    ],
    "fixes": [
      "需要延长使用时按值捕获合适数据。",
      "将筛选结果写入独立容器，或选择专门的修改算法。",
      "end 指向末尾之后，不可解引用。"
    ],
    "objectives": [
      "使用 count_if",
      "选择捕获方式",
      "维护迭代器有效性"
    ],
    "prerequisites": [
      "C++ STL 容器",
      "函数"
    ],
    "steps": [
      "threshold 以值捕获进 Lambda。",
      "35 和 20 满足条件，因此 count 为 2。",
      "算法没有改变原容器，size 保持 4。"
    ],
    "sourceRefs": [
      "cppreference"
    ],
    "version": "C++17",
    "title": "C++ Lambda 与标准算法",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“Lambda 与标准算法”示例，先写出预测结果，再运行核对。",
        "verification": "2 / 4"
      },
      {
        "level": "进阶",
        "title": "复制合格记录",
        "prompt": "用 copy_if 与 back_inserter 生成新 vector。",
        "verification": "新容器为 35、20，原容器仍有四项。"
      },
      {
        "level": "挑战",
        "title": "可复用筛选器",
        "prompt": "编写返回 Lambda 的工厂，按值保存阈值。",
        "verification": "工厂返回后仍能安全使用；不同阈值的筛选器互不影响。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：threshold 以值捕获进 Lambda。",
      "对照具体错误检查：需要延长使用时按值捕获合适数据。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "count_if 接收 [begin,end) 范围和谓词，统计返回 true 的元素。",
      "[threshold] 按值捕获当前值；[&threshold] 引用外部对象，其生命周期必须覆盖使用期。",
      "不要假设算法调用谓词的细节适合维护外部计数；尽量让谓词只依赖输入与不可变配置。"
    ]
  },
  {
    "id": "cpp-12",
    "topic": "optional 与返回契约",
    "category": "可靠性",
    "desc": "用 C++17 的 std::optional 表示可能不存在的普通结果。通过课程位置查询，区分找到值、没有结果与真正异常。",
    "code": "#include <iostream>\n#include <optional>\n#include <vector>\nstd::optional<int> at(const std::vector<int>& values, std::size_t index) {\n    if (index >= values.size()) return std::nullopt;\n    return values[index];\n}\nint main() {\n    const std::vector<int> minutes{12, 35};\n    const auto found = at(minutes, 1);\n    if (found) std::cout << *found << '\\n';\n    std::cout << at(minutes, 9).value_or(0) << '\\n';\n}",
    "output": "35\n0",
    "mentalModel": "optional 像一个可能为空的小盒子。存在检查针对盒子，而不是里面整数的真假，因此值为 0 仍然是有效结果。",
    "concepts": [
      "std::optional<T> 可存放一个 T 或空状态，std::nullopt 明确表示缺失。",
      "只有包含值时才能解引用；value 在空时抛出 bad_optional_access，value_or 提供默认值。",
      "optional 适合预期的无结果，不包含失败原因；需要错误详情时另设计结果结构或异常契约。"
    ],
    "errors": [
      "不检查就解引用空 optional。",
      "用 -1 哨兵混淆业务负值与缺失。",
      "把容器所有越界都当成无法恢复的崩溃。"
    ],
    "fixes": [
      "先 if(result) 再访问值。",
      "把是否有值与值本身分开表示。",
      "在查询边界明确返回空结果，调用方决定展示策略。"
    ],
    "objectives": [
      "表达可缺失结果",
      "安全访问 optional",
      "选择默认值和错误契约"
    ],
    "prerequisites": [
      "C++ 函数与 vector",
      "C++17 编译环境"
    ],
    "steps": [
      "位置 1 小于 size 2，返回装有 35 的 optional。",
      "found 检查成功后才解引用。",
      "位置 9 返回空，value_or 输出默认值 0。"
    ],
    "sourceRefs": [
      "cppreference"
    ],
    "version": "C++17",
    "title": "C++ optional 与返回契约",
    "reviewedAt": "2026-10-22",
    "exercises": [
      {
        "level": "初级",
        "title": "复现并解释输出",
        "prompt": "独立完成“optional 与返回契约”示例，先写出预测结果，再运行核对。",
        "verification": "35 / 0"
      },
      {
        "level": "进阶",
        "title": "保留零值",
        "prompt": "加入一个真实值为 0 的元素，显示是否有值。",
        "verification": "真实 0 的 has_value 为 true，越界为 false。"
      },
      {
        "level": "挑战",
        "title": "返回带原因的结果",
        "prompt": "设计结构体区分成功、越界和无权限等结果，保持只读查询。",
        "verification": "调用者能展示不同原因，成功值为 0 不被误判。"
      }
    ],
    "debugging": [
      "先定位本节输入与分支：位置 1 小于 size 2，返回装有 35 的 optional。",
      "对照具体错误检查：先 if(result) 再访问值。",
      "固定样例输出后再运行进阶练习中的边界输入，出现差异时逐步检查中间状态。"
    ],
    "summaryPoints": [
      "std::optional<T> 可存放一个 T 或空状态，std::nullopt 明确表示缺失。",
      "只有包含值时才能解引用；value 在空时抛出 bad_optional_access，value_or 提供默认值。",
      "optional 适合预期的无结果，不包含失败原因；需要错误详情时另设计结果结构或异常契约。"
    ]
  }
];
cppSeeds.push(...extraCppSeeds);

function buildCourse(
  name: Lang,
  slug: CourseDefinition["slug"],
  description: string,
  seeds: LessonSeed[],
): CourseDefinition {
  const topics = seeds.map((seed) => seed.topic);
  const built = seeds.map((seed, index) => ({ ...makeLesson(name, index, seed), topics }));
  return { slug, name, queryName: name, ...icons[name], description, lessons: built };
}

export const courseDefinitions: Record<Lang, CourseDefinition> = {
  Python: buildCourse("Python", "python", "从运行环境到测试与模块化，建立清晰、可靠的 Python 编程基础。", pythonSeeds),
  "C/C++": buildCourse("C/C++", "c-cpp", "理解编译、类型、生命周期与资源管理，建立现代 C++ 的安全实践。", cppSeeds),
  JavaScript: buildCourse("JavaScript", "javascript", "从语言运行环境走向浏览器交互、异步编程与工程化。", javascriptSeeds),
  Java: buildCourse("Java", "java", "以静态类型、集合、对象模型和并发基础构建可靠 Java 程序。", javaSeeds),
  TypeScript: buildCourse("TypeScript", "typescript", "从 JavaScript 走向类型安全：收窄、泛型、接口契约、异步数据与边界验证。", typescriptSeeds),
  Go: buildCourse("Go", "go", "从编译运行到切片、接口、错误处理与并发通信，建立可测试的 Go 编程基础。", goSeeds),
};

/** Older saved progress lacks new language keys. Fill them without shifting any lesson. */
export function normalizeCourseTopics(input: Partial<Record<Lang, unknown>> = {}): Record<Lang, number> {
  return Object.fromEntries(languageOrder.map((language) => {
    const value = input[language];
    const index = typeof value === "number" && Number.isInteger(value) ? value : 0;
    return [language, Math.max(0, Math.min(courseDefinitions[language].lessons.length - 1, index))];
  })) as Record<Lang, number>;
}

export const lessons: Record<Lang, Course> = Object.fromEntries(
  (Object.keys(courseDefinitions) as Lang[]).map((language) => {
    const course = courseDefinitions[language];
    return [language, { ...course.lessons[0], topics: course.lessons.map((lesson) => lesson.topic) }];
  }),
) as unknown as Record<Lang, Course>;

export const curriculum: Record<Lang, { lessons: CourseLesson[]; guides: LessonGuide[] }> = Object.fromEntries(
  (Object.keys(courseDefinitions) as Lang[]).map((language) => {
    const course = courseDefinitions[language];
    const guides = course.lessons.map((lesson) => ({
      summary: lesson.mentalModel,
      principles: lesson.concepts.map((concept, index) => ({ badge: String(index + 1).padStart(2, "0"), title: concept.title, text: concept.text })),
      syntaxTitle: `${lesson.topic}：可运行示例`,
      syntaxCode: lesson.code,
      syntaxNote: lesson.desc,
      pitfalls: lesson.commonErrors.map((error) => ({ title: error.title, wrong: error.symptom, right: error.fix })),
    }));
    return [language, { lessons: course.lessons, guides }];
  }),
) as unknown as Record<Lang, { lessons: CourseLesson[]; guides: LessonGuide[] }>;

export const lessonJudgeCases: Record<Lang, Array<{ stdin: string; expected: string }>> = Object.fromEntries(
  (Object.keys(courseDefinitions) as Lang[]).map((language) => [
    language,
    courseDefinitions[language].lessons.map((lesson) => lesson.judge),
  ]),
) as unknown as Record<Lang, Array<{ stdin: string; expected: string }>>;

export function sourceById(sourceId: string): ContentSource | undefined {
  return contentSources.find((source) => source.id === sourceId);
}

export function validateCourseContent(): void {
  const sourceIds = new Set<string>();
  for (const source of contentSources) {
    if (sourceIds.has(source.id)) throw new Error(`课程来源 ID 重复：${source.id}`);
    sourceIds.add(source.id);
    if (!source.sourceUrl.startsWith("https://") || !source.licenseUrl.startsWith("https://")) {
      throw new Error(`课程来源必须使用 HTTPS：${source.id}`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.retrievedAt)) {
      throw new Error(`课程来源检索日期无效：${source.id}`);
    }
    if (source.usageType === "coverage_audit" && !/^[0-9a-f]{40}$/.test(source.sourceRevision)) {
      throw new Error(`Exercism 来源必须固定完整 commit SHA：${source.id}`);
    }
  }

  const expectedLegacyIds: Partial<Record<Lang, string[]>> = {
    Python: ["python-01", "python-02", "python-03", "python-04", "python-05", "python-06", "python-07"],
    "C/C++": ["cpp-01", "cpp-02", "cpp-03", "cpp-04", "cpp-05", "cpp-06", "cpp-07"],
    JavaScript: ["javascript-01", "javascript-02", "javascript-03", "javascript-04", "javascript-05", "javascript-06", "javascript-07"],
    Java: ["java-01", "java-02", "java-03", "java-04", "java-05", "java-06", "java-07"],
  };
  const lessonIds = new Set<string>();
  for (const language of Object.keys(courseDefinitions) as Lang[]) {
    const course = courseDefinitions[language];
    if (course.lessons.length < 10) throw new Error(`${language} 至少包含 10 节课程`);
    const legacyIds = expectedLegacyIds[language];
    if (legacyIds && course.lessons.slice(0, 7).some((lesson, index) => lesson.id !== legacyIds[index])) {
      throw new Error(`${language} 原有七节课程的索引发生变化`);
    }
    for (const lesson of course.lessons) {
      if (lessonIds.has(lesson.id)) throw new Error(`课程 ID 重复：${lesson.id}`);
      lessonIds.add(lesson.id);
      if (!lesson.objectives.length || !lesson.prerequisites.length || lesson.concepts.length < 3 || lesson.commonErrors.length < 3) {
        throw new Error(`课程结构不完整：${lesson.id}`);
      }
      if (lesson.exercises.map((exercise) => exercise.level).join(",") !== "初级,进阶,挑战") {
        throw new Error(`课程练习等级不完整：${lesson.id}`);
      }
      if (!lesson.code.trim() || !lesson.output.trim() || lesson.judge.expected !== lesson.output) {
        throw new Error(`课程示例或判题输出无效：${lesson.id}`);
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(lesson.lastReviewedAt) || !lesson.reviewedLanguageVersion) {
        throw new Error(`课程复核信息不完整：${lesson.id}`);
      }
      for (const sourceId of lesson.sourceRefs) {
        if (!sourceIds.has(sourceId)) throw new Error(`课程引用了未知来源：${lesson.id} -> ${sourceId}`);
      }
    }
  }
}

validateCourseContent();
