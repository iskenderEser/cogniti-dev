// lib/push/icerik.ts
//
// OLAY × ROL → İÇERİK TEK KAYNAĞI (P5, K-P10 — koda dağılmış string yok).
// C.4 orkestrasyon olay haritasının kod karşılığı: aynı olay farklı role
// farklı metinle gider; rol tanımadığı olaya null döner (o alıcıya push yok).
//
// K-P6 — PII TAŞIMAZ: metinler jeneriktir (kişi/içerik adı yok); ayrıntı
// tıklamada uygulama içinden (authed) görülür. Eczanem'de müşteri kimliği
// hiçbir yüke girmez (İP-§9, TR §5.5).
//
import { panelBaslangici } from "@/lib/panel/baslangic";
import { IU_ROLU, MUSTERI_ROLU, URETICI_ROLLER, TUKETICI_ROLLER, ECLUB_TUKETICI_ROLLERI } from "@/lib/utils/roller";
import { eclubFirmaYolu } from "@/lib/eclub/firmaGezinme";
import type { PushBaglami, PushOlayTuru, PushYuku } from "./tipler";

function icKullaniciYuku(baslik: string, govde: string, rol: string): PushYuku {
  return { baslik, govde, url: panelBaslangici(rol).yol };
}

/**
 * (olay, gönderim anındaki rol) → yük. Bilinmeyen rol/olay eşleşmesi null:
 * push gitmez — in-app bildirim zaten asıl kayıttır (K-P3).
 */
export function icerikUret(olayTuru: PushOlayTuru, aliciRol: string, baglam: PushBaglami = {}): PushYuku | null {
  if (!aliciRol) return null; // rolCozucu boş döndüyse kimlik çözülememiştir

  switch (olayTuru) {
    case "uretim_durum_gecisi":
      if (aliciRol === IU_ROLU) {
        return icKullaniciYuku("Cogniti — Üretim Hattı", "Bir içerik sizden işlem bekliyor.", aliciRol);
      }
      if (URETICI_ROLLER.includes(aliciRol)) {
        return { baslik: "Cogniti — Üretim Hattı", govde: "Bir içeriğinizin durumu güncellendi.", url: "/yayin-takip" };
      }
      // Diğer iç roller (ör. bilgilendirme amaçlı alıcılar) için jenerik metin.
      return icKullaniciYuku("Cogniti", "Sizi ilgilendiren bir gelişme var.", aliciRol);

    case "video_onerisi":
      if (TUKETICI_ROLLER.includes(aliciRol)) {
        return { baslik: "Cogniti", govde: "Size yeni bir öğrenme içeriği önerildi.", url: baglam.yayinId ? `/ana-sayfa?yayin_id=${encodeURIComponent(baglam.yayinId)}${baglam.bagId ? `&oneri_id=${encodeURIComponent(baglam.bagId)}` : ""}` : "/ana-sayfa" };
      }
      return null;

    case "video_yayini":
      if (TUKETICI_ROLLER.includes(aliciRol)) {
        return { baslik: "Cogniti", govde: "Yeni bir öğrenme içeriği yayında.", url: baglam.yayinId ? `/ana-sayfa?yayin_id=${encodeURIComponent(baglam.yayinId)}` : "/ana-sayfa" };
      }
      return null;

    case "eclub_oneri":
      if (ECLUB_TUKETICI_ROLLERI.includes(aliciRol)) {
        return { baslik: "Cogniti E-Club", govde: "Eczanenize yeni bir öğrenme içeriği önerildi.", url: `${baglam.firmaId ? eclubFirmaYolu(baglam.firmaId, "yayinlar") : "/eclub/ana-sayfa"}${baglam.bagId ? `?oneri_id=${encodeURIComponent(baglam.bagId)}` : ""}` };
      }
      return null;

    case "eclub_cek_teslim":
      if (ECLUB_TUKETICI_ROLLERI.includes(aliciRol)) {
        return {
          baslik: "Cogniti E-Club",
          govde: "Eczanenizin Migros hediye çeki hazır.",
          url: `${baglam.firmaId ? eclubFirmaYolu(baglam.firmaId, "cek-talepleri") : "/eclub/cek-taleplerim"}${baglam.bagId ? `?talep_id=${encodeURIComponent(baglam.bagId)}` : ""}`,
        };
      }
      return null;

    case "challenge":
      return baglam.yayinId
        ? { baslik: "Challenge Club", govde: "Size bir challenge geldi.", url: `/challenge-club/izle/${encodeURIComponent(baglam.yayinId)}${baglam.bagId ? `?challenge_id=${encodeURIComponent(baglam.bagId)}` : ""}` }
        : icKullaniciYuku("Challenge Club", "Size bir challenge geldi.", aliciRol);

    case "eczanem_gonderim":
      if (aliciRol === MUSTERI_ROLU) {
        return { baslik: "Eczanem", govde: "Eczanenizden yeni bir öğrenme içeriği var.", url: baglam.bagId ? `/eczanem?gonderim_id=${encodeURIComponent(baglam.bagId)}` : "/eczanem" };
      }
      return null;

    case "eczanem_siparis":
      if (ECLUB_TUKETICI_ROLLERI.includes(aliciRol)) {
        return { baslik: "Eczanem", govde: "Bir işlem onayınızı bekliyor.", url: "/eczanem/eczane" };
      }
      if (aliciRol === MUSTERI_ROLU) {
        return { baslik: "Eczanem", govde: "Siparişinizde gelişme var.", url: "/eczanem" };
      }
      return null;

    case "store_siparis":
      if (ECLUB_TUKETICI_ROLLERI.includes(aliciRol)) {
        return { baslik: "FirmaStore", govde: "Siparişinizde gelişme var.", url: "/eclub/store" };
      }
      return icKullaniciYuku("FirmaStore", "Siparişinizde gelişme var.", aliciRol);
  }
}
