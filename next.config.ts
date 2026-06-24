import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 数据 = 仓库里的 markdown，构建时读取；push 到 main 后 Vercel 自动重建。
  outputFileTracingIncludes: {
    "/**": [
      "./HANDOFF.md",
      "./pipeline/**/*.md",
      "./strategy/**/*.md",
      "./prep/**/*.md",
      "./intel/**/*.md",
      "./profile/**/*.md",
      "./log/**/*.md",
      "./negotiation/**/*.md",
      "./summary/**/*.md",
      "./data/**/*.json",
    ],
  },
};

export default nextConfig;
