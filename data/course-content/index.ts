export type Lang = "Python" | "C/C++" | "JavaScript" | "Java";

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
  slug: "python" | "c-cpp" | "javascript" | "java";
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
};

const icons: Record<Lang, { icon: string; color: string }> = {
  Python: { icon: "Py", color: "#58e6ba" },
  "C/C++": { icon: "C+", color: "#9ca8ff" },
  JavaScript: { icon: "JS", color: "#ffd36a" },
  Java: { icon: "Jv", color: "#ff9677" },
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
    objectives: [
      `能用自己的话解释“${seed.topic}”解决的问题`,
      `能阅读并运行本节的完整 ${language} 示例`,
      "能识别常见边界条件，并用输出或调试信息验证结果",
    ],
    prerequisites: index === 0 ? ["会使用键盘与浏览器", "不要求编程经验"] : ["完成上一节或具备等价知识", "能运行并修改一个短程序"],
    mentalModel: seed.mentalModel,
    concepts,
    steps: ["确认输入数据及其类型", "沿执行顺序观察状态变化", "将实际输出与预期输出逐行比较"],
    commonErrors: seed.errors.map((error, errorIndex) => ({
      title: ["语义误解", "边界遗漏", "验证不足"][errorIndex],
      symptom: error,
      fix: ["先写出最小示例，再逐步增加逻辑。", "补充空值、零长度和极端输入测试。", "不要只看程序是否运行，要核对输出与状态变化。"][errorIndex],
    })),
    debugging: ["先复现最小失败输入，并记录实际值与预期值。", "在关键分支前后输出状态；定位后删除临时日志并补充测试。"],
    exercises: [
      { level: "初级", title: "复现主示例", prompt: `独立输入并运行“${seed.topic}”示例，再修改一个数据值。`, verification: `输出结构应与“${seed.output.replace(/\n/g, " / ")}”一致。` },
      { level: "进阶", title: "处理边界输入", prompt: "为示例增加空数据或无效输入处理，保证程序给出明确结果。", verification: "至少验证一个正常输入和两个边界输入。" },
      { level: "挑战", title: "封装可复用方案", prompt: "把核心逻辑封装为接口清晰、无隐藏副作用的可复用单元。", verification: "调用方只需提供输入即可得到结果，并能单独测试核心逻辑。" },
    ],
    summaryPoints: [`${seed.topic}的核心是明确输入、状态变化和输出。`, "语法只是表达工具，正确的边界处理和验证同样重要。", "遇到错误时先缩小问题，再检查类型、控制流和资源生命周期。"],
    furtherReading: seed.sourceRefs.map((sourceId) => {
      const source = contentSources.find((item) => item.id === sourceId);
      return { label: source?.sourceName || sourceId, url: source?.sourceUrl || "https://example.com" };
    }),
    sourceRefs: seed.sourceRefs,
    contentLicense: "MIT",
    lastReviewedAt: reviewedAt,
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
};

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

  const expectedLegacyIds: Record<Lang, string[]> = {
    Python: ["python-01", "python-02", "python-03", "python-04", "python-05", "python-06", "python-07"],
    "C/C++": ["cpp-01", "cpp-02", "cpp-03", "cpp-04", "cpp-05", "cpp-06", "cpp-07"],
    JavaScript: ["javascript-01", "javascript-02", "javascript-03", "javascript-04", "javascript-05", "javascript-06", "javascript-07"],
    Java: ["java-01", "java-02", "java-03", "java-04", "java-05", "java-06", "java-07"],
  };
  const lessonIds = new Set<string>();
  for (const language of Object.keys(courseDefinitions) as Lang[]) {
    const course = courseDefinitions[language];
    if (course.lessons.length !== 10) throw new Error(`${language} 必须包含 10 节课程`);
    if (course.lessons.slice(0, 7).some((lesson, index) => lesson.id !== expectedLegacyIds[language][index])) {
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
