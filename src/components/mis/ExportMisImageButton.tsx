"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { drawMisForm } from "@/lib/mis/renderMisForm";
import { FORM_PAGE, TEMPLATE_URL } from "@/lib/mis/formLayout";
import type { MisFormData } from "@/lib/mis/misData";
import { drawEdsQr } from "@/lib/mis/drawEdsQr";
import type { QrContext } from "@/lib/sga/drawEdsQr";
import { QrContextModal } from "@/components/sga/QrContextModal";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("โหลดแม่แบบฟอร์มไม่สำเร็จ"));
    img.src = src;
  });
}

async function renderJpegBlob(
  data: MisFormData,
  photo: HTMLImageElement | null,
  qr: QrContext | null,
): Promise<Blob> {
  const template = await loadImage(TEMPLATE_URL);
  const width = template.naturalWidth;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = Math.round((width * FORM_PAGE.height) / FORM_PAGE.width);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("เบราว์เซอร์ไม่รองรับ canvas");

  await document.fonts.load('16px "Sarabun"');
  drawMisForm(ctx, template, width, data, photo);
  await drawEdsQr(ctx, width, data.assessment.hn, qr);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("สร้างไฟล์รูปภาพไม่สำเร็จ"))),
      "image/jpeg",
      0.92,
    );
  });
}

async function loadPatientPhoto(hn: string): Promise<HTMLImageElement | null> {
  try {
    const res = await fetch(`/api/patient-image?hn=${encodeURIComponent(hn)}`);
    if (!res.ok) return null;
    return await loadImage(await blobToDataUrl(await res.blob()));
  } catch {
    return null;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("แปลงรูปภาพไม่สำเร็จ"));
    reader.readAsDataURL(blob);
  });
}

export function ExportMisImageButton({ data }: { data: MisFormData }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const runId = useRef(0);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const fileName = `MIS_HN${data.assessment.hn}_${data.assessment.id}.jpg`;

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  async function handleOpen(qr: QrContext | null) {
    const id = ++runId.current;
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const photo = await loadPatientPhoto(data.assessment.hn);
      const blob = await renderJpegBlob(data, photo, qr);
      const dataUrl = await blobToDataUrl(blob);
      if (id !== runId.current) return;
      setPreview(dataUrl);
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (err) {
      if (id === runId.current) {
        setError(err instanceof Error ? err.message : "สร้างรูปภาพไม่สำเร็จ");
      }
    } finally {
      if (id === runId.current) setLoading(false);
    }
  }

  function handleClose() {
    runId.current++;
    setOpen(false);
    setPreview(null);
    setDownloadUrl(null);
  }

  return (
    <>
      <Button type="button" onClick={() => setQrModalOpen(true)}>
        พิมพ์เป็นรูปภาพ (JPEG)
      </Button>

      <QrContextModal
        open={qrModalOpen}
        hn={data.assessment.hn}
        onCancel={() => setQrModalOpen(false)}
        onConfirm={(qr) => {
          setQrModalOpen(false);
          handleOpen(qr);
        }}
      />

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="ตัวอย่างรูปภาพแบบประเมิน"
        >
          <div className="flex max-h-full w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-3">
              <h2 className="text-sm font-semibold text-zinc-800">
                M/R-NUT-003.1 · HN {data.assessment.hn}
              </h2>
              <div className="flex items-center gap-2">
                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    download={fileName}
                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    ดาวน์โหลด JPEG
                  </a>
                )}
                <Button type="button" variant="secondary" onClick={handleClose}>
                  ปิด
                </Button>
              </div>
            </div>
            <div className="overflow-auto bg-zinc-100 p-4">
              {loading && (
                <p className="p-8 text-center text-sm text-zinc-500">กำลังสร้างรูปภาพ...</p>
              )}
              {error && <p className="p-8 text-center text-sm text-red-600">{error}</p>}
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element -- data URL สร้างตอน runtime ใช้ next/image ไม่ได้
                <img
                  src={preview}
                  alt="แบบประเมินภาวะโภชนาการสำหรับผู้ป่วยไตเทียมที่กรอกข้อมูลแล้ว"
                  className="mx-auto w-full max-w-2xl bg-white shadow"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
