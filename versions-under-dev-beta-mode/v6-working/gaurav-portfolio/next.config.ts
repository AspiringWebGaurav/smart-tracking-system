import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ✅ Disable build blocking on type errors
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Ignore ESLint errors during builds (for Netlify/Vercel)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ Experimental features for Next.js 15
  experimental: {
    serverActions: {
      // Allow dynamic origins for Vercel deployment
      allowedOrigins: [
        "localhost:3000", 
        "localhost:3001",
        // Add Vercel deployment URLs dynamically
        "*.vercel.app",
        // Add your custom domain if you have one
        // "yourdomain.com"
      ],
    },
  },
};

export default nextConfig;
