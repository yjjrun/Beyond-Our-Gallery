/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/mockup",
  images: { unoptimized: true },
  agentRules: false,
};

export default nextConfig;
