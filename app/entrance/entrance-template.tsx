/** Retained source markup: visuals remain independent of application state. */
export default function EntranceTemplate() {
  return <>
    <canvas id="c" aria-hidden="true"></canvas>

    <div id="fail" hidden role="status">
      当前设备不支持水面效果，但仍可使用登录入口。
    </div>

    <main
      className="auth-stage"
      id="auth-stage"
      data-mode="login"
      data-focus="none"
      data-password-visible="false"
      data-result="idle"
    >
      <section className="auth-shell" aria-label="账号登录与注册">
        <section className="lagoon-panel" aria-label="互动角色功能区">
          <div className="lagoon-caption">
            <span>水面正在聆听</span>
            <p>轻轻移动，他们正在看着你。</p>
          </div>

          <div className="lagoon-glow"></div>
          <div className="shore-line"></div>

          <div className="pal-group" aria-hidden="true">
            <div className="pal pal--purple">
              <span className="pal-fluid"><i></i><i></i></span>
              <span className="pal-brow pal-brow--left"></span>
              <span className="pal-brow pal-brow--right"></span>
              <span className="pal-eye pal-eye--left"><i></i></span>
              <span className="pal-eye pal-eye--right"><i></i></span>
              <span className="pal-mouth"></span>
            </div>

            <div className="pal pal--orange">
              <span className="pal-fluid"><i></i><i></i></span>
              <span className="pal-brow pal-brow--left"></span>
              <span className="pal-brow pal-brow--right"></span>
              <span className="pal-eye pal-eye--left"><i></i></span>
              <span className="pal-eye pal-eye--right"><i></i></span>
              <span className="pal-mouth"></span>
            </div>

            <div className="pal pal--black">
              <span className="pal-fluid"><i></i><i></i></span>
              <span className="pal-brow pal-brow--left"></span>
              <span className="pal-brow pal-brow--right"></span>
              <span className="pal-eye pal-eye--left"><i></i></span>
              <span className="pal-eye pal-eye--right"><i></i></span>
              <span className="pal-mouth"></span>
            </div>

            <div className="pal pal--yellow">
              <span className="pal-fluid"><i></i><i></i></span>
              <span className="pal-brow pal-brow--left"></span>
              <span className="pal-brow pal-brow--right"></span>
              <span className="pal-eye pal-eye--left"><i></i></span>
              <span className="pal-eye pal-eye--right"><i></i></span>
              <span className="pal-mouth"></span>
            </div>
          </div>

          <div className="pal-actions" aria-hidden="true">
            <span className="pal-action pal-action--account">
              <span className="pal-action-icon pal-action-icon--globe" aria-hidden="true"></span>
            </span>
            <span className="pal-action pal-action--voice">
              <span className="pal-action-icon pal-action-icon--voice" aria-hidden="true">
                <i></i><i></i><i></i><i></i>
              </span>
            </span>
            <span className="pal-action pal-action--files">
              <span className="pal-action-icon pal-action-icon--folder" aria-hidden="true"></span>
            </span>
            <span className="pal-action pal-action--safety">
              <span className="pal-action-icon pal-action-icon--lock" aria-hidden="true"></span>
            </span>
          </div>

          <div className="pal-ripples" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
        </section>

        <section className="form-panel">
          <div className="form-scroll">
            <div className="brand-mark" aria-hidden="true"><span></span></div>

            <header className="form-heading">
              <h1 id="auth-title">欢迎回来！</h1>
              <p id="auth-subtitle">请输入你的账号信息</p>
            </header>

            <form id="auth-form" autoComplete="on" noValidate>
              <div className="mode-fields" id="login-fields">
                <div className="line-field">
                  <label htmlFor="login-account">账号或邮箱</label>
                  <div className="line-control">
                    <input
                      id="login-account"
                      name="account"
                      type="text"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck="false"
                      placeholder="请输入账号或邮箱"
                      aria-describedby="login-account-message"
                      required
                     />
                    <span className="field-line" aria-hidden="true"></span>
                  </div>
                  <p className="field-message" id="login-account-message"></p>
                </div>

                <div className="line-field">
                  <label htmlFor="login-password">密码</label>
                  <div className="line-control">
                    <input
                      id="login-password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="请输入密码"
                      aria-describedby="login-password-message"
                      required
                     />
                    <button
                      className="reveal-button"
                      type="button"
                      data-password-target="login-password"
                      aria-label="显示密码"
                      aria-pressed="false"
                    >
                      <span aria-hidden="true"></span>
                    </button>
                    <span className="field-line" aria-hidden="true"></span>
                  </div>
                  <p className="field-message" id="login-password-message"></p>
                </div>

                <div className="form-row">
                  <label className="remember-control">
                    <input id="remember-login" name="remember" type="checkbox" />
                    <span aria-hidden="true"></span>
                    30 天内保持登录
                  </label>
                  <button className="text-action" id="forgot-password" type="button">
                    忘记密码？
                  </button>
                </div>
              </div>

              <div className="mode-fields" id="register-fields" hidden inert={true}>
                <div className="line-field">
                  <label htmlFor="register-account">账号</label>
                  <div className="line-control">
                    <input
                      id="register-account"
                      name="registerAccount"
                      type="text"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck="false"
                      placeholder="4–20 位字母、数字或下划线"
                      minLength={4}
                      maxLength={20}
                      aria-describedby="register-account-message"
                      required
                     />
                    <span className="field-line" aria-hidden="true"></span>
                  </div>
                  <p className="field-message" id="register-account-message"></p>
                </div>


                <div className="line-field">
                  <label htmlFor="register-password">密码</label>
                  <div className="line-control">
                    <input
                      id="register-password"
                      name="registerPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder="至少 10 位，包含字母和数字"
                      minLength={10} maxLength={128}
                      aria-describedby="register-password-message"
                      required
                     />
                    <button
                      className="reveal-button"
                      type="button"
                      data-password-target="register-password"
                      aria-label="显示注册密码"
                      aria-pressed="false"
                    >
                      <span aria-hidden="true"></span>
                    </button>
                    <span className="field-line" aria-hidden="true"></span>
                  </div>
                  <p className="field-message" id="register-password-message"></p>
                </div>

                <div className="line-field">
                  <label htmlFor="register-confirm">确认密码</label>
                  <div className="line-control">
                    <input
                      id="register-confirm"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder="请再次输入密码"
                      minLength={10} maxLength={128}
                      aria-describedby="register-confirm-message"
                      required
                     />
                    <button
                      className="reveal-button"
                      type="button"
                      data-password-target="register-confirm"
                      aria-label="显示确认密码"
                      aria-pressed="false"
                    >
                      <span aria-hidden="true"></span>
                    </button>
                    <span className="field-line" aria-hidden="true"></span>
                  </div>
                  <p className="field-message" id="register-confirm-message"></p>
                </div>
              </div>

              <button className="primary-action" id="primary-action" type="submit">
                <span className="primary-label">登录</span>
                <span className="button-current" aria-hidden="true"></span>
              </button>

              <div className="social-login">
                <span className="social-heading" id="social-heading">其他方式登录</span>
                <div className="social-options" aria-labelledby="social-heading"><button className="social-action" type="button" data-social-provider="wechat-oa" hidden>微信授权</button><button className="social-action" type="button" data-social-provider="wechat-open" hidden>微信扫码</button><button className="social-action" type="button" data-social-provider="qq" hidden>QQ</button>
                  
                  <button
                    className="social-action"
                    data-social-provider="microsoft" hidden
                    type="button"
                    aria-label="使用 Microsoft 登录"
                    title="Microsoft"
                  >
                    <span className="social-mark social-mark--microsoft" aria-hidden="true">
                      <i></i><i></i><i></i><i></i>
                    </span>
                    <span>微软</span>
                  </button>
                  
<a className="social-action guest-entry" href="/home" aria-label="进入网站，浏览公开课程">进入网站</a>
                </div>
              </div>

              <p className="form-status" id="form-status" role="status" aria-live="polite" aria-atomic="true"></p>

              <p className="mode-switch">
                <span id="mode-prompt">还没有账号？</span>
                <button
                  id="mode-switch-button"
                  type="button"
                  aria-controls="login-fields register-fields"
                >立即注册</button>
              </p>
            </form>
          </div>
        </section>
      </section>
    </main>

    <a
      className="blinga-badge"
      id="blinga-about-trigger"
      aria-label="关于Blinga coding，查看作者介绍"
      href="/author"
    >
      <span className="blinga-badge__prefix">关于</span>
      <span className="blinga-badge__name">Blinga</span>
      <span className="blinga-badge__accent">coding</span>
    </a>

    
    
    
  </>;
}
