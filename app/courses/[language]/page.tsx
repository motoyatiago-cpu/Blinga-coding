import { courseDefinitions, languageOrder } from "../../../data/course-content";
import { notFound } from "next/navigation";
import { buildCourseUrl } from "../../course-links";
import ThemeToggle from "../../theme-toggle";

const courseBySlug = new Map<string, (typeof courseDefinitions)[typeof languageOrder[number]]>(
  languageOrder.map((language) => [courseDefinitions[language].slug, courseDefinitions[language]]),
);

const levels = [
  { name: "Level 01 · 入门基础", range: [0, 4], note: "建立运行环境、类型与控制流基础" },
  { name: "Level 02 · 核心能力", range: [4, 7], note: "掌握真实编程任务所需的核心工具" },
  { name: "Level 03 · 进阶应用", range: [7, Infinity], note: "进入可靠性、工程化与资源管理" },
] as const;

export default async function CoursePage({ params }: { params: Promise<{ language: string }> }) {
  const { language } = await params;
  const course = courseBySlug.get(language);
  if (!course) notFound();
  const slug = course.slug;

  return <main className="course-page">
    <div className="ambient one" /><div className="ambient two" />
    <header className="topbar glass">
      <a className="brand" href="/home"><span className="brandmark">&lt;/&gt;</span><span>Blinga <span>coding</span></span></a>
      <nav><a href="/home">学习中心</a><a className="active" href={`/courses/${slug}`}>课程目录</a><a href={`/projects#${slug}`}>项目实战</a><a href={buildCourseUrl(course.queryName, 0, "map")}>知识图谱</a><a href={buildCourseUrl(course.queryName, 0, "lab")}>在线实训</a></nav>
      <div className="course-topbar-actions"><ThemeToggle /><a className="course-back" href={buildCourseUrl(course.queryName, 0)}>返回学习台 →</a></div>
    </header>

    <div className="course-layout">
      <aside className="course-language-nav glass">
        <a className="course-nav-back" href="/home">← 全部编程语言</a>
        <div className="language selected course-root-link"><span>{course.name}</span></div>
        <nav className="course-topic-nav" aria-label={`${course.name} 知识点`}>
          {course.lessons.map((lesson, index) =>
            <a href={buildCourseUrl(course.queryName, index)} key={lesson.id}>
              <span>{String(index + 1).padStart(2, "0")}</span><b>{lesson.topic}</b>
            </a>
          )}
        </nav>
        <div className="course-switcher">
          <span>切换编程语言</span>
          <div>{languageOrder.filter((item) => item !== course.name).map((item) => {
            const target = courseDefinitions[item];
            return <a href={`/courses/${target.slug}`} aria-label={`进入 ${target.name} 课程`} key={item}>{target.name}</a>;
          })}</div>
        </div>
      </aside>

      <section className="course-catalog">
        <div className="catalog-breadcrumb"><a href="/home">学习中心</a><span>/</span><b>{course.name}</b></div>
        <header className="course-hero glass">
          <div><h1>{course.name} 分级课程</h1><p>{course.description}</p></div>
          <div className="course-stats"><div><b>3</b><span>学习级别</span></div><div><b>{course.lessons.length}</b><span>核心知识点</span></div><div><b>∞</b><span>在线练习</span></div></div>
        </header>

        <div className="course-entry glass">
          <div><h2>从左侧选择一个知识点开始学习</h2><p>共 {course.lessons.length} 节课程，包含完整示例、运行结果、分级练习与来源说明。按顺序学习，或选择需要巩固的主题。</p></div>
          <a href={buildCourseUrl(course.queryName, 0)}>开始第一节</a>
        </div>
        <div className="course-level-summary">
          {levels.map((level, index) => <article className="glass" key={level.name}>
            <span>0{index + 1}</span><div><h3>{level.name}</h3><p>{level.note}</p></div><b>{Math.max(0, Math.min(course.lessons.length, level.range[1]) - level.range[0])} 节</b>
          </article>)}
        </div>
      </section>
    </div>
  </main>;
}
