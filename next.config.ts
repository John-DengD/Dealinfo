import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 独立输出:生成自包含的 .next/standalone,便于部署到服务器直接 node 运行
  output: "standalone",
};

export default nextConfig;
