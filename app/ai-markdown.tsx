import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

type AiMarkdownProps = {
  text: string;
};

export default function AiMarkdown({ text }: AiMarkdownProps) {
  return <div className="ai-markdown"><Markdown remarkPlugins={[remarkGfm]} skipHtml>{text}</Markdown></div>;
}
