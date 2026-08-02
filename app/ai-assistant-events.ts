export const OPEN_AI_ASSISTANT_EVENT = "blinga:ai-assistant:open";

export function requestExistingAiAssistant() {
  if (typeof window === "undefined") return false;
  const event = new CustomEvent(OPEN_AI_ASSISTANT_EVENT, { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}
