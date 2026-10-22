"use client";

import dynamic from "next/dynamic";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AccountMenu from "./account-menu";
import AiAssistantIcon from "./ai-assistant-icons";
import AiMarkdown from "./ai-markdown";
import ThemeToggle from "./theme-toggle";
import { OPEN_AI_ASSISTANT_EVENT } from "./ai-assistant-events";
import CodeViewerDialog, {
  consumeCodeImport,
  type CodeRecordRequest,
} from "./code-viewer-dialog";
import { buildCourseUrl, courseTopicIndex, courseTopicNumber } from "./course-links";
import type { KnowledgeGraphProps } from "./knowledge-graph";
import { useDraggableAiPanel } from "./use-draggable-ai-panel";
import {
  curriculum,
  lessons,
  sourceById,
  type Course,
  type Lang,
} from "../data/course-content";

type WorkspaceView = "learn" | "lab" | "map" | "notes";
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
type AiResponse = {
  answer: string;
};
type SpeechRecognitionResultEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const MAX_SOURCE_FILE_CHARS = 12_000;
const INITIAL_CHAT_MESSAGE = {
  role: "ai",
  text: "你好，我已读取当前课程。可以让我解释知识点、分析报错或优化代码。",
};

const workspaceViews: Array<{ id: WorkspaceView; label: string; description: string }> = [
  { id: "learn", label: "学习", description: "概念与示例" },
  { id: "lab", label: "练习", description: "编写与运行" },
  { id: "map", label: "图谱", description: "梳理知识" },
  { id: "notes", label: "笔记", description: "记录复习" },
];

function workspaceViewFromHash(hash: string): WorkspaceView {
  const requestedView = hash.replace(/^#/, "") as WorkspaceView;
  return workspaceViews.some((view) => view.id === requestedView) ? requestedView : "learn";
}

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
        ...course.objectives,
        ...course.prerequisites,
        course.mentalModel,
        ...course.concepts.flatMap((concept) => [concept.title, concept.text]),
        ...course.commonErrors.flatMap((error) => [error.title, error.symptom, error.fix]),
        ...course.exercises.flatMap((exercise) => [exercise.level, exercise.title, exercise.prompt]),
        ...course.summaryPoints,
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
    <section className={`feature-section ${focusMode ? "sandbox-focus-mode" : ""}`} id="lab" aria-labelledby="workspace-tab-lab">
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
            <span>UTF-8 · Ln {cursorPosition.line}, Col {cursorPosition.column} · {code.split("\n").length} 行</span>
            {/(失败|错误|暂未|不可用)/.test(draftStatus) && <span className="editor-status-error" role="status">{draftStatus}</span>}
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
            <div><span>STDIN</span><button onClick={() => updateStdin("")} disabled={!stdin}>清空</button></div>
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

const StableSandbox = memo(Sandbox);

function KnowledgeGraphLoading() {
  return (
    <section className="feature-section" id="map" aria-labelledby="workspace-tab-map" aria-busy="true">
      <div className="section-heading"><div><h2>动态知识图谱</h2></div></div>
      <div className="graph-shell graph-module-loading glass" role="status">正在加载知识图谱…</div>
    </section>
  );
}

const DynamicKnowledgeGraph = dynamic<KnowledgeGraphProps>(
  () => import("./knowledge-graph"),
  { ssr: false, loading: KnowledgeGraphLoading },
);

function DeepLesson({ lang, topicIndex }: { lang: Lang; topicIndex: number }) {
  const guide = curriculum[lang].guides[topicIndex];
  const lesson = curriculum[lang].lessons[topicIndex];
  return (
    <section className="deep-lesson" aria-labelledby="deep-lesson-title">
      <nav className="lesson-section-nav" aria-label="本节目录">
        <a href="#lesson-goals">学习目标</a>
        <a href="#lesson-concepts">核心概念</a>
        <a href="#course-example">代码示例</a>
        <a href="#lesson-errors">错误与调试</a>
        <a href="#lesson-exercises">分级练习</a>
        <a href="#lesson-sources">来源</a>
      </nav>
      <div className="lesson-foundation" id="lesson-goals">
        <section>
          <h2>学习目标</h2>
          <ul>{lesson.objectives.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section>
          <h2>前置知识</h2>
          <ul>{lesson.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      </div>
      <div className="deep-intro">
        <h2 id="deep-lesson-title">从执行模型理解，而不是只记住语法</h2>
        <p>{lesson.mentalModel}</p>
      </div>
      <div className="concept-flow" id="lesson-concepts" aria-label="知识点执行流程">
        {guide.principles.map((item, index) => <article key={item.title}>
          <div><b>0{index + 1}</b></div>
          <h3>{item.title}</h3><p>{item.text}</p>
        </article>)}
      </div>
      <div className="deep-example glass" id="course-example">
        <div className="mac-code-head" aria-hidden="true"><span>code walkthrough</span></div>
        <div className="example-explain">
          <h3>{guide.syntaxTitle}</h3>
          <p>{guide.syntaxNote}</p>
          <ol>{lesson.steps.map((item) => <li key={item}>{item}</li>)}</ol>
        </div>
        <pre><code>{guide.syntaxCode}</code></pre>
        <div className="expected-output">
          <span>预期运行结果</span>
          <pre><code>{lesson.output}</code></pre>
        </div>
      </div>
      <div className="pitfall-section" id="lesson-errors">
        <div><h3>三个高频错误与修复方法</h3></div>
        <div className="pitfall-grid">{guide.pitfalls.map((item) => <article key={item.title}>
          <h4>{item.title}</h4><p className="wrong">× {item.wrong}</p><p className="right">✓ {item.right}</p>
        </article>)}</div>
        <aside className="debugging-guide" aria-label="调试方法">
          <h3>调试方法</h3>
          <ol>{lesson.debugging.map((item) => <li key={item}>{item}</li>)}</ol>
        </aside>
      </div>
      <section className="lesson-exercises" id="lesson-exercises" aria-labelledby="lesson-exercises-title">
        <div><h3 id="lesson-exercises-title">分级练习</h3><p>从复现行为开始，再处理边界和接口设计。</p></div>
        <div className="exercise-grid">{lesson.exercises.map((exercise) => <article key={exercise.level}>
          <span>{exercise.level}</span><h4>{exercise.title}</h4><p>{exercise.prompt}</p><small>验收：{exercise.verification}</small>
        </article>)}</div>
      </section>
      <section className="lesson-summary" aria-labelledby="lesson-summary-title">
        <h3 id="lesson-summary-title">本节总结</h3>
        <ul>{lesson.summaryPoints.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
      <details className="lesson-sources" id="lesson-sources">
        <summary>来源与许可证</summary>
        <div>
          <p>本节正文、示例和练习为 Blinga Coding 原创内容，采用 {lesson.contentLicense}。第三方页面仅用于事实核对或延伸阅读。</p>
          <ul>{lesson.sourceRefs.map((sourceId) => {
            const source = sourceById(sourceId);
            if (!source) return null;
            return <li key={source.id}><a href={source.sourceUrl} target="_blank" rel="noreferrer">{source.sourceName}</a><span>{source.license} · {source.usageType}</span></li>;
          })}</ul>
          <p>复核版本：{lesson.reviewedLanguageVersion} · 最后复核：{lesson.lastReviewedAt} · <a href="/content-sources">查看完整来源说明</a></p>
        </div>
      </details>
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
  const [status, setStatus] = useState("");
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
        setStatus("");
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

    setStatus("");
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
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
        setStatus("");
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
    <section className="lesson-notes glass" id="notes" aria-labelledby="lesson-notes-title">
      <div className="lesson-notes-head">
        <div>
          <h2 id="lesson-notes-title">我的学习笔记</h2>
        </div>
        {/(失败|错误|暂未|不可用)/.test(status) && (
          <div className="lesson-notes-error" role="status">{status}</div>
        )}
      </div>
      <textarea
        value={content}
        maxLength={8000}
        disabled={!ready}
        onChange={(event) => setContent(event.target.value)}
        placeholder={"记录你对本节知识点的理解、易错点和复习结论…\n\n建议结构：\n1. 核心概念\n2. 容易犯的错误\n3. 我自己的代码示例"}
        aria-label={`${lessonTitle}学习笔记`}
      />
    </section>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("Python");
  const [topicByLang, setTopicByLang] = useState<Record<Lang, number>>({ Python: 3, "C/C++": 0, JavaScript: 0, Java: 0 });
  const [activeView, setActiveView] = useState<WorkspaceView>("learn");
  const [openedViews, setOpenedViews] = useState<WorkspaceView[]>(["learn"]);
  const [progressReady, setProgressReady] = useState(false);
  const [completedTopics, setCompletedTopics] = useState<Record<string, number[]>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<AiResponse | null>(null);
  const [searchStatus, setSearchStatus] = useState("");
  const [searchBusy, setSearchBusy] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([{ ...INITIAL_CHAT_MESSAGE }]);
  const [aiBusy, setAiBusy] = useState(false);
  const [chatActionStatus, setChatActionStatus] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [sandboxContext, setSandboxContext] = useState<SandboxContext>({
    code: lessons.Python.code,
    stdin: "",
    output: "终端已连接 · 等待输入",
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const searchDialogRef = useRef<HTMLDivElement>(null);
  const searchReturnFocusRef = useRef<HTMLElement | null>(null);
  const searchRequestRef = useRef(0);
  const searchAbortRef = useRef<AbortController | null>(null);
  const chatAbortRef = useRef<AbortController | null>(null);
  const chatRequestRef = useRef(0);
  const chatHistoryRef = useRef<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const chatStatusTimerRef = useRef<number | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const {
    panelRef: chatPanelRef,
    interaction: chatPanelInteraction,
    resetLayout: resetChatPanelLayout,
    dragHandleProps: chatDragHandleProps,
    resizeHandleProps: chatResizeHandleProps,
  } = useDraggableAiPanel(chatOpen);
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
  const currentTopicCompleted = completedForCurrentLanguage.includes(selectedTopicIndex);
  const courseMatches = useMemo(() => findCourseMatches(searchQuery), [searchQuery]);

  const openSearch = useCallback(() => {
    searchReturnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : searchTriggerRef.current;
    setSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    window.requestAnimationFrame(() => searchReturnFocusRef.current?.focus());
  }, []);

  const navigateToWorkspaceView = useCallback((nextView: WorkspaceView) => {
    setActiveView(nextView);
    setOpenedViews((current) => current.includes(nextView) ? current : [...current, nextView]);
    const nextUrl = new URL(window.location.href);
    nextUrl.hash = nextView;
    window.history.pushState(window.history.state, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
    window.requestAnimationFrame(() => {
      document.getElementById(nextView)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  function handleSearchDialogKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSearch();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = Array.from(searchDialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) || []).filter((element) => !element.hasAttribute("hidden"));
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function navigateToCourse(nextLanguage: Lang, nextTopicIndex: number, fromSearch = false) {
    const safeTopicIndex = Math.max(
      0,
      Math.min(lessons[nextLanguage].topics.length - 1, nextTopicIndex),
    );
    const isSameCourse = nextLanguage === lang && safeTopicIndex === selectedTopicIndex;

    setLang(nextLanguage);
    setTopicByLang((current) => ({ ...current, [nextLanguage]: safeTopicIndex }));
    setActiveView("learn");
    setOpenedViews((current) => current.includes("learn") ? current : [...current, "learn"]);
    if (fromSearch) {
      closeSearch();
      setSearchResult(null);
      setSearchStatus("");
    }
    if (!isSameCourse) {
      const nextUrl = buildCourseUrl(nextLanguage, safeTopicIndex);
      window.history.pushState(
        { lang: nextLanguage, topic: courseTopicNumber(safeTopicIndex) },
        "",
        nextUrl,
      );
    } else if (window.location.hash !== "#learn") {
      const nextUrl = new URL(window.location.href);
      nextUrl.hash = "learn";
      window.history.pushState(window.history.state, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
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
    setSearchResult(null);
    setSearchStatus("");
    setSearchBusy(false);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      }
      if (event.key === "Escape" && searchOpen) closeSearch();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeSearch, openSearch, searchOpen]);

  useEffect(() => {
    const openAssistant = (event: Event) => {
      event.preventDefault();
      setChatOpen(true);
    };
    window.addEventListener(OPEN_AI_ASSISTANT_EVENT, openAssistant);

    const params = new URLSearchParams(window.location.search);
    if (params.get("assistant") === "open") {
      setChatOpen(true);
      params.delete("assistant");
      const query = params.toString();
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
      );
    }

    return () => window.removeEventListener(OPEN_AI_ASSISTANT_EVENT, openAssistant);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [searchOpen]);

  useEffect(() => {
    const syncViewFromHash = () => {
      const nextView = workspaceViewFromHash(window.location.hash);
      setActiveView(nextView);
      setOpenedViews((current) => current.includes(nextView) ? current : [...current, nextView]);
      window.requestAnimationFrame(() => {
        document.getElementById(nextView)?.scrollIntoView({ block: "start" });
      });
    };
    syncViewFromHash();
    window.addEventListener("hashchange", syncViewFromHash);
    window.addEventListener("popstate", syncViewFromHash);
    return () => {
      window.removeEventListener("hashchange", syncViewFromHash);
      window.removeEventListener("popstate", syncViewFromHash);
    };
  }, []);

  useEffect(() => {
    if (openedViews.includes("lab")) return;
    setSandboxContext({ code: lesson.code, stdin: "", output: "终端已连接 · 等待输入" });
  }, [lesson, openedViews]);

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
    speechRecognitionRef.current?.stop();
    if (chatStatusTimerRef.current !== null) {
      window.clearTimeout(chatStatusTimerRef.current);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const readCourseFromUrl = (progress?: LearningProgress | null) => {
      const params = new URLSearchParams(window.location.search);
      const requestedLanguage = params.get("lang") as Lang | null;
      const requestedTopicNumber = params.get("topic");
      const hasRequestedLanguage = Boolean(requestedLanguage && requestedLanguage in lessons);
      const nextLanguage = hasRequestedLanguage
        ? requestedLanguage as Lang
        : progress?.activeLanguage;

      if (progress) setTopicByLang(progress.topics);
      if (nextLanguage) {
        setLang(nextLanguage);
        if (hasRequestedLanguage) {
          const safeTopic = courseTopicIndex(
            requestedTopicNumber,
            lessons[nextLanguage].topics.length,
          );
          if (safeTopic === null) return;
          setTopicByLang((current) => ({ ...current, [nextLanguage]: safeTopic }));

          const canonicalTopicNumber = String(courseTopicNumber(safeTopic));
          if (requestedTopicNumber !== canonicalTopicNumber) {
            const canonicalUrl = new URL(window.location.href);
            canonicalUrl.searchParams.set("topic", canonicalTopicNumber);
            window.history.replaceState(
              window.history.state,
              "",
              `${canonicalUrl.pathname}${canonicalUrl.search}${canonicalUrl.hash}`,
            );
          }
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
      } catch {
        if (!active) return;
        readCourseFromUrl();
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

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/progress", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activeLanguage: lang, topics: topicByLang }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "学习进度同步失败");
      } catch {}
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

  async function callAi(
    mode: "chat" | "search",
    prompt: string,
    signal?: AbortSignal,
    history: Array<{ role: "user" | "assistant"; content: string }> = [],
  ) {
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
      body: JSON.stringify({ mode, prompt, context, ...(mode === "chat" ? { history } : {}) }),
      signal,
    });
    const contentType = response.headers.get("Content-Type") || "";
    const data = contentType.includes("application/json")
      ? await response.json() as AiResponse & { error?: string }
      : null;
    if (!response.ok) throw new Error(data?.error || "AI 服务暂时不可用");
    if (!data?.answer) throw new Error("AI 未返回有效内容");
    return data;
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
    setSearchResult(null);
    setSearchStatus("正在生成回答…");
    try {
      const result = await callAi("search", searchQuery, controller.signal);
      if (requestId === searchRequestRef.current) {
        setSearchResult(result);
        setSearchStatus("");
      }
    } catch (error) {
      if (requestId === searchRequestRef.current) {
        if (error instanceof DOMException && error.name === "AbortError") {
          setSearchStatus(timedOut ? "AI 回答超时，请稍后重试" : "已停止本次问答");
        } else {
          setSearchStatus(error instanceof Error ? error.message : "搜索失败");
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
      const result = await callAi("chat", value, controller.signal, chatHistoryRef.current);
      if (requestId === chatRequestRef.current) {
        chatHistoryRef.current = [
          ...chatHistoryRef.current,
          { role: "user" as const, content: value },
          { role: "assistant" as const, content: result.answer },
        ].slice(-6);
        setMessages((current) => [...current, { role: "ai", text: result.answer }].slice(-40));
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

  function announceChatAction(message: string) {
    setChatActionStatus(message);
    if (chatStatusTimerRef.current !== null) {
      window.clearTimeout(chatStatusTimerRef.current);
    }
    chatStatusTimerRef.current = window.setTimeout(() => {
      setChatActionStatus("");
      chatStatusTimerRef.current = null;
    }, 2_400);
  }

  async function importAssistantFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 64 * 1024) {
      announceChatAction("文件过大，请选择 64KB 以内的文本或代码文件");
      return;
    }
    try {
      const content = await file.text();
      if (content.includes("\u0000")) throw new Error("binary");
      setQuestion(`请分析文件 ${file.name}：\n\n${content.slice(0, MAX_SOURCE_FILE_CHARS)}`);
      announceChatAction(`已载入 ${file.name}`);
    } catch {
      announceChatAction("无法读取该文件，请选择文本或代码文件");
    } finally {
      if (chatFileInputRef.current) chatFileInputRef.current.value = "";
    }
  }

  function readLatestAnswer() {
    if (!("speechSynthesis" in window)) {
      announceChatAction("当前浏览器不支持语音朗读");
      return;
    }
    const latestAnswer = [...messages].reverse().find((message) => message.role === "ai")?.text;
    if (!latestAnswer) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(latestAnswer);
    utterance.lang = "zh-CN";
    window.speechSynthesis.speak(utterance);
    announceChatAction("正在朗读最近一条回答");
  }

  function toggleSpeechInput() {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      speechRecognitionRef.current = null;
      setIsListening(false);
      return;
    }

    const voiceWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = voiceWindow.SpeechRecognition || voiceWindow.webkitSpeechRecognition;
    if (!Recognition) {
      announceChatAction("当前浏览器不支持语音输入");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) {
        setQuestion((current) => `${current}${current ? " " : ""}${transcript}`);
        announceChatAction("语音内容已加入输入框");
      }
    };
    recognition.onerror = () => announceChatAction("未能识别语音，请重试");
    recognition.onend = () => {
      speechRecognitionRef.current = null;
      setIsListening(false);
    };
    speechRecognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }

  function clearConversation() {
    chatRequestRef.current += 1;
    chatAbortRef.current?.abort();
    chatAbortRef.current = null;
    chatHistoryRef.current = [];
    setAiBusy(false);
    setQuestion("");
    setMessages([{ ...INITIAL_CHAT_MESSAGE }]);
    announceChatAction("对话已清空");
  }

  return (
    <main className="learning-workspace">
        <div className="ambient one" /><div className="ambient two" />
        <header className="topbar glass" inert={searchOpen ? true : undefined} aria-hidden={searchOpen || undefined}>
          <a className="brand" href="#learn" onClick={(event) => { event.preventDefault(); navigateToWorkspaceView("learn"); }}><span className="brandmark">&lt;/&gt;</span><span>Blinga <span>coding</span></span></a>
          <nav aria-label="学习工作区快捷入口">
            {workspaceViews.map((view) => <a
              className={activeView === view.id ? "active" : ""}
              href={`#${view.id}`}
              key={view.id}
              onClick={(event) => { event.preventDefault(); navigateToWorkspaceView(view.id); }}
            >{view.label}</a>)}
          </nav>
          <div className="header-actions"><button ref={searchTriggerRef} className="search-trigger" onClick={openSearch}>⌕ <span>搜索知识点</span></button><ThemeToggle /><AccountMenu /></div>
        </header>

        <div className={`search-overlay ${searchOpen ? "open" : ""}`} hidden={!searchOpen} onMouseDown={(event) => { if (event.currentTarget === event.target) closeSearch(); }}>
          <div ref={searchDialogRef} className="search-dialog glass" role="dialog" aria-modal="true" aria-labelledby="global-search-title" onKeyDown={handleSearchDialogKeyDown}>
            <div className="search-dialog-head"><div><b id="global-search-title">全站课程与 AI 搜索</b></div><button onClick={closeSearch} aria-label="关闭搜索">×</button></div>
            <div className="search-box"><input ref={searchInputRef} value={searchQuery} onChange={(event) => updateSearchQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") search(); }} placeholder="例如：循环、指针、异步编程…" /><button onClick={search} disabled={!searchQuery.trim() || searchBusy}>{searchBusy ? "分析中" : "AI 智能问答"}</button></div>
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
                : <p>没有找到完全匹配的课程，可调整关键词或使用 AI 智能问答。</p>}
            </section>}
            {searchStatus && <div className="search-answer search-answer-status" role="status"><p>{searchStatus}</p></div>}
            {searchResult && <div className="search-answer">
              <AiMarkdown text={searchResult.answer} />
            </div>}
          </div>
        </div>

        <div className="workspace" inert={searchOpen ? true : undefined} aria-hidden={searchOpen || undefined}>
          <aside className="sidebar glass" aria-label="课程导航">
            <a className="course-nav-back" href="/home">← 全部编程语言</a>
            <a className="language selected course-root-link" href={`/courses/${languageSlugs[lang]}`}>
              <span>{lang}</span>
            </a>
            <nav className="course-topic-nav" aria-label={`${lang} 知识点`}>
              {lesson.topics.map((topic, index) =>
                <a
                  className={[
                    selectedTopicIndex === index ? "active" : "",
                    completedForCurrentLanguage.includes(index) ? "completed" : "",
                  ].filter(Boolean).join(" ")}
                  href={buildCourseUrl(lang, index)}
                  key={topic}
                  onClick={(event) => {
                    event.preventDefault();
                    navigateToTopic(index);
                  }}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <b>{topic}</b>
                </a>
              )}
            </nav>
            <div className="course-switcher">
              <span>切换编程语言</span>
              <div>{(Object.keys(lessons) as Lang[]).filter((key) => key !== lang).map((key) =>
                <a href={`/courses/${languageSlugs[key]}`} aria-label={`进入 ${key} 课程`} key={key}>{key}</a>
              )}</div>
            </div>
          </aside>

          <section className="content">
            <div className="mobile-chapter-navigation">
              <label htmlFor="mobile-chapter-select">当前章节</label>
              <select
                id="mobile-chapter-select"
                value={selectedTopicIndex}
                onChange={(event) => navigateToTopic(Number(event.target.value))}
              >
                {lesson.topics.map((topic, index) => <option value={index} key={topic}>
                  {String(index + 1).padStart(2, "0")} · {topic}
                </option>)}
              </select>
            </div>
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

            <nav className="workspace-view-tabs" aria-label="课程工作区视图">
              {workspaceViews.map((view) => <a
                id={`workspace-tab-${view.id}`}
                className={activeView === view.id ? "active" : ""}
                href={`#${view.id}`}
                aria-current={activeView === view.id ? "page" : undefined}
                key={view.id}
                onClick={(event) => { event.preventDefault(); navigateToWorkspaceView(view.id); }}
              >
                <b>{view.label}</b>
                <span>{view.description}</span>
              </a>)}
            </nav>

            <div className="workspace-view" id="learn" aria-labelledby="workspace-tab-learn" hidden={activeView !== "learn"}>
              <article className="lesson-card"><h2>{lesson.title}：核心概念与实践</h2><p>{lesson.desc}</p><div className="note"><b>学习方式</b><span>先理解概念和执行过程，再阅读代码示例，最后进入在线实训完成修改与验证。</span></div></article>
              <DeepLesson lang={lang} topicIndex={selectedTopicIndex} />

              <div className="code-example glass">
                <div className="pane-head code-example-actions"><button onClick={() => navigator.clipboard?.writeText(lesson.code)}>复制代码</button></div>
                <pre><code>{lesson.code}</code></pre>
                <div className="example-foot"><a href="#lab" onClick={(event) => { event.preventDefault(); navigateToWorkspaceView("lab"); }}>进入练习</a></div>
              </div>
            </div>

            <div className="workspace-view" data-workspace-view="notes" hidden={activeView !== "notes"}>
              {openedViews.includes("notes") && <LessonNotes
                key={`${lang}:${selectedTopicIndex}`}
                lang={lang}
                topicIndex={selectedTopicIndex}
                lessonTitle={lesson.title}
              />}
            </div>
            <div className="workspace-view" data-workspace-view="map" hidden={activeView !== "map"}>
              {openedViews.includes("map") && <DynamicKnowledgeGraph lesson={lesson} code={lesson.code} />}
            </div>
            <div className="workspace-view" data-workspace-view="lab" hidden={activeView !== "lab"}>
              {openedViews.includes("lab") && <StableSandbox lang={lang} setLang={setLang} lesson={lesson} topicIndex={selectedTopicIndex} onContextChange={syncSandboxContext} onLessonCompleted={markLessonCompleted} />}
            </div>
          </section>

          <nav className="mobile-lesson-pager glass" aria-label="章节翻页">
            <button disabled={isFirstTopic} onClick={() => navigateToTopic(selectedTopicIndex - 1)} aria-label="进入上一节课程">← <span>上一节</span></button>
            <strong>{selectedTopicIndex + 1} / {lesson.topics.length}</strong>
            <button disabled={isLastTopic} onClick={() => navigateToTopic(selectedTopicIndex + 1)} aria-label="进入下一节课程"><span>下一节</span> →</button>
          </nav>
        </div>

        <aside
          ref={chatPanelRef}
          id="ai-programming-assistant"
          className={`chat glass ai-floating-panel ${chatOpen ? "open" : ""} ${chatPanelInteraction ? `is-${chatPanelInteraction}` : ""}`}
          aria-labelledby="ai-assistant-title"
          role="dialog"
          inert={searchOpen ? true : undefined}
          aria-hidden={searchOpen || !chatOpen}
          data-lenis-prevent
        >
          <div
            className="chat-head ai-panel-drag-handle"
            tabIndex={chatOpen ? 0 : -1}
            aria-label="拖动 AI 助教窗口，使用方向键可以微调位置"
            title="拖动窗口；双击恢复默认位置"
            onDoubleClick={resetChatPanelLayout}
            {...chatDragHandleProps}
          >
            <div className="ai-panel-title"><b id="ai-assistant-title">AI 助教</b></div>
            <div className="chat-head-actions"><button className="ai-panel-close" type="button" onClick={() => setChatOpen(false)} aria-label="关闭 AI 助教"><AiAssistantIcon name="close" /></button></div>
          </div>
          <div className={`ai-panel-body ${messages.length === 1 && !aiBusy ? "is-welcome" : ""}`}>
            <div className="messages" ref={chatMessagesRef} aria-live="polite">
              {messages.map((message, index) => <div key={index} className={`message-row ${message.role}`}>{message.role === "ai" && <img src="/web-pet/robot/idle.webp" alt="AI 助教" />}<div className={`message ${message.role}`}>{message.role === "ai" ? <AiMarkdown text={message.text} /> : message.text}</div></div>)}
              {aiBusy && <div className="message-row ai"><img src="/web-pet/robot/poses/thinking.webp" alt="" /><div className="message ai ai-working"><i />正在组织答案，可随时停止…</div></div>}
            </div>
            {messages.length === 1 && !aiBusy && <div className="ai-quick-actions" aria-label="快捷提问">
              <button type="button" onClick={() => ask("请结合当前课程，用通俗易懂的方式解释核心概念，并给出一个简单示例。") }><span className="ai-quick-icon explain"><AiAssistantIcon name="book" /></span><b>解释核心概念</b></button>
              <button type="button" onClick={() => ask("请分析当前编辑器中的代码报错，指出原因、位置并给出可执行的修复方案。") }><span className="ai-quick-icon debug"><AiAssistantIcon name="bug" /></span><b>分析代码报错</b></button>
              <button type="button" onClick={() => ask("请审查当前编辑器中的代码，优化可读性、性能与健壮性，并说明修改原因。") }><span className="ai-quick-icon optimize"><AiAssistantIcon name="chart" /></span><b>优化现有代码</b></button>
            </div>}
            {messages.length === 1 && !aiBusy && <div className="ai-welcome-spacer" aria-hidden="true" />}
            {messages.length > 1 && !aiBusy && <button type="button" className="ai-conversation-clear" onClick={clearConversation}>清空对话</button>}
          </div>
          <div className="ai-chat-status" role="status" aria-live="polite">{chatActionStatus}</div>
          <div className="chat-input">
            <input ref={chatFileInputRef} type="file" accept=".txt,.md,.py,.js,.jsx,.ts,.tsx,.java,.c,.cc,.cpp,.h,.hpp,.json,.html,.css" onChange={(event) => void importAssistantFile(event.target.files?.[0])} hidden />
            <button type="button" className="ai-input-tool ai-attach" onClick={() => chatFileInputRef.current?.click()} aria-label="添加代码或文本文件" title="添加代码或文本文件"><AiAssistantIcon name="plus" /></button>
            <textarea aria-label="向 AI 助教提问" value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); ask(); } }} placeholder={aiBusy ? "AI 正在回答，可先编辑下一个问题…" : "输入你的问题…"} />
            <button type="button" className="ai-input-tool" onClick={readLatestAnswer} aria-label="朗读最近回答" title="朗读最近回答"><AiAssistantIcon name="wave" /></button>
            <button type="button" className={`ai-input-tool ${isListening ? "is-active" : ""}`} onClick={toggleSpeechInput} aria-pressed={isListening} aria-label={isListening ? "停止语音输入" : "开始语音输入"} title={isListening ? "停止语音输入" : "开始语音输入"}><AiAssistantIcon name="microphone" /></button>
            <button type="button" className={`ai-send ${aiBusy ? "stop" : ""}`} onClick={aiBusy ? stopAiAnswer : () => ask()} disabled={!aiBusy && !question.trim()} aria-label={aiBusy ? "停止 AI 回答" : "发送问题"}>{aiBusy ? <span aria-hidden="true">■</span> : <AiAssistantIcon name="send" />}</button>
          </div>
          <button
            className="chat-resize-handle"
            type="button"
            tabIndex={chatOpen ? 0 : -1}
            aria-label="调整 AI 助教窗口大小，使用方向键可以微调"
            {...chatResizeHandleProps}
          />
        </aside>
    </main>
  );
}
