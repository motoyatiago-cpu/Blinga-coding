"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import EntranceTemplate from "./entrance-template";
import AuthorTemplate from "./author-template";
import entranceCss from "./entrance.css?raw";
import authorCss from "./author.css?raw";
import networkCss from "./network.css?raw";
import { createRuntime } from "./runtime";
import { createAuthHandlers } from "./auth-api";

export default function EntrancePage({ author = false }: { author?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  const [intro, setIntro] = useState<string | null>(null);
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
    if (intro) {
      const done = () => { scope.dispose(); window.location.replace(intro); };
      const skip = root.getElementById("skip-intro");
      skip?.focus();
      if (skip) scope.listen(skip, "click", done);
      scope.listen(window, "keydown", ((event: KeyboardEvent) => { if (event.key === "Escape") done(); }) as EventListener);
      scope.timeout(done, 4000);
      void import("./network-renderer.js").then(({ startNetworkIntro }) => {
        if (!scope.signal.aborted) startNetworkIntro(root, scope, done);
      }).catch(done);
      return () => scope.dispose();
    }
    const enter = (path: string) => {
      const target = new URL(path, location.origin);
      if (target.origin !== location.origin || target.pathname.startsWith("/api/")) return;
      setIntro(`${target.pathname}${target.search}${target.hash}`);
    };
    const guest = root.querySelector<HTMLAnchorElement>("a.guest-entry");
    if (!author && guest) scope.listen(guest, "click", ((event: MouseEvent) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      enter("/home");
    }) as EventListener);
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
      else behavior.startEntrance(root, scope, createAuthHandlers(root, scope.signal), enter);
    }).catch(() => {
      if (scope.signal.aborted) return;
      const message = root.getElementById("form-status");
      if (message) message.textContent = "页面未完整加载，请刷新重试，或通过下方入口进入网站。";
    });
    return () => { scope.dispose(); waterScope?.dispose(); };
  }, [root, author, intro]);

  return <div ref={host} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#05070a", isolation: "isolate" }}>
    {root ? createPortal(intro ? <><style>{networkCss}</style><canvas id="net" aria-hidden="true" /><div id="vignette" /><div id="loader" role="status"><div id="wordmark"><div className="title">Blinga coding</div><div className="sub" id="subtitle" /></div></div><div id="site" /><button id="skip-intro" className="skip">跳过</button></> : <><style>{author ? authorCss : entranceCss}</style>{author ? <AuthorTemplate /> : <EntranceTemplate />}</>, root) : <a href="/home" style={{ color: "white", padding: 24, display: "inline-block" }}>进入网站</a>}
  </div>;
}
