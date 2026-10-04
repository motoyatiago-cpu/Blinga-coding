export const PROJECT_LANGUAGE_SLUGS = ["python", "c-cpp", "javascript", "java"] as const;

export type ProjectLanguageSlug = typeof PROJECT_LANGUAGE_SLUGS[number];
export type ProjectDifficulty = "入门" | "进阶";
export type ProjectProgressStatus = "not_started" | "in_progress" | "completed";

export type ProjectMilestone = {
  id: string;
  title: string;
  description: string;
  topicIndex: number;
  deliverable: string;
};

export type ProjectBlueprint = {
  slug: string;
  language: ProjectLanguageSlug;
  languageName: string;
  runnerLanguage: "Python" | "C/C++" | "JavaScript" | "Java";
  title: string;
  summary: string;
  scenario: string;
  difficulty: ProjectDifficulty;
  duration: string;
  runnable: boolean;
  skills: string[];
  milestones: ProjectMilestone[];
  successCriteria: string[];
  starterCode: string;
  stdin?: string;
  expectedOutput?: string;
};

export const PROJECT_LANGUAGE_META: Record<ProjectLanguageSlug, { name: string; short: string; description: string }> = {
  python: { name: "Python", short: "Py", description: "用清晰的数据结构和函数，把日常信息处理成可靠的小工具。" },
  "c-cpp": { name: "C/C++", short: "C+", description: "从数组、函数到类，练习类型安全、边界意识与程序结构。" },
  javascript: { name: "JavaScript", short: "JS", description: "用数据转换与异步思维，构建贴近前端工作的交互逻辑。" },
  java: { name: "Java", short: "Jv", description: "以集合、方法和对象模型，搭建可维护的业务程序。" },
};

export const PROJECT_BLUEPRINTS: ProjectBlueprint[] = [
  {
    slug: "study-scoreboard", language: "python", languageName: "Python", runnerLanguage: "Python",
    title: "学习成绩分析器", summary: "读取一组成绩，计算平均分并找出需要重点复习的科目。",
    scenario: "你要为每周复盘做一个命令行工具，让原始分数变成一眼可读的学习建议。",
    difficulty: "入门", duration: "45–60 分钟", runnable: true,
    skills: ["列表与字典", "循环", "函数"],
    milestones: [
      { id: "model-data", title: "组织成绩数据", description: "用字典关联科目和分数。", topicIndex: 5, deliverable: "建立至少 4 个科目的数据集合" },
      { id: "calculate", title: "封装统计函数", description: "计算平均分并筛选低于目标线的科目。", topicIndex: 4, deliverable: "返回平均分与待复习列表" },
      { id: "report", title: "输出复盘报告", description: "按固定格式打印结果，便于核对。", topicIndex: 3, deliverable: "运行结果与验收样例一致" },
    ],
    successCriteria: ["平均分计算正确", "能筛选低于 80 分的科目", "输出包含清晰的复习建议"],
    starterCode: `scores = {"Python": 92, "算法": 76, "数据库": 84, "网络": 68}\n\ndef build_report(items, target=80):\n    # TODO: 计算平均分并找出低于 target 的科目\n    average = 0\n    review = []\n    return average, review\n\naverage, review = build_report(scores)\nprint(f"平均分: {average:.1f}")\nprint("待复习: " + ", ".join(review))`,
    expectedOutput: "平均分: 80.0\n待复习: 算法, 网络",
  },
  {
    slug: "reading-log", language: "python", languageName: "Python", runnerLanguage: "Python",
    title: "阅读进度管家", summary: "设计可记录书目、页数和阅读状态的轻量命令行程序。",
    scenario: "把多本书的阅读记录统一到一个可查询、可扩展的数据模型中。",
    difficulty: "进阶", duration: "90 分钟", runnable: false,
    skills: ["类与对象", "列表", "条件判断"],
    milestones: [
      { id: "book-model", title: "建立 Book 模型", description: "定义书名、总页数和已读页数。", topicIndex: 6, deliverable: "Book 类能计算阅读百分比" },
      { id: "library", title: "管理书目集合", description: "支持添加书目和查询未读完项目。", topicIndex: 5, deliverable: "完成书目列表的增查" },
      { id: "summary", title: "生成阅读摘要", description: "输出总进度与下一本建议。", topicIndex: 2, deliverable: "生成可读的周报文本" },
    ],
    successCriteria: ["数据模型职责清晰", "进度不会超过 100%", "空书目时有合理提示"], starterCode: "# 路线预告：完成相关课程后开放在线运行。",
  },
  {
    slug: "temperature-audit", language: "c-cpp", languageName: "C/C++", runnerLanguage: "C/C++",
    title: "温度采样审计", summary: "分析一组设备温度，报告平均值、最高值和超限次数。",
    scenario: "一台实验设备每小时生成一次读数，你需要写出边界清晰的审计程序。",
    difficulty: "入门", duration: "50–70 分钟", runnable: true,
    skills: ["数组", "循环", "函数"],
    milestones: [
      { id: "samples", title: "遍历采样数组", description: "读取固定长度数组且不越界。", topicIndex: 3, deliverable: "正确遍历全部 6 个读数" },
      { id: "statistics", title: "拆分统计逻辑", description: "用函数计算平均值、最大值和超限数量。", topicIndex: 5, deliverable: "统计函数返回正确结果" },
      { id: "audit", title: "打印审计摘要", description: "以固定精度输出三项指标。", topicIndex: 2, deliverable: "输出与验收样例一致" },
    ],
    successCriteria: ["数组访问不越界", "平均值保留一位小数", "正确统计高于 30 度的读数"],
    starterCode: `#include <iostream>\n#include <iomanip>\nusing namespace std;\n\nint main() {\n    double samples[] = {24.5, 31.2, 28.0, 33.8, 29.5, 32.0};\n    const int count = 6;\n    // TODO: 计算平均值、最高值和高于 30 度的次数\n    double average = 0;\n    double highest = 0;\n    int alerts = 0;\n\n    cout << fixed << setprecision(1);\n    cout << "平均温度: " << average << endl;\n    cout << "最高温度: " << highest << endl;\n    cout << "超限次数: " << alerts << endl;\n    return 0;\n}`,
    expectedOutput: "平均温度: 29.8\n最高温度: 33.8\n超限次数: 3",
  },
  {
    slug: "inventory-console", language: "c-cpp", languageName: "C/C++", runnerLanguage: "C/C++",
    title: "库存控制台", summary: "用类封装商品库存，并实现安全的入库与出库规则。",
    scenario: "为小型社团仓库建立本地库存核心，重点处理非法数量和库存不足。",
    difficulty: "进阶", duration: "90–120 分钟", runnable: false,
    skills: ["类与对象", "函数", "边界检查"],
    milestones: [
      { id: "item-class", title: "封装库存项", description: "隐藏数量并提供只读查询。", topicIndex: 6, deliverable: "完成 Item 类及构造函数" },
      { id: "operations", title: "实现库存操作", description: "拒绝负数和超额出库。", topicIndex: 5, deliverable: "入库、出库均返回明确结果" },
      { id: "scenarios", title: "覆盖异常场景", description: "验证零库存与超额请求。", topicIndex: 2, deliverable: "至少覆盖 3 个边界场景" },
    ],
    successCriteria: ["库存数量不可直接修改", "任何操作后库存不为负", "失败路径信息明确"], starterCode: "// 路线预告：完成相关课程后开放在线运行。",
  },
  {
    slug: "task-summary", language: "javascript", languageName: "JavaScript", runnerLanguage: "JavaScript",
    title: "任务清单摘要器", summary: "用数组方法汇总任务状态，并给出下一项优先任务。",
    scenario: "把一组前端任务数据转换为可展示的进度摘要，为后续 DOM 页面准备数据。",
    difficulty: "入门", duration: "45–60 分钟", runnable: true,
    skills: ["数组方法", "对象", "函数"],
    milestones: [
      { id: "filter", title: "筛选任务状态", description: "用 filter 区分已完成与待办任务。", topicIndex: 2, deliverable: "得到准确的完成数量" },
      { id: "priority", title: "寻找最高优先级", description: "从未完成任务中选择优先级最高的一项。", topicIndex: 2, deliverable: "找出 API 联调任务" },
      { id: "format", title: "格式化摘要", description: "组合出稳定、可测试的文本结果。", topicIndex: 0, deliverable: "输出与验收样例一致" },
    ],
    successCriteria: ["完成率计算正确", "只从待办任务中选择下一项", "不修改原始任务数组"],
    starterCode: `const tasks = [\n  { title: "页面结构", done: true, priority: 2 },\n  { title: "API 联调", done: false, priority: 3 },\n  { title: "空状态", done: false, priority: 1 },\n  { title: "键盘测试", done: true, priority: 2 },\n];\n\n// TODO: 计算完成数量，并找出未完成任务中优先级最高的一项\nconst completed = 0;\nconst nextTask = "待补充";\n\nconsole.log(\`完成进度: \${completed}/\${tasks.length}\`);\nconsole.log(\`下一项: \${nextTask}\`);`,
    expectedOutput: "完成进度: 2/4\n下一项: API 联调",
  },
  {
    slug: "request-dashboard", language: "javascript", languageName: "JavaScript", runnerLanguage: "JavaScript",
    title: "请求状态看板", summary: "设计加载、成功和失败三种状态，并把异步结果映射为界面模型。",
    scenario: "模拟前端请求生命周期，不依赖外部服务，专注状态设计与错误恢复。",
    difficulty: "进阶", duration: "90 分钟", runnable: false,
    skills: ["Promise", "async/await", "DOM 状态"],
    milestones: [
      { id: "state-model", title: "定义状态模型", description: "列出 idle、loading、success、error。", topicIndex: 1, deliverable: "每种状态都有明确字段" },
      { id: "async-flow", title: "实现异步流程", description: "用本地 Promise 模拟成功与失败。", topicIndex: 4, deliverable: "异常被捕获并转换为错误状态" },
      { id: "render", title: "渲染状态视图", description: "为每种状态提供可访问提示。", topicIndex: 3, deliverable: "状态变化可被用户感知" },
    ],
    successCriteria: ["不依赖外部 API", "错误状态可以重试", "状态信息不只依赖颜色"], starterCode: "// 路线预告：完成相关课程后开放在线运行。",
  },
  {
    slug: "expense-summary", language: "java", languageName: "Java", runnerLanguage: "Java",
    title: "月度支出汇总", summary: "用集合与方法统计分类支出，生成结构清晰的月度摘要。",
    scenario: "为个人预算工具实现最小统计核心：汇总类别、计算总额并识别最大支出项。",
    difficulty: "入门", duration: "60–75 分钟", runnable: true,
    skills: ["Map 集合", "循环", "方法"],
    milestones: [
      { id: "expenses", title: "建立分类集合", description: "用 Map 保存分类与金额。", topicIndex: 3, deliverable: "保存 4 个不重复分类" },
      { id: "aggregate", title: "封装汇总方法", description: "计算总额并找到金额最高的分类。", topicIndex: 4, deliverable: "返回总额与最大分类" },
      { id: "print", title: "输出预算摘要", description: "以固定格式打印统计结果。", topicIndex: 2, deliverable: "输出与验收样例一致" },
    ],
    successCriteria: ["总额计算正确", "最大分类选择正确", "金额保留一位小数"],
    starterCode: `import java.util.LinkedHashMap;\nimport java.util.Map;\n\npublic class Main {\n    public static void main(String[] args) {\n        Map<String, Double> expenses = new LinkedHashMap<>();\n        expenses.put("餐饮", 680.0);\n        expenses.put("交通", 240.0);\n        expenses.put("学习", 920.0);\n        expenses.put("娱乐", 360.0);\n\n        // TODO: 计算总额并找出金额最高的分类\n        double total = 0;\n        String largest = "待补充";\n\n        System.out.printf("总支出: %.1f%n", total);\n        System.out.println("最大分类: " + largest);\n    }\n}`,
    expectedOutput: "总支出: 2200.0\n最大分类: 学习",
  },
  {
    slug: "support-queue", language: "java", languageName: "Java", runnerLanguage: "Java",
    title: "客服工单队列", summary: "用对象与集合管理工单优先级、状态和异常输入。",
    scenario: "为校内技术支持台设计一个可维护的工单核心，不接入任何外部系统。",
    difficulty: "进阶", duration: "100–120 分钟", runnable: false,
    skills: ["类与对象", "集合", "异常处理"],
    milestones: [
      { id: "ticket", title: "建立 Ticket 模型", description: "封装标题、优先级和处理状态。", topicIndex: 5, deliverable: "Ticket 对象保持有效状态" },
      { id: "queue", title: "组织待办队列", description: "按优先级选择下一张工单。", topicIndex: 3, deliverable: "高优先级工单先处理" },
      { id: "validation", title: "处理无效输入", description: "拒绝空标题和非法优先级。", topicIndex: 6, deliverable: "异常包含可理解的信息" },
    ],
    successCriteria: ["模型字段受到保护", "相同优先级保持创建顺序", "非法输入不会污染队列"], starterCode: "// 路线预告：完成相关课程后开放在线运行。",
  },
];

const projectIndex = new Map<string, ProjectBlueprint>(
  PROJECT_BLUEPRINTS.map((project) => [`${project.language}/${project.slug}`, project]),
);

export function getProjectBlueprint(language: string, project: string): ProjectBlueprint | undefined {
  return projectIndex.get(`${language}/${project}`);
}

export function getProjectsForLanguage(language: ProjectLanguageSlug): ProjectBlueprint[] {
  return PROJECT_BLUEPRINTS.filter((project) => project.language === language);
}

export function isProjectLanguage(value: string): value is ProjectLanguageSlug {
  return (PROJECT_LANGUAGE_SLUGS as readonly string[]).includes(value);
}

export function emptyMilestoneProgress(project: ProjectBlueprint): Record<string, ProjectProgressStatus> {
  return Object.fromEntries(project.milestones.map((milestone) => [milestone.id, "not_started"]));
}
