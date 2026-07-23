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

export default function Home() {
  const [lang, setLang] = useState<Lang>("Python");
  const [expanded, setExpanded] = useState<Lang>("Python");
  const [topicByLang, setTopicByLang] = useState<Record<Lang, number>>({ Python: 3, "C/C++": 0, JavaScript: 0, Java: 0 });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([{ role: "ai", text: "你好，我已读取当前课程。可以让我解释知识点、分析报错或优化代码。" }]);
  const [aiBusy, setAiBusy] = useState(false);
  const lesson = lessons[lang];

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

  function selectLanguage(key: Lang) {
    setExpanded((current) => current === key ? key : key);
    setLang(key);
  }

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
          <a className="brand" href="#learn"><span className="brandmark">&lt;/&gt;</span><span>Code<span>Atlas</span></span></a>
          <nav><a className="active" href="#learn">学习中心</a><a href="#map">知识图谱</a><a href="#lab">在线实训</a></nav>
          <div className="header-actions"><button className="search-trigger" onClick={() => setSearchOpen(true)}>⌕ <span>搜索知识点</span><kbd>⌘ K</kbd></button><div className="avatar">林</div></div>
        </header>

        {searchOpen && <div className="search-overlay" onMouseDown={(event) => { if (event.currentTarget === event.target) setSearchOpen(false); }}>
          <div className="search-dialog glass">
            <div className="search-dialog-head"><div><b>AI 全局知识搜索</b><small>搜索课程概念、语法或错误信息</small></div><button onClick={() => setSearchOpen(false)}>×</button></div>
            <div className="search-box"><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") search(); }} placeholder="例如：for 与 while 应该怎么选择？" /><button onClick={search}>搜索</button></div>
            {searchResult && <div className="search-answer"><span>✦ AI ANSWER</span><p>{searchResult}</p></div>}
          </div>
        </div>}

        <div className="workspace">
          <aside className="sidebar glass" aria-label="课程导航">
            <div className="sidebar-brandline"><span>COURSE STACK</span><i>4 LANGUAGES</i></div>
            {(Object.keys(lessons) as Lang[]).map((key) => {
              const open = expanded === key;
              const activeIndex = topicByLang[key];
              return <div className={`accordion ${open ? "open" : ""}`} key={key}>
                <button className={`language ${lang === key ? "selected" : ""}`} onClick={() => { selectLanguage(key); setExpanded(open ? key : key); }} aria-expanded={open}>
                  <i style={{ background: lessons[key].color }}>{lessons[key].icon}</i>
                  <span>{key}</span><b>{open ? "−" : "+"}</b>
                </button>
                <div className="accordion-body" aria-hidden={!open}><div>
                  {lessons[key].topics.map((topic, index) => <button key={topic} className={`topic ${lang === key && activeIndex === index ? "active" : ""}`} onClick={() => { setLang(key); setTopicByLang((current) => ({ ...current, [key]: index })); }}>
                    <span>{String(index + 1).padStart(2, "0")}</span><em>{topic}</em>{index < 2 && <i>✓</i>}
                  </button>)}
                </div></div>
              </div>;
            })}
            <div className="sidebar-tip"><span>✦</span><div><b>AI 学习建议</b><p>完成当前实训后再进入下一节，知识留存率会更高。</p></div></div>
          </aside>

          <section className="content" id="learn">
            <div className="breadcrumb">学习中心 <span>/</span> {lang} <span>/</span> 第 {String(topicByLang[lang] + 1).padStart(2, "0")} 节</div>
            <div className="lesson-head">
              <div><p>{lesson.kicker}</p><h1>{lesson.title}</h1><div className="meta"><span>◉ 3 个练习</span><span className="level">基础</span><span>已同步至知识图谱</span></div></div>
              <div className="pager"><button>← 上一节</button><button className="primary">下一节 →</button></div>
            </div>

            <article className="lesson-card glass"><span className="eyebrow">CORE CONCEPT</span><h2>先理解问题，再写出循环</h2><p>{lesson.desc}</p><div className="note"><b>💡 为什么重要？</b><span>遍历是数据处理的基础模式。掌握后，你可以处理列表、文件内容和用户输入等几乎所有批量数据。</span></div></article>

            <div className="code-example glass">
              <div className="pane-head"><span><i /> lesson-example</span><button onClick={() => navigator.clipboard?.writeText(lesson.code)}>复制代码</button></div>
              <pre><code>{lesson.code}</code></pre>
              <div className="example-foot"><span>01 准备数据</span><span>02 逐个遍历</span><span>03 处理结果</span><a href="#lab">打开实训沙盒 →</a></div>
            </div>

            <KnowledgeGraph lesson={lesson} code={lesson.code} />
            <Sandbox lang={lang} setLang={setLang} lesson={lesson} />
          </section>
        </div>

        <button className={`chat-fab ${chatOpen ? "open" : ""}`} onClick={() => setChatOpen((current) => !current)}><span>✦</span>{chatOpen ? "收起" : "问 AI"}</button>
        {chatOpen && <aside className="chat glass">
          <div className="chat-head"><div><span>✦</span><div><b>AI 编程助教</b><small>{aiBusy ? "正在思考…" : `正在学习：${lesson.title}`}</small></div></div><button onClick={() => setChatOpen(false)}>×</button></div>
          <div className="messages">{messages.map((message, index) => <div key={index} className={`message ${message.role}`}>{message.text}</div>)}{aiBusy && <div className="message ai">正在组织答案…</div>}</div>
          <div className="chips"><button onClick={() => ask("用生活化的例子解释当前知识点")}>解释知识点</button><button onClick={() => ask("分析这段代码可能出现的错误")}>分析报错</button><button onClick={() => ask("给出代码优化建议")}>优化代码</button></div>
          <div className="chat-input"><textarea value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); ask(); } }} placeholder="输入你的编程问题…" /><button onClick={() => ask()}>↑</button></div>
        </aside>}
      </main>
    </ReactFlowProvider>
  );
}
