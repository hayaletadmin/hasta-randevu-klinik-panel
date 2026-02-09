import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Environment variable validation during build
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },

  // Better build output
  output: 'standalone',

  // Disable static page generation for dynamic pages
  experimental: {
    // This helps with build-time environment issues
  },
};

export default nextConfig;
