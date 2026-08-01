type LanguageSlug = "python" | "c-cpp" | "javascript" | "java";

const courses: Record<LanguageSlug, {
  name: string;
  icon: string;
  color: string;
  description: string;
  queryName: string;
  topics: Array<{ title: string; description: string; outcome: string }>;
}> = {
  python: {
    name: "Python",
    icon: "Py",
    color: "#58e6ba",
    queryName: "Python",
    description: "从零开始建立清晰的编程思维，逐步掌握语法、数据结构、函数与面向对象。",
    topics: [
      { title: "快速入门", description: "配置运行环境，完成第一段程序，理解缩进、注释与输入输出。", outcome: "独立运行 Python 程序" },
      { title: "变量与类型", description: "掌握数字、字符串、布尔值、类型转换和变量命名规则。", outcome: "正确表达程序状态" },
      { title: "条件判断", description: "使用 if、elif、else 构建多分支业务逻辑。", outcome: "让程序做出选择" },
      { title: "循环结构", description: "学习 for、while、range、break 与 continue。", outcome: "批量处理重复任务" },
      { title: "函数", description: "理解参数、返回值、作用域、类型标注与函数设计。", outcome: "封装可复用逻辑" },
      { title: "列表与字典", description: "组织、查询和转换结构化数据，掌握常用容器操作。", outcome: "完成真实数据处理" },
      { title: "面向对象", description: "学习类、对象、属性、方法、封装与继承。", outcome: "构建可扩展程序" },
    ],
  },
  "c-cpp": {
    name: "C/C++",
    icon: "C+",
    color: "#9ca8ff",
    queryName: "C/C++",
    description: "理解编译型语言、内存模型和类型系统，建立扎实的系统编程基础。",
    topics: [
      { title: "环境配置", description: "配置编译器与调试环境，理解源代码到可执行文件的过程。", outcome: "完成编译与运行" },
      { title: "数据类型", description: "掌握整数、浮点、字符、常量和类型转换。", outcome: "安全管理数据" },
      { title: "流程控制", description: "使用条件与循环组织程序执行路径。", outcome: "实现完整业务逻辑" },
      { title: "数组", description: "理解连续内存、下标访问和边界安全。", outcome: "处理批量数据" },
      { title: "指针", description: "理解地址、解引用、动态内存与资源管理。", outcome: "掌握内存模型" },
      { title: "函数", description: "学习参数传递、引用、重载和头文件组织。", outcome: "拆分复杂程序" },
      { title: "类与对象", description: "学习封装、构造函数、继承和多态。", outcome: "进入现代 C++ 设计" },
    ],
  },
  javascript: {
    name: "JavaScript",
    icon: "JS",
    color: "#ffd36a",
    queryName: "JavaScript",
    description: "从语言基础走向浏览器交互、异步编程和现代前端工程化。",
    topics: [
      { title: "语言基础", description: "认识运行环境、表达式、函数和控制台。", outcome: "运行 JavaScript 程序" },
      { title: "变量与作用域", description: "理解 let、const、闭包和词法作用域。", outcome: "管理程序状态" },
      { title: "数组方法", description: "掌握 map、filter、reduce 和数据流水线。", outcome: "高效转换数据" },
      { title: "DOM 操作", description: "查询和修改页面元素，处理用户事件。", outcome: "创建交互页面" },
      { title: "异步编程", description: "学习 Promise、async/await 和错误处理。", outcome: "调用网络服务" },
      { title: "ES6+", description: "掌握模块、解构、展开语法和现代语言特性。", outcome: "编写现代代码" },
      { title: "工程化", description: "认识构建工具、模块系统、测试和部署。", outcome: "组织真实项目" },
    ],
  },
  java: {
    name: "Java",
    icon: "Jv",
    color: "#ff9677",
    queryName: "Java",
    description: "通过静态类型、集合框架和面向对象构建可靠、可维护的应用程序。",
    topics: [
      { title: "快速入门", description: "理解 JDK、JVM、类结构和程序入口。", outcome: "运行 Java 程序" },
      { title: "变量与类型", description: "掌握基本类型、引用类型和类型转换。", outcome: "正确组织数据" },
      { title: "控制流", description: "使用分支和循环表达业务规则。", outcome: "控制执行过程" },
      { title: "数组与集合", description: "学习数组、List、Set 和 Map。", outcome: "管理数据集合" },
      { title: "方法", description: "理解参数、返回值、重载和作用域。", outcome: "封装程序逻辑" },
      { title: "类与对象", description: "掌握封装、继承、多态和接口。", outcome: "进行面向对象设计" },
      { title: "异常处理", description: "处理运行时错误并建立可靠的失败路径。", outcome: "提升程序健壮性" },
    ],
  },
};

const languageOrder: LanguageSlug[] = ["python", "c-cpp", "javascript", "java"];
const levels = [
  { name: "Level 01 · 入门基础", range: [0, 3], note: "建立语言认知与基础控制能力" },
  { name: "Level 02 · 核心能力", range: [3, 6], note: "掌握真实编程任务所需的核心工具" },
  { name: "Level 03 · 进阶应用", range: [6, 7], note: "进入工程化与程序设计阶段" },
] as const;

export default async function CoursePage({ params }: { params: Promise<{ language: string }> }) {
  const { language } = await params;
  const slug = languageOrder.includes(language as LanguageSlug) ? language as LanguageSlug : "python";
  const course = courses[slug];

  return <main className="course-page">
    <div className="ambient one" /><div className="ambient two" />
    <header className="topbar glass">
      <a className="brand" href="/"><span className="brandmark">&lt;/&gt;</span><span>Blinga <span>coding</span></span></a>
      <nav><a href="/">学习中心</a><a className="active" href={`/courses/${slug}`}>课程目录</a><a href="/#map">知识图谱</a><a href="/#lab">在线实训</a></nav>
      <a className="course-back" href="/">返回学习台 →</a>
    </header>

    <div className="course-layout">
      <aside className="course-language-nav glass">
        <a className="course-nav-back" href="/">← 全部编程语言</a>
        <div className="language selected course-root-link">
          <i style={{ background: course.color }}>{course.icon}</i><span>{course.name}<small>{course.topics.length} 个核心知识点</small></span><b>↓</b>
        </div>
        <nav className="course-topic-nav" aria-label={`${course.name} 知识点`}>
          {course.topics.map((topic, index) =>
            <a href={`/?lang=${encodeURIComponent(course.queryName)}&topic=${index}#learn`} key={topic.title}>
              <span>{String(index + 1).padStart(2, "0")}</span><b>{topic.title}</b><i>›</i>
            </a>
          )}
        </nav>
        <div className="course-switcher">
          <span>切换编程语言</span>
          <div>{languageOrder.filter((item) => item !== slug).map((item) =>
            <a href={`/courses/${item}`} aria-label={`进入 ${courses[item].name} 课程`} key={item} style={{ "--switch-color": courses[item].color } as React.CSSProperties}>{courses[item].icon}</a>
          )}</div>
        </div>
        <div className="sidebar-tip"><span>02</span><div><b>从左侧选择知识点</b><p>知识点始终保留在左侧，学习内容只在右侧切换。</p></div></div>
      </aside>

      <section className="course-catalog">
        <div className="catalog-breadcrumb"><a href="/">学习中心</a><span>/</span><b>{course.name}</b></div>
        <header className="course-hero glass" style={{ "--course-color": course.color } as React.CSSProperties}>
          <div className="course-icon">{course.icon}</div>
          <div><h1>{course.name} 分级课程</h1><p>{course.description}</p></div>
          <div className="course-stats"><div><b>3</b><span>学习级别</span></div><div><b>7</b><span>核心知识点</span></div><div><b>∞</b><span>在线练习</span></div></div>
        </header>

        <div className="course-entry glass">
          <div className="entry-marker">02</div>
          <div><h2>从左侧选择一个知识点开始学习</h2><p>语言名称与全部知识点会始终固定在左侧。选择知识点后，右侧进入对应讲解页，左侧目录不会消失或移动到中间。</p></div>
          <a href={`/?lang=${encodeURIComponent(course.queryName)}&topic=0#learn`}>开始第一节 →</a>
        </div>
        <div className="course-level-summary">
          {levels.map((level, index) => <article className="glass" key={level.name}>
            <span>0{index + 1}</span><div><h3>{level.name}</h3><p>{level.note}</p></div><b>{level.range[1] - level.range[0]} 节</b>
          </article>)}
        </div>
      </section>
    </div>
  </main>;
}
