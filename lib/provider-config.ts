export type ProviderKey =
  | "openai"
  | "custom"
  | "replicate"
  | "fireworks"
  | "vertex"
  | "dashscope";

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
  apiKey: "",
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
