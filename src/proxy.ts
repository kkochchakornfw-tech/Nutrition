import { NextResponse, type NextRequest } from "next/server";

/**
 * [security] Content-Security-Policy แบบ nonce ต่อ request
 * Next.js แทรก inline <script> เพื่อ hydrate หน้าเว็บ (RSC payload/bootstrap) — ถ้าตั้ง
 * script-src 'self' เฉยๆ เบราว์เซอร์จะบล็อก inline script เหล่านั้น หน้าเว็บเลยไม่ hydrate
 * (ปุ่ม login กดแล้วไม่ทำงาน) จึงต้องให้ Next ติด nonce ให้ script ของมันเอง
 * ห้ามใส่ upgrade-insecure-requests: ระบบนี้ deploy บน HTTP ในวง LAN ซึ่งจะทำให้โหลด asset ไม่ได้
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const csp = [
    "default-src 'self'",
    // dev: React ใช้ eval สร้าง stack ตอน debug; production ไม่ต้องใช้
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // inline style attribute ที่ Next.js/Tailwind แทรกตอน render
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // ข้าม API, ไฟล์ static และ prefetch — ไม่ต้องใช้ CSP ของหน้า
      source: "/((?!api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|manifest.webmanifest).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
