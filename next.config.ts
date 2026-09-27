import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Attached images/documents travel inline as data URIs (see lib/runware/request.ts).
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
