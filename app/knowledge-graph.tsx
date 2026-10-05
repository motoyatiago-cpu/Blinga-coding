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
  useState,
  type CSSProperties,
} from "react";

export type KnowledgeGraphProps = {
  lesson: {
    title: string;
    desc: string;
  };
  code: string;
};

type KnowledgeData = {
  title: string;
  description: string;
  color: string;
  depth: number;
};

type KnowledgeNode = Node<KnowledgeData, "knowledge">;

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
    <article className={`knowledge-node ${selected ? "selected" : ""}`} style={{ "--node-color": data.color } as CSSProperties}>
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

function KnowledgeGraph({ lesson, code }: KnowledgeGraphProps) {
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
    <section className="feature-section" id="map" aria-labelledby="workspace-tab-map">
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

function GraphDocumentExport() {
  function exportPdf() {
    document.body.classList.add("print-mindmap");
    const cleanup = () => document.body.classList.remove("print-mindmap");
    window.addEventListener("afterprint", cleanup, { once: true });
    window.setTimeout(() => window.print(), 40);
  }

  return <div className="document-export glass"><div><b>导出当前知识图谱</b></div><button onClick={exportPdf}>⇩ 导出 PDF</button></div>;
}

function KnowledgeGraphModule(props: KnowledgeGraphProps) {
  return (
    <ReactFlowProvider>
      <KnowledgeGraph {...props} />
      <GraphDocumentExport />
    </ReactFlowProvider>
  );
}

export default memo(KnowledgeGraphModule);
