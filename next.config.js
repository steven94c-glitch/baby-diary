/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/babydiary",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  async redirects() {
    return [
      // Send bare-root visits to the diary so the domain isn't a dead 404
      { source: "/", destination: "/babydiary", permanent: false, basePath: false },
    ];
  },
};

module.exports = nextConfig;
