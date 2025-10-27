process.env.NEXT_DISABLE_FONT_DOWNLOADS = process.env.NEXT_DISABLE_FONT_DOWNLOADS ?? "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "**.cdninstagram.com",
      },
      {
        protocol: "https",
        hostname: "**.tiktokcdn.com",
      },
      {
        protocol: "https",
        hostname: "**.tiktokcdn-us.com",
      },
      {
        protocol: "https",
        hostname: "**.tiktokcdn-eu.com",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
    ],
  },
};

export default nextConfig;
