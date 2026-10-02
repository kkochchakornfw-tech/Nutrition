import { formatThaiDate, formatThaiDateFromDateTime, formatTime } from "@/lib/format";
import { MIS_CRITERIA } from "./data";
import {
  CHECKBOX_SIZE,
  CHECKBOXES,
  FIELDS,
  FORM_PAGE,
  PHOTO_BOX,
  ROLE_BOXES,
  TOTAL_SCORE_BOX,
  type BoxPos,
  type LineField,
} from "./formLayout";
import type { MisFormData } from "./misData";

// ช่องติ๊กสีแดง ฟอนต์ Sarabun — เหมือนฟอร์ม SGA
const INK = "#000000";
const FONT_FAMILY =
  '"Sarabun", "Leelawadee UI", "Tahoma", "Noto Sans Thai", sans-serif';
const CHECK_INK = "#dc2626";

type Ctx = CanvasRenderingContext2D;

const LINE_LIFT = 1.1;

function drawFieldText(
  ctx: Ctx,
  S: number,
  field: LineField,
  raw: string | null | undefined,
  align: "left" | "center" = "left",
) {
  const text = raw?.replace(/\s+/g, " ").trim();
  if (!text) return;
  drawFitText(
    ctx,
    S,
    text,
    align === "center" ? field.x + field.width / 2 : field.x,
    field.baseline - LINE_LIFT,
    field.width,
    field.size,
    align,
  );
}

function drawFitText(
  ctx: Ctx,
  S: number,
  text: string,
  x: number,
  baseline: number,
  maxWidth: number,
  size: number,
  align: "left" | "center",
  bold = false,
) {
  const minSize = size * 0.6;
  let current = size;
  const setFont = () => {
    ctx.font = `${bold ? "bold " : ""}${current * S}px ${FONT_FAMILY}`;
  };
  setFont();
  while (ctx.measureText(text).width > maxWidth * S && current > minSize) {
    current -= 0.25;
    setFont();
  }
  let output = text;
  if (ctx.measureText(output).width > maxWidth * S) {
    while (
      output.length > 1 &&
      ctx.measureText(`${output}…`).width > maxWidth * S
    ) {
      output = output.slice(0, -1);
    }
    output = `${output}…`;
  }
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(output, x * S, baseline * S);
}

const BOX_VISUAL = { dx: 0.05, dy: 0.2, w: 0.85, h: 0.75 };

function drawCheck(
  ctx: Ctx,
  S: number,
  [x, y]: BoxPos,
  size: { width: number; height: number },
) {
  const left = (x + size.width * BOX_VISUAL.dx) * S;
  const top = (y + size.height * BOX_VISUAL.dy) * S;
  const w = size.width * BOX_VISUAL.w * S;
  const h = size.height * BOX_VISUAL.h * S;

  ctx.save();
  ctx.strokeStyle = CHECK_INK;
  ctx.lineWidth = 1.5 * S;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(left + w * 0.12, top + h * 0.55);
  ctx.lineTo(left + w * 0.42, top + h * 0.88);
  ctx.lineTo(left + w * 1.02, top - h * 0.08);
  ctx.stroke();
  ctx.restore();
}

const PHOTO_INSET = 1;

function drawPatientPhoto(ctx: Ctx, S: number, img: HTMLImageElement) {
  ctx.strokeRect(PHOTO_BOX.x * S, PHOTO_BOX.y * S, PHOTO_BOX.w * S, PHOTO_BOX.h * S);
  const x = (PHOTO_BOX.x + PHOTO_INSET) * S;
  const y = (PHOTO_BOX.y + PHOTO_INSET) * S;
  const w = (PHOTO_BOX.w - PHOTO_INSET * 2) * S;
  const h = (PHOTO_BOX.h - PHOTO_INSET * 2) * S;

  const boxRatio = w / h;
  const imgRatio = img.naturalWidth / img.naturalHeight;
  let sx = 0,
    sy = 0,
    sw = img.naturalWidth,
    sh = img.naturalHeight;
  if (imgRatio > boxRatio) {
    sw = img.naturalHeight * boxRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / boxRatio;
    sy = (img.naturalHeight - sh) * 0.25;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawCheckmarks(ctx: Ctx, S: number, data: MisFormData) {
  for (const answer of data.assessment.answers) {
    const criteria = MIS_CRITERIA.find((c) => c.id === answer.criteriaId);
    if (!criteria) continue;
    const optionIndex = criteria.options.findIndex((o) => o.id === answer.optionId);
    const box = CHECKBOXES[criteria.criteriaKey]?.[optionIndex];
    if (!box) continue;
    drawCheck(ctx, S, box, CHECKBOX_SIZE);
  }

  const roleBox = ROLE_BOXES[data.assessment.assessorRole];
  if (roleBox) drawCheck(ctx, S, roleBox, CHECKBOX_SIZE);
}

function drawTotalScore(ctx: Ctx, S: number, totalScore: number) {
  const cx = TOTAL_SCORE_BOX.x + TOTAL_SCORE_BOX.w / 2;
  const cy = TOTAL_SCORE_BOX.y + TOTAL_SCORE_BOX.h / 2;
  ctx.fillStyle = INK;
  drawFitText(
    ctx,
    S,
    String(totalScore),
    cx,
    cy + TOTAL_SCORE_BOX.h * 0.3,
    TOTAL_SCORE_BOX.w - 6,
    16,
    "center",
    true,
  );
}

/**
 * วาดข้อมูลลงบนแม่แบบฟอร์ม M/R-NUT-003.1 Rev.5
 * @param canvasWidth ความกว้างของ canvas ที่ template ถูกวาดเต็ม (ความสูงตามสัดส่วนหน้า PDF)
 */
export function drawMisForm(
  ctx: Ctx,
  template: CanvasImageSource,
  canvasWidth: number,
  data: MisFormData,
  photo: HTMLImageElement | null = null,
) {
  const S = canvasWidth / FORM_PAGE.width;
  const { patient, assessment } = data;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasWidth, FORM_PAGE.height * S);
  ctx.drawImage(template, 0, 0, canvasWidth, FORM_PAGE.height * S);
  if (photo) drawPatientPhoto(ctx, S, photo);
  ctx.fillStyle = INK;

  // กรอบข้อมูลผู้ป่วยมุมขวาบน
  drawFieldText(ctx, S, FIELDS.patientName, patient.name);
  drawFieldText(
    ctx,
    S,
    FIELDS.dateOfBirth,
    patient.dateOfBirth ? formatThaiDate(patient.dateOfBirth) : null,
  );
  drawFieldText(ctx, S, FIELDS.age, patient.ageText === "-" ? null : patient.ageText);
  drawFieldText(ctx, S, FIELDS.hn, patient.hn);
  drawFieldText(ctx, S, FIELDS.vnAn, patient.vnAn);
  drawFieldText(
    ctx,
    S,
    FIELDS.admitDate,
    patient.admitDate ? formatThaiDate(patient.admitDate) : null,
  );
  drawFieldText(ctx, S, FIELDS.gender, patient.genderLabel === "-" ? null : patient.genderLabel);
  drawFieldText(ctx, S, FIELDS.allergies, patient.allergies);

  // หัวฟอร์ม
  drawFieldText(ctx, S, FIELDS.date, formatThaiDateFromDateTime(assessment.assessedAt), "center");
  drawFieldText(ctx, S, FIELDS.time, formatTime(assessment.assessedAt), "center");
  drawFieldText(ctx, S, FIELDS.creatinine, assessment.serumCreatinine?.toString(), "center");
  drawFieldText(ctx, S, FIELDS.bun, assessment.bun?.toString(), "center");
  drawFieldText(ctx, S, FIELDS.albuminLab, assessment.serumAlbumin?.toString(), "center");
  drawFieldText(ctx, S, FIELDS.tibcLab, assessment.serumTibc?.toString(), "center");
  drawFieldText(ctx, S, FIELDS.comorbidity, assessment.comorbidityText);
  drawFieldText(ctx, S, FIELDS.height, assessment.heightCm?.toString(), "center");
  drawFieldText(ctx, S, FIELDS.dryWeight, assessment.dryWeightKg?.toString(), "center");
  drawFieldText(ctx, S, FIELDS.ibw, assessment.ibwKg?.toString(), "center");
  drawFieldText(ctx, S, FIELDS.bmi, assessment.bmi?.toString(), "center");
  drawFieldText(ctx, S, FIELDS.waist, assessment.waistCm?.toString(), "center");
  drawFieldText(ctx, S, FIELDS.arm, assessment.armCm?.toString(), "center");
  drawFieldText(ctx, S, FIELDS.leg, assessment.legCm?.toString(), "center");

  drawFieldText(ctx, S, FIELDS.assessorName, assessment.assessorName);

  drawCheckmarks(ctx, S, data);
  drawTotalScore(ctx, S, assessment.totalScore);
}
