"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { tags } from "@lezer/highlight";

type EditorLanguage = "Python" | "C/C++" | "JavaScript" | "Java";

export type CodeEditorHandle = { focus: () => void; resetViewport: () => void };

type Props = {
  language: EditorLanguage;
  value: string;
  onChange: (value: string) => void;
  onCursorChange: (position: { line: number; column: number }) => void;
  onRunShortcut: (judge: boolean) => void;
  ariaLabel: string;
};

const languageExtensions = { Python: python(), "C/C++": cpp(), JavaScript: javascript(), Java: java() } as const;

const syntaxTheme = HighlightStyle.define([
  { tag: [tags.keyword, tags.controlKeyword, tags.definitionKeyword], color: "#c4b5fd" },
  { tag: [tags.string, tags.special(tags.string)], color: "#a6e3a1" },
  { tag: [tags.number, tags.bool, tags.null], color: "#fab387" },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: "#6c7086", fontStyle: "italic" },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: "#89b4fa" },
  { tag: [tags.className, tags.typeName], color: "#f9e2af" },
  { tag: [tags.operator, tags.punctuation, tags.variableName, tags.propertyName], color: "#cdd6f4" },
]);

const editorTheme = EditorView.theme({
  "&": { height: "100%", color: "#cdd6f4", backgroundColor: "#1e1e2e", fontFamily: "var(--font-geist-mono), SFMono-Regular, Consolas, monospace", fontSize: "13px" },
  ".cm-scroller": { overflow: "auto", lineHeight: "1.75" },
  ".cm-content": { padding: "24px 0 28px", caretColor: "#f5f7ff" },
  ".cm-line": { padding: "0 24px" },
  ".cm-gutters": { color: "#6c7086", backgroundColor: "#1e1e2e", border: "0", paddingTop: "24px" },
  ".cm-gutterElement": { padding: "0 12px 0 16px" },
  ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "#29293d" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection": { backgroundColor: "#45475a" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#f5f7ff" },
  ".cm-focused": { outline: "none" },
}, { dark: true });

function getPosition(view: EditorView) {
  const cursor = view.state.selection.main.head;
  const line = view.state.doc.lineAt(cursor);
  return { line: line.number, column: cursor - line.from + 1 };
}

const CodeEditor = forwardRef<CodeEditorHandle, Props>(function CodeEditor(
  { language, value, onChange, onCursorChange, onRunShortcut, ariaLabel },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onCursorRef = useRef(onCursorChange);
  const onRunRef = useRef(onRunShortcut);
  onChangeRef.current = onChange;
  onCursorRef.current = onCursorChange;
  onRunRef.current = onRunShortcut;

  useImperativeHandle(ref, () => ({
    focus: () => viewRef.current?.focus(),
    resetViewport: () => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({ selection: { anchor: 0 }, effects: EditorView.scrollIntoView(0, { y: "start", yMargin: 16 }) });
      view.focus();
    },
  }), []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(), history(), languageExtensions[language], syntaxHighlighting(syntaxTheme), editorTheme,
          EditorView.contentAttributes.of({ "aria-label": ariaLabel }),
          keymap.of([
            indentWithTab, ...historyKeymap, ...defaultKeymap,
            { key: "Mod-Enter", run: () => { onRunRef.current(false); return true; } },
            { key: "Mod-Shift-Enter", run: () => { onRunRef.current(true); return true; } },
          ]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
            if (update.docChanged || update.selectionSet) onCursorRef.current(getPosition(update.view));
          }),
        ],
      }),
      parent: host,
    });
    viewRef.current = view;
    onCursorRef.current(getPosition(view));
    return () => { viewRef.current = null; view.destroy(); };
  }, [ariaLabel, language]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.state.doc.toString() === value) return;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
  }, [value]);

  return <div ref={hostRef} className="code-editor" data-lenis-prevent />;
});

export default CodeEditor;
