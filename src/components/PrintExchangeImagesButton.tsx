"use client";

import { useRef } from "react";

const PAGE_1 = "/images/exchange/exchange-1.jpg";
const PAGE_2 = "/images/exchange/exchange-2.jpg";

/** ตัวเลขที่เขียนลงตาราง "สัดส่วนอาหารต่อวัน" ในรูปหน้า 1 (หน่วยตรงกับคอลัมน์หน่วยในรูป) */
export interface ExchangeFill {
  kcal: number;
  grain: number; // ทัพพี
  veg: number; // ทัพพี
  fruit: number; // ส่วน
  meat: number; // ช้อนกินข้าว
  milk: number; // แก้ว
}

// ตำแหน่งกึ่งกลางช่องบนรูป 1414×2000 px
const IMG_W = 1414;
const IMG_H = 2000;
const CELL_X = 332;
const CELL_Y = { grain: 328, veg: 400, fruit: 472, meat: 545, milk: 617 } as const;
const KCAL_POS = { x: 332, y: 250 };

const fmt = (n: number) => String(Math.round(n * 10) / 10);

function overlay(text: string, x: number, y: number, sizeMm: number) {
  return `<span style="left:${(x / IMG_W) * 100}%;top:${(y / IMG_H) * 100}%;font-size:${sizeMm}mm">${text}</span>`;
}

function buildHtml(fill: ExchangeFill | undefined, origin: string) {
  const marks = fill
    ? [
        overlay(fmt(fill.kcal), KCAL_POS.x, KCAL_POS.y, 5.2),
        overlay(fmt(fill.grain), CELL_X, CELL_Y.grain, 5),
        overlay(fmt(fill.veg), CELL_X, CELL_Y.veg, 5),
        overlay(fmt(fill.fruit), CELL_X, CELL_Y.fruit, 5),
        overlay(fmt(fill.meat), CELL_X, CELL_Y.meat, 5),
        overlay(fmt(fill.milk), CELL_X, CELL_Y.milk, 5),
      ].join("")
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><title>รูปอาหารแลกเปลี่ยน</title>
<style>@page{size:A4 portrait;margin:0}html,body{margin:0}
.page{position:relative;width:210mm;height:297mm;overflow:hidden;break-after:page;page-break-after:always}
.page:last-child{break-after:auto;page-break-after:auto}
.page img{display:block;width:100%;height:100%}
.page span{position:absolute;transform:translate(-50%,-50%);font-family:"Sarabun","Leelawadee UI",Tahoma,sans-serif;font-weight:700;color:#000;line-height:1;white-space:nowrap}
</style></head><body>
<div class="page"><img src="${origin}${PAGE_1}" alt="">${marks}</div>
<div class="page"><img src="${origin}${PAGE_2}" alt=""></div>
</body></html>`;
}

/** พิมพ์รูปอาหารแลกเปลี่ยน 2 รูป (A4 รูปละ 1 หน้า) พร้อมเติมผลคำนวณลงตาราง — กดแล้วเปิดหน้าต่างพิมพ์ทันที กดซ้ำได้ */
export function PrintExchangeImagesButton({
  label = "พิมพ์รูปอาหารแลกเปลี่ยน",
  fill,
}: {
  label?: string;
  fill?: ExchangeFill;
}) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  function handlePrint() {
    frameRef.current?.remove();
    const iframe = document.createElement("iframe");
    frameRef.current = iframe;
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    iframe.onload = () => {
      const win = iframe.contentWindow;
      if (!win) return;
      const imgs = Array.from(win.document.images);
      void Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.onload = img.onerror = () => resolve();
              }),
        ),
      ).then(() => {
        win.focus();
        win.print();
      });
    };
    iframe.srcdoc = buildHtml(fill, location.origin);
    document.body.appendChild(iframe);
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
    >
      {label}
    </button>
  );
}
