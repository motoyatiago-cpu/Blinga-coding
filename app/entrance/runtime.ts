/** Instance-owned effects: never patch browser globals or leak work into /home. */
export function createRuntime(root: ShadowRoot) {
  const controller = new AbortController();
  const timers = new Set<number>();
  const frames = new Set<number>();
  const disposers: Array<() => void> = [];
  let disposed = false;
  const visibility = () => {
    (root.host as HTMLElement).dataset.paused = String(document.hidden);
  };
  document.addEventListener("visibilitychange", visibility, { signal: controller.signal });
  visibility();
  return {
    signal: controller.signal,
    listen(target: EventTarget, type: string, listener: EventListener, options: AddEventListenerOptions = {}) {
      target.addEventListener(type, listener, { ...options, signal: controller.signal });
    },
    timeout(callback: () => void, delay = 0) {
      const id = window.setTimeout(() => { timers.delete(id); if (!disposed) callback(); }, delay);
      timers.add(id);
      return id;
    },
    frame(callback: FrameRequestCallback) {
      if (disposed) return 0;
      const id = requestAnimationFrame((time) => { frames.delete(id); if (!disposed) callback(time); });
      frames.add(id);
      return id;
    },
    cancelFrame(id: number) { cancelAnimationFrame(id); frames.delete(id); },
    onDispose(callback: () => void) { disposers.push(callback); },
    dispose() {
      if (disposed) return;
      disposed = true;
      controller.abort();
      timers.forEach(clearTimeout);
      frames.forEach(cancelAnimationFrame);
      disposers.reverse().forEach((dispose) => dispose());
      timers.clear();
      frames.clear();
    },
  };
}
