import "./review.css";

export default function ReviewLoading() {
  return (
    <main className="review-page" aria-busy="true">
      <section className="review-loading" aria-label="正在加载复习记录">
        <span />
        <p>正在整理你的复习队列…</p>
      </section>
    </main>
  );
}
