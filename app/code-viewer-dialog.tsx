"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { buildCourseUrl } from "./course-links";

export type CodeRecordRequest =
  | { kind: "draft"; language: string; topicIndex: number }
  | { kind: "run"; id: number; language: string; topicIndex: number };

type CodeRecord = {
  kind: "draft" | "run";
  id?: number;
  language: string;
  topicIndex: number;
  code: string | null;
  codeAvailable: boolean;
  mode?: "run" | "judge";
  statusId?: number;
  statusDescription?: string;
  createdAt?: string;
  updatedAt?: string;
  unavailableReason?: string | null;
};

type EditorImport = {
  language: string;
  topicIndex: number;
  code: string;
  createdAt: number;
};

export const CODE_IMPORT_STORAGE_KEY = "blinga:editor-code-import";
const CODE_IMPORT_MAX_AGE_MS = 5 * 60 * 1000;

export function consumeCodeImport(language: string, topicIndex: number): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(CODE_IMPORT_STORAGE_KEY);
  if (!raw) return null;
  window.sessionStorage.removeItem(CODE_IMPORT_STORAGE_KEY);
  try {
    const value = JSON.parse(raw) as EditorImport;
    const valid = value.language === language
      && value.topicIndex === topicIndex
      && typeof value.code === "string"
      && value.code.length <= 12_000
      && Number.isFinite(value.createdAt)
      && Date.now() - value.createdAt <= CODE_IMPORT_MAX_AGE_MS;
    return valid ? value.code : null;
  } catch {
    return null;
  }
}

function fileExtension(language: string): string {
  if (language === "Python") return "py";
  if (language === "C/C++") return "cpp";
  if (language === "JavaScript") return "js";
  if (language === "Java") return "java";
  return "txt";
}

function fileName(record: CodeRecord): string {
  const prefix = record.kind === "run" ? `run-${record.id || "history"}` : "draft";
  return `${prefix}-lesson-${record.topicIndex + 1}.${fileExtension(record.language)}`;
}

function displayTime(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("zh-CN", { hour12: false });
}

async function readJson(response: Response): Promise<{ record?: CodeRecord; error?: string }> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("代码暂时无法查看，请稍后重试");
  }
  const payload = await response.json() as { record?: CodeRecord; error?: string };
  if (!response.ok) throw new Error(payload.error || "代码读取失败");
  return payload;
}

export default function CodeViewerDialog({
  request,
  onClose,
}: {
  request: CodeRecordRequest | null;
  onClose: () => void;
}) {
  const [record, setRecord] = useState<CodeRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!request) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]),a[href],input:not([disabled]),[tabindex]:not([tabindex='-1'])",
      ));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [request]);

  useEffect(() => {
    if (!request) {
      setRecord(null);
      setMessage("");
      return;
    }
    const controller = new AbortController();
    let active = true;
    const params = new URLSearchParams({ kind: request.kind });
    if (request.kind === "run") params.set("id", String(request.id));
    else {
      params.set("language", request.language);
      params.set("topicIndex", String(request.topicIndex));
    }
    setLoading(true);
    setRecord(null);
    setMessage("");
    void fetch(`/api/code-record?${params}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(readJson)
      .then((payload) => {
        if (active) setRecord(payload.record || null);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (active) setMessage(error instanceof Error ? error.message : "代码读取失败");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [request]);

  const lineNumbers = record?.code == null
    ? "1"
    : Array.from(
        { length: Math.max(1, record.code.split("\n").length) },
        (_, index) => index + 1,
      ).join("\n");

  if (!request || typeof document === "undefined") return null;

  async function copyCode() {
    if (record?.code == null) return;
    try {
      await navigator.clipboard.writeText(record.code);
      setMessage("代码已复制");
    } catch {
      setMessage("复制失败，请手动选择代码");
    }
  }

  function downloadCode() {
    if (record?.code == null) return;
    const blob = new Blob([record.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName(record);
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function loadInSandbox() {
    if (record?.code == null) return;
    const transfer: EditorImport = {
      language: record.language,
      topicIndex: record.topicIndex,
      code: record.code,
      createdAt: Date.now(),
    };
    window.sessionStorage.setItem(CODE_IMPORT_STORAGE_KEY, JSON.stringify(transfer));
    window.location.assign(buildCourseUrl(record.language, record.topicIndex, "lab"));
  }

  const title = record?.kind === "run" ? "运行代码快照" : "已保存代码草稿";
  const timestamp = record?.createdAt || record?.updatedAt;

  return createPortal(
    <div className="code-viewer-backdrop" onMouseDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}>
      <div
        className="code-viewer-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="code-viewer-title"
        ref={dialogRef}
      >
        <header className="code-viewer-titlebar">
          <div className="mac-traffic-lights" aria-hidden="true"><i /><i /><i /></div>
          <div className="code-viewer-heading">
            <b id="code-viewer-title">{title}</b>
            <span>{record ? fileName(record) : "正在读取代码"}</span>
          </div>
          <button ref={closeButtonRef} onClick={onClose} aria-label="关闭代码查看器">×</button>
        </header>

        <div className="code-viewer-meta">
          <span>{record?.language || request.language}</span>
          <span>第 {(record?.topicIndex ?? request.topicIndex) + 1} 节</span>
          {record?.kind === "run" && <span className={record.statusId === 3 ? "success" : "failed"}>
            {record.mode === "judge" ? "自动判题" : "运行代码"} · {record.statusDescription}
          </span>}
          {timestamp && <time>{displayTime(timestamp)}</time>}
        </div>

        <section className="code-viewer-body" data-lenis-prevent aria-live="polite">
          {loading ? <div className="code-viewer-state">正在读取完整代码…</div>
            : message && !record ? <div className="code-viewer-state error">{message}</div>
              : record?.codeAvailable && record.code !== null ? (
                <div className="code-viewer-source">
                  <pre className="code-viewer-lines" aria-hidden="true">{lineNumbers}</pre>
                  <pre><code>{record.code}</code></pre>
                </div>
              ) : <div className="code-viewer-state unavailable">
                <b>暂无可查看的源码</b>
                <p>{record?.unavailableReason || "该记录创建时未保存源码"}</p>
              </div>}
        </section>

        <footer>
          <span aria-live="polite">{message && record ? message : "载入后将替换该课程当前草稿"}</span>
          <div>
            <button onClick={copyCode} disabled={record?.code == null}>复制</button>
            <button onClick={downloadCode} disabled={record?.code == null}>下载</button>
            <button className="primary" onClick={loadInSandbox} disabled={record?.code == null}>载入为当前草稿</button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
