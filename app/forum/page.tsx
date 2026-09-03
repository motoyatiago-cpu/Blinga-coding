import ForumClient from "./forum-client";
import ThemeToggle from "../theme-toggle";

export default function ForumPage() {
  return (
    <main className="forum-page">
      <header className="forum-topbar">
        <a className="forum-brand" href="/">Blinga coding</a>
        <nav aria-label="论坛导航">
          <a href="/">学习中心</a>
          <a href="/?assistant=open">AI 问答</a>
          <ThemeToggle />
        </nav>
      </header>
      <ForumClient />
    </main>
  );
}
