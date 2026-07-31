/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: true },
};
export default nextConfig;
