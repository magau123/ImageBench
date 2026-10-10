export type ProviderKey =
  | "openai"
  | "custom"
  | "replicate"
  | "fireworks"
  | "vertex"
  | "dashscope"
  | "nanobanana"
  | "seedream"
  | "agnes";

export interface ProviderDefinition {
  displayName: string;
  defaultModel: string;
  models: string[];
  iconPath: string;
  color: string;
  needsBaseUrl?: boolean;
  defaultBaseUrl?: string;
  envHint?: string;
}

export const PROVIDERS: Record<ProviderKey, ProviderDefinition> = {
  openai: {
    displayName: "OpenAI",
    defaultModel: "gpt-image-1",
    models: ["gpt-image-1", "dall-e-3", "dall-e-2"],
    iconPath: "/provider-icons/openai.svg",
    color: "from-blue-500 to-cyan-500",
    envHint: "OPENAI_API_KEY",
  },
  custom: {
    displayName: "OpenAI 兼容 / NewAPI",
    defaultModel: "gpt-image-2.5",
    models: [
      "gpt-image-2.5",
      "gpt-image-2",
      "gpt-image-1.5",
      "gpt-image-1",
      "gemini-2.5-flash-image",
    ],
    iconPath: "/provider-icons/openai.svg",
    color: "from-slate-500 to-zinc-700",
    needsBaseUrl: true,
    defaultBaseUrl: "https://apinebula.ai/v1",
  },
  replicate: {
    displayName: "Replicate",
    defaultModel: "black-forest-labs/flux-1.1-pro",
    models: [
      "black-forest-labs/flux-1.1-pro",
      "black-forest-labs/flux-schnell",
      "recraft-ai/recraft-v3",
    ],
    iconPath: "/provider-icons/replicate.svg",
    color: "from-purple-500 to-blue-500",
    envHint: "REPLICATE_API_TOKEN",
  },
  fireworks: {
    displayName: "Fireworks",
    defaultModel: "accounts/fireworks/models/flux-1-dev-fp8",
    models: [
      "accounts/fireworks/models/flux-1-dev-fp8",
      "accounts/fireworks/models/flux-1-schnell-fp8",
    ],
    iconPath: "/provider-icons/fireworks.svg",
    color: "from-orange-500 to-red-500",
    envHint: "FIREWORKS_API_KEY",
  },
  vertex: {
    displayName: "Google Vertex AI",
    defaultModel: "imagen-3.0-generate-001",
    models: ["imagen-3.0-generate-001", "imagen-3.0-fast-generate-001"],
    iconPath: "/provider-icons/vertex.svg",
    color: "from-green-500 to-emerald-500",
    envHint: "GOOGLE_VERTEX_*",
  },
  dashscope: {
    displayName: "阿里云百炼 · 千问生图",
    defaultModel: "qwen-image-3.0-pro",
    models: [
      "qwen-image-3.0-pro",
      "qwen-image-3.0",
      "qwen-image-2.0-pro",
      "qwen-image-2.0",
      "qwen-image-plus",
      "qwen-image",
    ],
    iconPath: "/provider-icons/dashscope.svg",
    color: "from-orange-500 to-amber-500",
    envHint: "DASHSCOPE_API_KEY",
  },
  nanobanana: {
    displayName: "NanoBanana · APINebula 中转",
    defaultModel: "gemini-3.1-flash-image",
    models: [
      "gemini-3.1-flash-image",
      "gemini-3-pro-image-preview",
      "gemini-2.5-flash-image",
      "gemini-3.1-flash-image-preview",
      "gemini-2.5-flash-image-preview",
    ],
    iconPath: "/provider-icons/vertex.svg",
    color: "from-yellow-400 to-amber-500",
    envHint: "NANOBANANA_API_KEY",
  },
  seedream: {
    displayName: "豆包 Seedream · 火山方舟",
    defaultModel: "doubao-seedream-5-0-pro-260628",
    models: ["doubao-seedream-5-0-pro-260628", "doubao-seedream-5-0-flash-260915"],
    iconPath: "/provider-icons/dashscope.svg",
    color: "from-sky-500 to-indigo-500",
    envHint: "ARK_API_KEY",
  },
  agnes: {
    displayName: "Agnes AI · 生图",
    defaultModel: "agnes-image-2.5-flash",
    models: [
      "agnes-image-2.5-flash",
      "agnes-image-2.1-flash",
      "agnes-image-2.0-flash",
    ],
    iconPath: "/provider-icons/openai.svg",
    color: "from-violet-500 to-fuchsia-500",
    needsBaseUrl: true,
    defaultBaseUrl: "https://api.agnes-ai.cn/v1",
    envHint: "AGNES_API_KEY",
  },
};

const KEY_STORE = "image-bench-keys";

export const loadSavedKeys = (): Record<string, string> => {
  if (typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY_STORE) ?? "{}");
  } catch {
    return {};
  }
};

// Clearing the input removes the saved key; otherwise keys persist until browser data is cleared.
export const saveKey = (provider: string, value: string) => {
  const keys = loadSavedKeys();
  if (value) keys[provider] = value;
  else delete keys[provider];
  localStorage.setItem(KEY_STORE, JSON.stringify(keys));
};

export interface ModelSlot {
  id: string;
  provider: ProviderKey;
  modelId: string;
  apiKey: string;
  baseUrl: string;
}

export const createSlot = (
  id: string,
  provider: ProviderKey = "custom",
): ModelSlot => ({
  id,
  provider,
  modelId: PROVIDERS[provider].defaultModel,
  apiKey: loadSavedKeys()[provider] ?? "",
  baseUrl: PROVIDERS[provider].defaultBaseUrl ?? "",
});

// Backward-compatible exports retained for the upstream demo components.
export type ModelMode = "performance" | "quality";
export const PROVIDER_ORDER = Object.keys(PROVIDERS) as ProviderKey[];
export const MODEL_CONFIGS: Record<ModelMode, Record<ProviderKey, string>> = {
  performance: Object.fromEntries(
    PROVIDER_ORDER.map((key) => [key, PROVIDERS[key].defaultModel]),
  ) as Record<ProviderKey, string>,
  quality: Object.fromEntries(
    PROVIDER_ORDER.map((key) => [key, PROVIDERS[key].defaultModel]),
  ) as Record<ProviderKey, string>,
};
export const initializeProviderRecord = <T,>(defaultValue?: T) =>
  Object.fromEntries(
    PROVIDER_ORDER.map((key) => [key, defaultValue]),
  ) as Record<ProviderKey, T>;
