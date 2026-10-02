import { SGA_CRITERIA } from "@/lib/sga/data";

/**
 * แบนเนอร์หัวหน้าแบบประเมิน SGA/NAF — ภาพประกอบอาหารบนโต๊ะไม้ (SVG) + การ์ดกระจกฝ้า
 * ข้อมูลในการ์ดดึงจากเกณฑ์จริงของแบบฟอร์ม ไม่ใช่ตัวเลขสมมติ
 */
export function SgaHeroBanner() {
  const sections = Array.from(new Set(SGA_CRITERIA.map((c) => c.section)));

  return (
    <section className="relative isolate -mt-4 min-h-[17rem] overflow-hidden rounded-2xl shadow-lg shadow-amber-900/10 ring-1 ring-amber-900/10 sm:min-h-[19rem]">
      {/* ---------- ฉากหลัง: ผนังครัว + โต๊ะไม้ ---------- */}
      <div aria-hidden="true" className="absolute inset-0 -z-20">
        <div className="absolute inset-x-0 top-0 h-[46%] bg-gradient-to-b from-[#efe7da] to-[#e4d6c1]">
          {/* ตู้ครัวเบลอ ๆ */}
          <div className="absolute left-[8%] top-[-20%] h-[90%] w-[26%] rounded-lg bg-white/35 blur-[3px]" />
          <div className="absolute left-[37%] top-[-20%] h-[90%] w-[26%] rounded-lg bg-white/30 blur-[3px]" />
          <div className="absolute left-[66%] top-[-20%] h-[90%] w-[30%] rounded-lg bg-white/35 blur-[3px]" />
        </div>
        <div
          className="absolute inset-x-0 bottom-0 h-[58%]"
          style={{
            background:
              "repeating-linear-gradient(178deg, rgb(120 72 30 / 0.07) 0 2px, transparent 2px 13px), linear-gradient(180deg, #dcae7e 0%, #cf9a66 55%, #c08a57 100%)",
          }}
        />
        <div className="absolute inset-x-0 top-[42%] h-[4%] bg-gradient-to-b from-transparent to-amber-900/10" />
      </div>

      {/* ---------- ภาพอาหาร ---------- */}
      <FoodIllustration className="absolute bottom-0 right-[-18%] -z-10 h-[88%] w-auto sm:right-[-6%] lg:right-0 lg:h-[96%]" />

      {/* ไล่สีด้านซ้ายให้อ่านหัวข้อได้ชัด */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-[#fbf6ee] via-[#fbf6ee]/85 to-[#fbf6ee]/10 sm:via-[#fbf6ee]/75 sm:to-transparent lg:w-[68%]"
      />

      {/* ---------- การ์ดกระจก (lg ขึ้นไป) ---------- */}
      <div aria-hidden="true" className="hidden lg:block">
        <GlassCard className="right-5 top-5 w-48">
          <p className="font-display text-lg font-semibold tracking-wide">SGA</p>
          <ul className="mt-2 flex flex-col gap-1.5 text-xs">
            {sections.map((s, i) => (
              <li key={s} className="flex items-center justify-between gap-3">
                <span>{s}</span>
                <span className={`h-1 w-10 rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`} />
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="bottom-5 left-[58%] w-44">
          <p className="font-display text-base font-semibold">ผลการประเมิน</p>
          <div className="mt-2 flex flex-col gap-1.5 text-xs">
            <Pill dot="bg-green-500">A · 0–5 คะแนน</Pill>
            <Pill dot="bg-yellow-400">B · 6–10 คะแนน</Pill>
            <Pill dot="bg-red-500">C · ≥ 11 คะแนน</Pill>
          </div>
        </GlassCard>
      </div>

      {/* ---------- หัวข้อ ---------- */}
      <div className="relative flex min-h-[17rem] max-w-xl flex-col justify-center px-6 py-8 sm:min-h-[19rem] sm:px-10">
        <span className="w-fit rounded-full border border-white/70 bg-white/50 px-3 py-1 text-xs font-medium text-stone-700 backdrop-blur-sm">
          M/R-NUT-001.1 · Nutrition Alert Form
        </span>
        <h1 className="mt-3 font-display text-[2rem] font-bold leading-[1.15] tracking-tight text-stone-900 sm:text-[2.6rem]">
          แบบประเมินภาวะโภชนาการเบื้องต้น
          <span className="mt-1 block text-emerald-700">(SGA/NAF)</span>
        </h1>
        <p className="mt-3 max-w-md text-sm text-stone-700 sm:text-base">
          ค้นหาผู้ป่วยด้วย HN เพื่อดูประวัติการประเมิน หรือเริ่มประเมินภาวะโภชนาการครั้งใหม่
        </p>
      </div>
    </section>
  );
}

const BAR_COLORS = ["bg-orange-300", "bg-lime-400", "bg-sky-300", "bg-rose-300"];

function GlassCard({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div
      className={`absolute rounded-2xl border border-white/60 bg-white/25 p-3.5 text-stone-800 shadow-[inset_0_1px_0_rgb(255_255_255/0.75),0_10px_30px_rgb(120_72_30/0.15)] backdrop-blur-[6px] backdrop-saturate-150 ${className}`}
    >
      {children}
    </div>
  );
}

function Pill({ dot, children }: { dot: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2 rounded-full border border-white/60 bg-white/30 px-2.5 py-1 tabular-nums">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {children}
    </span>
  );
}

/* ================= ภาพประกอบ SVG ================= */

function Bowl({
  cx,
  cy,
  rx,
  ry,
  depth,
  children,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  depth: number;
  children?: React.ReactNode;
}) {
  return (
    <g>
      <ellipse cx={cx + 6} cy={cy + depth - 2} rx={rx * 0.85} ry={ry * 0.7} fill="#5b3717" opacity="0.22" />
      <path
        d={`M${cx - rx} ${cy} C ${cx - rx} ${cy + depth * 1.15}, ${cx + rx} ${cy + depth * 1.15}, ${cx + rx} ${cy} Z`}
        fill="url(#bowlBody)"
      />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#f6efe4" />
      <ellipse cx={cx} cy={cy + 1.5} rx={rx * 0.9} ry={ry * 0.72} fill="#e6d9c5" />
      {children}
    </g>
  );
}

const LEAF = "M0 0 C 9 -15, 31 -15, 40 0 C 31 13, 9 13, 0 0 Z";

// [x, y, rotate, scale, colorIndex]
const SPINACH: [number, number, number, number, number][] = [
  [262, 142, -20, 1.1, 0], [290, 128, -40, 1.2, 1], [318, 118, -70, 1.1, 2], [350, 116, -110, 1.2, 0],
  [382, 124, -140, 1.1, 1], [404, 138, -165, 1.0, 3], [276, 150, 10, 1.0, 2], [300, 140, -10, 1.3, 3],
  [334, 132, -60, 1.3, 1], [362, 134, -120, 1.2, 2], [390, 146, 170, 1.1, 0], [318, 146, 5, 1.2, 0],
  [348, 148, -175, 1.2, 3], [300, 110, -95, 0.9, 2], [340, 102, -85, 1.0, 1], [372, 108, -120, 0.9, 3],
];
const GREENS = ["#15803d", "#16a34a", "#22a34f", "#166534"];

// [x, y, type] 0 = blueberry, 1 = raspberry
const BERRIES: [number, number, number][] = [
  [78, 208, 0], [98, 200, 1], [122, 196, 0], [146, 200, 1], [166, 208, 0],
  [88, 190, 0], [112, 184, 1], [136, 182, 0], [158, 190, 0], [124, 170, 1], [100, 174, 0], [148, 170, 0],
];

function FoodIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 560 320" aria-hidden="true" className={className} preserveAspectRatio="xMaxYMax meet">
      <defs>
        <linearGradient id="bowlBody" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f3ebdf" />
          <stop offset="1" stopColor="#d6c6ae" />
        </linearGradient>
        <linearGradient id="salmon" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fb923c" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
        <radialGradient id="blueberry" cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="0.6" stopColor="#312e81" />
          <stop offset="1" stopColor="#1e1b4b" />
        </radialGradient>
        <radialGradient id="raspberry" cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#fb7185" />
          <stop offset="1" stopColor="#be123c" />
        </radialGradient>
      </defs>

      {/* ผักโขม */}
      <Bowl cx={335} cy={150} rx={112} ry={28} depth={72}>
        {SPINACH.map(([x, y, r, s, c], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
            <path d={LEAF} fill={GREENS[c]} />
            <path d="M2 0 H36" stroke="#bbf7d0" strokeOpacity="0.45" strokeWidth="1.2" />
          </g>
        ))}
      </Bowl>

      {/* เบอร์รี่ */}
      <Bowl cx={122} cy={214} rx={74} ry={20} depth={56}>
        {BERRIES.map(([x, y, t], i) =>
          t === 0 ? (
            <g key={i}>
              <circle cx={x} cy={y} r={11} fill="url(#blueberry)" />
              <circle cx={x - 3} cy={y - 4} r={2} fill="#c7d2fe" opacity="0.6" />
            </g>
          ) : (
            <g key={i}>
              <circle cx={x} cy={y} r={12} fill="url(#raspberry)" />
              <circle cx={x - 4} cy={y - 3} r={1.6} fill="#fecdd3" />
              <circle cx={x + 3} cy={y - 4} r={1.6} fill="#fecdd3" />
              <circle cx={x} cy={y + 3} r={1.6} fill="#fecdd3" />
              <circle cx={x + 5} cy={y + 2} r={1.6} fill="#fecdd3" />
            </g>
          )
        )}
      </Bowl>

      {/* จานแซลมอน */}
      <g>
        <ellipse cx={288} cy={284} rx={122} ry={30} fill="#5b3717" opacity="0.22" />
        <ellipse cx={282} cy={270} rx={128} ry={40} fill="#f6efe4" />
        <ellipse cx={282} cy={272} rx={100} ry={29} fill="#ebe0cf" />
        <path
          d="M212 268 C 214 240, 318 226, 352 244 C 364 252, 356 270, 338 276 C 300 290, 222 292, 212 268 Z"
          fill="url(#salmon)"
        />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path
            key={i}
            d={`M${232 + i * 20} ${250 - i * 2} q 10 14 2 30`}
            stroke="#ffedd5"
            strokeOpacity="0.75"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        ))}
        <path d="M214 266 C 240 280, 320 282, 350 262" stroke="#fed7aa" strokeWidth="2" fill="none" opacity="0.6" />
      </g>

      {/* ข้าวโอ๊ต */}
      <Bowl cx={500} cy={296} rx={80} ry={22} depth={50}>
        <ellipse cx={500} cy={294} rx={70} ry={16} fill="#e9d5a8" />
        {Array.from({ length: 22 }, (_, i) => (
          <ellipse
            key={i}
            cx={442 + ((i * 37) % 118)}
            cy={286 + ((i * 11) % 16)}
            rx={5}
            ry={2.6}
            fill={i % 3 === 0 ? "#d6b77c" : "#f3e3bd"}
            transform={`rotate(${(i * 47) % 180} ${442 + ((i * 37) % 118)} ${286 + ((i * 11) % 16)})`}
          />
        ))}
      </Bowl>
    </svg>
  );
}
