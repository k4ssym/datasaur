/** @type {import('next').NextConfig} */

// When NEXT_STATIC_EXPORT=true (Docker build):
//   • output: 'export' — generates static HTML/CSS/JS in out/
//   • No proxy API routes needed; frontend calls FastAPI directly
// When not set (local dev):
//   • Normal Next.js dev server with API proxy routes
const isStaticExport = process.env.NEXT_STATIC_EXPORT === "true";

const nextConfig = {
  ...(isStaticExport
    ? {
        output: "export",
        trailingSlash: true,
        // Required for static export — disable Next.js image optimization
        images: { unoptimized: true },
      }
    : {
        // Dev: proxy /api/backend/* → FastAPI
        async rewrites() {
          return [
            {
              source: "/api/backend/:path*",
              destination: `${process.env.BACKEND_URL ?? "http://localhost:8080"}/:path*`,
            },
          ];
        },
      }),
};

export default nextConfig;
