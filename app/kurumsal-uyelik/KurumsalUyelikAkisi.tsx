"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, Lock, Send } from "lucide-react";
import YeniFirmaFormu from "@/app/admin/_components/YeniFirmaFormu";
import type { YeniFirmaBilgileri } from "@/app/admin/_types";
import adminStyles from "@/app/admin/admin.module.css";
import formStyles from "@/app/admin/_components/yeni-firma-formu.module.css";
import styles from "@/app/login/login.module.css";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { sonrakiSayfaToastOku, SUREC1_TOAST } from "@/lib/bildirimler/toastMesajlari";
import IsimListesiSablonu from "./IsimListesiSablonu";
import SozlesmeBelgeleri, { type YukluBelgeDurumu } from "./SozlesmeBelgeleri";

type BasvuruDurumu = "taslak" | "incelemede" | "onaylandi" | "reddedildi";

type SunucuBasvuru = {
  durum: BasvuruDurumu;
  firma_bilgileri: Partial<YeniFirmaBilgileri>;
  belgeler: {
    logo: { yuklu: boolean; dosya_adi: string | null; url: string | null };
    sozlesme: { yuklu: boolean; dosya_adi: string | null };
    ticaret_sicil: { yuklu: boolean; dosya_adi: string | null };
    vergi_levhasi: { yuklu: boolean; dosya_adi: string | null };
  };
  isim_listesi: string[][];
  urun_listesi: string[][];
  gonderildi_at: string | null;
  karar_at: string | null;
  karar_notu: string | null;
};

export default function KurumsalUyelikAkisi({
  sozlesmeYolu,
  kullaniciSutunlari,
  urunSutunlari,
  secimMenuClassName,
}: {
  sozlesmeYolu: string | null;
  kullaniciSutunlari: string[];
  urunSutunlari: string[];
  secimMenuClassName: string;
}) {
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yuklemeHatasi, setYuklemeHatasi] = useState("");
  const [basvuru, setBasvuru] = useState<SunucuBasvuru | null>(null);
  const [adim1Tamam, setAdim1Tamam] = useState(false);
  const [adim2Tamam, setAdim2Tamam] = useState(false);
  const [gonderOnayAcik, setGonderOnayAcik] = useState(false);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const { mesajlar, basari, hata } = useHataMesaji();

  const firmaBilgisiRef = useRef<Partial<YeniFirmaBilgileri>>({});
  const isimListesiRef = useRef<string[][]>([]);
  const urunListesiRef = useRef<string[][]>([]);
  const ilkYuklemeBittiRef = useRef(false);
  const taslakZamanlayici = useRef<number | null>(null);

  useEffect(() => {
    const bekleyen = sonrakiSayfaToastOku();
    if (bekleyen) {
      if (bekleyen.tur === "hata") hata(bekleyen.mesaj);
      else basari(bekleyen.mesaj);
    }
  }, [basari, hata]);

  useEffect(() => {
    const kontrol = new AbortController();
    void (async () => {
      try {
        const yanit = await fetch("/kurumsal-uyelik/api/basvuru", {
          signal: kontrol.signal,
          cache: "no-store",
        });
        if (!yanit.ok) throw new Error("Başvuru bilgileri alınamadı.");
        const veri: SunucuBasvuru = await yanit.json();
        if (kontrol.signal.aborted) return;
        firmaBilgisiRef.current = {
          ...veri.firma_bilgileri,
          logo_url: veri.belgeler.logo.url ?? "",
        };
        isimListesiRef.current = veri.isim_listesi;
        urunListesiRef.current = veri.urun_listesi;
        setBasvuru(veri);
        setYuklemeHatasi("");
      } catch {
        if (!kontrol.signal.aborted) {
          setYuklemeHatasi("Başvuru bilgileri alınamadı. Sayfayı yenileyin.");
        }
      } finally {
        if (!kontrol.signal.aborted) {
          setYukleniyor(false);
          window.setTimeout(() => {
            ilkYuklemeBittiRef.current = true;
          }, 0);
        }
      }
    })();
    return () => {
      kontrol.abort();
      if (taslakZamanlayici.current) window.clearTimeout(taslakZamanlayici.current);
    };
  }, []);

  const kilitliForm = basvuru?.durum === "incelemede" || basvuru?.durum === "onaylandi";

  const firmaBilgisiDegisti = useCallback((bilgiler: YeniFirmaBilgileri) => {
    firmaBilgisiRef.current = bilgiler;
    if (!ilkYuklemeBittiRef.current || kilitliForm) return;
    if (taslakZamanlayici.current) window.clearTimeout(taslakZamanlayici.current);
    taslakZamanlayici.current = window.setTimeout(() => {
      const { logo_url: _logo, ...firmaAlani } = bilgiler;
      void _logo;
      void fetch("/kurumsal-uyelik/api/basvuru", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firma_bilgileri: firmaAlani }),
      }).then((yanit) => {
        if (yanit.ok) basari(SUREC1_TOAST.firmaBilgisiTaslakKaydedildi);
      }).catch(() => {});
    }, 800);
  }, [basari, kilitliForm]);

  const logoYukle = useCallback(async (dosya: File): Promise<{ url: string; dosyaAdi: string } | { hata: string }> => {
    const formData = new FormData();
    formData.append("tur", "logo");
    formData.append("dosya", dosya);
    try {
      const yanit = await fetch("/kurumsal-uyelik/api/basvuru/belge", {
        method: "POST",
        body: formData,
      });
      const veri = await yanit.json().catch(() => null);
      if (!yanit.ok || typeof veri?.url !== "string") {
        const hataMetni = veri?.hata || "Logo yüklenemedi.";
        hata(hataMetni);
        return { hata: hataMetni };
      }
      basari(SUREC1_TOAST.belgeYuklendi("Firma logosu"));
      return { url: veri.url, dosyaAdi: typeof veri.dosya_adi === "string" ? veri.dosya_adi : dosya.name };
    } catch {
      const hataMetni = "Logo yüklenemedi. Bağlantınızı kontrol edin.";
      hata(hataMetni);
      return { hata: hataMetni };
    }
  }, [basari, hata]);

  const logoKaldir = useCallback(async () => {
    try {
      await fetch("/kurumsal-uyelik/api/basvuru/belge?tur=logo", { method: "DELETE" });
    } catch {
      // Kullanıcı logoyu tekrar yükleyebilir.
    }
  }, []);

  const isimSatirlariDegisti = useCallback((satirlar: string[][]) => {
    isimListesiRef.current = satirlar;
  }, []);

  const urunSatirlariDegisti = useCallback((satirlar: string[][]) => {
    urunListesiRef.current = satirlar;
  }, []);

  const isimTaslakKaydet = useCallback(async (satirlar: string[][]): Promise<{ ok: true } | { ok: false; hata: string }> => {
    try {
      const yanit = await fetch("/kurumsal-uyelik/api/basvuru", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isim_listesi: satirlar }),
      });
      const veri = await yanit.json().catch(() => null);
      if (!yanit.ok) return { ok: false, hata: veri?.hata || "İsim listesi kaydedilemedi." };
      return { ok: true };
    } catch {
      return { ok: false, hata: "İsim listesi kaydedilemedi." };
    }
  }, []);

  const urunTaslakKaydet = useCallback(async (satirlar: string[][]): Promise<{ ok: true } | { ok: false; hata: string }> => {
    try {
      const yanit = await fetch("/kurumsal-uyelik/api/basvuru", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urun_listesi: satirlar }),
      });
      const veri = await yanit.json().catch(() => null);
      if (!yanit.ok) return { ok: false, hata: veri?.hata || "Ürün listesi kaydedilemedi." };
      return { ok: true };
    } catch {
      return { ok: false, hata: "Ürün listesi kaydedilemedi." };
    }
  }, []);

  async function basvuruyuGonder() {
    if (gonderiliyor || kilitliForm) return;
    setGonderiliyor(true);
    try {
      const { logo_url: _logo, ...firmaAlani } = firmaBilgisiRef.current;
      void _logo;
      const yanit = await fetch("/kurumsal-uyelik/api/basvuru", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firma_bilgileri: firmaAlani,
          isim_listesi: isimListesiRef.current,
          urun_listesi: urunListesiRef.current,
        }),
      });
      const veri = await yanit.json().catch(() => null);
      if (!yanit.ok) {
        hata(veri?.hata || "Başvuru gönderilemedi. Eksik alanları kontrol edin.");
        setGonderOnayAcik(false);
        return;
      }
      setBasvuru((onceki) => onceki ? {
        ...onceki,
        durum: "incelemede",
        gonderildi_at: veri?.gonderildi_at ?? new Date().toISOString(),
        karar_notu: null,
      } : onceki);
      setGonderOnayAcik(false);
      basari(SUREC1_TOAST.kurumsalBasvuruGonderildi);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      hata("Başvuru gönderilemedi. Bağlantınızı kontrol edip tekrar deneyin.");
      setGonderOnayAcik(false);
    } finally {
      setGonderiliyor(false);
    }
  }

  if (yukleniyor) {
    return <p role="status" className="py-8 text-center text-sm text-(--tema-ikincil-metin)">Kurumsal üyelik bilgileriniz yükleniyor…</p>;
  }

  if (yuklemeHatasi || !basvuru) {
    return <p role="alert" className={adminStyles.notice}>{yuklemeHatasi || "Başvuru bilgileri yüklenemedi."}</p>;
  }

  const ilkBelgeler: YukluBelgeDurumu = {
    sozlesme: basvuru.belgeler.sozlesme,
    ticaret_sicil: basvuru.belgeler.ticaret_sicil,
    vergi_levhasi: basvuru.belgeler.vergi_levhasi,
  };

  return (
    <>
      <HataMesajiContainer mesajlar={mesajlar} />
      {basvuru.durum === "reddedildi" && (
        <div role="alert" className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <div className="mb-1.5 flex items-center gap-2 font-semibold">
            <AlertTriangle size={18} aria-hidden="true" />
            <span>Başvurunuzda düzeltme / tamamlama gerekiyor</span>
          </div>
          {basvuru.karar_notu && (
            <p className="mb-2 whitespace-pre-line font-medium">{basvuru.karar_notu}</p>
          )}
          <p className="text-xs text-amber-900">
            Daha önce girdiğiniz bilgiler, yüklediğiniz belgeler ve listeler korunmuştur. İlgili alanı güncelleyip sayfanın altındaki <strong>Başvuruyu Gönder</strong> butonuyla yeniden iletebilirsiniz.
          </p>
        </div>
      )}

      {basvuru.durum === "incelemede" && (
        <div role="status" className="mb-6 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
          <div className="mb-1 flex items-center gap-2 font-semibold">
            <Clock size={18} aria-hidden="true" />
            <span>Kurumsal üyelik başvurunuz incelemede</span>
          </div>
          <p className="text-xs text-sky-900">
            Firma bilgileriniz, resmi belgeleriniz ve listeleriniz Cogniti’ye iletildi. İnceleme tamamlandığında e-posta ile bilgilendirileceksiniz.
          </p>
        </div>
      )}

      {basvuru.durum === "onaylandi" && (
        <div role="status" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
          <div className="mb-1 flex items-center gap-2 font-semibold">
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>Kurumsal üyeliğiniz onaylandı</span>
          </div>
          <p className="text-xs text-emerald-900">
            Hesabınız aktifleştirildi. <Link href="/login" className="font-semibold underline">Giriş ekranından</Link> Cogniti’ye erişebilirsiniz.
          </p>
        </div>
      )}

      <section aria-labelledby="firma-bilgileri-baslik">
        <h2 id="firma-bilgileri-baslik" className={styles.kurumsalUyelikAdimBasligi}>
          <span className={styles.kurumsalUyelikAdimNumarasi}>1</span>
          <span>Firma Bilgileri</span>
          {adim1Tamam && (
            <span className={`${styles.kurumsalUyelikAdimTamam} inline-flex items-center gap-1`}>
              <CheckCircle2 size={15} aria-hidden="true" />
              Tamamlandı
            </span>
          )}
        </h2>
        <p className={styles.kurumsalUyelikAdimNotu}>
          Kurumsal hesabınızın tanımlanması ve sözleşme süreçleri için firmanıza ait resmi bilgileri ve kurumsal logonuzu eksiksiz doldurun. (Logo: PNG, JPEG, SVG veya WebP, en fazla 5 MB)
        </p>
        <YeniFirmaFormu
          kurumsalUyelik
          kilitli={kilitliForm}
          ilkBilgiler={{
            ...basvuru.firma_bilgileri,
            logo_url: basvuru.belgeler.logo.url ?? "",
          }}
          ilkLogoDosyaAdi={basvuru.belgeler.logo.dosya_adi ?? ""}
          secimMenuClassName={secimMenuClassName}
          onDurumDegisimi={setAdim1Tamam}
          onBilgiDegisimi={firmaBilgisiDegisti}
          onLogoYukle={logoYukle}
          onLogoKaldir={logoKaldir}
        />
      </section>

      <section className={styles.kurumsalUyelikSozlesmeler} aria-labelledby="sozlesmeler-baslik">
        <h2 id="sozlesmeler-baslik" className={styles.kurumsalUyelikAdimBasligi}>
          <span className={styles.kurumsalUyelikAdimNumarasi}>2</span>
          <span>Sözleşmeler</span>
          {!adim1Tamam && !kilitliForm ? (
            <span className={`${styles.kurumsalUyelikAdimKilitNotu} inline-flex items-center gap-1`}>
              <Lock size={14} aria-hidden="true" />
              Önce 1. adımı tamamlayın
            </span>
          ) : adim2Tamam ? (
            <span className={`${styles.kurumsalUyelikAdimTamam} inline-flex items-center gap-1`}>
              <CheckCircle2 size={15} aria-hidden="true" />
              Tamamlandı
            </span>
          ) : null}
        </h2>
        <p className={styles.kurumsalUyelikAdimNotu}>
          Öncelikle <strong>Üyelik Sözleşmesi</strong>’ni indirip imzalayın. İmzalı sözleşmeyi, <strong>Ticaret Sicili Gazetesi</strong>’ni (.doc, .docx, .pdf) ve <strong>Vergi Levhası</strong>’nı (.png, .jpg, .webp, .pdf) ilgili alanlara yükleyin. Belge yükleme alanları sözleşme indirildikten sonra açılır.
        </p>
        <SozlesmeBelgeleri
          sozlesmeYolu={sozlesmeYolu}
          kilitli={!adim1Tamam && !kilitliForm}
          saltOkunur={kilitliForm}
          ilkBelgeler={ilkBelgeler}
          onDurumDegisimi={setAdim2Tamam}
          onBasari={basari}
          onHata={hata}
        />
      </section>

      <section className="mt-6" aria-labelledby="kurumsal-listeler-baslik">
        <h2 id="kurumsal-listeler-baslik" className={styles.kurumsalUyelikAdimBasligi}>
          <span className={styles.kurumsalUyelikAdimNumarasi}>3</span>
          <span>Kurumsal Listeler</span>
          {!adim2Tamam && !kilitliForm && (
            <span className={`${styles.kurumsalUyelikAdimKilitNotu} inline-flex items-center gap-1`}>
              <Lock size={14} aria-hidden="true" />
              Önce 2. adımı tamamlayın
            </span>
          )}
        </h2>
        <p className={styles.kurumsalUyelikAdimNotu}>
          Kullanıcı ve ürün listelerinizi tablodan doğrudan doldurabilir ya da örnek Excel/Word şablonunu indirip hazırlayarak yükleyebilirsiniz. Her tabloyu <strong>Kaydet</strong> ile taslak olarak saklayabilir, tüm adımlar hazır olduğunda sayfanın altındaki <strong>Başvuruyu Gönder</strong> butonuyla tek seferde iletebilirsiniz.
        </p>
        <div
          className={!adim2Tamam && !kilitliForm ? styles.kurumsalUyelikKilitli : undefined}
          aria-disabled={!adim2Tamam && !kilitliForm}
          inert={(!adim2Tamam && !kilitliForm) || undefined}
        >
          <div className={`${adminStyles.card} ${formStyles.kurumsalKart}`}>
            <div className={`${adminStyles.cardBody} ${formStyles.compactBody}`}>
              <IsimListesiSablonu
                sutunlar={kullaniciSutunlari}
                kurumsalBasvuru
                ilkSatirlar={basvuru.isim_listesi}
                kilitli={kilitliForm}
                onSatirlarDegisti={isimSatirlariDegisti}
                onTaslakKaydet={isimTaslakKaydet}
                onBasari={basari}
                onHata={hata}
              />
            </div>
          </div>
          <div className={`${adminStyles.card} ${formStyles.kurumsalKart} mt-4`}>
            <div className={`${adminStyles.cardBody} ${formStyles.compactBody}`}>
              <IsimListesiSablonu
                sutunlar={urunSutunlari}
                urunListesi
                kurumsalBasvuru
                ilkSatirlar={basvuru.urun_listesi}
                kilitli={kilitliForm}
                onSatirlarDegisti={urunSatirlariDegisti}
                onTaslakKaydet={urunTaslakKaydet}
                onBasari={basari}
                onHata={hata}
              />
            </div>
          </div>

          {!kilitliForm && (
            <div className="mt-6 flex flex-col items-end gap-3">
              <button
                type="button"
                className={`${adminStyles.button} ${adminStyles.primary} inline-flex items-center gap-2 px-6 py-2.5`}
                disabled={gonderiliyor || !adim1Tamam || !adim2Tamam}
                onClick={() => {
                  setGonderOnayAcik(true);
                }}
              >
                <Send size={16} aria-hidden="true" />
                {gonderiliyor
                  ? "Gönderiliyor…"
                  : basvuru.durum === "reddedildi"
                    ? "Düzeltilen Başvuruyu Yeniden Gönder"
                    : "Başvuruyu Gönder"}
              </button>
            </div>
          )}
        </div>
      </section>

      <AlertDialog open={gonderOnayAcik} onOpenChange={(acik) => { if (!gonderiliyor) setGonderOnayAcik(acik); }}>
        <AlertDialogContent>
          <AlertDialogTitle>Kurumsal üyelik başvurusunu gönder</AlertDialogTitle>
          <AlertDialogDescription>
            Firma bilgileriniz, resmi belgeleriniz, kullanıcı listeniz ve ürün listeniz inceleme için Cogniti’ye iletilecektir. Onaylıyor musunuz?
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={gonderiliyor}>Vazgeç</AlertDialogCancel>
            <button
              type="button"
              className={`${adminStyles.button} ${adminStyles.primary}`}
              disabled={gonderiliyor}
              onClick={() => void basvuruyuGonder()}
            >
              {gonderiliyor ? "Gönderiliyor…" : "Evet, Gönder"}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
