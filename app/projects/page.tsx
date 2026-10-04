import type { Metadata } from "next";
import Link from "next/link";
import { PROJECT_LANGUAGE_META, PROJECT_LANGUAGE_SLUGS, getProjectsForLanguage } from "../../data/project-blueprints";
import ThemeToggle from "../theme-toggle";

export const metadata: Metadata = {
  title: "项目实战 · Blinga coding",
  description: "把课程知识点串成可完成、可运行的编程项目。",
};

export default function ProjectsPage() {
  return <main className="projects-page">
    <header className="projects-topbar">
      <Link className="projects-brand" href="/home"><span aria-hidden="true">&lt;/&gt;</span><b>Blinga <em>coding</em></b></Link>
      <nav aria-label="项目实战导航"><Link href="/home">学习中心</Link><Link href="/projects" aria-current="page">项目实战</Link><Link href="/forum">用户论坛</Link></nav>
      <ThemeToggle />
    </header>

    <section className="projects-hero">
      <p className="projects-eyebrow">PROJECT-BASED LEARNING</p>
      <h1>把知识点，做成真正能运行的作品</h1>
      <p>每个项目拆成三个里程碑，并回链到现有课程。先完成一个可运行案例，再进入更完整的工程路线。</p>
      <div className="projects-hero-stats" aria-label="项目概览">
        <span><b>4</b> 种语言</span><span><b>8</b> 个项目蓝图</span><span><b>4</b> 个在线案例</span>
      </div>
    </section>

    <div className="projects-catalog">
      {PROJECT_LANGUAGE_SLUGS.map((language) => {
        const meta = PROJECT_LANGUAGE_META[language];
        const projects = getProjectsForLanguage(language);
        return <section className="projects-language" id={language} key={language} aria-labelledby={`${language}-title`}>
          <header>
            <span className="projects-language-mark" aria-hidden="true">{meta.short}</span>
            <div><p>学习路线</p><h2 id={`${language}-title`}>{meta.name}</h2><span>{meta.description}</span></div>
            <Link href={`/courses/${language}`}>查看课程 →</Link>
          </header>
          <div className="project-card-grid">
            {projects.map((project) => <article className="project-card" key={project.slug}>
              <div className="project-card-meta">
                <span>{project.difficulty}</span><span>{project.duration}</span>
                <b data-runnable={project.runnable}>{project.runnable ? "可在线运行" : "路线预告"}</b>
              </div>
              <h3>{project.title}</h3>
              <p>{project.summary}</p>
              <ul aria-label="涉及知识点">{project.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
              <div className="project-card-foot"><span>{project.milestones.length} 个里程碑</span><Link href={`/projects/${language}/${project.slug}`}>查看项目 <span aria-hidden="true">→</span></Link></div>
            </article>)}
          </div>
        </section>;
      })}
    </div>
  </main>;
}
