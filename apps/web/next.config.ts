import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/documents/:path*',
        destination: process.env.DOCUMENT_SERVICE_URL
          ? `${process.env.DOCUMENT_SERVICE_URL}/api/documents/:path*`
          : 'http://localhost:4002/api/documents/:path*',
      },
      {
        source: '/api/:path*',
        destination: process.env.API_URL 
          ? `${process.env.API_URL}/api/:path*` 
          : 'http://localhost:4001/api/:path*',
      },
    ];
  },
};

export default nextConfig;
