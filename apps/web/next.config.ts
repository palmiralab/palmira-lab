import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Минимальная сборка для Docker: .next/standalone с готовым server.js.
  output: "standalone",
};

export default nextConfig;
