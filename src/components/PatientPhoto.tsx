"use client";

import { useState } from "react";

export function PatientPhoto({ hn, name }: { hn: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const initial = (
    name?.trim().replace(/^[^\s]*\s+/, "")[0] || "?"
  ).toUpperCase();

  if (!hn || failed) {
    return (
      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-2xl font-medium text-zinc-400 ring-1 ring-zinc-200">
        {initial}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/patient-image?hn=${encodeURIComponent(hn)}`}
      alt={name || hn}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-24 w-24 shrink-0 rounded-lg bg-zinc-100 object-cover ring-1 ring-zinc-200"
    />
  );
}
