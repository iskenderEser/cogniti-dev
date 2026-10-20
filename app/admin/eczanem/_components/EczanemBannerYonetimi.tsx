"use client";

import EclubBannerYonetimi from "../../eclub/_components/EclubBannerYonetimi";

export default function EczanemBannerYonetimi({ firmaId, firmaAdi }: { firmaId: string; firmaAdi: string }) {
  return <EclubBannerYonetimi firmaId={firmaId} firmaAdi={firmaAdi} alan="uye-ana-sayfa" />;
}
