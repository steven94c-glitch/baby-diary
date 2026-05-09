import type { MetadataRoute } from "next";

const babyName = process.env.BABY_NAME ?? "Baby";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${babyName}'s Diary`,
    short_name: babyName,
    description: `A little corner of the internet for ${babyName}.`,
    start_url: "/",
    display: "standalone",
    background_color: "#f7f1e5",
    theme_color: "#a8b498",
    icons: [
      { src: "/icon", sizes: "192x192", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
