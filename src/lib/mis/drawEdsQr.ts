import QRCode from "qrcode";
import { buildEdsQrPayload } from "@/lib/eds/Edsqr";
import {
  EDS_QR_FORM_CODE_MIS,
  EDS_QR_CARE_PROVIDER_CODE,
  EDS_QR_PRINT_SPID,
} from "@/lib/eds/constants";
import { FORM_PAGE, EDS_QR_BOX } from "./formLayout";
import type { QrContext } from "@/lib/sga/drawEdsQr";

export type { QrContext };

export async function drawEdsQr(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  hn: string,
  qr: QrContext | null,
) {
  if (!hn?.trim() || !qr?.visitRef?.trim()) return; // ข้อมูลไม่ครบ ข้าม QR เหมือน SGA

  const now = new Date();
  const payload = buildEdsQrPayload({
    hn,
    visitRef: qr.visitRef,
    visitType: qr.visitType,
    formCode: EDS_QR_FORM_CODE_MIS,
    pageNumber: "01",
    printDate: now,
    printTime: `${now.getHours()}:${now.getMinutes()}`,
    careProviderCode: qr.careProviderCode?.trim() || EDS_QR_CARE_PROVIDER_CODE,
    printSpid: qr.printSpid?.trim() || EDS_QR_PRINT_SPID,
  });

  const scale = canvasWidth / FORM_PAGE.width;
  const size = Math.round(EDS_QR_BOX.size * scale);
  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, payload, {
    margin: 0,
    width: size,
    errorCorrectionLevel: "M",
  });
  ctx.drawImage(qrCanvas, EDS_QR_BOX.x * scale, EDS_QR_BOX.y * scale, size, size);
}
