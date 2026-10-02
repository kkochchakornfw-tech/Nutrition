import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // อนุญาตให้เปิด dev server ผ่าน IP ในวง LAN (ไม่ใช่แค่ localhost) — ใช้เฉพาะตอน dev
  allowedDevOrigins: [
    "172.16.22.131",
    "172.16.*.*",
    "192.168.*.*",
    "10.161.104.22",
  ],

  // [security] HTTP security headers — ใส่ไว้ที่นี่แทน middleware เพราะเป็นค่าคงที่
  // ไม่ต้องคำนวณต่อ request ครอบคลุมทุก route รวมถึงไฟล์ static
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // กันเว็บอื่นฝัง iframe ของเราไปทำ clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // กันเบราว์เซอร์เดา content-type เอง (MIME sniffing) จนรันไฟล์ที่ไม่ควรรันเป็นสคริปต์
          { key: "X-Content-Type-Options", value: "nosniff" },
          // ไม่ส่ง URL เต็มไปเป็น Referer ตอนลิงก์ออกไปเว็บอื่น (URL อาจมี HN ผู้ป่วยติดไปด้วย)
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // ปิดสิทธิ์เข้าถึงฮาร์ดแวร์ที่แอปนี้ไม่ได้ใช้เลย
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // Content-Security-Policy ตั้งใน src/proxy.ts เพราะต้องใช้ nonce ต่อ request
        ],
      },
    ];
  },
};

export default nextConfig;
