const BRAVE_WEB_SEARCH_ENDPOINT = "https://api.search.brave.com/res/v1/web/search";
const SEARCH_TIMEOUT_MS = 12_000;
const MAX_SEARCH_RESULTS = 6;

export type WebSearchSource = {
  id: number;
  title: string;
  url: string;
  description: string;
  publishedAt?: string;
};

type BraveSearchResponse = {
  web?: {
    results?: Array<{
      title?: string;
      url?: string;
      description?: string;
      age?: string;
      page_age?: string;
    }>;
  };
};

export class WebSearchError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
  }
}

function cleanSearchText(value: unknown, maxLength: number): string {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function safePublicUrl(value: unknown): string | null {
  try {
    const url = new URL(String(value || ""));
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    url.username = "";
    url.password = "";
    return url.toString();
  } catch {
    return null;
  }
}

function normalizeSearchQuery(query: string): string {
  return query
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 45)
    .join(" ")
    .slice(0, 360);
}

export async function searchWeb(
  query: string,
  apiKey: string | undefined,
  parentSignal?: AbortSignal,
): Promise<WebSearchSource[]> {
  if (!apiKey) {
    throw new WebSearchError("联网搜索尚未配置，请在服务端设置 BRAVE_SEARCH_API_KEY", 503);
  }

  const normalizedQuery = normalizeSearchQuery(query);
  if (!normalizedQuery) {
    throw new WebSearchError("请输入需要检索的内容", 400);
  }

  const controller = new AbortController();
  const abortFromParent = () => controller.abort();
  parentSignal?.addEventListener("abort", abortFromParent, { once: true });
  const timeoutId = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

  try {
    const endpoint = new URL(BRAVE_WEB_SEARCH_ENDPOINT);
    endpoint.searchParams.set("q", normalizedQuery);
    endpoint.searchParams.set("count", String(MAX_SEARCH_RESULTS));
    endpoint.searchParams.set("search_lang", "zh-hans");
    endpoint.searchParams.set("safesearch", "moderate");
    endpoint.searchParams.set("spellcheck", "1");

    const response = await fetch(endpoint, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": apiKey,
      },
    });

    if (!response.ok) {
      const messages: Record<number, string> = {
        401: "联网搜索密钥无效或已过期",
        403: "联网搜索服务拒绝了当前请求",
        422: "搜索关键词格式无效",
        429: "联网搜索请求过于频繁，请稍后重试",
      };
      throw new WebSearchError(messages[response.status] || "联网搜索服务暂时不可用", 502);
    }

    const data = (await response.json()) as BraveSearchResponse;
    const seenUrls = new Set<string>();
    const sources: WebSearchSource[] = [];

    for (const result of data.web?.results || []) {
      const url = safePublicUrl(result.url);
      const title = cleanSearchText(result.title, 180);
      if (!url || !title || seenUrls.has(url)) continue;
      seenUrls.add(url);
      sources.push({
        id: sources.length + 1,
        title,
        url,
        description: cleanSearchText(result.description, 720),
        publishedAt: cleanSearchText(result.page_age || result.age, 80) || undefined,
      });
      if (sources.length >= MAX_SEARCH_RESULTS) break;
    }

    if (!sources.length) {
      throw new WebSearchError("没有检索到可用的网页来源，请调整关键词后重试", 404);
    }

    return sources;
  } catch (error) {
    if (error instanceof WebSearchError) throw error;
    if (controller.signal.aborted) {
      throw new WebSearchError("联网搜索响应超时，请稍后重试", 504);
    }
    throw new WebSearchError("联网搜索服务暂时不可用", 502);
  } finally {
    clearTimeout(timeoutId);
    parentSignal?.removeEventListener("abort", abortFromParent);
  }
}

export function buildSearchEvidence(sources: WebSearchSource[]): string {
  return sources.map((source) => [
    `[${source.id}] ${source.title}`,
    `URL: ${source.url}`,
    source.publishedAt ? `时间信息: ${source.publishedAt}` : "",
    `摘要: ${source.description || "（搜索结果未提供摘要）"}`,
  ].filter(Boolean).join("\n")).join("\n\n");
}
