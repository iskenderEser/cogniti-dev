import { URETICI_ROLLER } from "@/lib/utils/roller";
import type { AuthKullanici } from "@/types/auth";
import type { RehberAdimi } from "@/components/rehber/YuruyenRehber";

export const KITY_METINLERI = {
  merhaba: "Merhaba ben Kity, istersen bu ekrandaki bazı başlıkları sana tanıtabilirim.",
  veda: "Eğlenceli öğrenmeler dilerim.",
} as const;

// Üreticinin /ana-sayfa ekranındaki gerçek alanlar. Karşılama dört adıma dahil değildir.
export const KITY_URETICI_ADIMLARI: readonly RehberAdimi[] = [
  {
    hedefId: "kity-uretici-onay",
    baslik: "Sizden Onay Bekleyen",
    aciklama: "Bu kart, incelemeni bekleyen içeriklerin sayısını gösterir. Karta tıklayarak Yayın Takip ekranında inceleme işlemlerine ulaşabilirsin.",
  },
  {
    hedefId: "kity-uretici-bekleyen",
    baslik: "Yayına Alınmayı Bekleyen",
    aciklama: "Bu kart, onaylanmış ve yayına alınmayı bekleyen içerikleri gösterir. Karta tıklayarak aşağıdaki yayın listesini bu içeriklerle filtreleyebilirsin.",
  },
  {
    hedefId: "kity-uretici-yayinda",
    baslik: "Yayında Olanlar",
    aciklama: "Bu kart, yayında olan içeriklerin sayısını gösterir. Karta tıklayarak yayın listesindeki yayında olan içerikleri görebilirsin.",
  },
  {
    hedefId: "kity-uretici-yayin-listesi",
    baslik: "Yayın Listesi",
    aciklama: "Bu liste, üretimi tamamlanmış içeriklerini ve yayın durumlarını gösterir. Arama alanıyla içeriği bulup satırına tıklayarak ilgili Yayın Yönetimi ekranına geçebilirsin.",
  },
];

export function kityTuruKapsaminda(kimlik: Pick<AuthKullanici, "rol" | "kimlik_turu">): boolean {
  return kimlik.kimlik_turu === "kullanici" && URETICI_ROLLER.includes(kimlik.rol.trim().toLowerCase());
}

export function kityKarsilamasi(ad: string): RehberAdimi {
  return {
    hedefId: "kity-uretici-karsilama",
    baslik: ad.trim() ? `Merhaba ${ad.trim()}!` : "Merhaba!",
    aciklama: KITY_METINLERI.merhaba,
  };
}
