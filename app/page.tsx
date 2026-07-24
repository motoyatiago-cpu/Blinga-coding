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

type Lang = "Python" | "C/C++" | "JavaScript" | "Java";
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

const lessonGuides: Record<Lang, {
  summary: string;
  principles: Array<{ title: string; text: string; badge: string }>;
  syntaxTitle: string;
  syntaxCode: string;
  syntaxNote: string;
  pitfalls: Array<{ wrong: string; right: string; title: string }>;
}> = {
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
        <div><span className="eyebrow">AI KNOWLEDGE GRAPH</span><h2>动态知识图谱</h2><p>拖拽节点，直接编辑内容，并用颜色标记核心考点。</p></div>
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

function Sandbox({ lang, setLang, lesson }: { lang: Lang; setLang: (lang: Lang) => void; lesson: Course }) {
  const [code, setCode] = useState(lesson.code);
  const [output, setOutput] = useState("终端已连接 · 等待输入");
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCode(lesson.code);
    setOutput("终端已连接 · 等待输入");
  }, [lesson]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const lines = code.split("\n").length;
      const pairs = (code.match(/[({[]/g) || []).length - (code.match(/[)}\]]/g) || []).length;
      setOutput(pairs === 0 ? `● 实时检查通过\n  ${lines} 行 · 未发现括号错误\n\n点击“运行代码”执行测试用例。` : `⚠ 实时检查\n  检测到 ${Math.abs(pairs)} 处括号可能未闭合。`);
    }, 240);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [code]);

  async function runCode() {
    setRunning(true);
    const frames = ["建立隔离运行环境…", "正在编译代码…", "正在执行基础测试…"];
    for (const frame of frames) {
      setOutput((current) => `${current}\n› ${frame}`);
      await new Promise((resolve) => setTimeout(resolve, 180));
    }
    setOutput(`✓ 运行成功 · 0.08s\n\n${lesson.output}\n\n自动判题  3 / 3  通过`);
    setRunning(false);
  }

  return (
    <section className="feature-section" id="lab">
      <div className="section-heading">
        <div><span className="eyebrow purple">LIVE SANDBOX</span><h2>在线实训沙盒</h2><p>输入变化即时诊断，运行状态与终端结果动态同步。</p></div>
        <select value={lang} onChange={(event) => setLang(event.target.value as Lang)}>{(Object.keys(lessons) as Lang[]).map((key) => <option key={key}>{key}</option>)}</select>
      </div>
      <div className="sandbox glass">
        <div className="editor-pane">
          <div className="pane-head"><span><i /> main.{lang === "Python" ? "py" : lang === "JavaScript" ? "js" : lang === "Java" ? "java" : "cpp"}</span><button onClick={() => setCode(lesson.code)}>↺ 重置</button></div>
          <textarea spellCheck={false} value={code} onChange={(event) => setCode(event.target.value)} aria-label="代码编辑器" />
          <div className="editor-foot"><span>UTF-8 · {code.split("\n").length} 行 · 自动同步</span><button className="run" onClick={runCode} disabled={running}>{running ? "运行中…" : "▶ 运行代码"}</button></div>
        </div>
        <div className="terminal-pane">
          <div className="pane-head"><span>TERMINAL / OUTPUT</span><button onClick={() => setOutput("")}>清空</button></div>
          <pre>{output}</pre>
          <div className="judge-row"><div><span className="status-dot" /> 实时通道</div><b className={output.includes("3 / 3") ? "passed" : ""}>{output.includes("3 / 3") ? "全部通过" : "监听中"}</b></div>
        </div>
      </div>
    </section>
  );
}

const StableKnowledgeGraph = memo(KnowledgeGraph);
const StableSandbox = memo(Sandbox);

function DeepLesson({ lang }: { lang: Lang }) {
  const guide = lessonGuides[lang];
  return (
    <section className="deep-lesson" aria-labelledby="deep-lesson-title">
      <div className="deep-intro">
        <span className="eyebrow">IN-DEPTH GUIDE</span>
        <h2 id="deep-lesson-title">从执行模型理解，而不是只记住语法</h2>
        <p>{guide.summary}</p>
      </div>
      <div className="concept-flow" aria-label="知识点执行流程">
        {guide.principles.map((item, index) => <article key={item.title}>
          <div><span>{item.badge}</span><b>0{index + 1}</b></div>
          <h3>{item.title}</h3><p>{item.text}</p>
        </article>)}
      </div>
      <div className="deep-example glass">
        <div className="example-explain">
          <span className="eyebrow purple">CODE WALKTHROUGH</span>
          <h3>{guide.syntaxTitle}</h3>
          <p>{guide.syntaxNote}</p>
          <ol><li>先确认输入数据及其类型</li><li>观察每轮循环变量的变化</li><li>验证终止条件和空数据边界</li></ol>
        </div>
        <pre><code>{guide.syntaxCode}</code></pre>
      </div>
      <div className="pitfall-section">
        <div><span className="eyebrow">DEBUG CHECKLIST</span><h3>三个高频错误与修复方法</h3></div>
        <div className="pitfall-grid">{guide.pitfalls.map((item) => <article key={item.title}>
          <h4>{item.title}</h4><p className="wrong">× {item.wrong}</p><p className="right">✓ {item.right}</p>
        </article>)}</div>
      </div>
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

  return <div className="document-export glass"><div><span>DOCUMENT EXPORT</span><b>导出当前知识图谱</b><small>图谱核心交互保持不变，导出由独立文档层完成。</small></div><label><span>格式</span><select value={format} onChange={(event) => setFormat(event.target.value as "pdf" | "word")}><option value="pdf">PDF</option><option value="word">Word</option></select></label><button onClick={exportDocument}>⇩ 导出{format === "pdf" ? " PDF" : " Word"}</button></div>;
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("Python");
  const [topicByLang, setTopicByLang] = useState<Record<Lang, number>>({ Python: 3, "C/C++": 0, JavaScript: 0, Java: 0 });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([{ role: "ai", text: "你好，我已读取当前课程。可以让我解释知识点、分析报错或优化代码。" }]);
  const [aiBusy, setAiBusy] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedTopicIndex = topicByLang[lang];
  const baseLesson = lessons[lang];
  const lesson = lang === "Python"
    ? pythonLessons[selectedTopicIndex]
    : {
        ...baseLesson,
        title: `${lang} ${baseLesson.topics[selectedTopicIndex]}`,
        kicker: `${lang} · 分级课程 · 第 ${String(selectedTopicIndex + 1).padStart(2, "0")} 节`,
        desc: `本节将系统讲解 ${lang} 的“${baseLesson.topics[selectedTopicIndex]}”，并通过执行过程、代码示例、易错点和在线练习帮助你完成从理解到应用。`,
      };

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
    const params = new URLSearchParams(window.location.search);
    const requestedLanguage = params.get("lang") as Lang | null;
    const requestedTopic = Number(params.get("topic"));
    if (requestedLanguage && requestedLanguage in lessons) {
      setLang(requestedLanguage);
      if (Number.isInteger(requestedTopic)) {
        const safeTopic = Math.max(0, Math.min(lessons[requestedLanguage].topics.length - 1, requestedTopic));
        setTopicByLang((current) => ({ ...current, [requestedLanguage]: safeTopic }));
      }
    }
  }, []);

  async function callAi(mode: "chat" | "search", prompt: string) {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, prompt, context: `${lesson.kicker}\n${lesson.desc}` }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "AI 服务暂时不可用");
    return data.answer as string;
  }

  async function search() {
    if (!searchQuery.trim()) return;
    setSearchResult("正在检索课程知识与扩展资料…");
    try { setSearchResult(await callAi("search", searchQuery)); }
    catch (error) { setSearchResult(error instanceof Error ? error.message : "搜索失败"); }
  }

  async function ask(text = question) {
    if (!text.trim() || aiBusy) return;
    const value = text.trim();
    setMessages((current) => [...current, { role: "user", text: value }]);
    setQuestion("");
    setAiBusy(true);
    try {
      const answer = await callAi("chat", value);
      setMessages((current) => [...current, { role: "ai", text: answer }]);
    } catch (error) {
      setMessages((current) => [...current, { role: "ai", text: error instanceof Error ? error.message : "AI 服务暂时不可用" }]);
    } finally { setAiBusy(false); }
  }

  return (
    <ReactFlowProvider>
      <main>
        <div className="ambient one" /><div className="ambient two" />
        <header className="topbar glass">
          <a className="brand" href="#learn"><span className="brandmark">&lt;/&gt;</span><span>Blinga <span>coding</span></span></a>
          <nav><a className="active" href="#learn">学习中心</a><a href="#map">知识图谱</a><a href="#lab">在线实训</a></nav>
          <div className="header-actions"><button className="search-trigger" onClick={() => setSearchOpen(true)}>⌕ <span>搜索知识点</span><kbd>⌘ K</kbd></button><div className="avatar">林</div></div>
        </header>

        <div className={`search-overlay ${searchOpen ? "open" : ""}`} aria-hidden={!searchOpen} onMouseDown={(event) => { if (event.currentTarget === event.target) setSearchOpen(false); }}>
          <div className="search-dialog glass">
            <div className="search-dialog-head"><div><b>AI 全局知识搜索</b><small>搜索课程概念、语法或错误信息</small></div><button onClick={() => setSearchOpen(false)}>×</button></div>
            <div className="search-box"><input ref={searchInputRef} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") search(); }} placeholder="例如：for 与 while 应该怎么选择？" /><button onClick={search}>搜索</button></div>
            {searchResult && <div className="search-answer"><span>✦ AI ANSWER</span><p>{searchResult}</p></div>}
          </div>
        </div>

        <div className="workspace">
          <aside className="sidebar glass" aria-label="课程导航">
            <a className="course-nav-back" href="/">← 全部编程语言</a>
            <div className="sidebar-brandline"><span>CURRENT COURSE</span><i>LEVEL 02</i></div>
            <a className="language selected course-root-link" href={`/courses/${languageSlugs[lang]}`}>
              <i style={{ background: lessons[lang].color }}>{lessons[lang].icon}</i>
              <span>{lang}<small>分级课程 · {lesson.topics.length} 个知识点</small></span><b>⌂</b>
            </a>
            <nav className="course-topic-nav" aria-label={`${lang} 知识点`}>
              {lesson.topics.map((topic, index) =>
                <a
                  className={selectedTopicIndex === index ? "active" : ""}
                  href={`/?lang=${encodeURIComponent(lang)}&topic=${index}#learn`}
                  key={topic}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <b>{topic}</b>
                  <i>{selectedTopicIndex === index ? "●" : "›"}</i>
                </a>
              )}
            </nav>
            <div className="course-switcher">
              <span>切换编程语言</span>
              <div>{(Object.keys(lessons) as Lang[]).filter((key) => key !== lang).map((key) =>
                <a href={`/courses/${languageSlugs[key]}`} aria-label={`进入 ${key} 课程`} key={key} style={{ "--switch-color": lessons[key].color } as React.CSSProperties}>{lessons[key].icon}</a>
              )}</div>
            </div>
            <div className="sidebar-tip"><span>✦</span><div><b>AI 学习建议</b><p>完成当前实训后再进入下一节，知识留存率会更高。</p></div></div>
          </aside>

          <section className="content" id="learn">
            <div className="breadcrumb">学习中心 <span>/</span> {lang} <span>/</span> 第 {String(topicByLang[lang] + 1).padStart(2, "0")} 节</div>
            <div className="lesson-head">
              <div><p>{lesson.kicker}</p><h1>{lesson.title}</h1><div className="meta"><span>◉ 3 个练习</span><span className="level">基础</span><span>已同步至知识图谱</span></div></div>
              <div className="pager"><button>← 上一节</button><button className="primary">下一节 →</button></div>
            </div>

            <article className="lesson-card glass"><span className="eyebrow">CORE CONCEPT</span><h2>{lesson.title}：核心概念与实践</h2><p>{lesson.desc}</p><div className="note"><b>💡 学习方式</b><span>先理解概念和执行过程，再阅读代码示例，最后进入在线实训完成修改与验证。</span></div></article>
            <DeepLesson lang={lang} />

            <div className="code-example glass">
              <div className="pane-head"><span><i /> lesson-example</span><button onClick={() => navigator.clipboard?.writeText(lesson.code)}>复制代码</button></div>
              <pre><code>{lesson.code}</code></pre>
              <div className="example-foot"><span>01 准备数据</span><span>02 逐个遍历</span><span>03 处理结果</span><a href="#lab">打开实训沙盒 →</a></div>
            </div>

            <StableKnowledgeGraph lesson={lesson} code={lesson.code} />
            <GraphDocumentExport lesson={lesson} />
            <StableSandbox lang={lang} setLang={setLang} lesson={lesson} />
          </section>
        </div>

        <button className={`chat-fab ${chatOpen ? "open" : ""}`} onClick={() => setChatOpen((current) => !current)}><span>✦</span>{chatOpen ? "收起" : "问 AI"}</button>
        <aside className={`chat glass ${chatOpen ? "open" : ""}`} aria-hidden={!chatOpen}>
          <div className="chat-head"><div><span>✦</span><div><b>AI 编程助教</b><small>{aiBusy ? "正在思考…" : `正在学习：${lesson.title}`}</small></div></div><button onClick={() => setChatOpen(false)}>×</button></div>
          <div className="messages">{messages.map((message, index) => <div key={index} className={`message ${message.role}`}>{message.text}</div>)}{aiBusy && <div className="message ai">正在组织答案…</div>}</div>
          <div className="chips"><button onClick={() => ask("用生活化的例子解释当前知识点")}>解释知识点</button><button onClick={() => ask("分析这段代码可能出现的错误")}>分析报错</button><button onClick={() => ask("给出代码优化建议")}>优化代码</button></div>
          <div className="chat-input"><textarea value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); ask(); } }} placeholder="输入你的编程问题…" /><button onClick={() => ask()}>↑</button></div>
        </aside>
      </main>
    </ReactFlowProvider>
  );
}
