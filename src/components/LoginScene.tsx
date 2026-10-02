/**
 * ภาพประกอบด้านซ้ายของหน้า login — ธีมโภชนาการ ใช้เฉพาะจอกว้าง (lg ขึ้นไป)
 *
 * เรื่องราวสั้น ๆ ของโมชัน: จานเปล่าปรากฏขึ้นก่อน (setup) → ข้าว ผัก โปรตีน
 * บินเข้าตามแนวโค้งคนละทิศ (action) → เบอร์รี่ตกแต่งเด้งเข้าเป็นชิ้นสุดท้าย (payoff)
 * → ไอน้ำลอยเบา ๆ และเบอร์รี่ขยิบเป็นระยะ ๆ (idle) ทุกจังหวะกำหนดด้วย CSS keyframes
 * ใน globals.css (คำนำหน้า login-) และปิดอัตโนมัติเมื่อผู้ใช้ตั้งค่าลดการเคลื่อนไหว
 */
export function LoginScene() {
  return (
    <div className="relative hidden h-full flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-12 py-12 text-white lg:flex">
      {/* พื้นหลังบลอบสีเบลอ ๆ ลอยช้า ๆ (ambient ชั้นหลังสุด) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="login-blob absolute -left-24 -top-24 h-80 w-80 rounded-full bg-lime-300/25 blur-3xl" />
        <div
          className="login-blob absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-amber-300/20 blur-3xl"
          style={{ animationDelay: "-8s" }}
        />
      </div>

      {/* โลโก้ */}
      <div className="login-logo-in relative flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur-sm">
          <BowlMark className="h-6 w-6" />
        </span>
        <span className="font-display text-lg font-semibold tracking-wide">ระบบประเมินภาวะโภชนาการ</span>
      </div>

      {/* ฉาก: จานอาหารประกอบตัว */}
      <div aria-hidden="true" className="relative flex flex-1 items-center justify-center">
        <PlateScene className="h-64 w-64 drop-shadow-[0_18px_40px_rgba(0,0,0,0.25)]" />
      </div>

      {/* ข้อความหลัก */}
      <div className="login-fade-up relative max-w-sm" style={{ animationDelay: "0.75s" }}>
        <h1 className="font-display text-3xl font-bold leading-tight">
          ดูแลโภชนาการผู้ป่วย
          <br />
          อย่างเป็นระบบ
        </h1>
        <p className="mt-3 text-sm text-emerald-50">
          ประเมินภาวะโภชนาการ คำนวณพลังงานและสารอาหาร พร้อมติดตามประวัติผู้ป่วยได้ในที่เดียว
        </p>
      </div>
    </div>
  );
}

/** โลโก้ย่อรูปชามสำหรับหัวข้อ (คนละองค์ประกอบกับ /icons/logo.png ที่ใช้ในแท็บ/navbar) */
function BowlMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 11h18a9 6 0 0 1-18 0Z" />
      <path d="M7 11c0-2 1-4 2-5M12 11c0-2.5 1-5 2-6M17 11c0-2 .5-3.5 1.5-5" />
    </svg>
  );
}

function PlateScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="login-plate-shade" cx="0.5" cy="0.42" r="0.6">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f4f4f3" />
        </radialGradient>
      </defs>

      {/* ไอน้ำ (ambient) — วาดไว้หลังจาน ให้ลอยผ่านด้านหลังของเข้า */}
      <g className="text-white/70">
        <path
          className="login-steam"
          style={{ "--steam-delay": "1000ms", "--steam-dur": "2600ms", transformOrigin: "82px 46px" } as React.CSSProperties}
          d="M82 60 Q76 50 82 42 Q88 34 82 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          className="login-steam"
          style={{ "--steam-delay": "1650ms", "--steam-dur": "3000ms", transformOrigin: "100px 40px" } as React.CSSProperties}
          d="M100 56 Q94 46 100 38 Q106 30 100 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          className="login-steam"
          style={{ "--steam-delay": "1250ms", "--steam-dur": "2800ms", transformOrigin: "118px 46px" } as React.CSSProperties}
          d="M118 60 Q112 50 118 42 Q124 34 118 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>

      {/* จาน — เข้าฉากก่อนเพื่อน (setup) แล้วหายใจเบา ๆ ตอนว่าง (ambient) */}
      <g className="login-plate-in">
        <g className="login-breathe" style={{ transformOrigin: "100px 108px" }}>
          <ellipse cx="100" cy="150" rx="62" ry="14" fill="#000" opacity="0.14" />
          <ellipse cx="100" cy="108" rx="86" ry="86" fill="url(#login-plate-shade)" />
          <ellipse cx="100" cy="108" rx="70" ry="70" fill="none" stroke="#e4e4e3" strokeWidth="3" />
          <ellipse cx="100" cy="108" rx="52" ry="52" fill="#fafafa" />

          {/* ข้าว — ร่วงจากด้านบน */}
          <g className="login-food-top" style={{ transformOrigin: "100px 96px" }}>
            <path
              d="M74 100c0-16 12-26 26-26s26 10 26 26c0 10-10 14-26 14s-26-4-26-14Z"
              fill="#fdf6e3"
              stroke="#e9dcb0"
              strokeWidth="2"
            />
            <circle cx="84" cy="92" r="3" fill="#f3e3ad" />
            <circle cx="97" cy="86" r="3" fill="#f3e3ad" />
            <circle cx="112" cy="93" r="3" fill="#f3e3ad" />
          </g>

          {/* ผัก — ไถลจากซ้าย */}
          <g className="login-food-left" style={{ transformOrigin: "70px 118px" }}>
            <path d="M56 122c2-14 14-22 24-18 6 10 2 22-10 26-10 3-16-1-14-8Z" fill="#4ade80" />
            <path d="M66 106c8-6 18-4 22 4-4 8-14 10-22 6-4-2-4-7 0-10Z" fill="#22c55e" />
          </g>

          {/* โปรตีน/ไข่ — ไถลจากขวา */}
          <g className="login-food-right" style={{ transformOrigin: "132px 118px" }}>
            <ellipse cx="132" cy="122" rx="18" ry="12" fill="#fb923c" />
            <circle cx="132" cy="120" r="7" fill="#fde68a" stroke="#f6c744" strokeWidth="1.5" />
          </g>

          {/* เบอร์รี่ตกแต่ง — มาสุดท้าย เด้งเด่นกว่าเพื่อน */}
          <g className="login-food-berry" style={{ transformOrigin: "124px 134px" }}>
            <circle cx="121" cy="132" r="5.5" fill="#6366f1" />
            <circle cx="130" cy="136" r="5" fill="#818cf8" />
            <circle cx="124" cy="140" r="4.5" fill="#4f46e5" />
          </g>
        </g>
      </g>
    </svg>
  );
}
