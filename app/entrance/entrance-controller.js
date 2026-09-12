export function startEntrance(root, scope, handlers) {

  const stage = root.getElementById("auth-stage");
  const form = root.getElementById("auth-form");
  const canvas = root.getElementById("c");
  const loginFields = root.getElementById("login-fields");
  const registerFields = root.getElementById("register-fields");
  const title = root.getElementById("auth-title");
  const subtitle = root.getElementById("auth-subtitle");
  const primaryAction = root.getElementById("primary-action");
  const primaryLabel = primaryAction.querySelector(".primary-label");
  const socialHeading = root.getElementById("social-heading");
  const socialActions = Array.from(root.querySelectorAll("[data-social-provider]"));
  const formStatus = root.getElementById("form-status");
  const modePrompt = root.getElementById("mode-prompt");
  const modeSwitch = root.getElementById("mode-switch-button");
  const forgotPassword = root.getElementById("forgot-password");
  const pals = Array.from(root.querySelectorAll(".pal"));
  const authShell = root.querySelector(".auth-shell");
  const lagoonPanel = root.querySelector(".lagoon-panel");
  const palGroup = root.querySelector(".pal-group");
  const orangePal = root.querySelector(".pal--orange");
  const revealButtons = Array.from(root.querySelectorAll("[data-password-target]"));
  const inputs = Array.from(form.querySelectorAll("input:not([type='checkbox'])"));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const loginAccount = root.getElementById("login-account");
  const loginPassword = root.getElementById("login-password");
  const rememberLogin = root.getElementById("remember-login");
  const registerAccount = root.getElementById("register-account");
  const registerPassword = root.getElementById("register-password");
  const registerConfirm = root.getElementById("register-confirm");

  const copy = {
    login: {
      title: "欢迎回来！",
      subtitle: "请输入你的账号信息",
      primary: "登录",
      social: "其他登录方式",
      prompt: "还没有账号？",
      switch: "立即注册"
    },
    register: {
      title: "创建账号",
      subtitle: "注册后可使用账号直接登录",
      primary: "注册",
      social: "其他进入方式",
      prompt: "已经有账号？",
      switch: "返回登录"
    }
  };

  const wait = (duration) => new Promise((resolve) => scope.timeout(resolve, duration));

  let mode = "login";
  let busy = false;
  let runToken = 0;
  let pointerFrame = 0;
  let latestPointer = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
  let lastFocusSplash = 0;
  let palCenters = [];
  let palCentersDirty = true;

  const authHandler = handlers.login;
  const registerHandler = handlers.register;
  const providerNames = { microsoft: "Microsoft", qq: "QQ", "wechat-open": "微信扫码", "wechat-oa": "微信授权" };

  const setInert = (element, value) => {
    element.inert = value;
    if (value) {
      element.setAttribute("inert", "");
    } else {
      element.removeAttribute("inert");
    }
  };

  const setBusy = (value) => {
    busy = value;
    primaryAction.disabled = value;
    socialActions.forEach((button) => {
      button.disabled = value;
    });
    modeSwitch.disabled = value;
    stage.setAttribute("aria-busy", String(value));
  };

  const clearFieldError = (input) => {
    const message = root.getElementById(`${input.id}-message`);
    input.removeAttribute("aria-invalid");
    input.closest(".line-field")?.classList.remove("has-error");
    if (message) message.textContent = "";
  };

  const setFieldError = (input, messageText) => {
    const message = root.getElementById(`${input.id}-message`);
    input.setAttribute("aria-invalid", "true");
    input.closest(".line-field")?.classList.add("has-error");
    if (message) message.textContent = messageText;
  };

  const clearFeedback = () => {
    inputs.forEach(clearFieldError);
    formStatus.textContent = "";
    stage.dataset.result = "idle";
  };

  const splashAt = (x, y, delay = 0) => {
    if (!canvas) return;

    scope.timeout(() => {
      if (stage.hidden) return;

      const eventInit = {
        bubbles: true,
        cancelable: true,
        clientX: Math.max(0, Math.min(window.innerWidth, x)),
        clientY: Math.max(0, Math.min(window.innerHeight, y)),
        pointerId: 71,
        pointerType: "mouse",
        isPrimary: true
      };

      try {
        canvas.dispatchEvent(new PointerEvent("pointerdown", eventInit));
      } catch {
        canvas.dispatchEvent(new MouseEvent("pointerdown", eventInit));
      }
    }, delay);
  };

  const splashAtElement = (element, xFactor = 0.5, yFactor = 0.82, delay = 0) => {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    splashAt(rect.left + rect.width * xFactor, rect.top + rect.height * yFactor, delay);
  };

  const splashSequence = (kind) => {
    if (!lagoonPanel) return;
    const rect = lagoonPanel.getBoundingClientRect();
    const y = rect.top + rect.height * 0.79;

    if (kind === "success") {
      splashAt(rect.left + rect.width * 0.30, y, 0);
      splashAt(rect.left + rect.width * 0.52, y - 12, reducedMotion.matches ? 50 : 160);
      splashAt(rect.left + rect.width * 0.72, y + 3, reducedMotion.matches ? 100 : 320);
      return;
    }

    if (kind === "error") {
      splashAt(rect.left + rect.width * 0.43, y, 0);
      splashAt(rect.left + rect.width * 0.58, y + 8, reducedMotion.matches ? 60 : 180);
      return;
    }

    splashAt(rect.left + rect.width * 0.50, y, 0);
  };

  const refreshPalCenters = () => {
    palCenters = pals.map((pal) => {
      const rect = pal.getBoundingClientRect();
      return {
        x: rect.left + rect.width * 0.5,
        y: rect.top + Math.min(rect.height * 0.3, 76)
      };
    });
    palCentersDirty = false;
  };

  const invalidatePalCenters = () => {
    palCentersDirty = true;
  };

  const pointPalsAt = (clientX, clientY) => {
    if (palCentersDirty || palCenters.length !== pals.length) {
      refreshPalCenters();
    }

    pals.forEach((pal, index) => {
      const center = palCenters[index];
      const dx = clientX - center.x;
      const dy = clientY - center.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const nx = dx / distance;
      const ny = dy / distance;
      const reach = Math.min(distance / 220, 1);

      pal.style.setProperty("--eye-x", `${(nx * reach * 4.2).toFixed(2)}px`);
      pal.style.setProperty("--eye-y", `${(ny * reach * 3.2).toFixed(2)}px`);
      pal.style.setProperty("--cursor-x", `${(nx * reach * 2.4).toFixed(2)}px`);
      pal.style.setProperty("--cursor-y", `${(ny * reach * 1.8).toFixed(2)}px`);
      pal.style.setProperty("--cursor-tilt", `${(nx * reach * 2.1).toFixed(2)}deg`);
    });
  };

  const queuePointerLook = (clientX, clientY) => {
    latestPointer = { x: clientX, y: clientY };
    if (pointerFrame) return;

    pointerFrame = scope.frame(() => {
      pointerFrame = 0;
      pointPalsAt(latestPointer.x, latestPointer.y);
    });
  };

  const lookAtElement = (element, yFactor = 0.55) => {
    const rect = element.getBoundingClientRect();
    queuePointerLook(rect.left + rect.width * 0.46, rect.top + rect.height * yFactor);
  };

  const updatePasswordState = () => {
    stage.dataset.passwordVisible = String(
      [loginPassword, registerPassword, registerConfirm].some(
        (input) => input.type === "text" && !input.closest("[hidden]")
      )
    );
  };

  const concealPasswords = () => {
    revealButtons.forEach((button) => {
      const input = root.getElementById(button.dataset.passwordTarget);
      input.type = "password";
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", button.dataset.passwordTarget === "login-password"
        ? "显示密码"
        : "显示注册密码");
    });
    updatePasswordState();
  };

  const updateMode = (nextMode, options = {}) => {
    if (nextMode !== "login" && nextMode !== "register") return;

    runToken += 1;
    mode = nextMode;
    setBusy(false);
    clearFeedback();
    concealPasswords();

    stage.dataset.mode = mode;
    const isLogin = mode === "login";
    loginFields.hidden = !isLogin;
    registerFields.hidden = isLogin;
    setInert(loginFields, !isLogin);
    setInert(registerFields, isLogin);

    const nextCopy = copy[mode];
    title.textContent = nextCopy.title;
    subtitle.textContent = nextCopy.subtitle;
    primaryLabel.textContent = nextCopy.primary;
    socialHeading.textContent = nextCopy.social;
    modePrompt.textContent = nextCopy.prompt;
    modeSwitch.textContent = nextCopy.switch;
    socialActions.forEach((button) => {
      const providerName = providerNames[button.dataset.socialProvider] || "第三方账号";
      button.setAttribute(
        "aria-label",
        button.dataset.socialProvider === "guest"
          ? "以访客身份登录"
          : `使用 ${providerName}${isLogin ? "登录" : "注册"}`
      );
    });

    splashSequence("neutral");

    if (options.focus !== false) {
      scope.timeout(() => {
        (isLogin ? loginAccount : registerAccount).focus({ preventScroll: true });
      }, reducedMotion.matches ? 0 : 180);
    }
  };

  const validateLogin = () => {
    let valid = true;
    const account = loginAccount.value.trim();
    clearFieldError(loginAccount);
    clearFieldError(loginPassword);

    if (!account) {
      setFieldError(loginAccount, "请输入账号或邮箱。");
      valid = false;
    }

    if (!loginPassword.value) {
      setFieldError(loginPassword, "请输入密码。");
      valid = false;
    }

    return valid;
  };

  const validateRegistration = () => {
    let valid = true;
    const account = registerAccount.value.trim();
    const accountPattern = /^[A-Za-z0-9_]+$/;
    [registerAccount, registerPassword, registerConfirm].forEach(clearFieldError);

    if (account.length < 4 || account.length > 20) {
      setFieldError(registerAccount, "账号长度应为 4–20 个字符。");
      valid = false;
    } else if (!accountPattern.test(account)) {
      setFieldError(registerAccount, "仅可使用英文字母、数字或下划线。");
      valid = false;
    }

    if (registerPassword.value.length < 10 || registerPassword.value.length > 128 || !/[A-Za-z]/.test(registerPassword.value) || !/[0-9]/.test(registerPassword.value)) {
      setFieldError(registerPassword, "密码需为 10–128 个字符，包含字母和数字。");
      valid = false;
    }

    if (!registerConfirm.value) {
      setFieldError(registerConfirm, "请再次输入密码。");
      valid = false;
    } else if (registerPassword.value !== registerConfirm.value) {
      setFieldError(registerConfirm, "两次输入的密码不一致。");
      valid = false;
    }

    return valid;
  };

  const firstInvalidInput = () =>
    form.querySelector(`${mode === "login" ? "#login-fields" : "#register-fields"} [aria-invalid='true']`);

  const normalizeResult = (result, fallbackMessage) => {
    if (!result || typeof result !== "object") {
      return { ok: false, message: fallbackMessage, redirectTo: "" };
    }

    return {
      ok: result.ok === true,
      message: typeof result.message === "string" ? result.message : "",
      redirectTo: typeof result.redirectTo === "string" ? result.redirectTo : ""
    };
  };

  const finishResult = async (result, token, context) => {
    if (token !== runToken) return;

    if (!result.ok) {
      stage.dataset.result = "error";
      formStatus.textContent = result.message || "操作失败，请检查填写内容。";
      splashSequence("error");
      setBusy(false);
      return;
    }

    stage.dataset.result = "success";
    formStatus.textContent = result.message || (context === "register"
      ? "账号创建成功，现在可以登录了。"
      : "登录成功，欢迎回来。");
    splashSequence("success");

    await wait(reducedMotion.matches ? 250 : 1150);
    if (token !== runToken) return;

    if (result.redirectTo) {
      window.location.assign(result.redirectTo);
      return;
    }

    if (context === "register") {
      const newAccount = registerAccount.value.trim();
      loginAccount.value = newAccount;
      registerPassword.value = "";
      registerConfirm.value = "";
      updateMode("login", { focus: false });
      formStatus.textContent = "账号创建成功，请使用新账号登录。";
      scope.timeout(() => loginPassword.focus({ preventScroll: true }), reducedMotion.matches ? 0 : 160);
      return;
    }

    setBusy(false);
  };

  const submitCredentials = async () => {
    if (busy) return;

    const valid = mode === "login" ? validateLogin() : validateRegistration();
    if (!valid) {
      stage.dataset.result = "error";
      formStatus.textContent = "请检查并完善标出的内容。";
      splashSequence("error");
      firstInvalidInput()?.focus({ preventScroll: true });
      return;
    }

    clearFeedback();
    setBusy(true);
    stage.dataset.result = "loading";
    formStatus.textContent = mode === "login" ? "正在登录…" : "正在创建账号…";
    const token = ++runToken;

    try {
      const rawResult = mode === "login"
        ? await authHandler({
          identifier: loginAccount.value.trim(),
          password: loginPassword.value,
          remember: rememberLogin.checked
        })
        : await registerHandler({
          username: registerAccount.value.trim(),
          password: registerPassword.value,
          confirmPassword: registerConfirm.value
        });

      const result = normalizeResult(rawResult, mode === "login"
        ? "登录失败，请重试。"
        : "注册失败，请重试。");
      await finishResult(result, token, mode);
    } catch {
      await finishResult({
        ok: false,
        message: "连接中断，请稍后重试。",
        redirectTo: ""
      }, token, mode);
    }
  };

  scope.listen(form, "submit", (event) => {
    event.preventDefault();
    submitCredentials();
  });

  scope.listen(modeSwitch, "click", () => {
    updateMode(mode === "login" ? "register" : "login");
  });

  scope.listen(forgotPassword, "click", () => {
    stage.dataset.result = "idle";
    formStatus.textContent = "请使用已绑定的平台登录后重设密码；无法登录时，请联系站点管理员核验账号。";
    lookAtElement(forgotPassword);
    splashAtElement(forgotPassword, 0.5, 0.7);
  });

  socialActions.forEach((button) => {
    scope.listen(button, "click", async () => {
      if (busy) return;

      const provider = button.dataset.socialProvider;
      const providerName = providerNames[provider] || "第三方账号";
      clearFeedback();
      setBusy(true);
      stage.dataset.result = "loading";
      formStatus.textContent = `正在连接 ${providerName}…`;
      const token = ++runToken;

      try {
        const handler = handlers.social;
        const result = normalizeResult(
          await handler({ mode: provider === "guest" ? "login" : mode, provider }),
          `无法完成 ${providerName} 登录。`
        );
        await finishResult(result, token, "social");
      } catch {
        await finishResult({
          ok: false,
          message: `${providerName} 登录连接中断，请重试。`,
          redirectTo: ""
        }, token, "social");
      }
    });
  });

  revealButtons.forEach((button) => {
    scope.listen(button, "click", () => {
      const input = root.getElementById(button.dataset.passwordTarget);
      const willShow = input.type === "password";
      input.type = willShow ? "text" : "password";
      button.setAttribute("aria-pressed", String(willShow));
      button.setAttribute("aria-label", willShow ? "隐藏密码" : "显示密码");
      updatePasswordState();
      lookAtElement(input, 0.16);

      splashAtElement(orangePal, 0.62, 0.94);
      input.focus({ preventScroll: true });
    });
  });

  inputs.forEach((input) => {
    scope.listen(input, "focus", () => {
      stage.dataset.focus = (input.id.includes("account") || input.id.includes("email")) ? "account" : "password";
      lookAtElement(input, 0.16);

      const now = performance.now();
      if (now - lastFocusSplash > 420) {
        splashAtElement(palGroup, 0.52, 0.92);
        lastFocusSplash = now;
      }
    });

    scope.listen(input, "input", () => {
      clearFieldError(input);
      if (stage.dataset.result === "error") {
        stage.dataset.result = "idle";
        formStatus.textContent = "";
      }
      if (input === registerPassword && registerConfirm.value) {
        clearFieldError(registerConfirm);
      }
    });
  });

  scope.listen(form, "focusout", () => {
    scope.timeout(() => {
      if (!form.contains(root.activeElement) || root.activeElement.tagName !== "INPUT") {
        stage.dataset.focus = "none";
        queuePointerLook(latestPointer.x, latestPointer.y);
      }
    }, 0);
  });

  scope.listen(window, "pointermove", (event) => {
    queuePointerLook(event.clientX, event.clientY);
  }, { passive: true });

  scope.listen(window, "resize", () => {
    invalidatePalCenters();
    queuePointerLook(latestPointer.x, latestPointer.y);
  }, { passive: true });

  if (authShell) scope.listen(authShell, "animationend", () => {
    invalidatePalCenters();
    queuePointerLook(latestPointer.x, latestPointer.y);
  }, { once: true });

  if ("ResizeObserver" in window && palGroup) {
    const palResizeObserver = new ResizeObserver(() => {
      invalidatePalCenters();
    });
    palResizeObserver.observe(palGroup);
    scope.onDispose(() => palResizeObserver.disconnect());
  }

  scope.listen(document, "keydown", (event) => {
    if (event.key === "Escape" && !stage.hidden) {
      concealPasswords();
      stage.dataset.focus = "none";
      formStatus.textContent = "";
      root.activeElement?.blur();
    }
  });

  scope.onDispose(() => { runToken += 1; });
  updateMode("login", { focus: false });

  pointPalsAt(latestPointer.x, latestPointer.y);
  scope.timeout(() => splashSequence("neutral"), reducedMotion.matches ? 80 : 540);
}
