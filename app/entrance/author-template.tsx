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
          <div className="rail-kicker" aria-hidden="true">
            <span>ABOUT ME</span><i></i>
          </div>
          <div className="portrait">
            <img src="/entrance/assets/avatar-struggle.jpg" alt="呆.struggle 头像" width="158" height="158" />
          </div>
          <div className="visitor-copy">
            <h1>呆.<em>struggle</em></h1>
            <span>欢迎来到我的创作空间</span>
          </div>
          <div className="identity-tags" aria-label="创作方向">
            <span>前端开发</span>
            <span>界面设计</span>
            <span>WebGL 探索</span>
          </div>
        </section>

        <section className="self-panel" data-module="about" aria-labelledby="self-title" tabIndex={0}>
          <div className="section-title-row">
            <i aria-hidden="true"></i>
            <h2 id="self-title">自我介绍</h2>
          </div>
          <p className="self-copy">
            我来自计算机相关专业，始终保持对新知识和新技术的好奇。学习过程中，我喜欢从实际问题出发，通过阅读、编程实践和独立思考不断完善自己的理解，也愿意尝试将有趣的想法转化为可以体验的作品。现阶段，我正在系统学习人工智能，重点关注前沿大模型、机器学习基础、模型训练与推理流程，以及这些技术背后的底层工作原理。我希望在持续探索中提升工程实践、创新思维与解决复杂问题的能力，并用技术创造真正有价值的内容。
          </p>
        </section>
      </aside>

      <section className="story-column" data-module="story-scroll" aria-label="作者内容，可上下滚动" tabIndex={0}>
        <section className="growth-section" data-module="journey" aria-labelledby="growth-title">
          <header className="story-heading">
            <div>
              <p className="section-kicker">GROWTH × CODE × LIFE</p>
              <h2 id="growth-title">我的成长<span>经历</span></h2>
              <p className="script-title" aria-hidden="true">My Journey</p>
            </div>
          </header>

          <div className="growth-intro">
            <h3>在水面与代码之间，寻找属于界面的呼吸。</h3>
            <i aria-hidden="true"></i>
            <p>从水的流动中感受节奏，从代码的逻辑中构建秩序，在理性与感性之间，寻找属于自己的创作方式。</p>
          </div>

          <ol className="timeline">
            <li>
              <span className="journey-index">01</span>
              <div className="journey-copy"><time>起点</time><strong>开始关注界面细节</strong><p>从排版、颜色与反馈入手，理解一个页面如何与人交流。</p></div>
              <span className="journey-visual journey-visual--origin" aria-hidden="true"><i></i><i></i><i></i></span>
            </li>
            <li>
              <span className="journey-index">02</span>
              <div className="journey-copy"><time>探索</time><strong>把动效变成功能</strong><p>尝试让动画承担引导、状态提示与情绪表达，而不只是装饰。</p></div>
              <span className="journey-visual journey-visual--explore" aria-hidden="true"><i></i><i></i><i></i></span>
            </li>
            <li>
              <span className="journey-index">03</span>
              <div className="journey-copy"><time>现在</time><strong>构建水面交互实验</strong><p>结合 WebGL 水面、角色反馈与账号入口，持续完善完整体验。</p></div>
              <span className="journey-visual journey-visual--present" aria-hidden="true"><i></i><i></i><i></i></span>
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
                loading="lazy"
                width="987"
                height="1347"
               />
            </div>
          </details>
        </section>
      </section>

      <aside className="history-rail" data-module="history" aria-labelledby="history-title" tabIndex={0}>
        <header>
          <div className="rail-kicker" aria-hidden="true"><span>TIMELINE</span><i></i><b>///</b></div>
          <h2 id="history-title">网站创作<br />历程</h2>
          <p>从一个想法<br />到一段持续生长的旅程。</p>
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
