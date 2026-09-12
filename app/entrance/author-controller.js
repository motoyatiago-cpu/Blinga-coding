export function startAuthor(root, scope) {

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

  const createParticles = () => {
    const layer = root.querySelector(".ambient-particles");
    if (!layer) return;

    const particleSettings = [
      [4, 12, 2, 0.22, 16, -7, 18], [11, 68, 3, 0.18, 21, -13, -12],
      [18, 31, 2, 0.28, 18, -4, 10], [26, 84, 2, 0.2, 24, -16, -15],
      [34, 18, 4, 0.16, 22, -11, 16], [41, 57, 2, 0.24, 17, -8, -9],
      [49, 90, 3, 0.18, 25, -19, 12], [57, 35, 2, 0.26, 19, -6, -13],
      [64, 74, 4, 0.14, 23, -14, 18], [72, 14, 2, 0.24, 20, -9, -8],
      [79, 46, 3, 0.2, 26, -18, 14], [87, 81, 2, 0.26, 18, -5, -11],
      [94, 25, 3, 0.16, 24, -12, 10], [7, 92, 2, 0.2, 19, -10, 15],
      [22, 49, 3, 0.17, 27, -20, -12], [53, 8, 2, 0.25, 21, -15, 9],
      [69, 93, 2, 0.21, 17, -7, -14], [91, 61, 4, 0.13, 25, -17, 13]
    ];
    const fragment = document.createDocumentFragment();

    particleSettings.forEach(([x, y, size, opacity, duration, delay, drift]) => {
      const particle = document.createElement("i");
      particle.style.setProperty("--particle-x", `${x}%`);
      particle.style.setProperty("--particle-y", `${y}%`);
      particle.style.setProperty("--particle-size", `${size}px`);
      particle.style.setProperty("--particle-opacity", opacity);
      particle.style.setProperty("--particle-duration", `${duration}s`);
      particle.style.setProperty("--particle-delay", `${delay}s`);
      particle.style.setProperty("--particle-drift", `${drift}px`);
      fragment.appendChild(particle);
    });

    layer.replaceChildren(fragment);
  };

  const setupReflections = () => {
    const reflectiveElements = Array.from(root.querySelectorAll(
      ".profile-rail, .story-column, .history-rail, .timeline li, .gallery-card"
    ));

    reflectiveElements.forEach((element) => {
      let frame = 0;
      let pointerX = 0;
      let pointerY = 0;

      const updateReflection = () => {
        frame = 0;
        const rect = element.getBoundingClientRect();
        const x = clamp(((pointerX - rect.left) / rect.width) * 100, 0, 100);
        const y = clamp(((pointerY - rect.top) / rect.height) * 100, 0, 100);
        element.style.setProperty("--shine-x", `${x.toFixed(1)}%`);
        element.style.setProperty("--shine-y", `${y.toFixed(1)}%`);
      };

      scope.listen(element, "pointermove", (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        if (!frame) frame = scope.frame(updateReflection);
      }, { passive: true });

      scope.listen(element, "pointerleave", () => {
        if (frame) scope.cancelFrame(frame);
        frame = 0;
        element.style.removeProperty("--shine-x");
        element.style.removeProperty("--shine-y");
      }, { passive: true });
    });
  };

  const setupCardTilt = () => {
    const cards = Array.from(root.querySelectorAll(
      ".profile-rail, .story-column, .history-rail"
    ));

    cards.forEach((card) => {
      let frame = 0;
      let pointerX = 0;
      let pointerY = 0;

      const updateTilt = () => {
        frame = 0;
        const rect = card.getBoundingClientRect();
        const horizontal = clamp((pointerX - rect.left) / rect.width, 0, 1) - 0.5;
        const vertical = clamp((pointerY - rect.top) / rect.height, 0, 1) - 0.5;
        card.style.setProperty("--tilt-x", `${(-vertical * 2.4).toFixed(2)}deg`);
        card.style.setProperty("--tilt-y", `${(horizontal * 3.2).toFixed(2)}deg`);
      };

      scope.listen(card, "pointermove", (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        if (!frame) frame = scope.frame(updateTilt);
      }, { passive: true });

      scope.listen(card, "pointerleave", () => {
        if (frame) scope.cancelFrame(frame);
        frame = 0;
        card.style.removeProperty("--tilt-x");
        card.style.removeProperty("--tilt-y");
      }, { passive: true });
    });
  };

  const setupCursorAurora = () => {
    const aurora = root.querySelector(".cursor-aurora");
    if (!aurora) return;

    let frame = 0;
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;

    const update = () => {
      frame = 0;
      aurora.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0) translate(-50%, -50%)`;
    };

    scope.listen(document, "pointermove", (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      aurora.classList.add("is-visible");
      if (!frame) frame = scope.frame(update);
    }, { passive: true });

    scope.listen(root.host, "pointerleave", () => {
      aurora.classList.remove("is-visible");
    }, { passive: true });

    scope.listen(window, "blur", () => {
      aurora.classList.remove("is-visible");
    });
  };

  createParticles();

  if (reducedMotion.matches || !finePointer.matches) return;

  setupReflections();
  setupCardTilt();
  setupCursorAurora();
}
