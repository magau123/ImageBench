export type VideoProviderKey = "dashscope" | "seedance" | "agnes";

export type VideoResolution = "720P" | "1080P";
export type VideoRatio = "16:9" | "9:16" | "1:1";

export interface VideoProviderDefinition {
  displayName: string;
  defaultModel: string;
  models: string[];
  envHint: string;
  docsUrl: string;
  docsLabel: string;
  needsBaseUrl?: boolean;
  defaultBaseUrl?: string;
}

export const VIDEO_PROVIDERS: Record<VideoProviderKey, VideoProviderDefinition> = {
  dashscope: {
    displayName: "阿里云百炼 · 万相视频",
    defaultModel: "wan3.0-video",
    models: [
      "wan3.0-video",
      "wan2.7-t2v",
      "wan2.7-t2v-2026-06-12",
      "wan2.6-t2v",
    ],
    envHint: "DASHSCOPE_API_KEY",
    docsUrl: "https://help.aliyun.com/zh/model-studio/text-to-video-guide",
    docsLabel: "百炼文生视频文档",
  },
  seedance: {
    displayName: "豆包 Seedance · 火山方舟",
    defaultModel: "doubao-seedance-1-0-pro-250528",
    models: [
      "doubao-seedance-1-0-pro-250528",
      "doubao-seedance-1-0-pro-fast-250528",
      "doubao-seedance-2-0-fast-260128",
    ],
    envHint: "ARK_API_KEY",
    docsUrl: "https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey",
    docsLabel: "获取火山方舟 API Key",
  },
  agnes: {
    displayName: "Agnes AI · 生视频",
    defaultModel: "agnes-video-2.5-flash",
    models: ["agnes-video-2.5-flash", "agnes-video-2.5"],
    envHint: "AGNES_API_KEY",
    needsBaseUrl: true,
    defaultBaseUrl: "https://api.agnes-ai.cn/v1",
    docsUrl: "https://wiki.agnes-ai.cn/zh-Hans/docs/agnes-video-25-flash",
    docsLabel: "Agnes Video 接入文档",
  },
};

/** @deprecated use VIDEO_PROVIDERS.dashscope.models */
export const VIDEO_MODELS = VIDEO_PROVIDERS.dashscope.models;

export interface VideoSlot {
  id: string;
  provider: VideoProviderKey;
  modelId: string;
  apiKey: string;
  baseUrl: string;
}

// Seedance shares the Ark key with Seedream image generation.
export const videoKeyStoreId = (provider: VideoProviderKey) =>
  provider === "seedance" ? "seedream" : provider;

export const createVideoSlot = (
  id: string,
  provider: VideoProviderKey = "dashscope",
  apiKey = "",
): VideoSlot => {
  const definition = VIDEO_PROVIDERS[provider];
  return {
    id,
    provider,
    modelId: definition.defaultModel,
    apiKey,
    baseUrl: definition.defaultBaseUrl ?? "",
  };
};

export const buildVideoParameters = (
  modelId: string,
  resolution: VideoResolution,
  ratio: VideoRatio,
  duration: number,
) => {
  const modernProtocol =
    modelId.startsWith("wan3.") || modelId.startsWith("wan2.7");
  if (modernProtocol) {
    return {
      resolution,
      ratio,
      duration,
      prompt_extend: false,
      watermark: false,
    };
  }

  const sizes = {
    "720P": {
      "16:9": "1280*720",
      "9:16": "720*1280",
      "1:1": "960*960",
    },
    "1080P": {
      "16:9": "1920*1080",
      "9:16": "1080*1920",
      "1:1": "1440*1440",
    },
  } as const;

  return {
    size: sizes[resolution][ratio],
    duration,
    prompt_extend: true,
    shot_type: "multi",
    watermark: false,
  };
};
