// Optional native integration check. Requires the selected language compilers on PATH.
// node scripts/check-course-examples.mjs Go Python C/C++ Java
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { loadCourseModule } from "../tests/helpers/course-module.mjs";

const languages = process.argv.slice(2);
if (!languages.length) throw new Error("Specify languages to verify: Go Python C/C++ Java");
const { courseDefinitions } = loadCourseModule();
const directory = await mkdtemp(join(tmpdir(), "blinga-course-check-"));
function run(command, args, input = "") {
  const result = spawnSync(command, args, {
    cwd: directory, input, encoding: "utf8", timeout: 90000, windowsHide: true,
    env: { ...process.env, PYTHONIOENCODING: "utf-8", GOTOOLCHAIN: "local", GOTELEMETRY: "off" },
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${command}: ${result.stderr}`);
  return result.stdout.replace(/\r\n/g, "\n").trimEnd();
}
try {
  for (const language of languages) {
    if (!["Go", "Python", "C/C++", "Java"].includes(language)) throw new Error(`Unsupported check: ${language}`);
    for (const lesson of courseDefinitions[language].lessons) {
      const fileName = { Go: "main.go", Python: "main.py", "C/C++": "main.cpp", Java: "Main.java" }[language];
      await writeFile(join(directory, fileName), lesson.code, "utf8");
      let output;
      if (language === "Go") output = run("go", ["run", fileName], lesson.judge.stdin);
      if (language === "Python") output = run("python", [fileName], lesson.judge.stdin);
      if (language === "C/C++") {
        const binary = process.platform === "win32" ? "lesson.exe" : "lesson";
        run("g++", ["-std=c++17", "-Wall", "-Wextra", "-finput-charset=UTF-8", "-fexec-charset=UTF-8", fileName, "-o", binary]);
        output = run(join(directory, binary), [], lesson.judge.stdin);
      }
      if (language === "Java") {
        run("javac", ["-encoding", "UTF-8", "--release", "17", fileName]);
        output = run("java", ["-Dfile.encoding=UTF-8", "Main"], lesson.judge.stdin);
      }
      assert.equal(output, lesson.output, lesson.id);
    }
    console.log(`${language}: ${courseDefinitions[language].lessons.length} examples passed`);
  }
} finally {
  // The exact mkdtemp directory is task-owned and contains only these test fixtures.
  if (dirname(resolve(directory)) !== resolve(tmpdir()) || !basename(directory).startsWith("blinga-course-check-")) {
    throw new Error("Refusing cleanup outside the course test directory");
  }
  await rm(directory, { recursive: true, force: true });
}
