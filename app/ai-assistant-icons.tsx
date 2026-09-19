import type { ReactNode } from "react";

type AiAssistantIconName =
  | "close"
  | "plus"
  | "wave"
  | "microphone"
  | "send"
  | "book"
  | "bug"
  | "chart";

type AiAssistantIconProps = {
  name: AiAssistantIconName;
  className?: string;
};

const paths: Record<AiAssistantIconName, ReactNode> = {
  close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  wave: <><path d="M4 10v4" /><path d="M8 7v10" /><path d="M12 4v16" /><path d="M16 7v10" /><path d="M20 10v4" /></>,
  microphone: <><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /></>,
  send: <><path d="M12 19V5" /><path d="m6 11 6-6 6 6" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z" /></>,
  bug: <><path d="M8 8h8v7a4 4 0 0 1-8 0z" /><path d="M9 8a3 3 0 0 1 6 0" /><path d="M4 13h4M16 13h4M5 8l3 2M19 8l-3 2M6 18l3-2M18 18l-3-2" /></>,
  chart: <><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /><path d="m4 8 5-4 5 5 6-6" /></>,
};

export default function AiAssistantIcon({ name, className }: AiAssistantIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      {paths[name]}
    </svg>
  );
}
