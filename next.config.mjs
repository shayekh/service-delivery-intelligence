/** @type {import('next').NextConfig} */
const nextConfig = {
  // Include public/assets in the serverless function bundle so fs.readFileSync
  // can access cover_bg.png and selise_logo.png for PDF generation at runtime.
  // Without this, Vercel's file-trace omits public/ from the function output.
  experimental: {
    outputFileTracingIncludes: {
      "/**": ["./public/assets/**"],
    },
  },
};

export default nextConfig;
