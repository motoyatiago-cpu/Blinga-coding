/** Judge0 submissions may be queued even when the HTTP request succeeds. */
export type RunnerResult = {
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  status?: { id?: number; description?: string };
  time?: string | number | null;
  memory?: number | null;
  exit_code?: number | null;
  token?: string;
};

export class RunnerError extends Error {
  constructor(message: string, readonly httpStatus = 502) {
    super(message);
    this.name = "RunnerError";
  }
}

const resultFields = "stdout,stderr,compile_output,message,status,time,memory,exit_code,token";

async function readResult(response: Response): Promise<RunnerResult> {
  if (!response.ok) {
    throw new RunnerError(`代码执行服务暂时不可用（${response.status}）`);
  }
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new RunnerError("代码执行服务返回了无效结果，请稍后重试");
  }
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new RunnerError("代码执行服务返回了无效结果，请稍后重试");
  }
  const value = result as RunnerResult;
  const status = value.status?.id;
  if (status !== undefined && (!Number.isInteger(status) || status < 1)) {
    throw new RunnerError("代码执行服务返回了无效状态，请稍后重试");
  }
  for (const field of [value.stdout, value.stderr, value.compile_output, value.message]) {
    if (field != null && typeof field !== "string") {
      throw new RunnerError("代码执行服务返回了无效输出，请稍后重试");
    }
  }
  return value;
}

function waitForPoll(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, 500);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export async function runSubmission(
  baseUrl: string,
  headers: Record<string, string>,
  submission: Record<string, unknown>,
  signal: AbortSignal,
): Promise<RunnerResult> {
  signal.throwIfAborted();
  // Async submissions also work on installations that disable wait=true.
  let result = await readResult(await fetch(
    `${baseUrl}/submissions?base64_encoded=true&wait=false&fields=${resultFields}`,
    { method: "POST", headers, signal, body: JSON.stringify(submission) },
  ));
  const token = result.token;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    signal.throwIfAborted();
    if (result.status?.id && result.status.id >= 3) return result;
    if (typeof token !== "string" || !/^[a-zA-Z0-9-]{1,128}$/.test(token)) {
      throw new RunnerError("代码执行服务未返回可查询的任务，请稍后重试");
    }
    if (attempt > 0) await waitForPoll(signal);
    result = await readResult(await fetch(
      `${baseUrl}/submissions/${encodeURIComponent(token)}?base64_encoded=true&fields=${resultFields}`,
      { method: "GET", headers, signal, cache: "no-store" },
    ));
  }
  if (result.status?.id && result.status.id >= 3) return result;
  throw new RunnerError("代码执行等待超时，请稍后重试；本次未计入判题结果", 504);
}
