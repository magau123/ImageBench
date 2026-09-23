"use client";

import { useState } from "react";
import { Film, ImageIcon, Sparkles } from "lucide-react";
import { BenchWorkbench } from "./BenchWorkbench";
import { VideoWorkbench } from "./VideoWorkbench";

export function StudioApp() {
  const [mode, setMode] = useState<"image" | "video">("image");

  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      <header className="border-b border-black/10 bg-[#101b18] text-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div>
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="h-5 w-5 text-[#b8f55b]" /> ImageBench
            </div>
            <p className="mt-1 text-xs text-white/55">
              多模型图像与视频生成对比工作台
            </p>
          </div>

          <nav className="flex rounded-xl border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setMode("image")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition ${
                mode === "image"
                  ? "bg-[#b8f55b] font-semibold text-[#172313]"
                  : "text-white/65 hover:text-white"
              }`}
            >
              <ImageIcon className="h-4 w-4" /> 图像测评
            </button>
            <button
              onClick={() => setMode("video")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition ${
                mode === "video"
                  ? "bg-[#b8f55b] font-semibold text-[#172313]"
                  : "text-white/65 hover:text-white"
              }`}
            >
              <Film className="h-4 w-4" /> 视频测评
            </button>
          </nav>

          <div className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/65">
            BYOK · 密钥仅保存在当前浏览器会话
          </div>
        </div>
      </header>

      {mode === "image" ? (
        <BenchWorkbench showHeader={false} />
      ) : (
        <VideoWorkbench />
      )}
    </div>
  );
}
