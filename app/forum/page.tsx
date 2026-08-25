import "./forum.css";
import ThemeToggle from "../theme-toggle";

const categories = [
  {
    title: "问题与答疑",
    description: "围绕语法、报错和运行结果整理问题，让讨论能够复现并得到准确回答。",
    tag: "Q&A",
  },
  {
    title: "代码评审",
    description: "分享小型代码片段，讨论可读性、性能、边界条件与更稳妥的实现方式。",
    tag: "REVIEW",
  },
  {
    title: "学习交流",
    description: "记录课程进度、整理知识框架，并与其他学习者交换练习与复盘方法。",
    tag: "LEARN",
  },
] as const;

export default function ForumPage() {
  return (
    <main className="forum-page">
      <div className="forum-ambient forum-ambient-one" />
      <div className="forum-ambient forum-ambient-two" />
      <header className="forum-topbar">
        <a className="forum-brand" href="/">
          <span>&lt;/&gt;</span>
          <b>Blinga coding</b>
        </a>
        <nav aria-label="论坛导航">
          <a href="/">学习中心</a>
          <a href="/?assistant=open">AI 问答</a>
          <ThemeToggle />
        </nav>
      </header>

      <section className="forum-shell">
        <header className="forum-hero">
          <p>Blinga community</p>
          <h1>用户论坛</h1>
          <span>交流问题、代码与学习方法。</span>
        </header>

        <section className="forum-categories" aria-label="讨论分类">
          {categories.map((category) => (
            <article key={category.title}>
              <small>{category.tag}</small>
              <h2>{category.title}</h2>
              <p>{category.description}</p>
            </article>
          ))}
        </section>

        <section className="forum-guidelines">
          <div>
            <h2>让每次讨论更有效</h2>
            <p>发布问题时保留必要的语言、代码、输入、实际输出和预期结果；请先移除密码、令牌与个人信息。</p>
          </div>
          <ol>
            <li><b>01</b><span>明确问题出现在哪个课程与知识点</span></li>
            <li><b>02</b><span>提供能够复现问题的最小代码</span></li>
            <li><b>03</b><span>说明已经尝试过的解决方法</span></li>
          </ol>
        </section>
      </section>
    </main>
  );
}
