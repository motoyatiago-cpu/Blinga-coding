"use client";

import { useMemo, useState } from "react";

const lessons = {
  Python: {
    icon: "Py",
    color: "#49d6a8",
    topics: ["快速入门", "变量与类型", "条件判断", "循环结构", "函数", "列表与字典", "面向对象"],
    title: "Python 循环结构",
    kicker: "Python · 基础语法 · 第 04 节",
    desc: "循环让程序重复执行一段逻辑。Python 提供 for 与 while 两种主要循环方式，本节将用一个成绩统计器理解遍历、条件和累加。",
    code: `scores = [86, 92, 74, 100, 65]\n\ntotal = 0\nfor score in scores:\n    total += score\n\naverage = total / len(scores)\nprint(f\"平均分：{average:.1f}\")`,
    output: "平均分：83.4",
    nodes: ["循环结构", "for 遍历", "while 条件", "range()", "break", "continue"],
  },
  "C/C++": {
    icon: "C+",
    color: "#8f9cff",
    topics: ["环境配置", "数据类型", "流程控制", "数组", "指针", "函数", "类与对象"],
    title: "C++ 数组与遍历",
    kicker: "C++ · 核心语法 · 第 04 节",
    desc: "数组将相同类型的数据连续存储。结合范围 for 循环，可以安全而清晰地访问每一个元素。",
    code: `#include <iostream>\nusing namespace std;\n\nint main() {\n  int scores[] = {86, 92, 74, 100, 65};\n  int total = 0;\n  for (int score : scores) total += score;\n  cout << \"总分：\" << total << endl;\n  return 0;\n}`,
    output: "总分：417",
    nodes: ["数组", "声明", "索引访问", "范围 for", "内存连续", "边界安全"],
  },
  JavaScript: {
    icon: "JS",
    color: "#f7c65e",
    topics: ["语言基础", "变量与作用域", "数组方法", "DOM 操作", "异步编程", "ES6+", "工程化"],
    title: "JavaScript 数组方法",
    kicker: "JavaScript · ES6+ · 第 03 节",
    desc: "map、filter 与 reduce 是处理集合的三个核心方法。它们能把复杂循环表达成清晰的数据变换管道。",
    code: `const scores = [86, 92, 74, 100, 65];\n\nconst passed = scores.filter(score => score >= 80);\nconst total = passed.reduce((sum, n) => sum + n, 0);\n\nconsole.log(\`优秀人数：\${passed.length}\`);\nconsole.log(\`优秀组总分：\${total}\`);`,
    output: "优秀人数：3\n优秀组总分：278",
    nodes: ["数组方法", "map 映射", "filter 筛选", "reduce 聚合", "链式调用", "纯函数"],
  },
  Java: {
    icon: "Jv",
    color: "#ff8c6b",
    topics: ["快速入门", "变量与类型", "控制流", "数组与集合", "方法", "类与对象", "异常处理"],
    title: "Java 集合遍历",
    kicker: "Java · 集合框架 · 第 04 节",
    desc: "List 是 Java 中最常用的有序集合。增强 for 循环让遍历集合更加简洁，同时保持静态类型安全。",
    code: `import java.util.List;\n\nclass Main {\n  public static void main(String[] args) {\n    List<Integer> scores = List.of(86, 92, 74, 100, 65);\n    int total = 0;\n    for (int score : scores) total += score;\n    System.out.println(\"总分：\" + total);\n  }\n}`,
    output: "总分：417",
    nodes: ["List 集合", "泛型", "创建集合", "增强 for", "访问元素", "不可变集合"],
  },
};

type Lang = keyof typeof lessons;

export default function Home() {
  const [lang, setLang] = useState<Lang>("Python");
  const [code, setCode] = useState(lessons.Python.code);
  const [output, setOutput] = useState("准备就绪，点击运行代码。");
  const [activeTopic, setActiveTopic] = useState(3);
  const [running, setRunning] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([{ role: "ai", text: "你好！我是你的 AI 编程助教。可以问我知识点、报错原因或代码优化。" }]);
  const lesson = lessons[lang];

  const progress = useMemo(() => ({ Python: 68, "C/C++": 42, JavaScript: 55, Java: 31 }[lang]), [lang]);

  function switchLang(next: Lang) {
    setLang(next); setCode(lessons[next].code); setActiveTopic(3); setOutput("准备就绪，点击运行代码。");
  }

  function runCode() {
    setRunning(true); setOutput("正在编译并执行…");
    setTimeout(() => { setRunning(false); setOutput(`✓ 运行成功 · 0.08s\n\n${lesson.output}\n\n测试用例  3/3  通过`); }, 650);
  }

  function ask(text = question) {
    if (!text.trim()) return;
    const q = text.trim();
    setMessages(m => [...m, { role: "user", text: q }]); setQuestion("");
    setTimeout(() => setMessages(m => [...m, { role: "ai", text: q.includes("优化") ? "建议用内置聚合函数简化循环：sum(scores) 可直接求和，表达更清晰，时间复杂度仍为 O(n)。" : q.includes("报错") ? "先看报错的最后一行，它通常包含异常类型与直接原因。把完整错误贴给我，我会按“位置 → 原因 → 修复”逐步说明。" : "for 循环会依次取出集合中的元素。这里 score 每轮对应一个成绩，total += score 负责累加，循环结束后再除以元素数量。" }]), 450);
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top"><span className="brandmark">&lt;/&gt;</span><span>Code<span>Atlas</span></span></a>
        <nav><a className="active" href="#learn">学习中心</a><a href="#map">知识图谱</a><a href="#lab">在线实训</a></nav>
        <div className="header-actions"><button className="search">⌕ <span>搜索知识点</span><kbd>⌘ K</kbd></button><button className="streak">🔥 12 天</button><div className="avatar">林</div></div>
      </header>

      <div className="workspace" id="top">
        <aside className="sidebar">
          <div className="side-title"><span>学习路径</span><button>＋</button></div>
          {(Object.keys(lessons) as Lang[]).map(key => <button className={`language ${lang === key ? "selected" : ""}`} onClick={() => switchLang(key)} key={key}><i style={{ background: lessons[key].color }}>{lessons[key].icon}</i><span>{key}</span><b>{lang === key ? `${progress}%` : "›"}</b></button>)}
          <div className="topic-list"><p>课程目录</p>{lesson.topics.map((topic, i) => <button key={topic} className={activeTopic === i ? "active-topic" : ""} onClick={() => setActiveTopic(i)}><span>{String(i + 1).padStart(2, "0")}</span>{topic}{i < 2 && <em>✓</em>}</button>)}</div>
          <div className="progress-card"><div><span>本周目标</span><b>4 / 6 节</b></div><div className="bar"><i style={{width: "67%"}} /></div><small>继续保持，超过 82% 的学习者</small></div>
        </aside>

        <section className="content" id="learn">
          <div className="breadcrumb">学习中心 <span>›</span> {lang} <span>›</span> {lesson.title}</div>
          <div className="lesson-head"><div><p>{lesson.kicker}</p><h1>{lesson.title}</h1><div className="meta"><span>◷ 约 12 分钟</span><span>◉ 3 个练习</span><span className="level">基础</span></div></div><div className="pager"><button>← 上一节</button><button>下一节 →</button></div></div>

          <article className="lesson-card"><span className="label">核心概念</span><p>{lesson.desc}</p><div className="note"><b>💡 为什么重要？</b><span>遍历是数据处理的基础模式。掌握后，你可以处理列表、文件内容和用户输入等几乎所有批量数据。</span></div></article>

          <div className="section-title"><span>01</span><div><h2>从一个实际问题开始</h2><p>计算一组学生成绩的平均值</p></div></div>
          <div className="code-card"><div className="code-head"><div><i className="dot red"/><i className="dot yellow"/><i className="dot green"/></div><span>example.{lang === "Python" ? "py" : lang === "JavaScript" ? "js" : lang === "Java" ? "java" : "cpp"}</span><button onClick={() => navigator.clipboard?.writeText(code)}>复制</button></div><pre><code>{lesson.code}</code></pre><div className="code-foot"><button onClick={runCode}>▶ 运行示例</button><span>试着修改成绩数据，观察结果变化</span></div></div>

          <div className="steps"><div><b>1</b><span><strong>准备数据</strong><small>使用集合保存多个成绩</small></span></div><div><b>2</b><span><strong>逐个遍历</strong><small>每轮读取一个元素</small></span></div><div><b>3</b><span><strong>处理结果</strong><small>累加并计算平均值</small></span></div></div>

          <section className="map-section" id="map"><div className="section-heading"><div><span className="eyebrow">AI 自动生成</span><h2>当前课程知识框架</h2></div><div><button onClick={() => alert("已导出为 PNG（演示）")}>⇩ 导出</button><button>⛶ 全屏</button></div></div><div className="mindmap"><div className="map-center">{lesson.nodes[0]}</div><div className="branch b1"><b>{lesson.nodes[1]}</b><small>按顺序访问元素</small></div><div className="branch b2"><b>{lesson.nodes[2]}</b><small>条件满足时重复</small></div><div className="branch b3"><b>{lesson.nodes[3]}</b><small>生成数字序列</small></div><div className="branch b4"><b>{lesson.nodes[4]}</b><small>提前结束循环</small></div><div className="branch b5"><b>{lesson.nodes[5]}</b><small>跳过当前一轮</small></div></div></section>

          <section className="lab" id="lab"><div className="section-heading"><div><span className="eyebrow purple">动手练习</span><h2>在线代码实验室</h2></div><select value={lang} onChange={e => switchLang(e.target.value as Lang)}>{(Object.keys(lessons) as Lang[]).map(x => <option key={x}>{x}</option>)}</select></div><div className="editor-grid"><div className="editor"><div className="editor-tabs"><span>● main.{lang === "Python" ? "py" : lang === "JavaScript" ? "js" : lang === "Java" ? "java" : "cpp"}</span><button onClick={() => setCode(lesson.code)}>↺ 重置</button></div><textarea spellCheck={false} value={code} onChange={e => setCode(e.target.value)} /><div className="editor-action"><span>Ln {code.split("\n").length}, Col 1</span><button onClick={runCode} disabled={running}>{running ? "运行中…" : "▶ 运行代码"}</button></div></div><div className="console"><div className="console-head"><span>终端输出</span><button onClick={() => setOutput("")}>清空</button></div><pre>{output}</pre><div className="judge"><b>自动判题</b><span className={output.includes("3/3") ? "passed" : ""}>{output.includes("3/3") ? "全部通过" : "等待运行"}</span></div></div></div><div className="ai-review"><span className="spark">✦</span><div><b>AI 代码教练</b><p>你的思路是正确的。运行后，我会从可读性、复杂度和边界处理三个维度给出建议。</p></div><button onClick={() => {setChatOpen(true); ask("如何优化这段代码？")}}>获取优化建议 →</button></div></section>
        </section>
      </div>

      <button className={`chat-fab ${chatOpen ? "open" : ""}`} onClick={() => setChatOpen(!chatOpen)}><span>✦</span>{chatOpen ? "×" : "问 AI"}</button>
      {chatOpen && <aside className="chat"><div className="chat-head"><div><span>✦</span><div><b>AI 编程助教</b><small>在线 · 基于当前课程</small></div></div><button onClick={() => setChatOpen(false)}>×</button></div><div className="chat-context">正在学习：{lesson.title}</div><div className="messages">{messages.map((m, i) => <div key={i} className={`message ${m.role}`}>{m.text}</div>)}</div><div className="chips"><button onClick={() => ask("解释当前知识点")}>解释知识点</button><button onClick={() => ask("帮我分析报错")}>分析报错</button></div><div className="chat-input"><textarea value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => {if(e.key === "Enter" && !e.shiftKey){e.preventDefault(); ask();}}} placeholder="输入你的编程问题…"/><button onClick={() => ask()}>↑</button></div></aside>}
    </main>
  );
}
