import path from "path";
import type { NextConfig } from "next";

const apiProxyUrl = process.env.API_PROXY_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  transpilePackages: ["@ripple/shared-types"],
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiProxyUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
