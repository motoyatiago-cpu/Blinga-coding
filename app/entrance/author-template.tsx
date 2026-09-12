/** Retained source markup: visuals remain independent of application state. */
export default function AuthorTemplate() {
  return <>
    <canvas id="c" aria-hidden="true"></canvas>

    <div id="fail" hidden role="status">
      当前设备不支持水面效果，但仍可阅读作者介绍。
    </div>

    <div className="ambient-particles" aria-hidden="true"></div>
    <div className="cursor-aurora" aria-hidden="true"></div>

    <main className="portfolio-shell" aria-label="Blinga coding 作者主页">
      <aside className="profile-rail" aria-label="作者信息">
        <section className="visitor-panel" data-module="welcome">
          <div className="portrait">
            <img src="/entrance/assets/avatar-struggle.jpg" alt="呆.struggle 头像" />
          </div>
          <div className="visitor-copy">
            <h1>呆.<em>struggle</em></h1>
            <span>欢迎来到我的创作空间</span>
          </div>
        </section>

        <section className="self-panel" data-module="about" aria-labelledby="self-title">
          <div>
            <h2 id="self-title">自我介绍</h2>
          </div>
          <p className="self-copy">
            本人为计算机专业，喜欢汲取新知。喜欢进行一些创新与深度思考。目前正在进行对人工智能的学习，了解前言大模型以及底层工作原理。
          </p>
        </section>
      </aside>

      <section className="story-column" data-module="story-scroll" aria-label="作者内容，可上下滚动">
        <section className="growth-section" data-module="journey" aria-labelledby="growth-title">
          <header className="story-heading">
            <div>
              <h2 id="growth-title">我的成长经历</h2>
            </div>
          </header>

          <div className="growth-intro">
            <h3>在水面与代码之间，寻找属于界面的呼吸。</h3>
          </div>

          <ol className="timeline">
            <li>
              <time>起点</time>
              <div><strong>开始关注界面细节</strong><p>从排版、颜色与反馈入手，理解一个页面如何与人交流。</p></div>
            </li>
            <li>
              <time>探索</time>
              <div><strong>把动效变成功能</strong><p>尝试让动画承担引导、状态提示与情绪表达，而不只是装饰。</p></div>
            </li>
            <li>
              <time>现在</time>
              <div><strong>构建水面交互实验</strong><p>结合 WebGL 水面、角色反馈与账号入口，持续完善完整体验。</p></div>
            </li>
          </ol>
        </section>

        <section className="gallery-section" data-module="gallery" aria-labelledby="gallery-title">
          <header className="story-heading">
            <div>
              <h2 id="gallery-title">我的图库</h2>
            </div>
          </header>

          <div className="gallery-grid">
            <article className="gallery-card gallery-card--water" data-gallery-item="water">
              <div className="gallery-art" aria-hidden="true"><i></i><i></i><i></i></div>
              <div><h3>水面实验</h3></div>
            </article>
            <article className="gallery-card gallery-card--pals" data-gallery-item="pals">
              <div className="gallery-art" aria-hidden="true"><i></i><i></i><i></i></div>
              <div><h3>角色研究</h3></div>
            </article>
            <article className="gallery-card gallery-card--layout" data-gallery-item="layout">
              <div className="gallery-art" aria-hidden="true"><i></i><i></i><i></i></div>
              <div><h3>界面构成</h3></div>
            </article>
            <article className="gallery-card gallery-card--future" data-gallery-item="future">
              <div className="gallery-art" aria-hidden="true">＋</div>
              <div><h3>等待新作品</h3></div>
            </article>
          </div>
        </section>

        <section className="contact-section" data-module="contact" aria-labelledby="contact-title">
          <h2 id="contact-title">想聊聊新的创意？</h2>
          <p>展开下方二维码，在小红书找到我。</p>
          <details className="contact-details">
            <summary>点击联系我</summary>
            <div className="contact-qr-panel">
              <img
                className="contact-qr"
                src="/entrance/assets/contact-xiaohongshu.jpg"
                alt="小红书联系二维码，账号呆yu"
               />
            </div>
          </details>
        </section>
      </section>

      <aside className="history-rail" data-module="history" aria-labelledby="history-title">
        <header>
          <h2 id="history-title">网站创作<br />历程</h2>
        </header>

        <ol className="history-list">
          <li><span>01</span><div><strong>概念建立</strong><p>确定以实时水面作为视觉核心。</p></div></li>
          <li><span>02</span><div><strong>角色加入</strong><p>让四位伙伴回应鼠标与输入状态。</p></div></li>
          <li><span>03</span><div><strong>功能完善</strong><p>完成登录、注册与多种认证入口。</p></div></li>
          <li><span>04</span><div><strong>作者空间</strong><p>把创作经历与作品整理为独立页面。</p></div></li>
        </ol>

        <a className="back-link" href="/">
          <span aria-hidden="true">←</span>
          返回登录页面
        </a>
      </aside>
    </main>

    
    
    
    
  </>;
}
