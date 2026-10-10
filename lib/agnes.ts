/** China site default; intl keys need https://apihub.agnes-ai.com/v1 */
export const AGNES_DEFAULT_BASE_URL = "https://api.agnes-ai.cn/v1";

export const normalizeAgnesApiKey = (raw?: string) => {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return "";
  return trimmed.replace(/^Bearer\s+/i, "").trim();
};

export const resolveAgnesBaseUrl = (override?: string) => {
  const base = (
    override?.trim() ||
    process.env.AGNES_BASE_URL ||
    AGNES_DEFAULT_BASE_URL
  ).replace(/\/+$/, "");
  return base;
};

export const agnesPollOrigin = (baseUrl?: string) => {
  const normalized = resolveAgnesBaseUrl(baseUrl);
  const withPath = normalized.endsWith("/v1") ? normalized : `${normalized}/v1`;
  return new URL(withPath).origin;
};

export const agnesImageEndpoint = (baseUrl?: string) =>
  `${resolveAgnesBaseUrl(baseUrl)}/images/generations`;

export const agnesVideoCreateEndpoint = (baseUrl?: string) =>
  `${resolveAgnesBaseUrl(baseUrl)}/videos`;

export const agnesVideoPollUrl = (
  baseUrl: string | undefined,
  videoId: string,
  modelId: string,
) =>
  `${agnesPollOrigin(baseUrl)}/agnesapi?video_id=${encodeURIComponent(videoId)}&model_name=${encodeURIComponent(modelId)}`;

export const agnesAuthErrorHint =
  "若 Key 来自 platform.agnes-ai.com 国际站，请将 Base URL 改为 https://apihub.agnes-ai.com/v1；国内站 Key 使用默认 https://api.agnes-ai.cn/v1。";

export const parseAgnesError = (
  data: {
    detail?: string;
    message?: string;
    error?: { message?: string } | string | null;
  },
  status: number,
) => {
  const core =
    data.detail ||
    data.message ||
    (typeof data.error === "string"
      ? data.error
      : data.error && typeof data.error === "object"
        ? data.error.message
        : undefined) ||
    `Agnes 请求失败 (${status})`;
  if (
    status === 401 ||
    /无效.*令牌|invalid.*token|unauthorized/i.test(core)
  ) {
    return `${core} ${agnesAuthErrorHint}`;
  }
  return core;
};
