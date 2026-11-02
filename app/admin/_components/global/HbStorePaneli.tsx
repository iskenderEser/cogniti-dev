"use client";

import FirmaStoreKatalogu from "../../store/_components/FirmaStoreKatalogu";

export default function HbStorePaneli(props: {
  hata: (mesaj: string, adim?: string, detay?: string) => void;
  basari: (mesaj: string) => void;
}) {
  return <FirmaStoreKatalogu {...props} />;
}
