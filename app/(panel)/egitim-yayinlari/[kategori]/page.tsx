"use client";

import { notFound, useParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import UttAnaSayfa, { UttKategoriIskeleti } from "@/components/ana-sayfa/UttAnaSayfa";
import BmEgitimYayinlari from "@/components/yayin/BmEgitimYayinlari";
import { uttVideoKategorisiBul } from "@/lib/video/uttVideoKategorileri";
import { TUKETICI_ROLLER, YONETICI_ROLLER } from "@/lib/utils/roller";

export default function EgitimKategoriPage() {
  const { kategori: slug } = useParams<{ kategori: string }>();
  const { kullanici, yukleniyor } = useAuth();
  const kategori = uttVideoKategorisiBul(slug);

  if (!kategori) notFound();
  if (yukleniyor || !kullanici) return <UttKategoriIskeleti />;
  const rol = kullanici.rol.trim().toLowerCase();

  if (TUKETICI_ROLLER.includes(rol)) {
    return (
      <UttAnaSayfa
        user={kullanici}
        rol={kullanici.rol}
        adSoyad={kullanici.adSoyad}
        kategoriBilgisi={kategori}
        temelYol={`/egitim-yayinlari/${kategori.urlSlug}`}
      />
    );
  }
  if (rol !== "bm" && rol !== "tm" && !YONETICI_ROLLER.includes(rol)) notFound();
  return <BmEgitimYayinlari kategoriBilgisi={kategori} />;
}
