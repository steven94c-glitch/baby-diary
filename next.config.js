/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/babydiary",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

module.exports = nextConfig;
