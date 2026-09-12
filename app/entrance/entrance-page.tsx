"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import EntranceTemplate from "./entrance-template";
import AuthorTemplate from "./author-template";
import entranceCss from "./entrance.css?raw";
import authorCss from "./author.css?raw";
import { createRuntime } from "./runtime";
import { createAuthHandlers } from "./auth-api";

export default function EntrancePage({ author = false }: { author?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  useEffect(() => {
    if (!host.current) return;
    // Old course bookmarks (including the pet's AI shortcut) retain their meaning.
    const query = new URLSearchParams(location.search);
    if (!author && (["lang", "topic", "assistant"].some((key) => query.has(key)) || ["#learn", "#lab", "#notes", "#map"].includes(location.hash))) {
      location.replace(`/home${location.search}${location.hash}`);
      return;
    }
    setRoot(host.current.shadowRoot || host.current.attachShadow({ mode: "open" }));
  }, [author]);

  useEffect(() => {
    if (!root) return;
    const scope = createRuntime(root);
    let waterScope: ReturnType<typeof createRuntime> | undefined;
    void Promise.all([
      import("./water-renderer.js"),
      author ? import("./author-controller.js") : import("./entrance-controller.js"),
    ]).then(([water, behavior]) => {
      if (scope.signal.aborted) return;
      waterScope = createRuntime(root);
      try { water.startWater(root, waterScope); }
      catch {
        waterScope.dispose();
        const fallback = root.getElementById("fail");
        if (fallback) { fallback.hidden = false; fallback.textContent = "当前设备不支持水面效果，仍可正常使用页面。"; }
      }
      if ("startAuthor" in behavior) behavior.startAuthor(root, scope);
      else behavior.startEntrance(root, scope, createAuthHandlers(root, scope.signal));
    }).catch(() => {
      if (scope.signal.aborted) return;
      const message = root.getElementById("form-status");
      if (message) message.textContent = "页面未完整加载，请刷新重试，或通过下方入口进入网站。";
    });
    return () => { scope.dispose(); waterScope?.dispose(); };
  }, [root, author]);

  return <div ref={host} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#05070a", isolation: "isolate" }}>
    {root ? createPortal(<><style>{author ? authorCss : entranceCss}</style>{author ? <AuthorTemplate /> : <EntranceTemplate />}</>, root) : <a href="/home" style={{ color: "white", padding: 24, display: "inline-block" }}>进入网站</a>}
  </div>;
}
