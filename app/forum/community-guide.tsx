"use client";

import { useState } from "react";

const COMMUNITY_GUIDELINES = [
  "友善交流，尊重每一位成员",
  "提问时写明环境、报错与复现步骤",
  "代码示例请保留解决问题所需的上下文",
  "回答前先确认问题，避免无依据的猜测",
  "分享可复用的思路、经验与学习记录",
  "不要发布密码、密钥或其他敏感信息",
  "问题解决后及时标记为已解决",
  "避免重复发布、刷屏和无关推广",
] as const;

function GuideList({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <ol className="forum-guide-list" aria-hidden={duplicate || undefined}>
      {COMMUNITY_GUIDELINES.map((item, index) => (
        <li key={`${duplicate ? "duplicate" : "guide"}-${item}`}>
          <b aria-hidden="true">{index + 1}</b>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

export default function CommunityGuide() {
  const [paused, setPaused] = useState(false);

  return (
    <section className="forum-guide">
      <div className="forum-guide-heading">
        <h2>社区指南</h2>
        <button
          type="button"
          aria-pressed={paused}
          aria-label={paused ? "继续滚动社区指南" : "暂停滚动社区指南"}
          onClick={() => setPaused((current) => !current)}
        >
          {paused ? "继续" : "暂停"}
        </button>
      </div>
      <div
        className={`forum-guide-viewport${paused ? " is-paused" : ""}`}
        tabIndex={0}
        aria-label="社区指南，内容会向上滚动；悬停、聚焦或点击暂停按钮可暂停"
      >
        <div className="forum-guide-track">
          <GuideList />
          <GuideList duplicate />
        </div>
      </div>
    </section>
  );
}
