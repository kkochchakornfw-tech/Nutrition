import type { MetadataRoute } from "next";

/** ใช้เมื่อติดตั้งเป็นแอปบนมือถือ/เดสก์ท็อป (Add to Home Screen / Install app) */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ระบบประเมินภาวะโภชนาการ",
    short_name: "Nutrition",
    description: "Nutrition Assessment System",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#059669",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
