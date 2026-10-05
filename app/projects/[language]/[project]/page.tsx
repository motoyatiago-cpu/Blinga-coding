import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBlueprint } from "../../../../data/project-blueprints";
import ThemeToggle from "../../../theme-toggle";
import ProjectWorkflow from "../../project-workflow";

type ProjectPageProps = { params: Promise<{ language: string; project: string }> };

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const value = await params;
  const project = getProjectBlueprint(value.language, value.project);
  return project ? { title: `${project.title} · 项目实战`, description: project.summary } : {};
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const value = await params;
  const project = getProjectBlueprint(value.language, value.project);
  if (!project) notFound();

  return <main className="projects-page project-detail-page">
    <header className="projects-topbar">
      <Link className="projects-brand" href="/home"><span aria-hidden="true">&lt;/&gt;</span><b>Blinga <em>coding</em></b></Link>
      <nav aria-label="项目实战导航"><Link href="/home">学习中心</Link><Link href="/projects" aria-current="page">项目实战</Link><Link href="/forum">用户论坛</Link></nav>
      <ThemeToggle />
    </header>

    <div className="project-detail-shell">
      <nav className="project-breadcrumb" aria-label="面包屑">
        <Link href="/projects">项目实战</Link><span aria-hidden="true">/</span>
        <Link href={`/projects#${project.language}`}>{project.languageName}</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{project.title}</span>
      </nav>
      <header className="project-detail-hero">
        <div>
          <p>{project.languageName} · {project.difficulty}</p>
          <h1>{project.title}</h1>
          <span>{project.scenario}</span>
        </div>
        <dl><div><dt>预计用时</dt><dd>{project.duration}</dd></div><div><dt>项目阶段</dt><dd>{project.milestones.length} 个里程碑</dd></div><div><dt>运行方式</dt><dd>{project.runnable ? "在线运行" : "路线预告"}</dd></div></dl>
      </header>
      <ProjectWorkflow project={project} />
    </div>
  </main>;
}
