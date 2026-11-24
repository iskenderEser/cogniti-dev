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

export type ProformaToastTuru =
  | "kko"
  | "esnek"
  | "abonelik"
  | "viva"
  | "banner"
  | "agora"
  | "icerik"
  | "firmastore"
  | "eczane";

const PROFORMA_TOAST_ADLARI: Record<ProformaToastTuru, string> = {
  kko: "Kullandığın Kadar Öde",
  esnek: "Esnek Paket",
  abonelik: "Aylık Abonelik",
  viva: "Viva Kullanımı",
  banner: "Banner Alımı",
  agora: "Agora Yayını Alımı",
  icerik: "İçerik Üretimi Alımı",
  firmastore: "FirmaStore Çekleri",
  eczane: "Eczane Çekleri",
};

export const SUREC4_TOAST = {
  proformaOnaylandi: (tur: ProformaToastTuru, adminOnayi: boolean) =>
    adminOnayi
      ? `${PROFORMA_TOAST_ADLARI[tur]} proforma faturası firma adına onaylandı.`
      : `${PROFORMA_TOAST_ADLARI[tur]} proforma faturası onaylandı.`,
} as const;

export const SUREC5_TOAST = {
  icerikUretimiOnaylandi: "Siparişiniz başarıyla işleme alınmıştır.",
  iuAtamaGuncellendi: "İçerik üreticisi ataması güncellendi.",
  gorevDevredildi: "Görev yeni içerik üreticisine devredildi.",
} as const;

export const SUREC6_TOAST = {
  yayinaAlindi: (urunAdi: string) =>
    urunAdi.trim() ? `${urunAdi.trim()} yayına alındı.` : "Öğrenme içeriği yayına alındı.",
  yayinPlanlandi: (tarihMetni: string) => `Yayın ${tarihMetni} için planlandı.`,
  planHemenYayinlandi: "Yayın hemen yayına alındı.",
  planTarihiGuncellendi: "Yayın tarihi ve token rezervasyonu güncellendi.",
  planIptalEdildi:
    "Plan iptal edildi; ayrılan tokenlar serbest bırakıldı ve içerik yayına bekleyenlere döndü.",
  yayinDurduruldu: "Yayın durduruldu.",
  yayinYenidenBaslatildi: "Yayın yeniden başlatıldı.",
  yayinAdayiSilindi: "Yayın adayı kalıcı olarak silindi.",
} as const;

export const SUREC7_TOAST = {
  limitAsildi: "Tek seferde en fazla 3 yayın önerilebilir.",
  oneriGonderildi: (adet: number) => `${adet} öneri gönderildi ve bilgilendirme e-postası iletildi.`,
  oneriKismiGonderildi: (basarili: number, basarisiz: number) =>
    `${basarili} öneri gönderildi, ${basarisiz} öneri gönderilemedi. Gönderilemeyen yayınlar seçili kaldı.`,
} as const;

export const SUREC8_TOAST = {
  puanKazanildiTek: (parca: string) => `${parca} kazandınız. Tebrikler!`,
  puanKazanildiCoklu: (govde: string, toplam: number) =>
    `${govde}, toplamda ${toplam} puan kazandınız. Tebrikler!`,
  puanSaatleriDisi: "Puan kazanma saatleri dışında izlendi.",
  ileriSarmaPuanKaybi: (kaybedilenPuan: number) =>
    `İleri sarma kaydedildi: ${kaybedilenPuan} puan kaybettiniz.`,
  ileriSarmaSoruHakkiKapandi: "İleri sarma kaydedildi. Bu izleme için soru hakkı kapandı.",
  soruHakkiNedenleri: {
    ileri_sarma: "Öğrenme içeriğinde ileri gidildiği için bu tamamlama sonunda sorular gösterilmeyecek.",
    yarim_deneme: "Bu turda daha önce yarım kalan bir deneme olduğu için sorular gösterilmeyecek.",
    tekrar_izleme: "Bu öğrenme içeriği bu turda daha önce tamamlandığı için sorular tekrar gösterilmeyecek.",
    puan_disinda: "Puan saatleri dışında tamamlandığı için sorular gösterilmeyecek.",
  } as Record<string, string>,
  begeniHatasi: "Beğeni işlemi başarısız.",
  favoriHatasi: "Favori işlemi başarısız.",
} as const;

export const SUREC9_TOAST = {
  challengeGonderildi: (adet: number) => `${adet} challenge gönderildi.`,
  izlemePuaniKazanildi: (puan: number) => `+${puan} puan kazandınız!`,
  netPuanKazanildi: (net: number) => `Net +${net} puan kazandınız!`,
  netPuanKaybi: (net: number) => `Net ${Math.abs(net)} puan kaybettiniz.`,
  ileriSarmaSoruYok: "Öğrenme içeriğinde ileri gidildiği için sorular gösterilmeyecek.",
  icerikYayindaDegil: "İçerik şu an yayında değil.",
  begeniHatasi: "Beğeni işlemi başarısız.",
  favoriHatasi: "Favori işlemi başarısız.",
} as const;

export const SUREC10_TOAST = {
  eczaneEklendi: "Eczane listenize eklendi.",
  eczaneCikarildi: "Eczane listenizden çıkarıldı.",
  kisiEklendi: "Kişi eklendi.",
  kisiGuncellendi: "Kişi güncellendi.",
  kisiPasifeAlindi: "Kişi pasife alındı.",
  takimAdiKaydedildi: "Takım adı kaydedildi.",
  yayinSecimLimiti: "Tek işlemde en fazla 20 yayın seçebilirsiniz.",
  izlemePuaniKazanildi: (netPuan: number) => `+${netPuan} net izleme puanı kazandınız!`,
  izlemePuaniKazanildiKayipli: (netPuan: number, brutPuan: number, kayip: number) =>
    `+${netPuan} net izleme puanı kazandınız! (${brutPuan} brüt - ${kayip} ileri sarma kaybı)`,
  cevapPuaniKazanildi: (puan: number) => `+${puan} cevaplama puanı kazandınız!`,
  ileriSarmaPuanKaybi: (kayip: number) =>
    `İleri sarma kaydedildi: ${kayip} puan kaybettiniz ve soru hakkınız kapandı.`,
  ileriSarmaSoruYok: "İleri sarma kaydedildi; bu izleme sonunda sorular gösterilmeyecek.",
  ileriSarmaSoruGosterilmeyecek:
    "Öğrenme içeriğinde ileri gidildiği için bu tamamlama sonunda sorular gösterilmeyecek.",
  cekTalebiIptalEdildi: "Çek talebi iptal edildi; talebe bağlı puan kullanımı kaldırıldı.",
  uttSiparisOnaylandi: "Sipariş onaylandı ve BM onayına gönderildi.",
  bmSiparisOnaylandi: "Sipariş BM tarafından onaylandı.",
} as const;

export const SUREC11_TOAST = {
  uyeDavetiGonderildi: "Üye kaydedildi; 24 saat geçerli şifre oluşturma daveti e-postasına gönderildi.",
  uyeDavetiGonderilemedi: "Üye kaydedildi ancak davet e-postası gönderilemedi.",
  davetYenidenGonderildi: "Şifre oluşturma daveti yeniden gönderildi.",
  davetGuncellendi: "Bekleyen davet bilgileri güncellendi ve yeni davet gönderildi.",
  davetIptalEdildi: "Bekleyen davet iptal edildi.",
  baglamaTalebiGonderildi: "Bağlantı onay talebi üyeye gönderildi.",
  baglamaOnaylandi: "Eczane bağlantısı onaylandı.",
  baglamaReddedildi: "Eczane bağlantı talebi reddedildi.",
  uyeDurumGuncellendi: "Üye durumu güncellendi.",
  uyeListedenSilindi: "Üye eczane listenizden silindi.",
  indirimTalebiGonderildi: "İndirim talebiniz eczanenizin onayına gönderildi.",
  indirimTalebiIptalEdildi: "İndirim talebi iptal edildi; puanınız değişmedi.",
  siparisOnaylandi: (indirimMetni: string, islemKodu: string) =>
    `Sipariş onaylandı — ${indirimMetni} indirim (${islemKodu}).`,
  siparisReddedildi: "İndirim talebi reddedildi.",
} as const;

export const SUREC12_TOAST = {
  cekTalebiAlindi: "Çek talebiniz alındı.",
  kullaniciTalepIptalEdildi: "Talebiniz iptal edildi ve puanınız iade edildi.",
  adminTalepHazirlaniyor: "Talep hazırlamaya alındı.",
  adminCekTeslimEdildi: "Çek kodları teslim edildi ve e-posta gönderimi başlatıldı.",
  adminTalepIptalEdildi: "Talep iptal edildi ve puan kullanıcıya iade edildi.",
  adminEpostaYenidenKuyrukta: "Hediye çeki e-postası yeniden gönderim kuyruğuna alındı.",
} as const;

export const SUREC13_TOAST = {
  taslakKaydedildi: "Etkinlik taslak olarak kaydedildi.",
  yayinPlanlandi: "Viva canlı yayını planlandı ve davetler gönderildi.",
  anlikYayinOlusturuldu: "Canlı yayın oluşturuldu; yayın odasına yönlendiriliyorsunuz.",
  etkinlikGuncellendi: "Etkinlik bilgileri güncellendi.",
  etkinlikIptalEdildi: "Etkinlik iptal edildi ve katılımcılara bilgilendirme e-postası gönderildi.",
  ozelDavetOlusturuldu: "Özel davet bağlantısı oluşturuldu.",
  davetYenidenGonderildi: "Davet e-postası yeniden gönderildi.",
  davetIptalEdildi: "Davet iptal edildi.",
  baglantiKopyalandi: "Bağlantı kopyalandı.",
  katilimciCikarildi: "Katılımcı çıkarıldı.",
  gorusmeBitirildi: "Görüşme herkes için bitirildi.",
  kayitKontrolSirada: "Kayıt kontrolü sıraya alındı. Sonuçlar otomatik güncellenecek.",
  dogrulamaKoduGonderildi: "Doğrulama kodu davetteki e-posta adresine gönderildi.",
  epostaDogrulandi: "E-posta adresiniz doğrulandı.",
} as const;

export const SUREC14_TOAST = {
  basvuruAlindi: "İş partnerliği başvurunuz alındı. Bilgilendirme e-postası adresinize gönderildi.",
  basvuruOnaylandi: "Başvuru onaylandı ve partnere şifre oluşturma daveti gönderildi.",
  basvuruOnaylandiAdli: (adSoyad: string) =>
    `${adSoyad} başvurusu onaylandı; şifre oluşturma daveti gönderildi.`,
  basvuruReddedildi: "Başvuru reddedildi ve bilgilendirme e-postası gönderildi.",
  basvuruReddedildiAdli: (adSoyad: string) =>
    `${adSoyad} başvurusu reddedildi ve bilgilendirme e-postası gönderildi.`,
  sifreOlusturuldu: "Şifreniz oluşturuldu. Partner girişi sayfasından giriş yapabilirsiniz.",
  erisimAcildi: "Partner erişimi açıldı ve bilgilendirme e-postası gönderildi.",
  erisimKapatildi: "Partner erişimi kapatıldı ve bilgilendirme e-postası gönderildi.",
  adminYayinAktif: "Yayın aktife alındı ve partnere bilgi verildi.",
  adminYayinPasif: "Yayın pasife alındı ve partnere bilgi verildi.",
  adminYayinSilindi: "Yayın silindi ve partnere bilgi verildi.",
} as const;

export const SUREC15_TOAST = {
  yayinSiparisMevcut: "Bu yayın için daha önce sipariş verdiniz.",
  yayinSiparisTamamlandi: (borcToken = 0) =>
    "Yayın siparişiniz tamamlandı ve yayın havuzunuza eklendi." +
    (borcToken > 0 ? ` ${borcToken.toLocaleString("tr-TR")} token borca yazıldı.` : ""),
  canliSiparisTamamlandi: (egitimAdi: string, borcToken = 0) =>
    `“${egitimAdi}” canlı yayın oturumu için siparişiniz oluşturuldu.` +
    (borcToken > 0 ? ` ${borcToken.toLocaleString("tr-TR")} token borca yazıldı.` : ""),
  yayinAyarlariKaydedildi: "Yayın ayarları kaydedildi; puan ve tarih seçerek yayına alabilirsiniz.",
  yayinYonetimineEklendi: "Agora yayını yayın yönetimine eklendi.",
} as const;

export const SUREC16_TOAST = {
  taslakKaydedildi: "Sınav taslak olarak kaydedildi.",
  hazirListeYayinlandi:
    "Sınav yayınlandı ve hazır listedeki katılımcılara davet e-postası gönderildi.",
  sinavYayinlandi: "Sınav yayınlandı.",
  sinavKapatildi: "Sınav katılıma kapatıldı.",
  sinavSilindi: "Sınav silindi.",
  baglantiKopyalandi: "Sınav katılım bağlantısı panoya kopyalandı.",
  raporIndirildi: "Sınav raporu Excel olarak indirildi.",
} as const;



