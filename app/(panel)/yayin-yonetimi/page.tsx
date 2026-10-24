// app/yayin-yonetimi/page.tsx
//
// Yayın yönetimi sayfası — orchestrator.
// Auth + sekme/modal state + useYayinYonetimi hook'unu bağlar; satır ve modal
// bileşenlerini render eder. Veri ve iş mantığı hook'ta, sunum _components'te.
//
// Ana sekmeler hedef role göre (şu an UTT / BM). Alt sekmeler durum filtresi
// (bekleyen / yayında / durdurulan).

"use client";

import { useEffect, useState, useCallback, useMemo, Suspense, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import { useAuth } from "@/app/providers/AuthProvider";
import { URETICI_ROLLER, ureticiYayinHedefGruplari, yayinHedefGrubuBelirle, type YayinHedefGrubu } from "@/lib/utils/roller";
import type { Bekleyen, AltSekme, OnizlemeHedefi } from "./_types";
import { useYayinYonetimi } from "./_hooks/useYayinYonetimi";
import { BekleyenSatir } from "./_components/BekleyenSatir";
import { YayinSatir } from "./_components/YayinSatir";
import { useListe, ListeArama, DahaFazlaGoster } from "@/components/liste";
import { OgrenmeAraciOnizlemeModal, YayinOnayModal, YayinSilmeModal } from "./_components/Modallar";
import { YayinKumandaPaneli, YayinDurumuToggle } from "./_components/YayinKumandaPaneli";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import MobilYayinAkisi from "@/components/yayin/MobilYayinAkisi";
import { UttYayinTuruToggle } from "@/components/yayin/UttYayinListeOrtaklari";
import { SadeZamanToggle } from "@/components/kontrol/SadeKontroller";
import type { YayinTuruFiltreDegeri } from "@/components/ogrenme-araci/YayinTuruFiltresi";
import type { Periyot } from "@/lib/utils/raporUtils";
import { aktifPeriyot, ligPeriyoduAraligi } from "@/lib/zaman/kontrol";
import { yayin_kodu } from "@/lib/utils/yayinKodu";

const ARAMA_HEDEF_KITLE_ADLARI: Record<YayinHedefGrubu, string> = {
  utt: "Temsilciler",
  bm: "Bölge Müdürleri",
  eczaci: "Eczacılar",
  eczane_teknisyeni: "Eczane Teknisyenleri",
  eczaci_ve_eczane_teknisyeni: "Eczacılar ve Eczane Teknisyenleri",
  eczanem: "Eczanem Üyeleri",
};

function ListeBasligi({ baslik, aciklama, sayi, arama }: { baslik: string; aciklama?: string; sayi: number; arama?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-col gap-3 rounded-2xl border border-[var(--tema-yerel-uretim-cizgi-36)] bg-[var(--tema-yerel-uretim-kart-01)] px-4 py-3.5 shadow-[0_6px_18px_var(--tema-yerel-uretim-golge-07)] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-extrabold text-[var(--tema-yerel-uretim-ana-metin-05)]">{baslik}</h2>
        {aciklama && <p className="mt-0.5 text-xs text-[var(--tema-yerel-uretim-yardimci-metin-41)]">{aciklama}</p>}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <span className="w-fit rounded-full bg-[var(--tema-yerel-uretim-secim-zemin-04)] px-2.5 py-1 text-[10px] font-extrabold text-[var(--tema-yerel-uretim-eylem-metin-05)]">{sayi} kayıt</span>
        {arama}
      </div>
    </div>
  );
}

function BosListe({ mesaj }: { mesaj: string }) {
  return (
    <div className="rounded-2xl border border-[var(--tema-yerel-uretim-cizgi-36)] bg-[var(--tema-yerel-uretim-kart-01)] px-6 py-12 text-center shadow-[0_6px_18px_var(--tema-yerel-uretim-golge-09)]">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--tema-yerel-uretim-secim-zemin-05)] text-[var(--tema-yerel-uretim-yardimci-metin-08)]">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M4 5h16v14H4zM8 9h8M8 13h5" /></svg>
      </span>
      <p className="mt-3 text-sm font-bold text-[var(--tema-yerel-uretim-yardimci-metin-12)]">{mesaj}</p>
    </div>
  );
}

function YayinYonetimiIcerik() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const durumParam = searchParams.get("durum");
  const hedefParam = searchParams.get("hedef");

  const baslangicDurum: AltSekme =
    durumParam === "yayinda" || durumParam === "durdurulan" || durumParam === "bekleyen"
      ? durumParam
      : "yayinda";

  const { kullanici, yukleniyor: kimlikYukleniyor } = useAuth();
  const rol = (kullanici?.rol ?? "").trim().toLowerCase();
  const anaSekmeler = useMemo(() => ureticiYayinHedefGruplari(rol), [rol]);

  const baslangicHedef: YayinHedefGrubu | null =
    hedefParam && (anaSekmeler as readonly string[]).includes(hedefParam)
      ? (hedefParam as YayinHedefGrubu)
      : null;

  const ureticiMi = !!kullanici && URETICI_ROLLER.includes((kullanici.rol ?? "").toLowerCase());
  const kullaniciId = ureticiMi ? kullanici.id : undefined;
  const { mesajlar, hata, basari } = useHataMesaji();

  const [aktifAnaSekme, setAktifAnaSekme] = useState<YayinHedefGrubu>(baslangicHedef ?? "utt");
  const [aktifSekme, setAktifSekme] = useState<AltSekme>(baslangicDurum);
  const [aktifYayinTuru, setAktifYayinTuru] = useState<YayinTuruFiltreDegeri>("tumu");
  const [aktifZaman, setAktifZaman] = useState<Periyot>("bu_ay");

  // Saf UI state (modallar + akordiyon + video/araç önizleme) — sayfada kalır.
  const [acikAkordiyon, setAcikAkordiyon] = useState<string | null>(null);
  const [onizlemeHedefi, setOnizlemeHedefi] = useState<OnizlemeHedefi | null>(null);
  const handleVideoAc = (url: string) => setOnizlemeHedefi({ arac_turu: "video", video_url: url });
  const [onayModal, setOnayModal] = useState<Bekleyen | null>(null);
  const [silmeModal, setSilmeModal] = useState<Bekleyen | null>(null);

  useEffect(() => {
    if (kimlikYukleniyor) return;
    if (!kullanici) {
      router.replace("/login");
      return;
    }
    if (!ureticiMi) router.replace("/ana-sayfa");
  }, [kimlikYukleniyor, kullanici, router, ureticiMi]);

  useEffect(() => {
    if (durumParam === "yayinda" || durumParam === "durdurulan" || durumParam === "bekleyen") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAktifSekme(durumParam);
    }
    if (hedefParam && (anaSekmeler as readonly string[]).includes(hedefParam)) {
      setAktifAnaSekme(hedefParam as YayinHedefGrubu);
    } else {
      setAktifAnaSekme((mevcut) => anaSekmeler.includes(mevcut) ? mevcut : "utt");
    }
  }, [durumParam, hedefParam, anaSekmeler]);

  const onOzetYuklendi = useCallback((sayilar: Record<string, number>) => {
    if (!baslangicHedef && baslangicDurum === "bekleyen") {
      const ilkBekleyenHedef = anaSekmeler.find(
        (hedef) => Number(sayilar?.[hedef] ?? 0) > 0,
      );
      if (ilkBekleyenHedef) {
        setAktifAnaSekme(ilkBekleyenHedef);
      }
    }
  }, [baslangicHedef, baslangicDurum, anaSekmeler]);

  const yy = useYayinYonetimi({
    kullaniciId,
    aktifAnaSekme,
    onOzetYuklendi,
    hata,
    basari,
  });

  const formatTarih = (tarih: string) =>
    new Date(tarih).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  // Yayınla onayı: modaldaki içeriği yayınlar, modalı kapatır.
  const handleYayinlaOnayla = async () => {
    if (!onayModal) return;
    const b = onayModal;
    setOnayModal(null);
    await yy.handleYayinla(b);
  };

  const handleYayinSilOnayla = async () => {
    if (!silmeModal) return;
    const b = silmeModal;
    await yy.handleYayinSil(b);
    setSilmeModal(null);
  };

  const yayinlarFiltreli = yy.yayinlar.filter(
    (y) => yayinHedefGrubuBelirle(y.hedef_roller) === aktifAnaSekme,
  );
  // Planlanmış yayınlar "Yayında" sekmesinde listelenir (Planlandı rozetiyle);
  // tarihi gelince cron aktive eder, rozet kendiliğinden "Yayında"ya döner.
  const yayindakiler = yayinlarFiltreli.filter(y => y.durum === "yayinda" || y.durum === "planlandi");
  const canliSayisi = yayinlarFiltreli.filter(y => y.durum === "yayinda").length;
  const planliSayisi = yayinlarFiltreli.filter(y => y.durum === "planlandi").length;
  const durdurulular = yayinlarFiltreli.filter(y => y.durum === "Durduruldu");

  const zamanAraligi = ligPeriyoduAraligi({
    ...aktifPeriyot(),
    periyot: aktifZaman === "bu_ay" ? "ay" : aktifZaman === "bu_donem" ? "donem" : aktifZaman === "bu_yil" ? "yil" : "hafta",
  });
  const baslangic = Date.parse(zamanAraligi.baslangic);
  const bitis = Date.parse(zamanAraligi.bitis);
  const zamanUygun = (tarih: string) => {
    const an = Date.parse(tarih);
    return an >= baslangic && an <= bitis;
  };
  const turUygun = (kayit: { arac_turu?: string | null }) =>
    aktifYayinTuru === "tumu" || (kayit.arac_turu ?? "video") === aktifYayinTuru;
  const zamanBekleyenler = yy.bekleyenler.filter((b) => zamanUygun(b.onay_tarihi));
  const zamanYayindakiler = yayindakiler.filter((y) => zamanUygun(y.yayin_tarihi));
  const zamanDurdurulanlar = durdurulular.filter((y) => zamanUygun(y.yayin_tarihi));
  const turFiltresiYayinlari: { arac_turu?: string | null }[] =
    aktifSekme === "bekleyen" ? zamanBekleyenler : aktifSekme === "yayinda" ? zamanYayindakiler : zamanDurdurulanlar;

  // Arama + kademeli listeleme merkezden (components/liste). Üç sekme üç ayrı
  // liste olduğu için üç kanca var; React kancaları koşulsuz çağrılmalı, bu yüzden
  // aktif sekmeye göre tek kanca kurulamaz — üçü de kurulur, biri kullanılır.
  const ARAMA_ALANLARI = [
    { anahtar: "ad", etiket: "Ürün / Eğitim", deger: (r: { urun_adi: string }) => r.urun_adi },
    { anahtar: "yayin_kodu", etiket: "Yayın Kodu", deger: (r: { firma_adi: string; talep_no: number }) => yayin_kodu(r.firma_adi, r.talep_no) },
  ];
  const bekleyenListe = useListe({ veri: zamanBekleyenler.filter(turUygun), aramaAlanlari: ARAMA_ALANLARI });
  const yayindaListe = useListe({ veri: zamanYayindakiler.filter(turUygun), aramaAlanlari: ARAMA_ALANLARI });
  const durdurulanListe = useListe({ veri: zamanDurdurulanlar.filter(turUygun), aramaAlanlari: ARAMA_ALANLARI });

  // Auth guard layout'ta; burada yalnız kimlik kontrolü sırasında tam ekran spinner.
  if (kimlikYukleniyor || !ureticiMi) {
    return (
      <div className="min-h-screen bg-[var(--tema-yerel-uretim-sayfa-zemini-01)] flex items-center justify-center">
        <svg className="animate-spin w-6 h-6 text-[var(--tema-yerel-uretim-yardimci-metin-01)]" fill="none" viewBox="0 0 24 24">
          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const aktifHedefOzet = yy.hedefOzetleri?.[aktifAnaSekme];
  const aramaSonucMesaji = `${ARAMA_HEDEF_KITLE_ADLARI[aktifAnaSekme]} için yapmış olduğunuz aramada kayıt bulunmadı.`;

  return (
    <>
      <div className="min-h-full bg-[var(--tema-yerel-uretim-sayfa-zemini-11)]">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-5 px-3 py-4 md:px-6 md:py-5 lg:px-8 lg:py-7">
        <YayinKumandaPaneli
          anaSekmeler={anaSekmeler}
          aktifHedef={aktifAnaSekme}
          bekleyen={aktifHedefOzet ? aktifHedefOzet.bekleyen : yy.bekleyenler.length}
          bekleyenHedefSayilari={yy.bekleyenHedefSayilari}
          canli={aktifHedefOzet ? aktifHedefOzet.canli : canliSayisi}
          planli={aktifHedefOzet ? aktifHedefOzet.planli : planliSayisi}
          durdurulan={aktifHedefOzet ? aktifHedefOzet.durdurulan : durdurulular.length}
          yukleniyor={!aktifHedefOzet && yy.loading}
          onHedefDegistir={setAktifAnaSekme}
          aksiyon={<YenileButonu yenileniyor={yy.yenileniyor} onYenile={() => { void yy.ozetCek(); void yy.veriCek(); }} disabled={!!acikAkordiyon || !!yy.islemLoading} />}
        />

        <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full min-w-0 sm:w-auto sm:flex-1">
            <UttYayinTuruToggle
              yayinlar={turFiltresiYayinlari}
              deger={aktifYayinTuru}
              onDegistir={setAktifYayinTuru}
              className="max-w-full"
            />
          </div>
          <SadeZamanToggle
            deger={aktifZaman}
            onDegistir={setAktifZaman}
            etiket="Yayın zamanı"
            className="max-w-full sm:ml-auto sm:shrink-0"
          />
        </div>

        <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <YayinDurumuToggle aktifDurum={aktifSekme} onDurumDegistir={setAktifSekme} />
          {aktifSekme === "bekleyen" ? (
            <ListeArama
              arama={bekleyenListe.arama}
              yukseklik="secim"
              genislik="w-full"
              className="w-full sm:ml-auto sm:w-[344px] sm:shrink"
            />
          ) : (
            <ListeArama
              arama={aktifSekme === "yayinda" ? yayindaListe.arama : durdurulanListe.arama}
              yukseklik="secim"
              genislik="w-full"
              className="w-full sm:ml-auto sm:w-[344px] sm:shrink"
            />
          )}
        </div>

        {yy.loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--tema-yerel-uretim-cizgi-36)] bg-[var(--tema-yerel-uretim-kart-01)] py-16 text-center shadow-[0_6px_18px_var(--tema-yerel-uretim-golge-09)]">
            <svg className="h-7 w-7 animate-spin text-[var(--tema-yerel-uretim-eylem-metin-15)]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="mt-3 text-xs font-bold text-[var(--tema-yerel-uretim-yardimci-metin-12)]">Yayınlar hazırlanıyor...</p>
          </div>
        ) : (
          <>
        {aktifSekme === "bekleyen" && (
          <ListeBasligi baslik="Yayına Hazır İçerikler" sayi={bekleyenListe.toplam} />
        )}
        {aktifSekme === "bekleyen" && (
          bekleyenListe.toplam === 0
            ? <BosListe mesaj={!bekleyenListe.arama.aranan.trim() && yy.bekleyenler.length === 0 ? "Yayına hazırlanmayı bekleyen içerik yok." : aramaSonucMesaji} />
            : bekleyenListe.gorunen.map(b => (
              <BekleyenSatir key={b.soru_seti_durum_id} b={b}
                islemLoading={yy.islemLoading}
                acikAkordiyon={acikAkordiyon} setAcikAkordiyon={setAcikAkordiyon}
                videoPuanlari={yy.videoPuanlari} setVideoPuanlari={yy.setVideoPuanlari}
                extraPuanlar={yy.extraPuanlar} setExtraPuanlar={yy.setExtraPuanlar}
                barkodlar={yy.barkodlar} setBarkodlar={yy.setBarkodlar}
                karsilikPuanlar={yy.karsilikPuanlar} setKarsilikPuanlar={yy.setKarsilikPuanlar}
                karsilikTllar={yy.karsilikTllar} setKarsilikTllar={yy.setKarsilikTllar}
                satisFiyatlar={yy.satisFiyatlar} setSatisFiyatlar={yy.setSatisFiyatlar}
                kazanimModelleri={yy.kazanimModelleri} setKazanimModelleri={yy.setKazanimModelleri}
                katlamaOranlari={yy.katlamaOranlari} setKatlamaOranlari={yy.setKatlamaOranlari}
                baremTablolari={yy.baremTablolari} setBaremTablolari={yy.setBaremTablolari}
                eclubKarsilikPuanlar={yy.eclubKarsilikPuanlar} setEclubKarsilikPuanlar={yy.setEclubKarsilikPuanlar}
                eclubKarsilikTllar={yy.eclubKarsilikTllar} setEclubKarsilikTllar={yy.setEclubKarsilikTllar}
                tekrarPeriyotlari={yy.tekrarPeriyotlari} setTekrarPeriyotlari={yy.setTekrarPeriyotlari}
                tekrarSecenekleri={yy.tekrarSecenekleri}
                yayinGunleri={yy.yayinGunleri} setYayinGunleri={yy.setYayinGunleri}
                tumPuanlarAtandiMi={yy.tumPuanlarAtandiMi}
                getSoruPuani={yy.getSoruPuani} setSoruPuani={yy.setSoruPuani} hepsineAyniPuanAta={yy.hepsineAyniPuanAta}
                onVideoAc={handleVideoAc}
                onOnizle={setOnizlemeHedefi}
                onYayinlaClick={setOnayModal}
                onYayinSilClick={setSilmeModal}
              />
            ))
        )}

        {aktifSekme === "bekleyen" && (
          <DahaFazlaGoster
            dahaVar={bekleyenListe.dahaVar}
            gorunenSayi={bekleyenListe.gorunen.length}
            toplam={bekleyenListe.toplam}
            onGoster={bekleyenListe.dahaFazlaGoster}
          />
        )}

        {aktifSekme === "yayinda" && (
          yayindaListe.toplam === 0
            ? <BosListe mesaj={!yayindaListe.arama.aranan.trim() && yayindakiler.length === 0 ? "Bu hedef kitle için aktif yayın yok." : aramaSonucMesaji} />
            : (
              <MobilYayinAkisi
                kayitlar={yayindaListe.filtrelenmis}
                kayitAnahtari={(y) => y.yayin_id}
                renderKart={(y) => (
                  <div className="w-full">
                    <YayinSatir
                      key={y.yayin_id}
                      y={y}
                      kartGorunumu
                      islemLoading={yy.islemLoading}
                      acikAkordiyon={acikAkordiyon}
                      setAcikAkordiyon={setAcikAkordiyon}
                      formatTarih={formatTarih}
                      tekrarBilgi={yy.tekrarBilgi[y.yayin_id]}
                      getSoruPuani={yy.getSoruPuani}
                      setSoruPuani={yy.setSoruPuani}
                      hepsineAyniPuanAta={yy.hepsineAyniPuanAta}
                      onVideoAc={handleVideoAc}
                      onOnizle={setOnizlemeHedefi}
                      onDurumDegistir={yy.handleDurumDegistir}
                      onPlanIslem={yy.handlePlanIslem}
                    />
                  </div>
                )}
                sayacGoster={false}
                sifirlamaAnahtari={`${aktifAnaSekme}-${aktifSekme}-${aktifYayinTuru}-${aktifZaman}-${yayindaListe.arama.alanAnahtari}-${yayindaListe.arama.aranan}`}
                masaustuIcerik={
                  <>
                    <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                      {yayindaListe.gorunen.map((y) => (
                        <YayinSatir
                          key={y.yayin_id}
                          y={y}
                          kartGorunumu
                          islemLoading={yy.islemLoading}
                          acikAkordiyon={acikAkordiyon}
                          setAcikAkordiyon={setAcikAkordiyon}
                          formatTarih={formatTarih}
                          tekrarBilgi={yy.tekrarBilgi[y.yayin_id]}
                          getSoruPuani={yy.getSoruPuani}
                          setSoruPuani={yy.setSoruPuani}
                          hepsineAyniPuanAta={yy.hepsineAyniPuanAta}
                          onVideoAc={handleVideoAc}
                          onOnizle={setOnizlemeHedefi}
                          onDurumDegistir={yy.handleDurumDegistir}
                          onPlanIslem={yy.handlePlanIslem}
                        />
                      ))}
                    </div>
                    <DahaFazlaGoster
                      dahaVar={yayindaListe.dahaVar}
                      gorunenSayi={yayindaListe.gorunen.length}
                      toplam={yayindaListe.toplam}
                      onGoster={yayindaListe.dahaFazlaGoster}
                    />
                  </>
                }
              />
            )
        )}

        {aktifSekme === "durdurulan" && (
          <ListeBasligi baslik="Durdurulan Yayınlar" aciklama="Yayından kaldırılan içerikleri inceleyin veya yeniden başlatın." sayi={durdurulanListe.toplam} />
        )}
        {aktifSekme === "durdurulan" && (
          durdurulanListe.toplam === 0
            ? <BosListe mesaj={!durdurulanListe.arama.aranan.trim() && durdurulular.length === 0 ? "Bu hedef kitle için durdurulan yayın yok." : aramaSonucMesaji} />
            : durdurulanListe.gorunen.map(y => (
              <YayinSatir key={y.yayin_id} y={y}
                islemLoading={yy.islemLoading}
                acikAkordiyon={acikAkordiyon} setAcikAkordiyon={setAcikAkordiyon}
                formatTarih={formatTarih}
                tekrarBilgi={yy.tekrarBilgi[y.yayin_id]}
                getSoruPuani={yy.getSoruPuani} setSoruPuani={yy.setSoruPuani} hepsineAyniPuanAta={yy.hepsineAyniPuanAta}
                onVideoAc={handleVideoAc}
                onOnizle={setOnizlemeHedefi}
                onDurumDegistir={yy.handleDurumDegistir}
              />
            ))
        )}

        {aktifSekme === "durdurulan" && (
          <DahaFazlaGoster
            dahaVar={durdurulanListe.dahaVar}
            gorunenSayi={durdurulanListe.gorunen.length}
            toplam={durdurulanListe.toplam}
            onGoster={durdurulanListe.dahaFazlaGoster}
          />
        )}
          </>
        )}
      </div>
      </div>

      {onizlemeHedefi && <OgrenmeAraciOnizlemeModal hedef={onizlemeHedefi} onKapat={() => setOnizlemeHedefi(null)} />}

      {onayModal && (
        <YayinOnayModal bekleyen={onayModal} onIptal={() => setOnayModal(null)} onYayinla={handleYayinlaOnayla} />
      )}

      {silmeModal && (
        <YayinSilmeModal
          bekleyen={silmeModal}
          islemde={yy.islemLoading === silmeModal.soru_seti_durum_id}
          onIptal={() => setSilmeModal(null)}
          onSil={handleYayinSilOnayla}
        />
      )}

      <HataMesajiContainer mesajlar={mesajlar} />
    </>
  );
}

export default function YayinYonetimiPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--tema-yerel-uretim-sayfa-zemini-01)] flex items-center justify-center">
          <svg className="animate-spin w-6 h-6 text-[var(--tema-yerel-uretim-yardimci-metin-01)]" fill="none" viewBox="0 0 24 24">
            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      }
    >
      <YayinYonetimiIcerik />
    </Suspense>
  );
}
