import { contentSources } from "../../data/course-content";
import ThemeToggle from "../theme-toggle";

export default function ContentSourcesPage() {
  return <main className="content-sources-page">
    <header className="topbar glass">
      <a className="brand" href="/home"><span className="brandmark">&lt;/&gt;</span><span>Blinga <span>coding</span></span></a>
      <div className="content-sources-actions"><ThemeToggle /><a href="/home">返回学习中心 →</a></div>
    </header>
    <article className="content-sources-document">
      <header>
        <p>CONTENT PROVENANCE</p>
        <h1>课程内容来源与许可证</h1>
        <span>最后整理：2026-10-21</span>
      </header>
      <section>
        <h2>内容创作原则</h2>
        <p>课程正文、代码示例、测试数据和练习均由 Blinga Coding 独立编写并采用项目 MIT License。下列资料只用于核对语言事实、标准库行为、版本边界和课程覆盖范围，不复制第三方教程正文、插图、截图或课程结构。</p>
      </section>
      <section>
        <h2>登记来源</h2>
        <div className="content-source-list">{contentSources.map((source) => <article key={source.id}>
          <div><h3>{source.sourceName}</h3><span>{source.usageType}</span></div>
          <dl>
            <div><dt>版本</dt><dd>{source.sourceRevision}</dd></div>
            <div><dt>许可证</dt><dd><a href={source.licenseUrl} target="_blank" rel="noreferrer">{source.license}</a></dd></div>
            <div><dt>使用说明</dt><dd>{source.modificationSummary}</dd></div>
            <div><dt>检索日期</dt><dd>{source.retrievedAt}</dd></div>
          </dl>
          <a className="content-source-link" href={source.sourceUrl} target="_blank" rel="noreferrer">查看原始来源 ↗</a>
        </article>)}</div>
      </section>
      <section>
        <h2>明确未采用的来源</h2>
        <p>本轮没有导入 W3Schools、GeeksforGeeks、Programiz、菜鸟教程、CSDN、博客园、知乎、OpenStax、付费课程、电子书、视频字幕或许可证不明的 GitHub 内容。cppreference 与 Oracle Java 规范仅作为外部事实参考，不复制其正文、表格或示例。</p>
      </section>
    </article>
  </main>;
}
