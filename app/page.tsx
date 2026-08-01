"use client";

import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AccountMenu from "./account-menu";
import CodeViewerDialog, {
  consumeCodeImport,
  type CodeRecordRequest,
} from "./code-viewer-dialog";

type Lang = "Python" | "C/C++" | "JavaScript" | "Java";
type LearningProgress = {
  activeLanguage: Lang;
  topics: Record<Lang, number>;
};
type LessonCompletion = {
  language: string;
  topicIndex: number;
  passedTests: number;
  totalTests: number;
  completedAt: string;
};
type Course = {
  icon: string;
  color: string;
  topics: string[];
  title: string;
  kicker: string;
  desc: string;
  code: string;
  output: string;
};
type KnowledgeData = {
  title: string;
  description: string;
  color: string;
  depth: number;
};
type KnowledgeNode = Node<KnowledgeData, "knowledge">;

const MAX_SOURCE_FILE_CHARS = 12_000;
const INITIAL_CHAT_MESSAGE = {
  role: "ai",
  text: "你好，我已读取当前课程。可以让我解释知识点、分析报错或优化代码。",
};

const lessons: Record<Lang, Course> = {
  Python: {
    icon: "Py",
    color: "#58e6ba",
    topics: ["快速入门", "变量与类型", "条件判断", "循环结构", "函数", "列表与字典", "面向对象"],
    title: "Python 循环结构",
    kicker: "Python · 基础语法 · 第 04 节",
    desc: "循环让程序重复执行一段逻辑。Python 提供 for 与 while 两种主要循环方式，本节将用成绩统计器理解遍历、条件和累加。",
    code: `scores = [86, 92, 74, 100, 65]\n\ntotal = 0\nfor score in scores:\n    total += score\n\naverage = total / len(scores)\nprint(f"平均分：{average:.1f}")`,
    output: "平均分：83.4",
  },
  "C/C++": {
    icon: "C+",
    color: "#9ca8ff",
    topics: ["环境配置", "数据类型", "流程控制", "数组", "指针", "函数", "类与对象"],
    title: "C++ 数组与遍历",
    kicker: "C++ · 核心语法 · 第 04 节",
    desc: "数组将相同类型的数据连续存储。结合范围 for 循环，可以安全而清晰地访问每一个元素。",
    code: `#include <iostream>\nusing namespace std;\n\nint main() {\n  int scores[] = {86, 92, 74, 100, 65};\n  int total = 0;\n  for (int score : scores) total += score;\n  cout << "总分：" << total << endl;\n  return 0;\n}`,
    output: "总分：417",
  },
  JavaScript: {
    icon: "JS",
    color: "#ffd36a",
    topics: ["语言基础", "变量与作用域", "数组方法", "DOM 操作", "异步编程", "ES6+", "工程化"],
    title: "JavaScript 数组方法",
    kicker: "JavaScript · ES6+ · 第 03 节",
    desc: "map、filter 与 reduce 是处理集合的三个核心方法，能把复杂循环表达成清晰的数据变换管道。",
    code: `const scores = [86, 92, 74, 100, 65];\nconst passed = scores.filter(score => score >= 80);\nconst total = passed.reduce((sum, n) => sum + n, 0);\n\nconsole.log(\`优秀人数：\${passed.length}\`);\nconsole.log(\`优秀组总分：\${total}\`);`,
    output: "优秀人数：3\n优秀组总分：278",
  },
  Java: {
    icon: "Jv",
    color: "#ff9677",
    topics: ["快速入门", "变量与类型", "控制流", "数组与集合", "方法", "类与对象", "异常处理"],
    title: "Java 集合遍历",
    kicker: "Java · 集合框架 · 第 04 节",
    desc: "List 是 Java 中最常用的有序集合。增强 for 循环让遍历集合更加简洁，同时保持静态类型安全。",
    code: `import java.util.List;\n\nclass Main {\n  public static void main(String[] args) {\n    List<Integer> scores = List.of(86, 92, 74, 100, 65);\n    int total = 0;\n    for (int score : scores) total += score;\n    System.out.println("总分：" + total);\n  }\n}`,
    output: "总分：417",
  },
};

const languageSlugs: Record<Lang, string> = {
  Python: "python",
  "C/C++": "c-cpp",
  JavaScript: "javascript",
  Java: "java",
};

const sourceFileExtensions: Record<Lang, string[]> = {
  Python: [".py", ".txt"],
  "C/C++": [".c", ".cc", ".cpp", ".cxx", ".h", ".hpp", ".txt"],
  JavaScript: [".js", ".mjs", ".cjs", ".txt"],
  Java: [".java", ".txt"],
};

function defaultSourceFileName(language: Lang): string {
  if (language === "Python") return "main.py";
  if (language === "C/C++") return "main.cpp";
  if (language === "JavaScript") return "main.js";
  return "Main.java";
}

const pythonLessons: Course[] = [
  {
    ...lessons.Python,
    title: "Python 快速入门",
    kicker: "Python · 入门基础 · 第 01 节",
    desc: "从第一行 Python 程序开始，认识解释器、缩进规则、注释和最基本的输入输出流程，并建立“编写—运行—观察结果”的学习闭环。",
    code: `name = input("请输入你的名字：")\nprint(f"你好，{name}！")\nprint("欢迎来到 Blinga coding")`,
    output: "你好，学习者！\n欢迎来到 Blinga coding",
  },
  {
    ...lessons.Python,
    title: "Python 变量与类型",
    kicker: "Python · 入门基础 · 第 02 节",
    desc: "变量用于保存程序状态。本节讲解整数、浮点数、字符串、布尔值、类型转换以及动态类型语言在运行时的行为。",
    code: `name = "Lin"\nage = 18\nscore = 92.5\nis_passed = score >= 60\n\nprint(type(name), type(age))\nprint(f"{name} 的成绩：{score}，通过：{is_passed}")`,
    output: "<class 'str'> <class 'int'>\nLin 的成绩：92.5，通过：True",
  },
  {
    ...lessons.Python,
    title: "Python 条件判断",
    kicker: "Python · 入门基础 · 第 03 节",
    desc: "通过 if、elif 和 else 让程序根据不同条件选择执行路径，同时学习比较运算、逻辑运算和条件分支的覆盖顺序。",
    code: `score = 86\n\nif score >= 90:\n    level = "优秀"\nelif score >= 60:\n    level = "合格"\nelse:\n    level = "需要复习"\n\nprint(level)`,
    output: "合格",
  },
  lessons.Python,
  {
    ...lessons.Python,
    title: "Python 函数",
    kicker: "Python · 核心语法 · 第 05 节",
    desc: "函数把可复用逻辑封装为清晰的接口。本节覆盖参数、返回值、默认参数、作用域和单一职责原则。",
    code: `def calculate_average(scores: list[int]) -> float:\n    if not scores:\n        return 0.0\n    return sum(scores) / len(scores)\n\nresult = calculate_average([86, 92, 74])\nprint(f"平均分：{result:.1f}")`,
    output: "平均分：84.0",
  },
  {
    ...lessons.Python,
    title: "Python 列表与字典",
    kicker: "Python · 数据结构 · 第 06 节",
    desc: "列表适合保存有序数据，字典适合建立键和值的映射。本节讲解增删改查、遍历、推导式和常见数据组织方式。",
    code: `students = {\n    "Lin": [86, 92, 74],\n    "Mia": [95, 88, 91],\n}\n\nfor name, scores in students.items():\n    average = sum(scores) / len(scores)\n    print(name, round(average, 1))`,
    output: "Lin 84.0\nMia 91.3",
  },
  {
    ...lessons.Python,
    title: "Python 面向对象",
    kicker: "Python · 进阶能力 · 第 07 节",
    desc: "通过类和对象把数据与行为组织在一起，理解构造方法、实例属性、方法调用、封装和继承的基本思想。",
    code: `class Student:\n    def __init__(self, name: str, scores: list[int]):\n        self.name = name\n        self.scores = scores\n\n    def average(self) -> float:\n        return sum(self.scores) / len(self.scores)\n\nstudent = Student("Lin", [86, 92, 74])\nprint(student.name, student.average())`,
    output: "Lin 84.0",
  },
];

const cppLessons: Course[] = [
  {
    ...lessons["C/C++"],
    title: "C++ 环境配置与编译流程",
    kicker: "C/C++ · 入门基础 · 第 01 节",
    desc: "认识源文件、预处理、编译、汇编和链接五个阶段，掌握 main 函数、标准输出以及编译器错误信息的基本阅读方法。",
    code: `#include <iostream>\n\nint main() {\n  std::cout << "Compiler ready: C++17" << '\\n';\n  return 0;\n}`,
    output: "Compiler ready: C++17",
  },
  {
    ...lessons["C/C++"],
    title: "C++ 数据类型与安全转换",
    kicker: "C/C++ · 入门基础 · 第 02 节",
    desc: "系统理解整数、浮点数、字符、布尔值、常量和类型推导，学习使用 static_cast 明确表达转换意图并避免整数除法陷阱。",
    code: `#include <iostream>\n\nint main() {\n  const int completed = 7;\n  const int total = 8;\n  const double progress = static_cast<double>(completed) / total;\n  std::cout << "完成率：" << progress * 100 << "%" << '\\n';\n  return 0;\n}`,
    output: "完成率：87.5%",
  },
  {
    ...lessons["C/C++"],
    title: "C++ 流程控制",
    kicker: "C/C++ · 入门基础 · 第 03 节",
    desc: "通过 if、else if、switch、for 和 while 构建程序执行路径，重点掌握条件覆盖顺序、循环边界以及 break 与 continue 的区别。",
    code: `#include <iostream>\n\nint main() {\n  const int score = 86;\n  if (score >= 90) {\n    std::cout << "优秀";\n  } else if (score >= 60) {\n    std::cout << "合格";\n  } else {\n    std::cout << "需要复习";\n  }\n  return 0;\n}`,
    output: "合格",
  },
  lessons["C/C++"],
  {
    ...lessons["C/C++"],
    title: "C++ 指针与对象生命周期",
    kicker: "C/C++ · 核心能力 · 第 05 节",
    desc: "从地址、取址和解引用开始理解指针，区分空指针、悬空指针和有效指针，并使用引用与智能指针表达更安全的所有权关系。",
    code: `#include <iostream>\n\nvoid addBonus(int& score, int bonus) {\n  score += bonus;\n}\n\nint main() {\n  int score = 86;\n  int* address = &score;\n  addBonus(*address, 4);\n  std::cout << "更新后：" << score << '\\n';\n  return 0;\n}`,
    output: "更新后：90",
  },
  {
    ...lessons["C/C++"],
    title: "C++ 函数与接口设计",
    kicker: "C/C++ · 核心能力 · 第 06 节",
    desc: "使用参数、返回值、const 引用、函数重载和头文件组织可复用逻辑，并通过清晰的函数契约降低模块之间的耦合。",
    code: `#include <iostream>\n#include <vector>\n\n double average(const std::vector<int>& values) {\n  if (values.empty()) return 0.0;\n  long long total = 0;\n  for (const int value : values) total += value;\n  return static_cast<double>(total) / values.size();\n}\n\nint main() {\n  std::cout << "平均分：" << average({86, 92, 74}) << '\\n';\n  return 0;\n}`,
    output: "平均分：84",
  },
  {
    ...lessons["C/C++"],
    title: "C++ 类与对象",
    kicker: "C/C++ · 进阶应用 · 第 07 节",
    desc: "通过类把数据和行为封装在一起，理解访问控制、构造函数、const 成员函数、对象生命周期以及组合优先于继承的设计思想。",
    code: `#include <iostream>\n#include <string>\n\nclass Student {\n public:\n  Student(std::string name, int score) : name_(name), score_(score) {}\n  void print() const { std::cout << name_ << "：" << score_ << '\\n'; }\n\n private:\n  std::string name_;\n  int score_;\n};\n\nint main() {\n  const Student student("Lin", 92);\n  student.print();\n  return 0;\n}`,
    output: "Lin：92",
  },
];

const javascriptLessons: Course[] = [
  {
    ...lessons.JavaScript,
    title: "JavaScript 语言基础",
    kicker: "JavaScript · 入门基础 · 第 01 节",
    desc: "认识 JavaScript 在浏览器和 Node.js 中的运行方式，掌握表达式、函数、对象、控制台输出以及严格相等运算符。",
    code: `function createGreeting(name) {\n  return \`你好，\${name}！\`;\n}\n\nconst learner = { name: "Lin", level: 1 };\nconsole.log(createGreeting(learner.name));\nconsole.log(\`当前等级：\${learner.level}\`);`,
    output: "你好，Lin！\n当前等级：1",
  },
  {
    ...lessons.JavaScript,
    title: "JavaScript 变量与作用域",
    kicker: "JavaScript · 入门基础 · 第 02 节",
    desc: "区分 const、let 和 var，理解块级作用域、词法作用域、暂时性死区与闭包，建立默认使用 const 的变量声明习惯。",
    code: `function createCounter() {\n  let count = 0;\n  return () => {\n    count += 1;\n    return count;\n  };\n}\n\nconst next = createCounter();\nconsole.log(next());\nconsole.log(next());`,
    output: "1\n2",
  },
  lessons.JavaScript,
  {
    ...lessons.JavaScript,
    title: "JavaScript DOM 操作",
    kicker: "JavaScript · 浏览器交互 · 第 04 节",
    desc: "学习查询元素、修改文本和样式、监听事件以及创建节点；同时明确 DOM 只存在于浏览器，在线沙盒的 Node.js 环境会给出兼容提示。",
    code: `const hasDom = typeof document !== "undefined";\n\nif (hasDom) {\n  const title = document.querySelector("#title");\n  if (title) title.textContent = "Blinga coding 已就绪";\n  console.log(title?.textContent ?? "没有找到 #title");\n} else {\n  console.log("当前为 Node.js 沙盒；浏览器中会修改 #title");\n}`,
    output: "当前为 Node.js 沙盒；浏览器中会修改 #title",
  },
  {
    ...lessons.JavaScript,
    title: "JavaScript 异步编程",
    kicker: "JavaScript · 核心能力 · 第 05 节",
    desc: "理解事件循环、Promise、async/await 和异常传播，学习顺序任务与并行任务的选择，并用 try/catch 处理异步失败。",
    code: `const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));\n\nasync function loadLesson() {\n  await wait(20);\n  return { id: 5, title: "异步编程" };\n}\n\nloadLesson()\n  .then(lesson => console.log(\`\${lesson.id}：\${lesson.title}\`))\n  .catch(error => console.error(error.message));`,
    output: "5：异步编程",
  },
  {
    ...lessons.JavaScript,
    title: "JavaScript ES6+",
    kicker: "JavaScript · 现代语法 · 第 06 节",
    desc: "使用解构、展开语法、模板字符串、可选链、空值合并和模块化组织现代 JavaScript，同时避免把简洁语法写成难以调试的表达式。",
    code: `const student = {\n  name: "Lin",\n  profile: { city: "Shanghai" },\n  scores: [86, 92],\n};\n\nconst { name, scores } = student;\nconst updatedScores = [...scores, 100];\nconst city = student.profile?.city ?? "未知";\nconsole.log(\`\${name} · \${city} · \${updatedScores.join(",")}\`);`,
    output: "Lin · Shanghai · 86,92,100",
  },
  {
    ...lessons.JavaScript,
    title: "JavaScript 工程化",
    kicker: "JavaScript · 工程实践 · 第 07 节",
    desc: "从模块边界、纯函数和自动测试入手理解工程化，认识格式化、静态检查、构建与部署流水线如何保障多人协作质量。",
    code: `function calculateAverage(values) {\n  if (!Array.isArray(values) || values.length === 0) return 0;\n  return values.reduce((sum, value) => sum + value, 0) / values.length;\n}\n\nfunction assertEqual(actual, expected, label) {\n  if (actual !== expected) throw new Error(\`\${label}: \${actual} !== \${expected}\`);\n  console.log(\`✓ \${label}\`);\n}\n\nassertEqual(calculateAverage([80, 90, 100]), 90, "平均分");\nassertEqual(calculateAverage([]), 0, "空数组");`,
    output: "✓ 平均分\n✓ 空数组",
  },
];

const javaLessons: Course[] = [
  {
    ...lessons.Java,
    title: "Java 快速入门",
    kicker: "Java · 入门基础 · 第 01 节",
    desc: "认识 JDK、JVM、字节码、类结构和 main 入口，掌握编译运行流程、标准输出与基础命名规则。",
    code: `class Main {\n  public static void main(String[] args) {\n    String learner = "Lin";\n    System.out.println("你好，" + learner + "！");\n    System.out.println("JVM 已就绪");\n  }\n}`,
    output: "你好，Lin！\nJVM 已就绪",
  },
  {
    ...lessons.Java,
    title: "Java 变量与类型",
    kicker: "Java · 入门基础 · 第 02 节",
    desc: "区分基本类型与引用类型，理解自动类型提升、显式转换、final 常量、包装类型以及整数除法。",
    code: `class Main {\n  public static void main(String[] args) {\n    final int completed = 7;\n    final int total = 8;\n    double progress = (double) completed / total;\n    System.out.println("完成率：" + progress * 100 + "%");\n  }\n}`,
    output: "完成率：87.5%",
  },
  {
    ...lessons.Java,
    title: "Java 控制流",
    kicker: "Java · 入门基础 · 第 03 节",
    desc: "使用 if、switch、for、while 控制执行路径，掌握分支覆盖顺序、循环边界、break 与 continue。",
    code: `class Main {\n  public static void main(String[] args) {\n    int score = 86;\n    String level;\n    if (score >= 90) level = "优秀";\n    else if (score >= 60) level = "合格";\n    else level = "需要复习";\n    System.out.println(level);\n  }\n}`,
    output: "合格",
  },
  lessons.Java,
  {
    ...lessons.Java,
    title: "Java 方法设计",
    kicker: "Java · 核心能力 · 第 05 节",
    desc: "通过参数、返回值、重载和访问控制封装可复用逻辑，建立单一职责、明确契约和可测试的方法边界。",
    code: `class Main {\n  static double average(int... values) {\n    if (values.length == 0) return 0.0;\n    long total = 0;\n    for (int value : values) total += value;\n    return (double) total / values.length;\n  }\n\n  public static void main(String[] args) {\n    System.out.println("平均分：" + average(86, 92, 74));\n  }\n}`,
    output: "平均分：84.0",
  },
  {
    ...lessons.Java,
    title: "Java 类与对象",
    kicker: "Java · 进阶应用 · 第 06 节",
    desc: "通过类封装状态和行为，理解构造器、private、final、实例方法、继承与组合的基本设计原则。",
    code: `class Student {\n  private final String name;\n  private final int score;\n\n  Student(String name, int score) {\n    this.name = name;\n    this.score = score;\n  }\n\n  String report() { return name + "：" + score; }\n}\n\nclass Main {\n  public static void main(String[] args) {\n    System.out.println(new Student("Lin", 92).report());\n  }\n}`,
    output: "Lin：92",
  },
  {
    ...lessons.Java,
    title: "Java 异常处理",
    kicker: "Java · 可靠性 · 第 07 节",
    desc: "区分受检异常与运行时异常，使用 try/catch/finally 和自定义异常表达失败，并避免吞掉错误。",
    code: `class Main {\n  static int parsePositive(String text) {\n    int value = Integer.parseInt(text);\n    if (value <= 0) throw new IllegalArgumentException("必须为正数");\n    return value;\n  }\n\n  public static void main(String[] args) {\n    try {\n      System.out.println(parsePositive("18"));\n    } catch (IllegalArgumentException error) {\n      System.out.println("输入错误：" + error.getMessage());\n    }\n  }\n}`,
    output: "18",
  },
];

type LessonGuide = {
  summary: string;
  principles: Array<{ title: string; text: string; badge: string }>;
  syntaxTitle: string;
  syntaxCode: string;
  syntaxNote: string;
  pitfalls: Array<{ wrong: string; right: string; title: string }>;
};

const lessonGuides: Record<Lang, LessonGuide> = {
  Python: {
    summary: "Python 的循环建立在“可迭代对象”之上。for 循环负责按顺序取值，while 循环负责在条件成立时重复执行。真正需要掌握的不是背语法，而是明确循环的数据来源、终止条件和每轮发生的状态变化。",
    principles: [
      { badge: "INPUT", title: "确定遍历对象", text: "列表、字符串、range 对象和字典都可以被遍历。每一轮，循环变量都会接收其中的下一个元素。" },
      { badge: "STATE", title: "更新程序状态", text: "在循环体内进行累加、筛选、计数或构造新结果。状态更新应保持单一、清晰，便于检查。" },
      { badge: "EXIT", title: "保证能够结束", text: "for 会在元素耗尽后自然结束；while 必须确保条件最终变为 False，否则会形成无限循环。" },
    ],
    syntaxTitle: "for 与 enumerate：同时获得位置和值",
    syntaxCode: `scores = [86, 92, 74]\n\nfor index, score in enumerate(scores, start=1):\n    status = "优秀" if score >= 90 else "继续加油"\n    print(f"第 {index} 位：{score} 分，{status}")`,
    syntaxNote: "enumerate 比手动维护索引变量更可靠；start=1 只改变展示序号，不会改变列表本身的下标。",
    pitfalls: [
      { title: "修改正在遍历的列表", wrong: "遍历时直接 remove，可能跳过元素", right: "遍历副本，或使用列表推导式生成新列表" },
      { title: "while 忘记更新条件", wrong: "计数器始终不变，循环无法结束", right: "在循环体内更新计数器，并设置安全上限" },
      { title: "混淆 break 与 continue", wrong: "把 continue 当成终止循环", right: "break 结束整个循环；continue 只跳过当前轮" },
    ],
  },
  "C/C++": {
    summary: "C/C++ 的循环与内存访问关系紧密。除了理解 for、while 和 do-while，还必须关注数组边界、变量类型和迭代器有效性。一次越界访问可能不会立即报错，却会导致难以定位的未定义行为。",
    principles: [
      { badge: "RANGE", title: "明确合法边界", text: "长度为 n 的数组，其合法下标是 0 到 n-1。循环条件通常使用 i < n，而不是 i <= n。" },
      { badge: "TYPE", title: "选择合适类型", text: "索引可使用 std::size_t；累加大量整数时应考虑 long long，避免计算过程中溢出。" },
      { badge: "LIFE", title: "维护对象生命周期", text: "遍历容器时不要随意使迭代器失效。需要删除元素时，优先使用 erase 返回的新迭代器。" },
    ],
    syntaxTitle: "范围 for：安全读取容器元素",
    syntaxCode: `#include <iostream>\n#include <vector>\n\nint main() {\n  std::vector<int> scores{86, 92, 74};\n  long long total = 0;\n  for (const int score : scores) {\n    total += score;\n  }\n  std::cout << "平均分：" << total / scores.size();\n}`,
    syntaxNote: "只读遍历时使用 const；若元素对象较大，可使用 const auto& 避免复制。",
    pitfalls: [
      { title: "数组下标越界", wrong: "使用 i <= size", right: "使用 i < size，或采用范围 for" },
      { title: "无符号整数回绕", wrong: "size_t i >= 0 作为倒序条件", right: "使用反向迭代器或安全的倒序写法" },
      { title: "迭代器失效", wrong: "erase 后继续使用旧迭代器", right: "接收 erase 返回值并继续遍历" },
    ],
  },
  JavaScript: {
    summary: "JavaScript 的循环不仅包括 for 和 while，也包括 map、filter、reduce 等声明式数组方法。选择循环方式时，要区分“产生新数据”“查找元素”和“执行副作用”三种目的。",
    principles: [
      { badge: "MAP", title: "数据映射", text: "当输入和输出一一对应时使用 map。它返回新数组，不应在回调中修改原数组。" },
      { badge: "FILTER", title: "条件筛选", text: "filter 保留回调结果为真值的元素，适合构建符合条件的数据子集。" },
      { badge: "ASYNC", title: "处理异步任务", text: "forEach 不会等待 async 回调。需要顺序等待时使用 for...of，并在循环体中 await。" },
    ],
    syntaxTitle: "组合筛选、映射和聚合",
    syntaxCode: `const scores = [86, 92, 74, 100];\n\nconst report = scores\n  .filter(score => score >= 80)\n  .map(score => ({ score, level: score >= 90 ? "A" : "B" }));\n\nconst average = report.reduce((sum, item) => sum + item.score, 0)\n  / report.length;`,
    syntaxNote: "链式调用适合表达数据流水线；当中间数组非常大时，可改用一次 reduce 以减少分配。",
    pitfalls: [
      { title: "误用 for...in", wrong: "用 for...in 遍历数组值", right: "数组值使用 for...of；对象键才使用 for...in" },
      { title: "异步 forEach", wrong: "await array.forEach(async ...)", right: "顺序任务使用 for...of，并行任务使用 Promise.all" },
      { title: "reduce 无初始值", wrong: "空数组调用 reduce 导致异常", right: "始终提供类型明确的初始值" },
    ],
  },
  Java: {
    summary: "Java 的循环建立在静态类型和集合框架之上。数组适合固定长度数据，List 适合动态集合；增强 for 简洁安全，而 Iterator 更适合遍历期间执行受控删除。",
    principles: [
      { badge: "COLLECTION", title: "面向集合编程", text: "优先通过 List、Set 等接口组织数据，让代码与具体实现解耦。" },
      { badge: "ITERATOR", title: "安全修改集合", text: "遍历期间需要删除元素时使用 Iterator.remove，避免 ConcurrentModificationException。" },
      { badge: "STREAM", title: "表达数据流水线", text: "Stream 适合筛选、转换和聚合；普通循环则更适合复杂控制流和逐步调试。" },
    ],
    syntaxTitle: "增强 for 与 Stream 聚合",
    syntaxCode: `List<Integer> scores = List.of(86, 92, 74, 100);\n\nint total = 0;\nfor (int score : scores) {\n  total += score;\n}\n\ndouble average = scores.stream()\n  .mapToInt(Integer::intValue)\n  .average()\n  .orElse(0);`,
    syntaxNote: "List.of 创建不可变集合；需要新增或删除元素时，应复制到 ArrayList。",
    pitfalls: [
      { title: "并发修改异常", wrong: "增强 for 中直接调用 list.remove", right: "使用 Iterator，或先筛选再创建新集合" },
      { title: "整数除法", wrong: "int / int 导致小数部分丢失", right: "至少将一个操作数转换为 double" },
      { title: "空值拆箱", wrong: "Integer null 自动拆箱为 int", right: "在计算前过滤或显式处理 null" },
    ],
  },
};

const cppLessonGuides: LessonGuide[] = [
  {
    summary: "C++ 程序不会直接从源代码开始运行。编译器先处理 #include 等预处理指令，再检查语法和类型并生成目标文件，最后由链接器把目标文件与标准库组合成可执行程序。理解这条链路，才能判断错误发生在编译期、链接期还是运行期。",
    principles: [
      { badge: "SOURCE", title: "组织源文件", text: ".cpp 文件保存实现，头文件声明可复用接口；main 是可执行程序的入口，返回 0 通常表示正常结束。" },
      { badge: "BUILD", title: "区分编译与链接", text: "语法错误和类型错误通常由编译器报告；声明存在但实现缺失，通常会在链接阶段出现 undefined reference。" },
      { badge: "DEBUG", title: "从首条错误开始", text: "后续错误经常由第一处错误连锁触发。先阅读文件名、行号和第一条诊断，再回到最小可复现代码。" },
    ],
    syntaxTitle: "最小可运行程序与标准错误输出",
    syntaxCode: `#include <iostream>\n\nint main() {\n  std::cout << "正常信息" << '\\n';\n  std::cerr << "诊断信息" << '\\n';\n  return 0;\n}`,
    syntaxNote: "std::cout 用于正常输出，std::cerr 用于错误或诊断信息。每个语句以分号结束，花括号明确代码块边界。",
    pitfalls: [
      { title: "遗漏 main 函数", wrong: "只有工具函数，没有程序入口", right: "为可执行程序提供签名正确的 int main()" },
      { title: "声明后没有实现", wrong: "函数在头文件中声明却没有定义", right: "把对应实现文件加入编译和链接命令" },
      { title: "忽略第一条错误", wrong: "从错误列表末尾开始随机修改", right: "优先修复最早出现的文件与行号" },
    ],
  },
  {
    summary: "C++ 是静态类型语言，变量的类型决定可表示范围、内存布局和可执行操作。算术表达式会发生整型提升与常见类型转换，因此结果类型不仅取决于接收变量，还取决于运算发生时的操作数类型。",
    principles: [
      { badge: "RANGE", title: "关注数值范围", text: "int 适合常规整数，long long 适合更大范围；无符号类型不能表示负数，回绕行为容易制造边界错误。" },
      { badge: "CONST", title: "默认使用 const", text: "不会再次赋值的数据应声明为 const，让编译器帮助阻止意外修改，并向读者表达设计意图。" },
      { badge: "CAST", title: "显式表达转换", text: "使用 static_cast 代替难以识别的 C 风格转换，并在转换前确认是否会截断、溢出或丢失精度。" },
    ],
    syntaxTitle: "避免整数除法丢失小数",
    syntaxCode: `#include <iostream>\n\nint main() {\n  const int correct = 7;\n  const int questions = 8;\n  const double rate = static_cast<double>(correct) / questions;\n  std::cout << rate << '\\n';\n  return 0;\n}`,
    syntaxNote: "如果两个操作数都是 int，除法会先得到整数结果。提前把一个操作数转换为 double，计算才会保留小数。",
    pitfalls: [
      { title: "整数除法", wrong: "double rate = 7 / 8，结果为 0", right: "使用 static_cast<double>(7) / 8" },
      { title: "窄化转换", wrong: "把超大 long long 直接存入 int", right: "在转换前检查范围，优先保持更宽类型" },
      { title: "未初始化变量", wrong: "读取未赋初值的局部变量", right: "声明时立即初始化，如 int count{0}" },
    ],
  },
  {
    summary: "流程控制负责选择和重复执行路径。可靠的控制流应让条件互斥且覆盖完整，让循环具有明确的初始状态、继续条件和状态更新，并尽量减少深层嵌套。",
    principles: [
      { badge: "BRANCH", title: "按严格条件排序", text: "多分支判断通常从最严格条件开始，避免宽泛条件提前命中，使后续分支永远无法执行。" },
      { badge: "LOOP", title: "写清循环三要素", text: "初始化、继续条件和每轮更新缺一不可；循环边界应能用一句话解释并覆盖空数据情况。" },
      { badge: "EXIT", title: "控制提前退出", text: "break 结束整个循环，continue 跳过当前轮；合理的提前返回可以减少多层 if 嵌套。" },
    ],
    syntaxTitle: "筛选并统计满足条件的数据",
    syntaxCode: `#include <iostream>\n#include <vector>\n\nint main() {\n  const std::vector<int> scores{86, 42, 92, 74};\n  int passed = 0;\n  for (const int score : scores) {\n    if (score < 60) continue;\n    ++passed;\n  }\n  std::cout << passed << '\\n';\n  return 0;\n}`,
    syntaxNote: "continue 让不满足条件的数据尽早退出当前轮，后续代码只处理有效数据，通常比增加一层嵌套更清晰。",
    pitfalls: [
      { title: "边界多执行一次", wrong: "循环条件写成 i <= size", right: "访问下标时使用 i < size" },
      { title: "条件顺序错误", wrong: "先判断 score >= 60，再判断 >= 90", right: "从更严格的 >= 90 开始判断" },
      { title: "循环状态不更新", wrong: "while 条件中的变量始终不变", right: "在循环体内确保状态朝终止条件推进" },
    ],
  },
  {
    summary: "原生数组在连续内存中保存固定数量、相同类型的元素。现代 C++ 更推荐 std::array 表达固定长度集合、std::vector 表达动态长度集合，因为它们能提供 size、迭代器和更清晰的值语义。",
    principles: [
      { badge: "MEMORY", title: "理解连续存储", text: "第一个元素下标为 0，最后一个元素下标为 size-1；越界访问属于未定义行为，结果不可预测。" },
      { badge: "ARRAY", title: "固定长度用 array", text: "std::array 的长度是类型的一部分，适合编译期已知大小的数据，并可直接使用范围 for。" },
      { badge: "VECTOR", title: "动态长度用 vector", text: "std::vector 自动管理动态内存，支持 push_back 和 size；扩容可能导致原指针、引用和迭代器失效。" },
    ],
    syntaxTitle: "使用 std::array 计算最高分",
    syntaxCode: `#include <array>\n#include <iostream>\n\nint main() {\n  const std::array<int, 4> scores{86, 92, 74, 100};\n  int highest = scores.front();\n  for (const int score : scores) {\n    if (score > highest) highest = score;\n  }\n  std::cout << highest << '\\n';\n  return 0;\n}`,
    syntaxNote: "std::array 同时保留连续内存和固定长度特性，并提供 front、size 和范围遍历等标准容器接口。",
    pitfalls: [
      { title: "数组越界", wrong: "访问 scores[scores.size()]", right: "最后一个元素是 scores[scores.size()-1]" },
      { title: "空容器取首项", wrong: "空 vector 直接调用 front", right: "先检查 empty，再读取元素" },
      { title: "扩容后保留旧地址", wrong: "push_back 后继续使用旧指针", right: "扩容后重新获取地址，或提前 reserve" },
    ],
  },
  {
    summary: "指针保存对象地址，解引用用于访问该地址上的对象。真正的难点不是星号语法，而是确认指针是否为空、指向对象是否仍然存活、以及谁负责释放资源。现代 C++ 应优先使用值、引用和智能指针表达这些关系。",
    principles: [
      { badge: "ADDRESS", title: "区分对象与地址", text: "&value 获取对象地址，*pointer 访问所指对象；任何解引用之前都必须确认指针有效。" },
      { badge: "LIFETIME", title: "服从对象生命周期", text: "局部对象离开作用域后地址立即失效；返回局部变量地址会产生悬空指针。" },
      { badge: "OWNER", title: "明确所有权", text: "独占动态资源使用 std::unique_ptr，共享所有权仅在确有需要时使用 std::shared_ptr，非拥有关系可使用引用或观察指针。" },
    ],
    syntaxTitle: "使用 unique_ptr 自动管理资源",
    syntaxCode: `#include <iostream>\n#include <memory>\n\nint main() {\n  auto score = std::make_unique<int>(86);\n  *score += 4;\n  std::cout << *score << '\\n';\n  return 0;\n}`,
    syntaxNote: "unique_ptr 离开作用域时自动释放对象，不需要手动 delete，能避免异常或提前返回导致的资源泄漏。",
    pitfalls: [
      { title: "解引用空指针", wrong: "int* p = nullptr; std::cout << *p", right: "解引用前检查 p，或改用保证存在的引用" },
      { title: "返回局部地址", wrong: "函数返回局部变量的指针", right: "返回值对象，或由调用方管理存储" },
      { title: "重复释放", wrong: "两个裸指针分别 delete 同一地址", right: "使用 unique_ptr 明确唯一所有权" },
    ],
  },
  {
    summary: "函数是可测试、可复用逻辑的边界。优秀的函数拥有清晰名称、单一职责、明确的输入输出和尽可能小的副作用。参数传递方式还表达了复制成本、可修改性与生命周期约束。",
    principles: [
      { badge: "VALUE", title: "小对象按值传递", text: "int、double 等小型标量按值传递最清晰，函数内部修改不会影响调用方。" },
      { badge: "REF", title: "大对象使用 const 引用", text: "只读 vector、string 等对象使用 const T&，避免复制同时阻止函数修改输入。" },
      { badge: "RETURN", title: "优先通过返回值交付结果", text: "返回值使数据流更明确；需要表达可能失败时，可使用 std::optional 或明确的结果类型。" },
    ],
    syntaxTitle: "用 const 引用设计只读接口",
    syntaxCode: `#include <iostream>\n#include <string>\n\nstd::string greeting(const std::string& name) {\n  return "你好，" + name;\n}\n\nint main() {\n  const std::string name = "Lin";\n  std::cout << greeting(name) << '\\n';\n  return 0;\n}`,
    syntaxNote: "const std::string& 避免复制并保证输入不被修改，返回 std::string 则依靠返回值优化高效地交付结果。",
    pitfalls: [
      { title: "返回局部引用", wrong: "返回函数内部局部对象的引用", right: "按值返回局部结果，让编译器执行返回值优化" },
      { title: "参数职责不清", wrong: "同一参数既作为输入又隐式承载输出", right: "优先返回结果，必要时明确命名输出参数" },
      { title: "函数承担过多任务", wrong: "读取、计算、打印、保存全部放在一个函数", right: "按单一职责拆分并分别测试" },
    ],
  },
  {
    summary: "类用于维护必须始终保持一致的一组状态和行为。构造函数负责建立有效对象，不变量由成员函数持续维护；访问控制不是隐藏语法，而是限制外部代码绕过规则直接破坏对象状态。",
    principles: [
      { badge: "STATE", title: "维护类不变量", text: "构造完成后对象就应处于有效状态，后续公开方法必须保证成员之间的约束始终成立。" },
      { badge: "ACCESS", title: "最小化公开接口", text: "数据成员通常保持 private，只公开业务需要的操作，避免外部代码依赖内部表示。" },
      { badge: "RAII", title: "资源绑定对象生命周期", text: "构造时获取资源、析构时释放资源；优先使用标准容器和智能指针获得自动资源管理。" },
    ],
    syntaxTitle: "带校验规则的封装类",
    syntaxCode: `#include <iostream>\n#include <string>\n\nclass Account {\n public:\n  explicit Account(std::string owner) : owner_(owner) {}\n  bool deposit(int amount) {\n    if (amount <= 0) return false;\n    balance_ += amount;\n    return true;\n  }\n  int balance() const { return balance_; }\n\n private:\n  std::string owner_;\n  int balance_{0};\n};\n\nint main() {\n  Account account("Lin");\n  account.deposit(100);\n  std::cout << account.balance() << '\\n';\n}`,
    syntaxNote: "余额不能从外部直接修改，只能通过带校验的 deposit 更新；balance 声明为 const 成员函数，表示读取不会改变对象。",
    pitfalls: [
      { title: "公开所有数据", wrong: "成员全部 public，任意代码都能破坏状态", right: "保持 private，并提供表达业务规则的方法" },
      { title: "构造后仍无效", wrong: "依赖调用方稍后补齐必要字段", right: "通过构造函数一次建立有效对象" },
      { title: "继承层级过深", wrong: "仅为复用几行代码建立复杂继承", right: "优先组合小对象，仅在真正的 is-a 关系下继承" },
    ],
  },
];

const javascriptLessonGuides: LessonGuide[] = [
  {
    summary: "JavaScript 是动态类型语言，代码可以在浏览器、Node.js 和其他宿主环境中运行。语言核心负责值、函数与对象，DOM、定时器和网络请求等能力则由宿主提供。",
    principles: [
      { badge: "VALUE", title: "理解值与类型", text: "原始值包括 string、number、boolean、null、undefined、bigint 和 symbol；对象通过引用参与赋值和比较。" },
      { badge: "FUNC", title: "函数是一等值", text: "函数可以赋给变量、作为参数传递并从其他函数返回，是回调、闭包和函数式组合的基础。" },
      { badge: "EQUAL", title: "默认使用严格相等", text: "=== 不执行隐式类型转换，通常比 == 更容易预测；确需转换时应显式调用 Number、String 或 Boolean。" },
    ],
    syntaxTitle: "对象、函数与严格比较",
    syntaxCode: `const learner = { name: "Lin", active: true };\nconst describe = ({ name, active }) =>\n  \`\${name}：\${active === true ? "学习中" : "已暂停"}\`;\n\nconsole.log(describe(learner));`,
    syntaxNote: "参数解构直接表达函数所需字段，严格相等避免字符串、数字与布尔值之间发生隐式转换。",
    pitfalls: [
      { title: "误用宽松相等", wrong: `0 == "" 得到 true`, right: "使用 ===，需要转换时显式转换类型" },
      { title: "读取不存在属性", wrong: "直接连续访问不确定的深层属性", right: "使用可选链并提供合理默认值" },
      { title: "混淆 null 与 undefined", wrong: "把两者当成完全相同的状态", right: "为缺失、清空和未初始化定义统一约定" },
    ],
  },
  {
    summary: "JavaScript 采用词法作用域：变量能否访问由代码书写位置决定。const 和 let 具有块级作用域，而闭包让函数在外层函数结束后仍能访问创建时的变量环境。",
    principles: [
      { badge: "CONST", title: "默认使用 const", text: "变量绑定不需要重新赋值时使用 const；对象内部仍可修改，需要真正不可变时应创建新对象或冻结结构。" },
      { badge: "BLOCK", title: "缩小作用域", text: "let 和 const 只在所在花括号内有效，靠近使用位置声明可以降低状态被意外修改的风险。" },
      { badge: "CLOSURE", title: "用闭包封装状态", text: "返回的函数会保留创建时的词法环境，适合计数器、配置函数和私有状态，但也要避免无意保留大对象。" },
    ],
    syntaxTitle: "闭包创建相互独立的状态",
    syntaxCode: `const createCounter = (start = 0) => {\n  let value = start;\n  return () => ++value;\n};\n\nconst first = createCounter();\nconst second = createCounter(10);\nconsole.log(first(), first(), second());`,
    syntaxNote: "每次调用 createCounter 都会创建新的词法环境，因此两个计数器互不影响。",
    pitfalls: [
      { title: "继续使用 var", wrong: "期待 var 具有块级作用域", right: "新代码优先使用 const，需要重新赋值时使用 let" },
      { title: "误解 const", wrong: "认为 const 对象内部完全不可修改", right: "const 只锁定绑定；不可变更新应创建新对象" },
      { title: "循环闭包共享变量", wrong: "var 循环变量被所有回调共享", right: "使用 let 创建每轮独立绑定" },
    ],
  },
  {
    summary: "数组方法把集合处理拆成明确步骤：filter 选择元素，map 转换元素，find 查找单项，some 与 every 判断条件，reduce 聚合结果。选择方法应由输出形态决定。",
    principles: [
      { badge: "FILTER", title: "筛选子集", text: "filter 返回满足条件的新数组，不修改原数组；当只需要第一项时使用 find，避免继续遍历全部数据。" },
      { badge: "MAP", title: "保持一一映射", text: "map 应为每个输入返回一个输出，不要只执行副作用；仅执行副作用时使用 for...of 或 forEach。" },
      { badge: "REDUCE", title: "明确聚合初值", text: "reduce 适合求和、分组和构建对象；始终提供初始值，避免空数组异常和类型推断混乱。" },
    ],
    syntaxTitle: "构建可读的数据处理管道",
    syntaxCode: `const scores = [86, 92, 74, 100];\nconst report = scores\n  .filter(score => score >= 80)\n  .map(score => ({ score, grade: score >= 90 ? "A" : "B" }));\nconsole.log(report);`,
    syntaxNote: "每一步只完成一种转换，调试时可单独检查中间结果；大数据场景再考虑减少中间数组。",
    pitfalls: [
      { title: "map 没有返回值", wrong: "回调使用花括号却忘记 return", right: "显式 return，或使用圆括号隐式返回对象" },
      { title: "原地修改输入", wrong: "在 map 中修改原对象", right: "使用展开语法返回新对象" },
      { title: "空数组 reduce", wrong: "省略初始值导致异常", right: "根据结果类型提供 0、[] 或 {}" },
    ],
  },
  {
    summary: "DOM 是浏览器根据 HTML 建立的对象树。JavaScript 可以查询节点、修改属性、监听事件并创建新节点；Node.js 默认没有 document，因此代码必须明确自己的运行环境。",
    principles: [
      { badge: "QUERY", title: "稳定查询元素", text: "使用语义明确的 id、data 属性或类名，并处理元素不存在的情况，避免对 null 继续访问属性。" },
      { badge: "EVENT", title: "通过事件驱动交互", text: "使用 addEventListener 注册事件，组件销毁时移除长期监听器；事件委托适合动态列表。" },
      { badge: "SAFE", title: "安全写入内容", text: "普通文本使用 textContent；不要把不可信输入写入 innerHTML，防止脚本注入。" },
    ],
    syntaxTitle: "浏览器中创建并追加列表项",
    syntaxCode: `const list = document.querySelector("#lesson-list");\nif (list) {\n  const item = document.createElement("li");\n  item.textContent = "异步编程";\n  list.append(item);\n}`,
    syntaxNote: "先判断查询结果，再操作节点；textContent 会把输入当作文本处理，比拼接 innerHTML 更安全。",
    pitfalls: [
      { title: "Node中直接使用DOM", wrong: "在线Node沙盒直接访问 document", right: "在浏览器运行，或先检查 typeof document" },
      { title: "重复绑定事件", wrong: "每次渲染都新增相同监听器", right: "集中注册并在销毁阶段移除" },
      { title: "不可信innerHTML", wrong: "把用户输入直接插入HTML", right: "使用 textContent 或经过审计的净化工具" },
    ],
  },
  {
    summary: "异步任务不会阻塞主线程等待结果，而是通过事件循环在条件满足后继续执行。Promise 表达未来结果，async/await 则以接近同步代码的结构组织 Promise 链。",
    principles: [
      { badge: "PROMISE", title: "保证处理成功与失败", text: "Promise 最终进入 fulfilled 或 rejected；await 应放在 try/catch 中，链式调用则需要 catch。" },
      { badge: "ORDER", title: "区分顺序与并行", text: "彼此依赖的任务顺序 await；互不依赖的任务先同时启动，再用 Promise.all 等待全部结果。" },
      { badge: "LOOP", title: "理解事件循环", text: "当前调用栈清空后，微任务队列中的 Promise 回调通常先于定时器任务执行。" },
    ],
    syntaxTitle: "并行等待多个独立任务",
    syntaxCode: `const delayValue = (value, ms) =>\n  new Promise(resolve => setTimeout(() => resolve(value), ms));\n\nasync function main() {\n  const [course, progress] = await Promise.all([\n    delayValue("JavaScript", 20),\n    delayValue(80, 10),\n  ]);\n  console.log(course, progress);\n}\nmain();`,
    syntaxNote: "两个任务同时启动，总耗时接近较慢的那个任务；若改为连续 await，总耗时会相加。",
    pitfalls: [
      { title: "忘记等待Promise", wrong: "直接把 Promise 当最终数据使用", right: "在 async 函数中 await，或返回 Promise 链" },
      { title: "异步forEach", wrong: "期待 forEach 等待 async 回调", right: "顺序使用 for...of，并行使用 Promise.all" },
      { title: "吞掉错误", wrong: "catch 后不记录也不恢复", right: "给出上下文并重新抛出或返回明确降级结果" },
    ],
  },
  {
    summary: "ES6+ 提供了解构、展开、模板字符串、可选链和模块等表达能力。它们的目标是让数据流更清晰，而不是追求最短代码；复杂表达式仍应拆分为可命名、可调试的步骤。",
    principles: [
      { badge: "DESTRUCT", title: "按需解构数据", text: "解构能直接表达需要哪些字段，并可提供默认值；过深嵌套会降低可读性，应先检查数据结构。" },
      { badge: "COPY", title: "使用展开创建浅拷贝", text: "展开语法只复制第一层；嵌套对象仍共享引用，更新深层结构时需要逐层复制。" },
      { badge: "MODULE", title: "建立模块边界", text: "export 暴露稳定接口，import 声明依赖；模块应围绕职责组织，而不是按文件大小随意拆分。" },
    ],
    syntaxTitle: "不可变地更新嵌套对象",
    syntaxCode: `const student = { name: "Lin", profile: { city: "Shanghai" } };\nconst updated = {\n  ...student,\n  profile: { ...student.profile, city: "Hangzhou" },\n};\nconsole.log(student.profile.city, updated.profile.city);`,
    syntaxNote: "外层对象和 profile 都需要复制，否则修改新对象的城市仍可能影响旧对象。",
    pitfalls: [
      { title: "误以为是深拷贝", wrong: "只展开外层后修改嵌套对象", right: "逐层复制发生变化的路径" },
      { title: "滥用可选链", wrong: "用 ?. 掩盖本应必填的数据缺失", right: "对必须存在的数据进行显式校验" },
      { title: "单行表达式过长", wrong: "把多步转换压成一行", right: "拆分并命名中间结果" },
    ],
  },
  {
    summary: "工程化把个人可运行代码变成团队可维护产品。稳定流程通常包括模块设计、依赖管理、格式化、静态检查、单元测试、构建和持续集成，并通过一致脚本让本地与生产环境使用相同规则。",
    principles: [
      { badge: "MODULE", title: "建立清晰模块边界", text: "业务逻辑与输入输出分离，纯函数便于测试，外部依赖集中在适配层。" },
      { badge: "TEST", title: "测试行为而非实现", text: "测试公开输入输出、边界和错误路径，避免依赖内部变量名等脆弱细节。" },
      { badge: "CI", title: "自动执行质量门禁", text: "提交代码后自动运行格式化检查、静态分析、测试和构建，失败时阻止不可靠版本发布。" },
    ],
    syntaxTitle: "可测试的纯函数与边界用例",
    syntaxCode: `const clamp = (value, min, max) => Math.min(max, Math.max(min, value));\n\nconst cases = [\n  { input: -1, expected: 0 },\n  { input: 50, expected: 50 },\n  { input: 101, expected: 100 },\n];\n\nfor (const test of cases) {\n  const actual = clamp(test.input, 0, 100);\n  if (actual !== test.expected) throw new Error("测试失败");\n}\nconsole.log("全部通过");`,
    syntaxNote: "纯函数不依赖外部状态，同一输入始终得到同一输出，因此适合快速、稳定的自动测试。",
    pitfalls: [
      { title: "脚本只在个人电脑可用", wrong: "依赖未记录的全局工具", right: "固定依赖版本并通过项目脚本执行" },
      { title: "只测试正常路径", wrong: "忽略空值、边界和异常", right: "按正常、边界、失败三类组织用例" },
      { title: "构建后才发现错误", wrong: "上线前手工运行检查", right: "在持续集成中自动执行完整质量门禁" },
    ],
  },
];

function createLessonGuide(
  lesson: Course,
  concepts: Array<[string, string, string]>,
  pitfalls: Array<[string, string, string]>,
  syntaxNote: string,
): LessonGuide {
  return {
    summary: lesson.desc,
    principles: concepts.map(([badge, title, text]) => ({ badge, title, text })),
    syntaxTitle: `${lesson.title}：可运行示例`,
    syntaxCode: lesson.code,
    syntaxNote,
    pitfalls: pitfalls.map(([title, wrong, right]) => ({ title, wrong, right })),
  };
}

const pythonLessonGuides: LessonGuide[] = [
  createLessonGuide(pythonLessons[0], [["RUN", "解释执行", "Python 由解释器加载并执行源码，报错通常包含文件、行号和异常类型。"], ["INDENT", "缩进即结构", "同一代码块必须保持一致缩进，推荐每层四个空格。"], ["IO", "处理输入输出", "input 返回字符串，需要数值时显式转换；print 负责可观察结果。"]], [["输入类型错误", "直接对 input 结果做数值运算", "先使用 int 或 float 转换并处理失败"], ["缩进不一致", "混用 Tab 与空格", "统一使用四个空格"], ["覆盖内置名称", "变量命名为 list 或 str", "使用能表达业务含义的名称"]], "先运行最小程序，再逐行修改输入、变量和输出，观察解释器反馈。"),
  createLessonGuide(pythonLessons[1], [["BIND", "变量绑定对象", "变量名指向运行时对象，重新赋值可以绑定到不同类型。"], ["TYPE", "理解核心类型", "int、float、str、bool 各自支持不同操作，可用 type 检查。"], ["CAST", "显式转换", "外部输入通常是字符串，转换前应确认格式和允许范围。"]], [["字符串与数字相加", `"18" + 1 会报错`, "先明确希望拼接还是数值计算"], ["浮点精度", "直接用 float 表示精确金额", "金额使用 Decimal 或整数最小单位"], ["真假值误判", `bool("False") 为 True`, "按允许文本显式解析布尔值"]], "动态类型不等于没有类型；每个运行时对象都有明确类型。"),
  createLessonGuide(pythonLessons[2], [["ORDER", "严格条件优先", "多分支从更严格条件开始，避免宽泛条件遮蔽后续分支。"], ["LOGIC", "组合逻辑条件", "and 要求同时成立，or 要求至少一个成立，not 负责取反。"], ["COVER", "覆盖边界情况", "明确等于边界、空值和异常输入应进入哪个分支。"]], [["条件顺序错误", "先判断 >=60 再判断 >=90", "从 >=90 开始判断"], ["误用多个if", "互斥条件全部使用独立if", "互斥路径使用 if/elif/else"], ["比较与赋值混淆", "把 = 当作相等比较", "比较使用 ==，赋值使用 ="]], "用边界值分别运行各条分支，确认每条路径都可到达。"),
  lessonGuides.Python,
  createLessonGuide(pythonLessons[4], [["INPUT", "定义参数契约", "参数名和类型标注应表达函数需要什么数据。"], ["RETURN", "返回结果", "优先返回值而不是修改全局状态，让数据流更易测试。"], ["SCOPE", "控制作用域", "局部变量只服务当前调用，避免函数隐式依赖可变全局变量。"]], [["可变默认参数", "参数默认值写成 []", "使用 None 并在函数内创建列表"], ["忘记return", "期待函数自动返回最后表达式", "显式 return 需要交付的结果"], ["职责过多", "一个函数同时读取计算打印保存", "按单一职责拆分"]], "函数接口越明确，越容易复用、测试和交给 AI 分析。"),
  createLessonGuide(pythonLessons[5], [["LIST", "列表维护顺序", "列表适合按位置保存可变长度元素。"], ["DICT", "字典建立映射", "字典通过唯一键快速定位值，键应稳定且可哈希。"], ["COPY", "理解可变对象", "赋值通常共享同一对象，需要独立数据时显式浅拷贝或深拷贝。"]], [["遍历时修改", "循环列表时直接删除", "生成新列表或遍历副本"], ["键不存在", "直接读取不确定的字典键", "使用 get 或先判断成员关系"], ["共享嵌套对象", "只复制外层后修改深层数据", "按需要使用 deepcopy"]], "根据访问方式选择容器，而不是把所有数据都塞进列表。"),
  createLessonGuide(pythonLessons[6], [["STATE", "封装有效状态", "构造方法建立对象初始状态，公开方法维护业务约束。"], ["METHOD", "行为靠近数据", "操作实例状态的逻辑应成为实例方法。"], ["COMPOSE", "优先组合", "把小对象组合成大对象，通常比深层继承更易维护。"]], [["公开修改所有属性", "外部任意破坏对象状态", "提供带校验的方法或属性"], ["类承担过多职责", "数据访问、网络和业务全部在一个类", "按职责拆分并组合"], ["滥用继承", "只为复用代码建立is-a关系", "优先提取函数或组合对象"]], "类不是字典的复杂写法；只有需要维护状态约束和行为时才创建类。"),
];

const javaLessonGuides: LessonGuide[] = [
  createLessonGuide(javaLessons[0], [["JDK", "JDK负责编译", "javac 把 .java 源码编译为 JVM 可执行的字节码。"], ["JVM", "JVM负责运行", "JVM加载类、验证字节码并执行 main 方法。"], ["CLASS", "类是组织单元", "源文件、类名和 main 入口需遵循明确结构。"]], [["类名不匹配", "public类名与文件名不同", "保持 public 类名和文件名一致"], ["入口签名错误", "main 参数或修饰符缺失", "使用 public static void main(String[] args)"], ["忽略首条编译错误", "从错误列表末尾修改", "先修复最早的文件和行号"]], "理解编译与运行阶段，才能快速区分语法错误和运行时异常。"),
  createLessonGuide(javaLessons[1], [["PRIMITIVE", "基本类型存值", "int、long、double、boolean 等有固定语义和范围。"], ["REFERENCE", "引用类型指向对象", "String、数组和自定义类变量保存对象引用，也可能为 null。"], ["CAST", "控制数值转换", "宽化通常自动完成，窄化转换必须显式并承担数据丢失风险。"]], [["整数除法", "两个int相除后再赋给double", "先把一个操作数转换为double"], ["空值拆箱", "Integer null 自动转 int", "拆箱前检查null"], ["溢出", "int累加超出范围", "根据数据规模使用long"]], "静态类型让很多错误在编译期暴露，应充分利用 final 和类型检查。"),
  createLessonGuide(javaLessons[2], [["BRANCH", "组织互斥分支", "if/else if/else 表达互斥路径，严格条件应放在前面。"], ["LOOP", "明确循环边界", "初始化、继续条件和更新共同保证循环正确结束。"], ["SWITCH", "按离散值选择", "switch 适合枚举、字符串和有限状态，现代写法可直接返回结果。"]], [["条件顺序错误", "宽泛条件提前命中", "从严格条件开始"], ["下标越界", "使用 i <= length", "使用 i < length"], ["忘记break", "传统switch意外贯穿", "使用箭头switch或明确break"]], "使用边界值验证分支和循环，不要只测试典型输入。"),
  lessonGuides.Java,
  createLessonGuide(javaLessons[4], [["PARAM", "参数表达输入", "按值传递引用意味着可修改对象内容，但不能替换调用方变量。"], ["RETURN", "返回值表达输出", "让方法的输入输出明确，避免依赖可变静态字段。"], ["OVERLOAD", "谨慎使用重载", "重载应保持同一语义，只改变参数形态。"]], [["返回类型不一致", "分支返回不同类型", "统一返回契约"], ["静态状态污染", "方法依赖可变static字段", "通过参数传入依赖"], ["方法过长", "一个方法完成全部流程", "按单一职责拆分"]], "方法设计应先写清输入、输出、失败方式，再实现内部步骤。"),
  createLessonGuide(javaLessons[5], [["PRIVATE", "隐藏内部状态", "字段保持 private，通过方法维护不变量。"], ["CTOR", "构造有效对象", "构造器完成必要校验，避免对象创建后仍不可用。"], ["COMPOSE", "组合优先继承", "仅在稳定的 is-a 关系下使用继承。"]], [["所有字段public", "外部可绕过规则修改", "使用private和业务方法"], ["构造器职责过重", "构造时执行网络或复杂流程", "只建立对象有效状态"], ["equals未配hashCode", "集合行为不一致", "成对实现equals与hashCode"]], "对象应该从构造完成起就处于有效状态，并在整个生命周期维持约束。"),
  createLessonGuide(javaLessons[6], [["THROW", "异常表达失败", "无法在当前层正确处理时抛出带上下文的异常。"], ["CATCH", "在有恢复策略处捕获", "只有能降级、重试或转换错误时才捕获。"], ["RESOURCE", "自动关闭资源", "文件和连接使用 try-with-resources 保证释放。"]], [["吞掉异常", "空catch导致问题消失", "记录上下文并恢复或重新抛出"], ["捕获范围过大", "所有异常统一catch Exception", "捕获可处理的具体类型"], ["异常代替正常分支", "用异常控制常规流程", "可预期条件使用显式判断"]], "异常信息应说明操作、关键输入和原始原因，但不能泄露密钥等敏感信息。"),
];

type CurriculumEntry = {
  lessons: Course[];
  guides: LessonGuide[];
};

function defineCurriculum(entries: Record<Lang, CurriculumEntry>): Record<Lang, CurriculumEntry> {
  for (const language of Object.keys(entries) as Lang[]) {
    const entry = entries[language];
    if (entry.lessons.length !== lessons[language].topics.length || entry.guides.length !== entry.lessons.length) {
      throw new Error(`${language} 课程必须为每个知识点提供独立内容和独立讲解`);
    }
  }
  return entries;
}

const curriculum = defineCurriculum({
  Python: { lessons: pythonLessons, guides: pythonLessonGuides },
  "C/C++": { lessons: cppLessons, guides: cppLessonGuides },
  JavaScript: { lessons: javascriptLessons, guides: javascriptLessonGuides },
  Java: { lessons: javaLessons, guides: javaLessonGuides },
});

type CourseSearchItem = {
  language: Lang;
  topicIndex: number;
  topicLabel: string;
  title: string;
  kicker: string;
  description: string;
  searchText: string;
};

const courseSearchIndex: CourseSearchItem[] = (Object.keys(curriculum) as Lang[]).flatMap(
  (language) => curriculum[language].lessons.map((course, topicIndex) => {
    const topicLabel = lessons[language].topics[topicIndex];
    const guide = curriculum[language].guides[topicIndex];
    return {
      language,
      topicIndex,
      topicLabel,
      title: course.title,
      kicker: course.kicker,
      description: course.desc,
      searchText: [
        language,
        topicLabel,
        course.title,
        course.kicker,
        course.desc,
        guide.summary,
        ...guide.principles.flatMap((principle) => [principle.title, principle.text]),
        ...guide.pitfalls.flatMap((pitfall) => [pitfall.title, pitfall.wrong, pitfall.right]),
      ].join(" ").toLocaleLowerCase(),
    };
  }),
);

function findCourseMatches(query: string): CourseSearchItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [];

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  return courseSearchIndex
    .filter((item) => terms.every((term) => item.searchText.includes(term)))
    .map((item) => {
      const title = item.title.toLocaleLowerCase();
      const topic = item.topicLabel.toLocaleLowerCase();
      const language = item.language.toLocaleLowerCase();
      const score =
        (title.includes(normalizedQuery) ? 8 : 0) +
        (topic.includes(normalizedQuery) ? 6 : 0) +
        (language.includes(normalizedQuery) ? 4 : 0) +
        (item.description.toLocaleLowerCase().includes(normalizedQuery) ? 2 : 0);
      return { item, score };
    })
    .sort((left, right) => right.score - left.score || left.item.topicIndex - right.item.topicIndex)
    .slice(0, 6)
    .map(({ item }) => item);
}

const starterNodes: KnowledgeNode[] = [
  { id: "root", type: "knowledge", position: { x: 420, y: 180 }, data: { title: "循环结构", description: "控制重复执行的核心语法", color: "#58e6ba", depth: 0 } },
  { id: "for", type: "knowledge", position: { x: 80, y: 40 }, data: { title: "for 遍历", description: "依次访问可迭代对象", color: "#8ba8ff", depth: 1 } },
  { id: "while", type: "knowledge", position: { x: 80, y: 300 }, data: { title: "while 条件", description: "条件成立时持续执行", color: "#8ba8ff", depth: 1 } },
  { id: "range", type: "knowledge", position: { x: 740, y: 40 }, data: { title: "range()", description: "生成整数序列", color: "#c39cff", depth: 1 } },
  { id: "control", type: "knowledge", position: { x: 740, y: 300 }, data: { title: "流程控制", description: "改变循环执行路径", color: "#c39cff", depth: 1 } },
  { id: "break", type: "knowledge", position: { x: 1040, y: 235 }, data: { title: "break", description: "提前终止循环", color: "#ff9f7a", depth: 2 } },
  { id: "continue", type: "knowledge", position: { x: 1040, y: 385 }, data: { title: "continue", description: "跳过当前轮次", color: "#ff9f7a", depth: 2 } },
];
const starterEdges: Edge[] = [
  ["root", "for"], ["root", "while"], ["root", "range"], ["root", "control"],
  ["control", "break"], ["control", "continue"],
].map(([source, target]) => ({ id: `${source}-${target}`, source, target, animated: true }));

const GraphActions = createContext<{
  updateNode: (id: string, patch: Partial<KnowledgeData>) => void;
  removeNode: (id: string) => void;
}>({ updateNode: () => undefined, removeNode: () => undefined });

function KnowledgeCard({ id, data, selected }: NodeProps<KnowledgeNode>) {
  const { updateNode, removeNode } = useContext(GraphActions);
  return (
    <article className={`knowledge-node ${selected ? "selected" : ""}`} style={{ "--node-color": data.color } as React.CSSProperties}>
      <Handle type="target" position={Position.Left} />
      <div className="node-topline">
        <span>{data.depth === 0 ? "核心主题" : `L${data.depth} 知识点`}</span>
        <button className="node-delete nodrag" onClick={() => removeNode(id)} aria-label="删除节点">×</button>
      </div>
      <input
        className="node-title nodrag"
        value={data.title}
        onChange={(event) => updateNode(id, { title: event.target.value })}
        aria-label="节点标题"
      />
      <textarea
        className="node-description nodrag"
        value={data.description}
        onChange={(event) => updateNode(id, { description: event.target.value })}
        aria-label="节点说明"
      />
      <label className="node-color nodrag">
        <span>文字高亮</span>
        <input type="color" value={data.color} onChange={(event) => updateNode(id, { color: event.target.value })} />
      </label>
      <Handle type="source" position={Position.Right} />
    </article>
  );
}

const nodeTypes = { knowledge: KnowledgeCard };

function KnowledgeGraph({ lesson, code }: { lesson: Course; code: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<KnowledgeNode>(starterNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(starterEdges);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>("root");

  const updateNode = useCallback((id: string, patch: Partial<KnowledgeData>) => {
    setNodes((current) => current.map((node) => node.id === id ? { ...node, data: { ...node.data, ...patch } } : node));
  }, [setNodes]);
  const removeNode = useCallback((id: string) => {
    setNodes((current) => current.filter((node) => node.id !== id));
    setEdges((current) => current.filter((edge) => edge.source !== id && edge.target !== id));
  }, [setEdges, setNodes]);
  const onConnect = useCallback((connection: Connection) => {
    setEdges((current) => addEdge({ ...connection, animated: true }, current));
  }, [setEdges]);

  function addKnowledgeNode() {
    const id = crypto.randomUUID();
    const parent = selectedId ?? "root";
    setNodes((current) => [...current, {
      id,
      type: "knowledge",
      position: { x: 600 + Math.random() * 240, y: 120 + Math.random() * 300 },
      data: { title: "新知识点", description: "双击文字开始编辑", color: "#58e6ba", depth: 2 },
    }]);
    setEdges((current) => [...current, { id: `${parent}-${id}`, source: parent, target: id, animated: true }]);
    setSelectedId(id);
  }

  async function generateGraph(expand = false) {
    setBusy(true);
    try {
      const focus = expand && selectedId ? nodes.find((node) => node.id === selectedId)?.data.title : "";
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "mindmap",
          prompt: focus ? `围绕“${focus}”联网扩写 3 层知识图谱` : "生成 3 层、高密度、多分支课程知识图谱",
          context: `${lesson.title}\n${lesson.desc}\n代码示例：\n${code}`,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "生成失败");
      const raw = result.nodes as Array<{ id?: string; parentId?: string | null; title: string; description: string; color?: string }>;
      const normalized: KnowledgeNode[] = raw.map((item, index) => {
        const depth = item.parentId ? (index < 6 ? 1 : 2) : 0;
        const laneIndex = depth === 0 ? 0 : index - 1;
        return {
          id: item.id || `ai-${index}`,
          type: "knowledge",
          position: { x: depth * 360 + 60, y: depth === 0 ? 220 : 40 + (laneIndex % 6) * 145 },
          data: { title: item.title, description: item.description, color: item.color || (depth === 0 ? "#58e6ba" : "#9ca8ff"), depth },
        };
      });
      const ids = new Set(normalized.map((node) => node.id));
      const rootId = normalized[0]?.id;
      const nextEdges: Edge[] = raw.slice(1).map((item, index) => {
        const target = normalized[index + 1].id;
        const source = item.parentId && ids.has(item.parentId) ? item.parentId : rootId;
        return { id: `${source}-${target}`, source, target, animated: true };
      });
      setNodes(normalized);
      setEdges(nextEdges);
      setSelectedId(rootId);
    } catch (error) {
      alert(error instanceof Error ? error.message : "AI 图谱生成失败");
    } finally {
      setBusy(false);
    }
  }

  function exportGraph() {
    const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${lesson.title}-知识图谱.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="feature-section" id="map">
      <div className="section-heading">
        <div><h2>动态知识图谱</h2></div>
        <div className="toolbar">
          <button onClick={addKnowledgeNode}>＋ 新增节点</button>
          <button onClick={() => generateGraph(true)} disabled={busy}>✦ 扩写选中</button>
          <button className="primary" onClick={() => generateGraph()} disabled={busy}>{busy ? "生成中…" : "✦ AI 生成"}</button>
          <button onClick={exportGraph}>⇩ 导出</button>
        </div>
      </div>
      <div className={`graph-shell glass ${busy ? "is-loading" : ""}`}>
        <GraphActions.Provider value={{ updateNode, removeNode }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            fitView
            onlyRenderVisibleElements
            minZoom={0.35}
            maxZoom={1.8}
          >
            <Background color="#344158" gap={26} size={1} />
            <MiniMap nodeColor={(node) => (node.data as KnowledgeData).color} pannable zoomable />
            <Controls showInteractive={false} />
          </ReactFlow>
        </GraphActions.Provider>
      </div>
    </section>
  );
}

type InspectionResult = {
  lines: number;
  characters: number;
  issues: string[];
  suggestions: string[];
};

type RunResult = {
  status: { id: number; description: string };
  stdout: string;
  stderr: string;
  compileOutput: string;
  message: string;
  time: string | null;
  memory: number | null;
  exitCode: number | null;
  completionSaved?: boolean;
  runRecorded?: boolean;
  judge?: {
    passed: number;
    total: number;
    tests: Array<{
      name: string;
      passed: boolean;
      expected?: string;
      actual?: string;
    }>;
  };
};

type RunHistoryItem = {
  id: number;
  mode: "run" | "judge";
  statusId: number;
  statusDescription: string;
  durationMs: number | null;
  memoryKb: number | null;
  passedTests: number | null;
  totalTests: number | null;
  codeAvailable: boolean;
  createdAt: string;
};

type SandboxContext = {
  code: string;
  stdin: string;
  output: string;
};

/**
 * 代码检测器只负责分析文本，不直接修改 React 状态。
 * 将纯检测逻辑与界面分开，后续替换为 WebWorker 或后端 API 时不需要改动 UI。
 */
function inspectSourceCode(source: string, lang: Lang): InspectionResult {
  const rows = source.split("\n");
  const issues: string[] = [];
  const suggestions: string[] = [];
  const bracketStack: Array<{ value: string; line: number }> = [];
  const closingToOpening: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  let quote: "'" | '"' | "`" | null = null;
  let escaped = false;
  let line = 1;

  for (const character of source) {
    if (character === "\n") line += 1;
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (character === quote) quote = null;
      continue;
    }
    if (character === "'" || character === '"' || character === "`") {
      quote = character;
      continue;
    }
    if ("([{".includes(character)) bracketStack.push({ value: character, line });
    if (")]}".includes(character)) {
      const opening = bracketStack.pop();
      if (!opening || opening.value !== closingToOpening[character]) {
        issues.push(`第 ${line} 行附近存在不匹配的“${character}”`);
      }
    }
  }
  bracketStack.forEach((item) => issues.push(`第 ${item.line} 行的“${item.value}”尚未闭合`));

  if (!source.trim()) issues.push("代码内容为空，请先输入代码");
  if (rows.some((row) => row.includes("\t"))) suggestions.push("建议将 Tab 统一转换为 4 个空格，避免不同环境下缩进不一致");
  if (rows.some((row) => row.length > 100)) suggestions.push("检测到超过 100 个字符的长行，建议拆分以提升可读性");

  if (lang === "Python") {
    rows.forEach((row, index) => {
      const statement = row.trim();
      if (/^(if|elif|else|for|while|def|class|try|except|finally|with)\b/.test(statement)
        && !statement.endsWith(":")
        && !statement.startsWith("#")) {
        issues.push(`第 ${index + 1} 行的 Python 代码块可能缺少冒号`);
      }
    });
    if (source.includes("== None")) suggestions.push("建议使用“is None”替代“== None”");
  }
  if (lang === "JavaScript" && /\bvar\s+/.test(source)) {
    suggestions.push("建议优先使用 const 或 let，减少 var 带来的作用域问题");
  }
  if (lang === "C/C++" && source.includes("using namespace std;")) {
    suggestions.push("较大项目中建议显式使用 std:: 前缀，避免命名冲突");
  }
  if (lang === "Java" && !source.includes("class ")) {
    suggestions.push("Java 可执行示例通常需要声明类和 main 方法");
  }
  if (!suggestions.length && source.trim()) {
    suggestions.push("代码结构清晰，可以点击“运行代码”继续执行测试用例");
  }

  return { lines: rows.length, characters: source.length, issues, suggestions };
}

function formatInspection(result: InspectionResult): string {
  const status = result.issues.length
    ? `⚠ 实时检测发现 ${result.issues.length} 个问题`
    : "● 实时检查通过";
  const issueText = result.issues.length
    ? `\n\n问题定位：\n${result.issues.map((issue) => `  • ${issue}`).join("\n")}`
    : "\n  未发现明显语法结构问题";
  const suggestionText = `\n\n自动修改建议：\n${result.suggestions.map((suggestion) => `  → ${suggestion}`).join("\n")}`;
  return `${status}\n  ${result.lines} 行 · ${result.characters} 个字符${issueText}${suggestionText}`;
}

function formatRunResult(result: RunResult): string {
  const succeeded = result.status.id === 3;
  const timeText = result.time ? ` · ${result.time}s` : "";
  const memoryText = result.memory ? ` · ${Math.round(result.memory / 1024)} MB` : "";
  const heading = succeeded
    ? `✓ 运行成功${timeText}${memoryText}`
    : `✕ ${result.status.description || "运行失败"}${timeText}`;
  const sections: string[] = [heading];

  if (result.compileOutput.trim()) sections.push(`编译器输出：\n${result.compileOutput.trim()}`);
  if (result.stderr.trim()) sections.push(`错误输出：\n${result.stderr.trim()}`);
  if (result.stdout.trim()) {
    sections.push(`程序输出：\n${result.stdout.trimEnd()}`);
  } else if (succeeded) {
    sections.push("程序正常结束，但没有产生标准输出。");
  }
  if (result.message.trim()) sections.push(`运行信息：\n${result.message.trim()}`);
  if (result.exitCode != null) sections.push(`退出码：${result.exitCode}`);
  if (result.judge) {
    const testLines = result.judge.tests.map((test) =>
      `  ${test.passed ? "✓" : "✕"} ${test.name}`,
    );
    const mismatch = result.judge.tests.find((test) => !test.passed && test.expected !== undefined);
    sections.push(`自动判题：${result.judge.passed} / ${result.judge.total} 通过\n${testLines.join("\n")}`);
    if (mismatch) {
      sections.push(`预期输出：\n${mismatch.expected || "（空）"}\n\n实际输出：\n${mismatch.actual || "（空）"}`);
    }
    if (result.judge.passed === result.judge.total) {
      sections.push(result.completionSaved
        ? "课程进度：✓ 当前知识点已标记完成"
        : "课程进度：判题已通过，完成状态暂未同步");
    }
  }

  return sections.join("\n\n");
}

function formatRunHistoryTime(value: string): string {
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function Sandbox({
  lang,
  setLang,
  lesson,
  topicIndex,
  onContextChange,
  onLessonCompleted,
}: {
  lang: Lang;
  setLang: (lang: Lang) => void;
  lesson: Course;
  topicIndex: number;
  onContextChange: (context: SandboxContext) => void;
  onLessonCompleted: (language: Lang, topicIndex: number) => void;
}) {
  const [code, setCode] = useState(lesson.code);
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState("终端已连接 · 等待输入");
  const [runningMode, setRunningMode] = useState<"run" | "judge" | null>(null);
  const [draftReadyKey, setDraftReadyKey] = useState("");
  const [draftStatus, setDraftStatus] = useState("正在读取草稿…");
  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>([]);
  const [codeViewerRequest, setCodeViewerRequest] = useState<CodeRecordRequest | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [focusMode, setFocusMode] = useState(false);
  const [sourceFileName, setSourceFileName] = useState(defaultSourceFileName(lang));
  const [resetAction, setResetAction] = useState<"idle" | "confirm" | "undo">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetActionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetSnapshotRef = useRef<{ code: string; fileName: string } | null>(null);
  const draftEditRevisionRef = useRef(0);
  const draftSaveRevisionRef = useRef(0);
  const lastSavedCodeRef = useRef(lesson.code);
  const historyRevisionRef = useRef(0);
  const analysisRevisionRef = useRef(0);
  const runAbortRef = useRef<AbortController | null>(null);
  const stdinRef = useRef(stdin);
  const outputRef = useRef(output);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLPreElement>(null);
  const sourceFileInputRef = useRef<HTMLInputElement>(null);
  const draftKey = `${lang}:${topicIndex}`;
  const lineNumbers = useMemo(
    () => Array.from({ length: Math.max(1, code.split("\n").length) }, (_, index) => index + 1).join("\n"),
    [code],
  );

  const loadRunHistory = useCallback(async () => {
    const revision = ++historyRevisionRef.current;
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({
        language: lang,
        topicIndex: String(topicIndex),
      });
      const response = await fetch(`/api/run-history?${params}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const data = await response.json() as {
        history?: RunHistoryItem[];
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "运行历史读取失败");
      if (revision !== historyRevisionRef.current) return;
      setRunHistory(data.history || []);
    } catch {
      if (revision !== historyRevisionRef.current) return;
      setRunHistory([]);
    } finally {
      if (revision === historyRevisionRef.current) setHistoryLoading(false);
    }
  }, [lang, topicIndex]);

  const updateCode = useCallback((nextCode: string) => {
    draftEditRevisionRef.current += 1;
    setCode(nextCode);
    onContextChange({ code: nextCode, stdin: stdinRef.current, output: outputRef.current });
  }, [onContextChange]);

  function cancelResetAction() {
    if (resetActionTimerRef.current) {
      clearTimeout(resetActionTimerRef.current);
      resetActionTimerRef.current = null;
    }
    if (resetAction !== "idle" || resetSnapshotRef.current) {
      setResetAction("idle");
      resetSnapshotRef.current = null;
    }
  }

  const updateOutput = useCallback((nextOutput: string, sourceCode = code) => {
    outputRef.current = nextOutput;
    setOutput(nextOutput);
    onContextChange({ code: sourceCode, stdin: stdinRef.current, output: nextOutput });
  }, [code, onContextChange]);

  const updateStdin = useCallback((nextStdin: string) => {
    stdinRef.current = nextStdin;
    setStdin(nextStdin);
    onContextChange({ code, stdin: nextStdin, output: outputRef.current });
  }, [code, onContextChange]);

  useEffect(() => {
    let active = true;
    const editRevisionAtLoad = 0;
    draftSaveRevisionRef.current += 1;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftEditRevisionRef.current = editRevisionAtLoad;
    setDraftReadyKey("");
    setDraftStatus("正在读取草稿…");
    setCode(lesson.code);
    setCursorPosition({ line: 1, column: 1 });
    setSourceFileName(defaultSourceFileName(lang));
    if (resetActionTimerRef.current) clearTimeout(resetActionTimerRef.current);
    resetActionTimerRef.current = null;
    resetSnapshotRef.current = null;
    setResetAction("idle");
    stdinRef.current = "";
    setStdin("");
    const initialOutput = "终端已连接 · 等待输入";
    outputRef.current = initialOutput;
    setOutput(initialOutput);
    onContextChange({ code: lesson.code, stdin: "", output: initialOutput });

    const loadDraft = async () => {
      const importedCode = consumeCodeImport(lang, topicIndex);
      if (importedCode !== null) {
        if (!active) return;
        draftEditRevisionRef.current = 1;
        lastSavedCodeRef.current = lesson.code;
        setCode(importedCode);
        onContextChange({ code: importedCode, stdin: stdinRef.current, output: outputRef.current });
        setDraftStatus("已载入历史代码，正在保存为当前草稿…");
        setDraftReadyKey(draftKey);
        return;
      }
      let restoredCode = lesson.code;
      try {
        const params = new URLSearchParams({
          language: lang,
          topicIndex: String(topicIndex),
        });
        const response = await fetch(`/api/draft?${params}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const data = await response.json() as {
          draft?: { code?: string } | null;
          error?: string;
        };
        if (!response.ok) throw new Error(data.error || "代码草稿读取失败");
        if (typeof data.draft?.code === "string") restoredCode = data.draft.code;
        if (!active) return;

        lastSavedCodeRef.current = restoredCode;
        // 如果读取期间用户已经开始输入，则保留用户的新内容，不让旧草稿覆盖编辑器。
        if (draftEditRevisionRef.current === editRevisionAtLoad) {
          setCode(restoredCode);
          onContextChange({ code: restoredCode, stdin: stdinRef.current, output: outputRef.current });
        }
        setDraftStatus(data.draft ? "代码草稿已恢复" : "代码草稿自动保存");
      } catch (error) {
        if (!active) return;
        lastSavedCodeRef.current = lesson.code;
        setDraftStatus(error instanceof Error ? error.message : "代码草稿暂未同步");
      } finally {
        if (active) setDraftReadyKey(draftKey);
      }
    };

    void loadDraft();
    return () => {
      active = false;
    };
  }, [draftKey, lang, lesson, onContextChange, topicIndex]);

  useEffect(() => {
    // 草稿数据流：输入监听 → 500ms 防抖 → 服务端按“用户+语言+知识点”保存 → 状态渲染。
    if (draftReadyKey !== draftKey || code === lastSavedCodeRef.current) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);

    const revision = ++draftSaveRevisionRef.current;
    setDraftStatus("正在保存代码草稿…");
    draftTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch("/api/draft", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: lang, topicIndex, code }),
        });
        const data = await response.json() as { saved?: boolean; error?: string };
        if (!response.ok) throw new Error(data.error || "代码草稿保存失败");
        if (revision !== draftSaveRevisionRef.current) return;
        lastSavedCodeRef.current = code;
        setDraftStatus("代码草稿已保存");
      } catch (error) {
        if (revision !== draftSaveRevisionRef.current) return;
        setDraftStatus(error instanceof Error ? error.message : "代码草稿暂未同步");
      }
    }, 500);

    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [code, draftKey, draftReadyKey, lang, topicIndex]);

  useEffect(() => {
    void loadRunHistory();
  }, [loadRunHistory]);

  useEffect(() => () => {
    if (resetActionTimerRef.current) clearTimeout(resetActionTimerRef.current);
  }, []);

  useEffect(() => {
    if (!focusMode) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const exitOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFocusMode(false);
    };
    window.addEventListener("keydown", exitOnEscape);
    window.requestAnimationFrame(() => editorRef.current?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", exitOnEscape);
    };
  }, [focusMode]);

  useEffect(() => {
    // 数据流第 2 步：每次 code 变化都取消上一轮计时，重新开始 500ms 防抖。
    // 用户连续输入期间不会真正执行检测，因此不会浪费 CPU 或后端 API 配额。
    if (timerRef.current) clearTimeout(timerRef.current);
    const revision = ++analysisRevisionRef.current;
    updateOutput("● 已监听到输入\n  等待 500ms，输入暂停后自动检测…");

    timerRef.current = setTimeout(async () => {
      updateOutput("◌ 正在检测代码结构与常见问题…");

      // 数据流第 3 步：执行检测。这里保持异步接口形式，未来可直接替换成 fetch 或 WebWorker。
      const result = await Promise.resolve(inspectSourceCode(code, lang));

      // 如果检测期间用户又输入了内容，则丢弃这次旧结果，避免旧响应覆盖新代码。
      if (revision !== analysisRevisionRef.current) return;

      // 数据流第 4 步：写入 output 状态，React 只更新现有终端文本，不改变页面结构。
      updateOutput(formatInspection(result));
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [code, lang, updateOutput]);

  function handleCodeInput(event: React.ChangeEvent<HTMLTextAreaElement>) {
    cancelResetAction();
    // 数据流第 1 步：React onChange 对应文本框原生 input 事件，每次键入都同步最新代码。
    updateCode(event.target.value);
    updateCursorPosition(event.target);
  }

  function resetCode() {
    if (resetAction === "undo") {
      const snapshot = resetSnapshotRef.current;
      cancelResetAction();
      if (!snapshot) return;
      updateCode(snapshot.code);
      setSourceFileName(snapshot.fileName);
      setDraftStatus("已撤销重置，正在恢复原草稿…");
      window.requestAnimationFrame(() => {
        const editor = editorRef.current;
        if (!editor) return;
        editor.setSelectionRange(0, 0);
        updateCursorPosition(editor);
        editor.focus();
      });
      return;
    }

    if (code === lesson.code && sourceFileName === defaultSourceFileName(lang)) {
      cancelResetAction();
      setDraftStatus("当前已经是课程初始代码");
      return;
    }

    if (resetAction !== "confirm") {
      cancelResetAction();
      setResetAction("confirm");
      setDraftStatus("再次点击“确认重置”将恢复课程初始代码");
      resetActionTimerRef.current = setTimeout(() => {
        setResetAction("idle");
        setDraftStatus("已取消重置，当前代码保持不变");
        resetActionTimerRef.current = null;
      }, 5_000);
      return;
    }

    if (resetActionTimerRef.current) clearTimeout(resetActionTimerRef.current);
    resetSnapshotRef.current = { code, fileName: sourceFileName };
    updateCode(lesson.code);
    setSourceFileName(defaultSourceFileName(lang));
    setResetAction("undo");
    setDraftStatus("已重置，可在 10 秒内撤销");
    resetActionTimerRef.current = setTimeout(() => {
      setResetAction("idle");
      resetSnapshotRef.current = null;
      resetActionTimerRef.current = null;
    }, 10_000);
    window.requestAnimationFrame(() => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.scrollTop = 0;
      editor.setSelectionRange(0, 0);
      if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = 0;
      updateCursorPosition(editor);
      editor.focus();
    });
  }

  async function importSourceFile(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const lowerName = file.name.toLocaleLowerCase();
      const validExtension = sourceFileExtensions[lang].some((extension) => lowerName.endsWith(extension));
      if (!validExtension) {
        throw new Error(`${lang} 支持 ${sourceFileExtensions[lang].join("、")} 文件`);
      }
      if (file.size > 64_000) {
        throw new Error("源码文件过大，请选择 64KB 以内的文本文件");
      }

      const importedCode = (await file.text()).replace(/\r\n/g, "\n");
      if (importedCode.includes("\u0000")) {
        throw new Error("无法导入二进制文件，请选择纯文本源码");
      }
      if (importedCode.length > MAX_SOURCE_FILE_CHARS) {
        throw new Error(`源码最多支持 ${MAX_SOURCE_FILE_CHARS} 个字符`);
      }

      cancelResetAction();
      updateCode(importedCode);
      setSourceFileName(file.name.slice(0, 80));
      setDraftStatus(`已导入 ${file.name}，等待自动保存…`);
      window.requestAnimationFrame(() => {
        const editor = editorRef.current;
        if (!editor) return;
        editor.scrollTop = 0;
        editor.setSelectionRange(0, 0);
        if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = 0;
        updateCursorPosition(editor);
        editor.focus();
      });
    } catch (error) {
      setDraftStatus(error instanceof Error ? error.message : "源码文件导入失败");
    } finally {
      input.value = "";
    }
  }

  function downloadSourceFile() {
    const normalizedName = sourceFileName
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
      .replace(/^\.+/, "")
      .slice(0, 80) || defaultSourceFileName(lang);
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = normalizedName;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    setDraftStatus(`已下载 ${normalizedName}`);
  }

  function updateCursorPosition(target = editorRef.current) {
    if (!target) return;
    const beforeCursor = target.value.slice(0, target.selectionStart);
    const linesBeforeCursor = beforeCursor.split("\n");
    setCursorPosition({
      line: linesBeforeCursor.length,
      column: (linesBeforeCursor.at(-1)?.length || 0) + 1,
    });
  }

  function syncEditorScroll(event: React.UIEvent<HTMLTextAreaElement>) {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = event.currentTarget.scrollTop;
    }
  }

  function stopRun() {
    const activeController = runAbortRef.current;
    if (!activeController) return;
    activeController.abort();
    runAbortRef.current = null;
    setRunningMode(null);
    updateOutput("■ 已手动停止本次运行\n\n代码与标准输入均已保留，可以修改后重新运行。");
  }

  function handleRunShortcut(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(event.ctrlKey || event.metaKey) || event.key !== "Enter") return;
    event.preventDefault();
    if (runningMode) {
      stopRun();
      return;
    }
    void runCode(event.shiftKey ? "judge" : "run");
  }

  function handleEditorKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Tab") {
      handleRunShortcut(event);
      return;
    }

    event.preventDefault();
    cancelResetAction();
    const target = event.currentTarget;
    const selectionStart = target.selectionStart;
    const selectionEnd = target.selectionEnd;

    if (!event.shiftKey) {
      const indentation = "  ";
      const nextCode = `${code.slice(0, selectionStart)}${indentation}${code.slice(selectionEnd)}`;
      updateCode(nextCode);
      window.requestAnimationFrame(() => {
        const nextCursor = selectionStart + indentation.length;
        target.setSelectionRange(nextCursor, nextCursor);
        updateCursorPosition(target);
      });
      return;
    }

    const lineStart = code.lastIndexOf("\n", Math.max(0, selectionStart - 1)) + 1;
    const leadingWhitespace = code.slice(lineStart).match(/^(?: {1,2}|\t)/)?.[0] || "";
    if (!leadingWhitespace) return;

    const nextCode = `${code.slice(0, lineStart)}${code.slice(lineStart + leadingWhitespace.length)}`;
    updateCode(nextCode);
    window.requestAnimationFrame(() => {
      const nextCursor = Math.max(lineStart, selectionStart - leadingWhitespace.length);
      target.setSelectionRange(nextCursor, nextCursor);
      updateCursorPosition(target);
    });
  }

  async function runCode(mode: "run" | "judge" = "run") {
    // 主动运行时使尚未完成的自动检测失效，防止检测结果覆盖运行结果。
    analysisRevisionRef.current += 1;
    if (timerRef.current) clearTimeout(timerRef.current);
    runAbortRef.current?.abort();
    const controller = new AbortController();
    runAbortRef.current = controller;
    setRunningMode(mode);
    updateOutput(mode === "judge"
      ? "› 正在提交判题…\n› 正在运行隐藏测试并核对结果…"
      : "› 正在提交最新代码…\n› 正在隔离环境中编译并运行…");

    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          language: lang,
          code,
          stdin,
          judge: mode === "judge",
          topicIndex,
        }),
      });
      const result = await response.json() as RunResult & { error?: string };
      if (!response.ok) throw new Error(result.error || "代码执行失败");
      updateOutput(formatRunResult(result));
      if (
        result.completionSaved
        && result.judge
        && result.judge.passed === result.judge.total
      ) {
        onLessonCompleted(lang, topicIndex);
      }
      if (result.runRecorded) void loadRunHistory();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      updateOutput(`✕ 运行失败\n\n${error instanceof Error ? error.message : "代码执行服务暂时不可用"}`);
    } finally {
      if (runAbortRef.current === controller) {
        runAbortRef.current = null;
        setRunningMode(null);
      }
    }
  }

  return (
    <section className={`feature-section ${focusMode ? "sandbox-focus-mode" : ""}`} id="lab">
      <div className="section-heading">
        <div><h2>在线实训沙盒</h2></div>
        <div className="sandbox-heading-actions">
          <select value={lang} onChange={(event) => setLang(event.target.value as Lang)}>{(Object.keys(lessons) as Lang[]).map((key) => <option key={key}>{key}</option>)}</select>
          <button
            className="focus-mode-toggle"
            onClick={() => setFocusMode((current) => !current)}
            aria-pressed={focusMode}
            aria-label={focusMode ? "退出实训专注模式" : "进入实训专注模式"}
          >
            {focusMode ? "↙ 退出专注" : "⛶ 专注模式"}
          </button>
        </div>
      </div>
      <div className="sandbox glass">
        <div className="editor-pane">
          <div className="pane-head">
            <span><i /> {sourceFileName}</span>
            <div className="editor-file-actions">
              <input
                ref={sourceFileInputRef}
                type="file"
                accept={sourceFileExtensions[lang].join(",")}
                onChange={importSourceFile}
                tabIndex={-1}
                aria-hidden="true"
              />
              <button onClick={() => sourceFileInputRef.current?.click()}>⇧ 导入</button>
              <button onClick={downloadSourceFile}>⇩ 下载</button>
              <button
                className={resetAction === "confirm" ? "reset-confirm" : resetAction === "undo" ? "reset-undo" : ""}
                onClick={resetCode}
              >
                {resetAction === "confirm" ? "! 确认重置" : resetAction === "undo" ? "↶ 撤销" : "↺ 重置"}
              </button>
            </div>
          </div>
          <div className="code-editor-body">
            <pre ref={lineNumbersRef} className="code-line-numbers" aria-hidden="true">{lineNumbers}</pre>
            <textarea
              ref={editorRef}
              spellCheck={false}
              value={code}
              onChange={handleCodeInput}
              onKeyDown={handleEditorKeyDown}
              onScroll={syncEditorScroll}
              onSelect={(event) => updateCursorPosition(event.currentTarget)}
              aria-label="代码编辑器"
              aria-keyshortcuts="Tab Shift+Tab Control+Enter Meta+Enter Control+Shift+Enter Meta+Shift+Enter"
            />
          </div>
          <div className="editor-foot">
            <span>UTF-8 · Ln {cursorPosition.line}, Col {cursorPosition.column} · {code.split("\n").length} 行 · {draftStatus}</span>
            <div className="editor-actions">
              <button className="stop-run" onClick={stopRun} disabled={runningMode === null}>
                ■ 停止
              </button>
              <button className="judge-submit" onClick={() => runCode("judge")} disabled={runningMode !== null} title="Ctrl/Cmd + Shift + Enter">
                {runningMode === "judge" ? "判题中…" : "✓ 提交判题"}
              </button>
              <button className="run" onClick={() => runCode("run")} disabled={runningMode !== null} title="Ctrl/Cmd + Enter">
                {runningMode === "run" ? "运行中…" : "▶ 运行代码"}
              </button>
            </div>
          </div>
        </div>
        <div className="terminal-pane">
          <div className="pane-head"><span>TERMINAL / OUTPUT</span><button onClick={() => updateOutput("")}>清空</button></div>
          <div className="stdin-panel">
            <div><span>STDIN · 程序标准输入</span><small>{runningMode === "judge" ? "判题时使用隐藏测试输入" : `${stdin.length} 个字符`}</small><button onClick={() => updateStdin("")} disabled={!stdin}>清空</button></div>
            <textarea
              value={stdin}
              onChange={(event) => updateStdin(event.target.value)}
              onKeyDown={handleRunShortcut}
              placeholder={"每行输入一个值，例如：\nLin\n92"}
              aria-label="程序标准输入"
              spellCheck={false}
              maxLength={2000}
            />
          </div>
          <pre>{output}</pre>
          <div className="judge-row"><div><span className="status-dot" /> 实时通道</div><b className={output.includes("3 / 3 通过") ? "passed" : ""}>{runningMode === "judge" ? "判题中" : runningMode === "run" ? "执行中" : output.includes("自动判题") ? "判题完成" : output.includes("✓ 运行成功") ? "执行完成" : output.startsWith("✕") ? "执行失败" : "监听中"}</b></div>
        </div>
      </div>
      <section className="run-history glass" aria-label="当前知识点运行历史">
        <div className="run-history-head">
          <div><b>最近运行记录</b></div>
        </div>
        {historyLoading ? (
          <div className="run-history-empty">正在读取运行记录…</div>
        ) : runHistory.length ? (
          <div className="run-history-list">
            {runHistory.map((item) => {
              const accepted = item.statusId === 3;
              return (
                <article
                  className={`${accepted ? "accepted" : "failed"} code-record-trigger`}
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`查看第 ${item.id} 条运行代码`}
                  onClick={() => setCodeViewerRequest({
                    kind: "run",
                    id: item.id,
                    language: lang,
                    topicIndex,
                  })}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setCodeViewerRequest({ kind: "run", id: item.id, language: lang, topicIndex });
                    }
                  }}
                >
                  <i>{accepted ? "✓" : "!"}</i>
                  <div>
                    <b>{item.mode === "judge" ? "自动判题" : "普通运行"}</b>
                    <span>{item.statusDescription}</span>
                  </div>
                  <div className="run-history-metrics">
                    {item.mode === "judge" && item.totalTests != null && <span>{item.passedTests}/{item.totalTests} 通过</span>}
                    {item.durationMs != null && <span>{item.durationMs} ms</span>}
                    {item.memoryKb != null && <span>{Math.max(1, Math.round(item.memoryKb / 1024))} MB</span>}
                  </div>
                  <time>{formatRunHistoryTime(item.createdAt)}</time>
                  <span className="code-record-availability">{item.codeAvailable ? "查看源码" : "旧记录无源码"}</span>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="run-history-empty">还没有运行记录，完成一次运行后会显示在这里。</div>
        )}
      </section>
      <CodeViewerDialog request={codeViewerRequest} onClose={() => setCodeViewerRequest(null)} />
    </section>
  );
}

const StableKnowledgeGraph = memo(KnowledgeGraph);
const StableSandbox = memo(Sandbox);

function DeepLesson({ lang, topicIndex }: { lang: Lang; topicIndex: number }) {
  const guide = curriculum[lang].guides[topicIndex];
  return (
    <section className="deep-lesson" aria-labelledby="deep-lesson-title">
      <div className="deep-intro">
        <h2 id="deep-lesson-title">从执行模型理解，而不是只记住语法</h2>
        <p>{guide.summary}</p>
      </div>
      <div className="concept-flow" aria-label="知识点执行流程">
        {guide.principles.map((item, index) => <article key={item.title}>
          <div><b>0{index + 1}</b></div>
          <h3>{item.title}</h3><p>{item.text}</p>
        </article>)}
      </div>
      <div className="deep-example glass">
        <div className="mac-code-head" aria-hidden="true"><span>code walkthrough</span></div>
        <div className="example-explain">
          <h3>{guide.syntaxTitle}</h3>
          <p>{guide.syntaxNote}</p>
          <ol><li>先确认输入数据及其类型</li><li>观察每轮循环变量的变化</li><li>验证终止条件和空数据边界</li></ol>
        </div>
        <pre><code>{guide.syntaxCode}</code></pre>
      </div>
      <div className="pitfall-section">
        <div><h3>三个高频错误与修复方法</h3></div>
        <div className="pitfall-grid">{guide.pitfalls.map((item) => <article key={item.title}>
          <h4>{item.title}</h4><p className="wrong">× {item.wrong}</p><p className="right">✓ {item.right}</p>
        </article>)}</div>
      </div>
    </section>
  );
}

function LessonNotes({
  lang,
  topicIndex,
  lessonTitle,
}: {
  lang: Lang;
  topicIndex: number;
  lessonTitle: string;
}) {
  const [content, setContent] = useState("");
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("正在读取笔记…");
  const savedContentRef = useRef("");

  useEffect(() => {
    const controller = new AbortController();

    const loadNote = async () => {
      try {
        const params = new URLSearchParams({
          language: lang,
          topicIndex: String(topicIndex),
        });
        const response = await fetch(`/api/notes?${params}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json() as {
          note?: { content: string; updatedAt: string } | null;
          error?: string;
        };
        if (!response.ok) throw new Error(data.error || "学习笔记读取失败");

        const restoredContent = data.note?.content || "";
        savedContentRef.current = restoredContent;
        setContent(restoredContent);
        setStatus(data.note ? "笔记已恢复" : "输入后自动保存");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus(error instanceof Error ? error.message : "学习笔记暂未同步");
      } finally {
        if (!controller.signal.aborted) setReady(true);
      }
    };

    void loadNote();
    return () => controller.abort();
  }, [lang, topicIndex]);

  useEffect(() => {
    if (!ready || content === savedContentRef.current) return;

    setStatus("等待自动保存…");
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setStatus("正在保存…");
      try {
        const response = await fetch("/api/notes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: lang, topicIndex, content }),
          signal: controller.signal,
        });
        const data = await response.json() as { saved?: boolean; error?: string };
        if (!response.ok) throw new Error(data.error || "学习笔记保存失败");
        savedContentRef.current = content;
        setStatus("笔记已保存");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus(error instanceof Error ? error.message : "学习笔记暂未同步");
      }
    }, 500);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [content, lang, ready, topicIndex]);

  return (
    <section className="lesson-notes glass" aria-labelledby="lesson-notes-title">
      <div className="lesson-notes-head">
        <div>
          <h2 id="lesson-notes-title">我的学习笔记</h2>
          <p>{lang} · {lessonTitle}，仅保存到你的账号。</p>
        </div>
        <div className="lesson-notes-status" role="status">
          <i className={status.includes("已") || status.includes("自动") ? "synced" : ""} />
          {status}
        </div>
      </div>
      <textarea
        value={content}
        maxLength={8000}
        disabled={!ready}
        onChange={(event) => setContent(event.target.value)}
        placeholder={"记录你对本节知识点的理解、易错点和复习结论…\n\n建议结构：\n1. 核心概念\n2. 容易犯的错误\n3. 我自己的代码示例"}
        aria-label={`${lessonTitle}学习笔记`}
      />
      <footer>
        <span>停止输入 500ms 后自动保存</span>
        <b>{content.length} / 8000</b>
      </footer>
    </section>
  );
}

function GraphDocumentExport({ lesson }: { lesson: Course }) {
  const [format, setFormat] = useState<"pdf" | "word">("pdf");

  function exportDocument() {
    if (format === "pdf") {
      document.body.classList.add("print-mindmap");
      const cleanup = () => document.body.classList.remove("print-mindmap");
      window.addEventListener("afterprint", cleanup, { once: true });
      window.setTimeout(() => window.print(), 40);
      return;
    }
    const section = document.querySelector("#map");
    if (!section) return;
    const clone = section.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("button,select,.react-flow__controls,.react-flow__minimap").forEach((element) => element.remove());
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${lesson.title}知识图谱</title><style>body{font-family:Arial,'Microsoft YaHei';padding:32px;color:#162033}h1,h2{color:#102a43}.graph-shell{height:720px;border:1px solid #ccd5e0;position:relative;overflow:hidden}.react-flow{width:100%;height:100%}.knowledge-node{border:1px solid #789;padding:10px;border-radius:8px;background:#fff}.node-title,.node-description{border:0;width:100%}</style></head><body><h1>Blinga coding · ${lesson.title}</h1>${clone.outerHTML}</body></html>`;
    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${lesson.title}-知识图谱.doc`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return <div className="document-export glass"><div><b>导出当前知识图谱</b></div><label><span>格式</span><select value={format} onChange={(event) => setFormat(event.target.value as "pdf" | "word")}><option value="pdf">PDF</option><option value="word">Word</option></select></label><button onClick={exportDocument}>⇩ 导出{format === "pdf" ? " PDF" : " Word"}</button></div>;
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("Python");
  const [topicByLang, setTopicByLang] = useState<Record<Lang, number>>({ Python: 3, "C/C++": 0, JavaScript: 0, Java: 0 });
  const [progressReady, setProgressReady] = useState(false);
  const [progressStatus, setProgressStatus] = useState("正在恢复学习进度…");
  const [completedTopics, setCompletedTopics] = useState<Record<string, number[]>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState("");
  const [searchBusy, setSearchBusy] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([{ ...INITIAL_CHAT_MESSAGE }]);
  const [aiBusy, setAiBusy] = useState(false);
  const [sandboxContext, setSandboxContext] = useState<SandboxContext>({
    code: lessons.Python.code,
    stdin: "",
    output: "终端已连接 · 等待输入",
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchRequestRef = useRef(0);
  const searchAbortRef = useRef<AbortController | null>(null);
  const chatAbortRef = useRef<AbortController | null>(null);
  const chatRequestRef = useRef(0);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const syncSandboxContext = useCallback((context: SandboxContext) => {
    setSandboxContext(context);
  }, []);
  const markLessonCompleted = useCallback((language: Lang, topicIndex: number) => {
    setCompletedTopics((current) => {
      const existing = current[language] || [];
      if (existing.includes(topicIndex)) return current;
      return {
        ...current,
        [language]: [...existing, topicIndex].sort((left, right) => left - right),
      };
    });
  }, []);
  const selectedTopicIndex = topicByLang[lang];
  const baseLesson = lessons[lang];
  const isFirstTopic = selectedTopicIndex === 0;
  const isLastTopic = selectedTopicIndex === baseLesson.topics.length - 1;
  const lesson = useMemo(
    () => curriculum[lang].lessons[selectedTopicIndex],
    [lang, selectedTopicIndex],
  );
  const completedForCurrentLanguage = completedTopics[lang] || [];
  const completedCount = completedForCurrentLanguage.filter(
    (topicIndex) => topicIndex >= 0 && topicIndex < lesson.topics.length,
  ).length;
  const completionPercent = Math.round((completedCount / lesson.topics.length) * 100);
  const currentTopicCompleted = completedForCurrentLanguage.includes(selectedTopicIndex);
  const courseMatches = useMemo(() => findCourseMatches(searchQuery), [searchQuery]);

  function navigateToCourse(nextLanguage: Lang, nextTopicIndex: number, fromSearch = false) {
    const safeTopicIndex = Math.max(
      0,
      Math.min(lessons[nextLanguage].topics.length - 1, nextTopicIndex),
    );
    const isSameCourse = nextLanguage === lang && safeTopicIndex === selectedTopicIndex;

    setLang(nextLanguage);
    setTopicByLang((current) => ({ ...current, [nextLanguage]: safeTopicIndex }));
    if (fromSearch) {
      setSearchOpen(false);
      setSearchResult("");
    }
    if (!isSameCourse) {
      const nextUrl = `/?lang=${encodeURIComponent(nextLanguage)}&topic=${safeTopicIndex}#learn`;
      window.history.pushState(
        { lang: nextLanguage, topic: safeTopicIndex },
        "",
        nextUrl,
      );
    }
    window.requestAnimationFrame(() => {
      document.getElementById("learn")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function navigateToTopic(nextTopicIndex: number) {
    navigateToCourse(lang, nextTopicIndex);
  }

  function updateSearchQuery(value: string) {
    searchAbortRef.current?.abort();
    searchRequestRef.current += 1;
    setSearchQuery(value);
    setSearchResult("");
    setSearchBusy(false);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (searchOpen) window.setTimeout(() => searchInputRef.current?.focus(), 80);
  }, [searchOpen]);

  useEffect(() => {
    if (!chatOpen) return;
    const frame = window.requestAnimationFrame(() => {
      const container = chatMessagesRef.current;
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [aiBusy, chatOpen, messages]);

  useEffect(() => () => {
    searchAbortRef.current?.abort();
    chatAbortRef.current?.abort();
  }, []);

  useEffect(() => {
    let active = true;

    const readCourseFromUrl = (progress?: LearningProgress | null) => {
      const params = new URLSearchParams(window.location.search);
      const requestedLanguage = params.get("lang") as Lang | null;
      const requestedTopic = Number(params.get("topic"));
      const hasRequestedLanguage = Boolean(requestedLanguage && requestedLanguage in lessons);
      const nextLanguage = hasRequestedLanguage
        ? requestedLanguage as Lang
        : progress?.activeLanguage;

      if (progress) setTopicByLang(progress.topics);
      if (nextLanguage) {
        setLang(nextLanguage);
        if (hasRequestedLanguage && Number.isInteger(requestedTopic)) {
          const safeTopic = Math.max(0, Math.min(lessons[nextLanguage].topics.length - 1, requestedTopic));
          setTopicByLang((current) => ({ ...current, [nextLanguage]: safeTopic }));
        }
      }
    };

    const loadProgress = async () => {
      try {
        const response = await fetch("/api/progress", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "学习进度恢复失败");
        if (!active) return;
        readCourseFromUrl(data.progress as LearningProgress | null);
        setProgressStatus(data.progress ? "学习进度已恢复" : "学习进度自动同步");
      } catch (error) {
        if (!active) return;
        readCourseFromUrl();
        setProgressStatus(error instanceof Error ? error.message : "学习进度暂未同步");
      } finally {
        if (active) setProgressReady(true);
      }
    };

    const onPopState = () => readCourseFromUrl();
    void loadProgress();
    window.addEventListener("popstate", onPopState);
    return () => {
      active = false;
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useEffect(() => {
    if (!progressReady) return;

    setProgressStatus("正在同步学习进度…");
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/progress", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activeLanguage: lang, topics: topicByLang }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "学习进度同步失败");
        setProgressStatus("学习进度已同步");
      } catch (error) {
        setProgressStatus(error instanceof Error ? error.message : "学习进度暂未同步");
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [lang, progressReady, topicByLang]);

  useEffect(() => {
    let active = true;
    const loadCompletions = async () => {
      try {
        const response = await fetch("/api/completions", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const data = await response.json() as {
          completions?: LessonCompletion[];
          error?: string;
        };
        if (!response.ok) throw new Error(data.error || "课程完成状态读取失败");
        if (!active) return;

        const grouped: Record<string, number[]> = {};
        for (const completion of data.completions || []) {
          if (!grouped[completion.language]) grouped[completion.language] = [];
          if (!grouped[completion.language].includes(completion.topicIndex)) {
            grouped[completion.language].push(completion.topicIndex);
          }
        }
        Object.values(grouped).forEach((topics) => topics.sort((left, right) => left - right));
        setCompletedTopics(grouped);
      } catch {
        if (active) setCompletedTopics({});
      }
    };

    void loadCompletions();
    return () => {
      active = false;
    };
  }, []);

  async function callAi(mode: "chat" | "search", prompt: string, signal?: AbortSignal) {
    const context = mode === "chat"
      ? [
          `当前课程：${lesson.kicker}`,
          `知识点：${lesson.title}`,
          `课程说明：${lesson.desc}`,
          `当前语言：${lang}`,
          "用户编辑器中的最新代码：",
          sandboxContext.code.slice(-4_000),
          "程序标准输入：",
          sandboxContext.stdin.slice(0, 2_000) || "（空）",
          "最近一次实时检测或运行结果：",
          sandboxContext.output.slice(-1_500),
        ].join("\n")
      : [
          `当前课程：${lesson.kicker}`,
          `当前知识点：${lesson.title}`,
          "Blinga coding 全部课程目录：",
          ...courseSearchIndex.map(
            (item) => `${item.language} 第${item.topicIndex + 1}节 ${item.title}：${item.description}`,
          ),
        ].join("\n").slice(0, 5_500);
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, prompt, context }),
      signal,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "AI 服务暂时不可用");
    return data.answer as string;
  }

  async function search() {
    if (!searchQuery.trim()) return;
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    const requestId = ++searchRequestRef.current;
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 50_000);
    setSearchBusy(true);
    setSearchResult("正在检索课程知识与扩展资料…");
    try {
      const answer = await callAi("search", searchQuery, controller.signal);
      if (requestId === searchRequestRef.current) setSearchResult(answer);
    } catch (error) {
      if (requestId === searchRequestRef.current) {
        if (error instanceof DOMException && error.name === "AbortError") {
          if (timedOut) setSearchResult("AI 搜索响应超时，请稍后重试");
        } else {
          setSearchResult(error instanceof Error ? error.message : "搜索失败");
        }
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (requestId === searchRequestRef.current) {
        searchAbortRef.current = null;
        setSearchBusy(false);
      }
    }
  }

  async function ask(text = question) {
    if (!text.trim() || aiBusy) return;
    const value = text.trim();
    const controller = new AbortController();
    chatAbortRef.current = controller;
    const requestId = ++chatRequestRef.current;
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 50_000);

    setMessages((current) => [...current, { role: "user", text: value }].slice(-40));
    setQuestion("");
    setAiBusy(true);
    try {
      const answer = await callAi("chat", value, controller.signal);
      if (requestId === chatRequestRef.current) {
        setMessages((current) => [...current, { role: "ai", text: answer }].slice(-40));
      }
    } catch (error) {
      if (requestId === chatRequestRef.current) {
        const text = error instanceof DOMException && error.name === "AbortError"
          ? timedOut
            ? "AI 响应超时，本次请求已自动停止，请稍后重试。"
            : "已停止本次回答。你可以调整问题后重新发送。"
          : error instanceof Error
            ? error.message
            : "AI 服务暂时不可用";
        setMessages((current) => [...current, { role: "ai", text }].slice(-40));
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (requestId === chatRequestRef.current) {
        chatAbortRef.current = null;
        setAiBusy(false);
      }
    }
  }

  function stopAiAnswer() {
    chatAbortRef.current?.abort();
  }

  function clearConversation() {
    chatRequestRef.current += 1;
    chatAbortRef.current?.abort();
    chatAbortRef.current = null;
    setAiBusy(false);
    setQuestion("");
    setMessages([{ ...INITIAL_CHAT_MESSAGE }]);
  }

  return (
    <ReactFlowProvider>
      <main>
        <div className="ambient one" /><div className="ambient two" />
        <header className="topbar glass">
          <a className="brand" href="#learn"><span className="brandmark">&lt;/&gt;</span><span>Blinga <span>coding</span></span></a>
          <nav><a className="active" href="#learn">学习中心</a><a href="#map">知识图谱</a><a href="#lab">在线实训</a></nav>
          <div className="header-actions"><button className="search-trigger" onClick={() => setSearchOpen(true)}>⌕ <span>搜索知识点</span></button><AccountMenu /></div>
        </header>

        <div className={`search-overlay ${searchOpen ? "open" : ""}`} aria-hidden={!searchOpen} onMouseDown={(event) => { if (event.currentTarget === event.target) setSearchOpen(false); }}>
          <div className="search-dialog glass" role="dialog" aria-modal="true" aria-labelledby="global-search-title">
            <div className="search-dialog-head"><div><b id="global-search-title">全站课程与 AI 搜索</b></div><button onClick={() => setSearchOpen(false)} aria-label="关闭搜索">×</button></div>
            <div className="search-box"><input ref={searchInputRef} value={searchQuery} onChange={(event) => updateSearchQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") search(); }} placeholder="例如：循环、指针、异步编程…" /><button onClick={search} disabled={!searchQuery.trim() || searchBusy}>{searchBusy ? "分析中" : "AI 深度搜索"}</button></div>
            {searchQuery.trim() && <section className="course-search-results" aria-label="即时课程匹配">
              <header><span>即时课程匹配</span><b>{courseMatches.length ? `${courseMatches.length} 个结果` : "暂无匹配"}</b></header>
              {courseMatches.length > 0
                ? <div>{courseMatches.map((item) =>
                    <button
                      key={`${item.language}:${item.topicIndex}`}
                      onClick={() => navigateToCourse(item.language, item.topicIndex, true)}
                    >
                      <i style={{ background: lessons[item.language].color }}>{lessons[item.language].icon}</i>
                      <span>
                        <small>{item.language} · 第 {String(item.topicIndex + 1).padStart(2, "0")} 节</small>
                        <b>{item.title}</b>
                        <em>{item.description}</em>
                      </span>
                      <strong>打开 →</strong>
                    </button>
                  )}</div>
                : <p>没有找到完全匹配的课程，可调整关键词或使用 AI 深度搜索。</p>}
            </section>}
            {searchResult && <div className="search-answer"><p>{searchResult}</p></div>}
          </div>
        </div>

        <div className="workspace">
          <aside className="sidebar glass" aria-label="课程导航">
            <a className="course-nav-back" href="/">← 全部编程语言</a>
            <a className="language selected course-root-link" href={`/courses/${languageSlugs[lang]}`}>
              <i style={{ background: lessons[lang].color }}>{lessons[lang].icon}</i>
              <span>{lang}<small>已完成 {completedCount}/{lesson.topics.length} · {completionPercent}%</small></span><b>⌂</b>
            </a>
            <div className="course-progress" aria-label={`${lang} 课程完成度 ${completionPercent}%`}>
              <span style={{ width: `${completionPercent}%` }} />
            </div>
            <nav className="course-topic-nav" aria-label={`${lang} 知识点`}>
              {lesson.topics.map((topic, index) =>
                <a
                  className={[
                    selectedTopicIndex === index ? "active" : "",
                    completedForCurrentLanguage.includes(index) ? "completed" : "",
                  ].filter(Boolean).join(" ")}
                  href={`/?lang=${encodeURIComponent(lang)}&topic=${index}#learn`}
                  key={topic}
                  onClick={(event) => {
                    event.preventDefault();
                    navigateToTopic(index);
                  }}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <b>{topic}</b>
                  <i>{completedForCurrentLanguage.includes(index) ? "✓" : selectedTopicIndex === index ? "●" : "›"}</i>
                </a>
              )}
            </nav>
            <div className="course-switcher">
              <span>切换编程语言</span>
              <div>{(Object.keys(lessons) as Lang[]).filter((key) => key !== lang).map((key) =>
                <a href={`/courses/${languageSlugs[key]}`} aria-label={`进入 ${key} 课程`} key={key} style={{ "--switch-color": lessons[key].color } as React.CSSProperties}>{lessons[key].icon}</a>
              )}</div>
            </div>
            <div className="progress-sync" role="status">
              <span className={progressStatus.includes("已") || progressStatus.includes("自动") ? "synced" : ""} />
              {progressStatus}
            </div>
          </aside>

          <section className="content" id="learn">
            <div className="breadcrumb">学习中心 <span>/</span> {lang} <span>/</span> 第 {String(topicByLang[lang] + 1).padStart(2, "0")} 节</div>
            <div className="lesson-head">
              <div><p>{lesson.kicker}</p><h1>{lesson.title}</h1><div className="meta"><span>◉ 3 个练习</span><span className="level">基础</span><span>{currentTopicCompleted ? "✓ 当前知识点已完成" : "通过自动判题后记录完成"}</span></div></div>
              <div className="pager">
                <button
                  disabled={isFirstTopic}
                  onClick={() => navigateToTopic(selectedTopicIndex - 1)}
                  aria-label="进入上一节课程"
                >
                  ← 上一节
                </button>
                <button
                  className="primary"
                  disabled={isLastTopic}
                  onClick={() => navigateToTopic(selectedTopicIndex + 1)}
                  aria-label="进入下一节课程"
                >
                  下一节 →
                </button>
              </div>
            </div>

            <article className="lesson-card glass"><h2>{lesson.title}：核心概念与实践</h2><p>{lesson.desc}</p><div className="note"><b>💡 学习方式</b><span>先理解概念和执行过程，再阅读代码示例，最后进入在线实训完成修改与验证。</span></div></article>
            <DeepLesson lang={lang} topicIndex={selectedTopicIndex} />

            <div className="code-example glass">
              <div className="pane-head"><span><i /> lesson-example</span><button onClick={() => navigator.clipboard?.writeText(lesson.code)}>复制代码</button></div>
              <pre><code>{lesson.code}</code></pre>
              <div className="example-foot"><span>01 准备数据</span><span>02 逐个遍历</span><span>03 处理结果</span><a href="#lab">打开实训沙盒 →</a></div>
            </div>

            <LessonNotes
              key={`${lang}:${selectedTopicIndex}`}
              lang={lang}
              topicIndex={selectedTopicIndex}
              lessonTitle={lesson.title}
            />
            <StableKnowledgeGraph lesson={lesson} code={lesson.code} />
            <GraphDocumentExport lesson={lesson} />
            <StableSandbox lang={lang} setLang={setLang} lesson={lesson} topicIndex={selectedTopicIndex} onContextChange={syncSandboxContext} onLessonCompleted={markLessonCompleted} />
          </section>
        </div>

        <div className={`chat-dock ${chatOpen ? "open" : ""}`}>
          <button
            className="chat-fab"
            onClick={() => setChatOpen((current) => !current)}
            aria-expanded={chatOpen}
            aria-controls="ai-programming-assistant"
          >
            <span>✦</span>{chatOpen ? "收起" : "问 AI"}
          </button>
        </div>
        <aside id="ai-programming-assistant" className={`chat glass ${chatOpen ? "open" : ""}`} aria-hidden={!chatOpen}>
          <div className="chat-head"><div><span>✦</span><div><b>AI 编程助教</b><small>{aiBusy ? "正在分析当前代码…" : `已同步编辑器 · ${sandboxContext.code.split("\n").length} 行代码`}</small></div></div><div className="chat-head-actions"><button className="chat-clear" onClick={clearConversation} disabled={messages.length === 1 && !aiBusy}>清空</button><button onClick={() => setChatOpen(false)} aria-label="关闭 AI 助教">×</button></div></div>
          <div className="messages" ref={chatMessagesRef} aria-live="polite">{messages.map((message, index) => <div key={index} className={`message ${message.role}`}>{message.text}</div>)}{aiBusy && <div className="message ai ai-working"><i />正在组织答案，可随时停止…</div>}</div>
          <div className="chips"><button disabled={aiBusy} onClick={() => ask("用生活化的例子解释当前知识点")}>解释知识点</button><button disabled={aiBusy} onClick={() => ask("分析这段代码可能出现的错误")}>分析报错</button><button disabled={aiBusy} onClick={() => ask("给出代码优化建议")}>优化代码</button></div>
          <div className="chat-input"><textarea value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); ask(); } }} placeholder={aiBusy ? "AI 正在回答，可先编辑下一个问题…" : "输入你的编程问题…"} /><button className={aiBusy ? "stop" : ""} onClick={aiBusy ? stopAiAnswer : () => ask()} disabled={!aiBusy && !question.trim()} aria-label={aiBusy ? "停止 AI 回答" : "发送问题"}>{aiBusy ? "■" : "↑"}</button></div>
        </aside>
      </main>
    </ReactFlowProvider>
  );
}
