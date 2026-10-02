import type { FoodPlan } from "@/lib/calorie/types";
import { flagSlots, type FlagSlot } from "@/lib/calorie/flag";
import { round } from "@/lib/calorie/calc";

/*
 * ธงโภชนาการ (สามเหลี่ยมหัวกลับ) — แต่ละชั้นเป็นภาพถ่ายอาหาร (Unsplash License: ใช้/พิมพ์ได้ฟรี)
 * ตัวเลขในวงกลมดึงจากจำนวน "ส่วน" ในตาราง 3
 * เรขาคณิต: ฐานบนกว้าง 560 (x 130–690) ที่ y=60, ปลายแหลมที่ (410, 560)
 */
const CX = 410;
const TOP = 60;
const APEX = 560;
const HALF_TOP = 280;
const half = (y: number) => (HALF_TOP * (APEX - y)) / (APEX - TOP);
const L = (y: number) => CX - half(y);
const R = (y: number) => CX + half(y);

// ขอบแต่ละชั้น
const Y1 = 210; // ข้าว-แป้ง | ผัก/ผลไม้
const Y2 = 325; // ผัก/ผลไม้ | นม/เนื้อสัตว์
const Y3 = 430; // นม/เนื้อสัตว์ | น้ำมัน/น้ำตาล/เกลือ

type Pt = [number, number];
const pts = (p: Pt[]) => p.map(([x, y]) => `${x},${y}`).join(" ");

const fmt = (n: number) => round(n, 1).toLocaleString("th-TH", { maximumFractionDigits: 1 });

/** ภาพถ่ายประจำแต่ละชั้น — ไฟล์อยู่ใน public/images/flag/ */
export const FLAG_PHOTOS = {
  grain: { src: "/images/flag/grain.jpg", credit: "Pille R. Priske" },
  veg: { src: "/images/flag/veg.jpg", credit: "Lou Liebau" },
  fruit: { src: "/images/flag/fruit.jpg", credit: "Natalya Karpeka" },
  milk: { src: "/images/flag/milk.jpg", credit: "Mary Skrynnikova" },
  meat: { src: "/images/flag/meat.jpg", credit: "Buddy AN" },
  tip: { src: "/images/flag/tip.jpg", credit: "Kamakshi subramani" },
} as const;

type PhotoKey = keyof typeof FLAG_PHOTOS;

const BANDS: { key: PhotoKey; poly: Pt[] }[] = [
  { key: "grain", poly: [[L(TOP), TOP], [R(TOP), TOP], [R(Y1), Y1], [L(Y1), Y1]] },
  { key: "veg", poly: [[L(Y1), Y1], [CX, Y1], [CX, Y2], [L(Y2), Y2]] },
  { key: "fruit", poly: [[CX, Y1], [R(Y1), Y1], [R(Y2), Y2], [CX, Y2]] },
  { key: "milk", poly: [[L(Y2), Y2], [CX, Y2], [CX, Y3], [L(Y3), Y3]] },
  { key: "meat", poly: [[CX, Y2], [R(Y2), Y2], [R(Y3), Y3], [CX, Y3]] },
  { key: "tip", poly: [[L(Y3), Y3], [R(Y3), Y3], [CX, APEX]] },
];

function bbox(poly: Pt[]) {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

/** เฉพาะตัวภาพ SVG — ใช้ทั้งบนจอและในหน้าพิมพ์ */
export function FlagGraphic({ plan, idPrefix = "flag" }: { plan: FoodPlan; idPrefix?: string }) {
  const s = flagSlots(plan);
  const list: FlagSlot[] = [s.grain, s.veg, s.fruit, s.milk, s.meat, s.egg, s.oil, s.sugar, s.salt];
  const clip = (k: string) => `${idPrefix}-clip-${k}`;

  return (
    <svg
      viewBox="0 0 820 600"
      role="img"
      aria-labelledby={`${idPrefix}-title ${idPrefix}-desc`}
      className="h-auto w-full"
      style={{ fontFamily: "var(--font-kanit), var(--font-geist-sans), sans-serif" }}
    >
      <title id={`${idPrefix}-title`}>ธงโภชนาการ ปริมาณอาหารต่อวัน</title>
      <desc id={`${idPrefix}-desc`}>{list.map((x) => `${x.label} ${fmt(x.value)} ${x.unit}`).join(", ")}</desc>
      <defs>
        {BANDS.map((b) => (
          <clipPath key={b.key} id={clip(b.key)}>
            <polygon points={pts(b.poly)} />
          </clipPath>
        ))}
        <linearGradient id={`${idPrefix}-shade`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.18" />
        </linearGradient>
      </defs>

      {/* ---------- ชั้นของธง (ภาพถ่าย) ---------- */}
      {BANDS.map((b) => {
        const box = bbox(b.poly);
        return (
          <g key={b.key} clipPath={`url(#${clip(b.key)})`}>
            <rect {...box} fill="#e7e5e4" />
            <image href={FLAG_PHOTOS[b.key].src} {...box} preserveAspectRatio="xMidYMid slice" />
            <rect {...box} fill={`url(#${idPrefix}-shade)`} />
          </g>
        );
      })}
      <g fill="none" stroke="#fff" strokeWidth="5" strokeLinejoin="round">
        {BANDS.map((b) => (
          <polygon key={b.key} points={pts(b.poly)} />
        ))}
      </g>

      {/* ชื่อหมวดบนภาพ (ป้ายขาวให้อ่านชัดบนภาพถ่าย) */}
      <BandLabel x={CX} y={135} text="ข้าว-แป้ง" size={30} color="#92400e" />
      <BandLabel x={(L(268) + CX) / 2 + 8} y={268} text="ผัก" size={20} color="#166534" />
      <BandLabel x={(R(268) + CX) / 2 - 8} y={268} text="ผลไม้" size={20} color="#9a3412" />
      <BandLabel x={(L(378) + CX) / 2 + 8} y={378} text="นม" size={17} color="#075985" />
      <BandLabel x={(R(378) + CX) / 2 - 8} y={378} text="เนื้อสัตว์" size={15} color="#9f1239" />

      {/* ---------- ตัวเลขแต่ละหมวด ---------- */}
      <Leader x1={104} y1={135} x2={L(135) + 6} y2={135} />
      <Badge x={70} y={135} slot={s.grain} color="#d97706" />

      <Leader x1={184} y1={268} x2={L(268) + 6} y2={268} />
      <Badge x={150} y={268} slot={s.veg} color="#16a34a" />

      <Leader x1={636} y1={268} x2={R(268) - 6} y2={268} />
      <Badge x={670} y={268} slot={s.fruit} color="#ea580c" />

      <Leader x1={216} y1={396} x2={L(396) + 6} y2={396} />
      <Badge x={182} y={396} slot={s.milk} color="#0284c7" />

      <Leader x1={566} y1={396} x2={R(396) - 6} y2={396} />
      <Badge x={600} y={396} slot={s.meat} color="#e11d48" />
      <Badge x={690} y={396} slot={s.egg} color="#e11d48" />

      <Leader x1={526} y1={522} x2={R(500) - 4} y2={500} />
      <Badge x={560} y={522} slot={s.oil} color="#78716c" small />
      <Badge x={636} y={522} slot={s.sugar} color="#78716c" small />
      <Badge x={712} y={522} slot={s.salt} color="#78716c" small />

      <text x={L(492) - 16} y={488} textAnchor="end" fontSize="15" fill="#57534e">
        ใช้แต่น้อย
      </text>
      <text x={L(492) - 16} y={507} textAnchor="end" fontSize="15" fill="#57534e">
        เท่าที่จำเป็น
      </text>
    </svg>
  );
}

/** ธงโภชนาการพร้อมหัวข้อ — ใช้บนหน้าจอ */
export function NutritionFlag({
  plan,
  targetKcal,
}: {
  plan: FoodPlan;
  targetKcal?: number | null;
}) {
  const s = flagSlots(plan);
  const list: FlagSlot[] = [s.grain, s.veg, s.fruit, s.milk, s.meat, s.egg, s.oil, s.sugar, s.salt];

  return (
    <figure className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-emerald-800">ธงโภชนาการ</h2>
          <p className="text-sm text-zinc-600">ปริมาณอาหารที่แนะนำใน 1 วัน · คำนวณจากจำนวนส่วนในตาราง 3</p>
        </div>
        <p className="rounded-full bg-orange-100 px-4 py-1.5 text-sm font-medium text-orange-900 ring-1 ring-orange-200">
          พลังงาน <span className="font-semibold tabular-nums">{Math.round(plan.totals.kcal).toLocaleString("th-TH")}</span>{" "}
          กิโลแคลอรี
          {targetKcal ? (
            <span className="font-normal text-orange-800"> · เป้าหมาย {Math.round(targetKcal).toLocaleString("th-TH")}</span>
          ) : null}
        </p>
      </div>

      <div className="w-full max-w-3xl self-center">
        <FlagGraphic plan={plan} />
      </div>

      {/* รายการตัวอักษร — อ่านง่ายบนจอเล็ก และเป็น fallback ของภาพ */}
      <figcaption className="grid grid-cols-3 gap-2 text-sm sm:sr-only">
        {list.map((x) => (
          <span key={x.key} className="rounded-lg bg-zinc-50 px-2.5 py-1.5 ring-1 ring-zinc-200">
            <span className="block text-xs text-zinc-500">{x.label}</span>
            <span className="font-semibold tabular-nums text-zinc-900">{fmt(x.value)}</span>{" "}
            <span className="text-xs text-zinc-600">{x.unit}</span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

/** เครดิตภาพ (Unsplash License ไม่บังคับ แต่ให้เครดิตช่างภาพ) */
export function FlagPhotoCredits({ className = "" }: { className?: string }) {
  const names = Array.from(new Set(Object.values(FLAG_PHOTOS).map((p) => p.credit)));
  return <p className={`text-[10px] text-zinc-400 ${className}`}>ภาพ: {names.join(", ")} / Unsplash</p>;
}

function BandLabel({ x, y, text, size, color }: { x: number; y: number; text: string; size: number; color: string }) {
  // ความกว้างโดยประมาณของตัวอักษรไทย ~0.62em
  const w = text.length * size * 0.62 + size * 1.2;
  const h = size * 1.7;
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill="#fff" fillOpacity="0.9" />
      <text x={x} y={y + size * 0.36} textAnchor="middle" fontSize={size} fontWeight="700" fill={color}>
        {text}
      </text>
    </g>
  );
}

function Leader({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#a8a29e" strokeWidth="1.5" strokeDasharray="3 3" />;
}

function Badge({
  x,
  y,
  slot,
  color,
  small = false,
}: {
  x: number;
  y: number;
  slot: FlagSlot;
  color: string;
  small?: boolean;
}) {
  const r = small ? 24 : 30;
  const zero = slot.value === 0;
  return (
    <g transform={`translate(${x} ${y})`}>
      <text y={-r - 10} textAnchor="middle" fontSize={small ? 14 : 16} fontWeight="600" fill="#3f3f46">
        {slot.label}
      </text>
      <circle r={r} fill="#fff" stroke={zero ? "#d4d4d8" : color} strokeWidth="3.5" />
      <text
        y={small ? 8 : 10}
        textAnchor="middle"
        fontSize={small ? 22 : 28}
        fontWeight="700"
        fill={zero ? "#a1a1aa" : color}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {fmt(slot.value)}
      </text>
      <text y={r + 20} textAnchor="middle" fontSize={small ? 13 : 14} fill="#52525b">
        {slot.unit}
        {slot.fixed ? " (คงที่)" : ""}
      </text>
    </g>
  );
}
