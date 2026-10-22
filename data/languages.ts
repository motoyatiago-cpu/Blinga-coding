/** Lightweight shared language metadata. Course prose stays out of profile bundles. */
export const languageOrder = ["Python", "C/C++", "JavaScript", "Java", "TypeScript", "Go"] as const;
export type Lang = typeof languageOrder[number];

export const languageSettings: Record<Lang, { slug: string; fileName: string; extensions: string[]; judgeId: number }> = {
  Python: { slug: "python", fileName: "main.py", extensions: [".py", ".txt"], judgeId: 100 },
  "C/C++": { slug: "c-cpp", fileName: "main.cpp", extensions: [".c", ".cc", ".cpp", ".cxx", ".h", ".hpp", ".txt"], judgeId: 105 },
  JavaScript: { slug: "javascript", fileName: "main.js", extensions: [".js", ".mjs", ".cjs", ".txt"], judgeId: 102 },
  Java: { slug: "java", fileName: "Main.java", extensions: [".java", ".txt"], judgeId: 91 },
  TypeScript: { slug: "typescript", fileName: "main.ts", extensions: [".ts", ".txt"], judgeId: 101 },
  Go: { slug: "go", fileName: "main.go", extensions: [".go", ".txt"], judgeId: 107 },
};

export function isCourseLanguage(value: unknown): value is Lang {
  return typeof value === "string" && (languageOrder as readonly string[]).includes(value);
}
