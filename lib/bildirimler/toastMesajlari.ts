// lib/bildirimler/toastMesajlari.ts
//
// Cogniti süreç bazlı standart toast mesajları — tek doğruluk kaynağı.
// Üretim hattı (Süreç 5) mesajları lib/uretim/toastMesaj.ts içinde tutulur.

export type ToastTuru = "basari" | "hata" | "uyari" | "bilgi";

const SONRAKI_SAYFA_TOAST_ANAHTARI = "cogniti_sonraki_sayfa_toast";

export function sonrakiSayfaToastYaz(mesaj: string, tur: ToastTuru = "basari"): void {
  try {
    sessionStorage.setItem(SONRAKI_SAYFA_TOAST_ANAHTARI, JSON.stringify({ mesaj, tur }));
  } catch {
    // Oturum depolaması kapalıysa sessizce geç.
  }
}

export function sonrakiSayfaToastOku(): { mesaj: string; tur: ToastTuru } | null {
  try {
    const ham = sessionStorage.getItem(SONRAKI_SAYFA_TOAST_ANAHTARI);
    if (!ham) return null;
    sessionStorage.removeItem(SONRAKI_SAYFA_TOAST_ANAHTARI);
    const veri = JSON.parse(ham) as { mesaj?: unknown; tur?: unknown };
    if (typeof veri?.mesaj !== "string" || !veri.mesaj.trim()) return null;
    const tur: ToastTuru =
      veri.tur === "hata" || veri.tur === "uyari" || veri.tur === "bilgi" ? veri.tur : "basari";
    return { mesaj: veri.mesaj, tur };
  } catch {
    return null;
  }
}

export const SUREC1_TOAST = {
  onBasvuruAlindi: "Üyelik ön başvurunuz alındı. Bilgilendirme e-postası adresinize gönderildi.",
  onBasvuruOnaylandi: "Üyelik ön başvurusu onaylandı ve 48 saatlik davet e-postası gönderildi.",
  onBasvuruSilindi: "Üyelik ön başvurusu silindi.",
  davetDogrulandi: "Davetiniz doğrulandı. Kurumsal üyelik formunu doldurabilirsiniz.",
  firmaBilgisiTaslakKaydedildi: "Firma bilgileri taslak olarak kaydedildi.",
  belgeYuklendi: (belgeAdi: string) => `${belgeAdi} yüklendi.`,
  listeTaslakKaydedildi: (urunListesi: boolean) =>
    `${urunListesi ? "Ürün" : "Kullanıcı"} listesi taslak olarak kaydedildi.`,
  listeSilindi: (urunListesi: boolean) =>
    `${urunListesi ? "Ürün" : "Kullanıcı"} listesi temizlendi.`,
  kurumsalBasvuruGonderildi:
    "Kurumsal üyelik başvurunuz gönderildi. Bilgilendirme e-postası adresinize iletildi.",
  kurumsalBasvuruOnaylandi: (firmaAdi: string) =>
    `${firmaAdi} kurumsal üyeliği onaylandı. Firma hesabı oluşturuldu ve onay e-postası gönderildi.`,
  kurumsalBasvuruReddedildi: (firmaAdi: string) =>
    `${firmaAdi} başvurusu reddedildi ve düzeltme e-postası gönderildi.`,
} as const;

export const SUREC2_TOAST = {
  sifreSifirlamaIstendi:
    "E-posta adresiniz sistemde kayıtlıysa şifre sıfırlama bağlantısı gönderilecektir. Lütfen gelen ve spam kutunuzu kontrol edin.",
  sifreGuncellendi:
    "Şifreniz güncellendi ve bilgilendirme e-postası gönderildi. Yeni şifrenizle giriş yapabilirsiniz.",
  sifreOlusturuldu:
    "Şifreniz oluşturuldu. E-posta adresiniz ve şifrenizle giriş yapabilirsiniz.",
  firmaAdminAcildi:
    "Firma Admini erişimi açıldı ve bilgilendirme e-postası gönderildi.",
  firmaAdminKapatildi:
    "Firma Admini erişimi kapatıldı. Yönetim yetkisi Cogniti’ye geçti.",
  kullaniciEklendi: (adSoyad: string) =>
    `${adSoyad || "Kullanıcı"} eklendi ve 24 saatlik şifre oluşturma daveti e-posta ile gönderildi.`,
  topluYuklemeTamamlandi: ({
    eklenen,
    guncellenen,
    degismeyen,
  }: {
    eklenen: number;
    guncellenen: number;
    degismeyen: number;
  }) => {
    const parcalar: string[] = [];
    if (eklenen > 0) parcalar.push(`${eklenen} yeni kullanıcı eklendi`);
    if (guncellenen > 0) parcalar.push(`${guncellenen} kullanıcı güncellendi`);
    if (degismeyen > 0 && parcalar.length === 0) parcalar.push(`${degismeyen} kayıtta değişiklik bulunmadı`);
    const ozet = parcalar.length > 0 ? parcalar.join(", ") : "Toplu yükleme tamamlandı";
    return eklenen > 0
      ? `${ozet} — yeni kullanıcıların 24 saatlik şifre davetleri gönderildi.`
      : `${ozet}.`;
  },
  davetYenidenGonderildi: "24 saatlik şifre oluşturma daveti yeniden gönderildi.",
  kullaniciGuncellendi: "Kullanıcı bilgileri güncellendi.",
  rolGuncellendi: "Kullanıcı rolü güncellendi ve bilgilendirme e-postası gönderildi.",
  kullaniciPasifeAlindi: "Kullanıcı pasife alındı ve bilgilendirme e-postası gönderildi.",
  kullaniciAktifEdildi: "Kullanıcı yeniden aktif edildi ve bilgilendirme e-postası gönderildi.",
  topluPasifeAlindi: (adet: number) =>
    `${adet} kullanıcı pasife alındı ve bilgilendirme e-postaları gönderildi.`,
  yetkiGuncellendi: "Kullanıcı yetkisi güncellendi.",
  eksikBilgiTamamlandi: "Eksik kullanıcı bilgisi tamamlandı.",
  telefonKaydedildi: "Kullanıcı telefonu kaydedildi.",
  kullaniciSilindi: "Kullanıcı silindi.",
  topluSilindi: (adet: number) => `${adet} kullanıcı silindi.`,
  firmaOlusturuldu: "Yeni firma oluşturuldu.",
  firmaAktiflestirildi: "Firma aktifleştirildi.",
  firmaPasiflestirildi: "Firma pasifleştirildi.",
  logoKimlikGuncellendi: "Logo ve kimlik ayarları güncellendi.",
} as const;

export const SUREC3_TOAST = {
  abonelikTanimlandi: (hesapTuru: "kisisel" | "firma_ortak", tokenAdedi: number) =>
    `Aylık abonelik paketi tanımlandı. ${tokenAdedi.toLocaleString("tr-TR")} token ${hesapTuru === "kisisel" ? "kişisel hesabınıza" : "firma ortak hesabına"} yüklendi.`,
  esnekPaketTanimlandi: (hesapTuru: "kisisel" | "firma_ortak", tokenAdedi: number) =>
    `Esnek paket tanımlandı. ${tokenAdedi.toLocaleString("tr-TR")} token ${hesapTuru === "kisisel" ? "kişisel hesabınıza" : "firma ortak hesabına"} yüklendi.`,
  kkoTanimlandi: (hesapTuru: "kisisel" | "firma_ortak") =>
    `Kullandığın Kadar Öde (KKÖ) paketi ${hesapTuru === "kisisel" ? "kişisel hesabınız" : "firma ortak hesabı"} için tanımlandı.`,
} as const;
