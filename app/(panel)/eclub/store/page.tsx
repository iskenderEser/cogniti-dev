"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Coins,
  Gift,
  Package,
  Sparkles,
  Store,
} from "lucide-react";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  EclubKisiBaslik,
  EclubKisiBosDurum,
  EclubKisiSayfa,
  EclubKisiStat,
  EclubKisiYukleniyor,
} from "@/components/eclub/EclubKisiSayfa";
import EclubFirmaCekTalebiSkeleton from "@/components/eclub/EclubFirmaCekTalebiSkeleton";
import EclubHediyeCekiBilgiPaneli from "@/components/eclub/EclubHediyeCekiBilgiPaneli";
import EclubCekTalepVitrinKarti from "@/components/eclub/EclubCekTalepVitrinKarti";
import EclubHaftalikPuanBirikimi from "@/components/eclub/EclubHaftalikPuanBirikimi";
import type { PerformansVerisi } from "@/lib/eclub/performans";
import { performansVerisiniIste } from "@/lib/eclub/performansOnbellek";
import { useEclubStore } from "./_hooks/useEclubStore";
import {
  CEK_TALEP_DURUM_META,
  type BaremSatiri,
} from "@/lib/eclub/store/eclubStoreTipler";
import { useEclubFirmaSecimi } from "@/components/eclub/EclubFirmaSecimi";
import { eclubUrunIcerigi } from "@/lib/eclub/firmaGezinme";
import { eclubFirmaYolu, eclubUrunGruplari } from "@/lib/eclub/firmaGezinme";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import { useEclubStoreTakvim } from "@/hooks/useEclubStoreTakvim";
import { eclubCekTalebiOlusturabilirMi } from "@/lib/eclub/store/cekTalebiYetkisi";
import { eclubUxTestYayiniMi } from "@/lib/eclub/store/uxGorunumTesti";

export default function EclubStorePage() {
  const router = useRouter();
  const secim = useEclubFirmaSecimi();
  const firmaId = secim.firmaId ?? null;
  const { kullanici, yukleniyor: authYukleniyor } = useAuth();
  const { mesajlar, hata, basari } = useHataMesaji();
  const eclubKisi = !!kullanici && kullanici.kimlik_turu === "eclub_kisi";
  const cekTalebiOlusturabilir = eclubCekTalebiOlusturabilirMi(kullanici?.rol);
  const {
    firma,
    cekYayinlar,
    loading,
    yenileniyor,
    yenile,
    cekTalebiOlustur,
  } = useEclubStore({ hata, basari, firmaId, hazir: !authYukleniyor && eclubKisi, onbellekKullaniciId: secim.gomulu && eclubKisi ? kullanici?.id : undefined });
  const { takvim, acik: storeAcik, yenile: takvimYenile } = useEclubStoreTakvim({
    aktif: Boolean(eclubKisi),
  });

  const [islemId, setIslemId] = useState<string | null>(null);
  const [testSiparisSecimleri, setTestSiparisSecimleri] = useState<Record<string, boolean>>({});
  const [haftalikYenileme, setHaftalikYenileme] = useState(0);
  const [haftalikPerformans, setHaftalikPerformans] = useState<{
    kapsam: string;
    veriler: Record<string, PerformansVerisi>;
  } | null>(null);
  const islemLoading = Boolean(islemId) || yenileniyor;
  const gorunenYayinlar = secim.gomulu ? eclubUrunIcerigi(cekYayinlar, secim.urunId) : cekYayinlar;
  const urunGruplari = eclubUrunGruplari(gorunenYayinlar);
  const haftalikKapsamlar = JSON.stringify([...new Map(gorunenYayinlar
    .filter((item) => !item.gorunum_testi_mi)
    .map((item) => [`${item.firma_id}:${item.urun_id}`, { firmaId: item.firma_id, urunId: item.urun_id }])).values()]);
  const haftalikKapsam = `${kullanici?.id ?? ""}:${haftalikKapsamlar}`;
  useEffect(() => {
    if (authYukleniyor) return;
    if (!kullanici) {
      router.replace("/login");
      return;
    }
    if (!eclubKisi) router.replace("/ana-sayfa");
  }, [authYukleniyor, kullanici, eclubKisi, router]);

  useEffect(() => {
    if (authYukleniyor || loading || !eclubKisi || !kullanici?.id) return;
    const urunler = JSON.parse(haftalikKapsamlar) as { firmaId: string; urunId: string }[];
    if (!urunler.length) return;
    let aktif = true;
    let istekSirasi = 0;
    const yenile = async () => {
      const istek = ++istekSirasi;
      const sonuclar = await Promise.allSettled(urunler.map(async ({ firmaId, urunId }) => ({
        anahtar: `${firmaId}:${urunId}`,
        veri: await performansVerisiniIste(kullanici.id, firmaId, urunId),
      })));
      if (!aktif || istek !== istekSirasi) return;
      const veriler: Record<string, PerformansVerisi> = {};
      for (const sonuc of sonuclar) if (sonuc.status === "fulfilled") {
        veriler[sonuc.value.anahtar] = sonuc.value.veri;
      }
      setHaftalikPerformans({ kapsam: haftalikKapsam, veriler });
    };
    void yenile();
    const gorunurYenile = () => { if (document.visibilityState === "visible") void yenile(); };
    const zamanlayici = window.setInterval(gorunurYenile, 60_000);
    window.addEventListener("focus", gorunurYenile);
    return () => {
      aktif = false;
      window.clearInterval(zamanlayici);
      window.removeEventListener("focus", gorunurYenile);
    };
  }, [authYukleniyor, loading, eclubKisi, kullanici?.id, haftalikKapsamlar, haftalikKapsam, haftalikYenileme]);

  if (authYukleniyor || !kullanici || loading) return secim.gomulu ? <EclubFirmaCekTalebiSkeleton /> : <EclubKisiYukleniyor />;

  const handleTalepVer = async (
    yayinId: string,
    siparisVerilsinMi: boolean,
    urunAdi: string,
  ) => {
    if (yenileniyor) return;
    const testKart = cekYayinlar.find((item) => item.yayin_id === yayinId && item.gorunum_testi_mi);
    if (testKart) {
      if (!eclubUxTestYayiniMi(yayinId) || testKart.satis_sarti_tipi !== "serbest_siparis" || !cekTalebiOlusturabilir) return;
      const baremler = testKart.barem_tablosu ?? [];
      const minimum = Math.min(...baremler.map((barem) => barem.min_puan));
      if (!Number.isFinite(minimum) || (testKart.havuz_toplam_puan ?? testKart.toplanan_puan ?? 0) < minimum) return;
      setTestSiparisSecimleri((onceki) => ({ ...onceki, [yayinId]: siparisVerilsinMi }));
      return;
    }
    if (!cekTalebiOlusturabilir) {
      hata("Hediye çeki talebini yalnız ana eczacı oluşturabilir.");
      return;
    }
    if (!storeAcik) {
      hata(
        `Hediye çeki talepleri şu an kapalıdır. Talepler 2 ayda bir ilk 7 günde (${takvim?.sonrakiDonemEtiketi ?? "Hediye Çeki Günleri"}) verilebilir.`,
      );
      return;
    }
    setIslemId(yayinId);
    const ok = await cekTalebiOlustur(yayinId, siparisVerilsinMi);
    setIslemId(null);
    if (ok) {
      basari(`${urunAdi} için hediye çeki talebiniz UTT onayına iletildi.`);
    }
  };

  const tumunuYenile = async () => {
    setTestSiparisSecimleri({});
    await Promise.all([yenile(), takvimYenile()]);
    setHaftalikYenileme((eski) => eski + 1);
  };

  const toplamHavuzPuani = cekYayinlar.reduce(
    (acc, y) => acc + (y.havuz_toplam_puan ?? y.toplanan_puan ?? 0),
    0,
  );
  const toplamHakEdilenTl = cekYayinlar.reduce(
    (acc, y) => acc + (y.baz_cek_tutari_tl ?? y.hak_edilen_cek_tl ?? 0),
    0,
  );

  return (
    <EclubKisiSayfa>
      {secim.gomulu && secim.aksiyonAlani && createPortal(
        <YenileButonu yenileniyor={yenileniyor} onYenile={tumunuYenile} disabled={islemLoading} />,
        secim.aksiyonAlani,
      )}
      {!secim.gomulu && <>
      <EclubKisiBaslik
        ikon={Store}
        ustEtiket={firma?.firma_adi ?? ""}
        baslik="Hediye Çekleri"
        rehberAnahtar="eclub-store-magaza"
        aciklama="Eczanenizin kazandığı puanları Hediye Çeki'ne dönüştürebilirsiniz"
        aksiyon={
            <YenileButonu
              yenileniyor={yenileniyor}
              onYenile={tumunuYenile}
              disabled={islemLoading}
            />
        }
        ekKontroller={
            <Link
              href={firmaId ? eclubFirmaYolu(firma?.firma_adi ?? firmaId, "cek-talepleri") : "/eclub/cek-taleplerim"}
              className="rounded-xl border border-[#d7e1ec] bg-white px-3.5 py-2 text-xs font-extrabold text-[#45627f] hover:bg-[#f6f9fc]"
            >
              Çek Talepleri
            </Link>
        }
      />

      {/* İstatistikler */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <EclubKisiStat
          ikon={Coins}
          etiket="Eczane Havuz Puanı"
          deger={toplamHavuzPuani.toLocaleString("tr-TR")}
          detay="Eczane çalışanlarının toplam puanı"
          renk="#16865f"
          zemin="#ebf8f2"
        />
        <EclubKisiStat
          ikon={Gift}
          etiket="Toplam Çek Değeri"
          deger={`${toplamHakEdilenTl.toLocaleString("tr-TR")} TL`}
          detay="Yayın ayarındaki puan/TL karşılığı"
          renk="#2563eb"
          zemin="#eff6ff"
        />
        <div className="sm:col-span-2 lg:col-span-1">
          <EclubKisiStat
            ikon={Calendar}
            etiket="Çek Talep Takvimi"
            deger={storeAcik ? "Talebe Açık" : "Talebe Kapalı"}
            detay={takvim?.sonrakiDonemEtiketi ? `Dönem: ${takvim.sonrakiDonemEtiketi}` : "2 ayda bir ilk 7 gün"}
            renk={storeAcik ? "#16865f" : "#d97706"}
            zemin={storeAcik ? "#ebf8f2" : "#fef3c7"}
          />
        </div>
      </section>
      </>}
      <EclubHediyeCekiBilgiPaneli />

      {/* Çek & Satış Şartı Listesi */}
      {gorunenYayinlar.length === 0 && (
        <EclubKisiBosDurum ikon={Gift} baslik="Henüz puan biriken yayın bulunmuyor"
          aciklama="Eczane çalışanlarınız eğitimleri izleyip soruları yanıtladıkça firmanızın ürünleri ve hak ettiğiniz hediye çekleri burada listelenecektir." />
      )}
        <div className="grid gap-4">
          {urunGruplari.map((grup, grupIndex) => (
            <section key={grup.anahtar} className="overflow-hidden rounded-2xl border border-[#dfe7f1] bg-white shadow-sm">
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#dfe7f1] bg-[#f5f8fb] px-5 py-4">
                <div>
                  {!firmaId && <p className="text-xs font-semibold text-slate-500">{grup.firmaAdi}</p>}
                  <h2 className="text-lg font-extrabold text-[#203653]">{grup.urunAdi}</h2>
                </div>
                <span className="text-xs font-semibold text-slate-500">{grup.yayinlar.length} yayın</span>
              </header>
              <div className="grid gap-3 p-3 sm:p-4">
          {grup.yayinlar.map((item, yayinIndex) => {
            const performans = haftalikPerformans?.kapsam === haftalikKapsam
              ? haftalikPerformans.veriler[`${item.firma_id}:${item.urun_id}`]
              : undefined;
            const haftalikPuanlar = performans?.yayinHaftalikBirikim?.[item.yayin_id];
            const haftalikBirikim = haftalikPuanlar?.length === 8 && performans
              ? { donemAdi: performans.donem.ad, aktifHafta: performans.donem.aktifHafta, puanlar: haftalikPuanlar }
              : undefined;
            const toplananPuan = item.havuz_toplam_puan ?? item.toplanan_puan ?? 0;
            const bazCek = item.baz_cek_tutari_tl ?? item.hak_edilen_cek_tl ?? 0;
            const katlanmisCek = item.katlanmis_cek_tutari_tl ?? item.katlanmis_cek_tl ?? 0;
            const uygunAdet = item.aktif_barem_adet ?? item.uygun_adet ?? 0;
            const uygunMf = item.aktif_barem_mal_fazlasi ?? item.uygun_mal_fazlasi ?? 0;
            const baremler: BaremSatiri[] = Array.isArray(item.barem_tablosu)
              ? item.barem_tablosu
              : [];
            const isSerbest = item.satis_sarti_tipi === "serbest_siparis";
            const etkilesimliTest = Boolean(item.gorunum_testi_mi) && eclubUxTestYayiniMi(item.yayin_id) && isSerbest;
            const testSiparisSecimi = etkilesimliTest ? testSiparisSecimleri[item.yayin_id] : undefined;
            const siparissiz = item.satis_sarti_tipi === "siparissiz_cek";
            const katlamaOrani = item.gizli_sart_katlama_orani ?? 20;
            const minimumPuan = Math.min(...baremler.map((barem) => barem.min_puan));
            const yeterliPuanVarMi = Number.isFinite(minimumPuan) && toplananPuan >= minimumPuan;
            const ilkKartMi = grupIndex === 0 && yayinIndex === 0;
            const talepPasif = !cekTalebiOlusturabilir || !yeterliPuanVarMi || islemLoading
              || (Boolean(item.gorunum_testi_mi) && !etkilesimliTest) || (!storeAcik && !etkilesimliTest);

            if (ilkKartMi || eclubUxTestYayiniMi(item.yayin_id) || (isSerbest && !item.talep_durumu)) {
              return (
                <EclubCekTalepVitrinKarti
                  key={`${item.eczane_id}:${item.yayin_id}`}
                  platformStili
                  item={item}
                  haftalikBirikim={haftalikBirikim}
                  toplananPuan={toplananPuan}
                  bazCek={bazCek}
                  katlanmisCek={katlanmisCek}
                  uygunAdet={uygunAdet}
                  uygunMf={uygunMf}
                  minimumPuan={minimumPuan}
                  yeterliPuanVarMi={yeterliPuanVarMi}
                  talepPasif={talepPasif}
                  islemde={islemId === item.yayin_id}
                  islemLoading={islemLoading}
                  siparissiz={siparissiz}
                  isSerbest={isSerbest}
                  katlamaOrani={katlamaOrani}
                  etkilesimliTest={etkilesimliTest}
                  testSiparisSecimi={testSiparisSecimi}
                  cekTalebiOlusturabilir={cekTalebiOlusturabilir}
                  onTalepVer={(siparisVerilsinMi) => handleTalepVer(item.yayin_id, siparisVerilsinMi, item.urun_adi)}
                />
              );
            }

            return (
              <article
                key={`${item.eczane_id}:${item.yayin_id}`}
                className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Sol: Ürün & Firma & Şart Rozeti */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.gorunum_testi_mi && (
                        <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-800">Test verisi · {etkilesimliTest ? "Etkileşimli" : "Salt okunur"}</span>
                      )}
                      {siparissiz ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-800">
                          <Gift size={13} /> Siparişsiz Hediye Çeki
                        </span>
                      ) : isSerbest ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-bold text-purple-800">
                          <Sparkles size={13} /> Siparişle artan çek (+%{katlamaOrani})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800">
                          <Package size={13} /> Satış Şartlı (Sipariş Zorunlu)
                        </span>
                      )}
                    </div>

                    <h3 className="mt-1.5 text-sm font-extrabold tracking-tight text-slate-900">
                      {item.gorunum_testi_etiketi ?? (item.talep_no ? `Yayın ${item.talep_no}` : "Yayın")}{item.donem_kodu ? ` · ${item.donem_kodu}` : ""}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Eczaneniz: <strong>{item.eczane_adi}</strong>
                    </p>

                    {/* Barem Tablosu Mini Görünüm */}
                    {baremler.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-500">
                          {siparissiz ? "Çek puan sınırları:" : "Sipariş baremleri:"}
                        </span>
                        {baremler.map((b, idx) => {
                          const aktifMi =
                            toplananPuan >= b.min_puan &&
                            toplananPuan <= b.max_puan;
                          return (
                            <span
                              key={idx}
                              className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition ${
                                aktifMi
                                  ? "border-emerald-300 bg-emerald-50 font-bold text-emerald-900 shadow-sm"
                                  : "border-slate-200 bg-slate-50 text-slate-600"
                              }`}
                            >
                              {b.min_puan}–{b.max_puan} p:{" "}
                              {!siparissiz && <strong>{b.adet}+{b.mal_fazlasi}</strong>}
                              {aktifMi && " ✓ (Mevcut Bareminiz)"}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Sağ: Puan & Çek Tutarı & Aksiyon */}
                  <div className="flex flex-col items-start gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between lg:min-w-[420px]">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Eczane Havuzu
                      </span>
                      <strong className="text-xl font-black text-slate-800">
                        {toplananPuan.toLocaleString("tr-TR")} Puan
                      </strong>
                      <span className="mt-0.5 block text-xs font-semibold text-emerald-700">
                        Hediye Çeki: {bazCek.toLocaleString("tr-TR")} TL
                      </span>
                      {isSerbest && (
                        <span className="block text-[11px] font-bold text-purple-700">
                          Siparişli Tutar: {katlanmisCek.toLocaleString("tr-TR")} TL
                        </span>
                      )}
                      {item.gorunum_testi_mi && (item.gorunum_testi_kalan_puan ?? 0) > 0 && yeterliPuanVarMi && (
                        <span className="mt-1 block text-[11px] text-slate-600">
                          Talep sonrası kalan: {item.gorunum_testi_kalan_puan?.toLocaleString("tr-TR")} puan
                        </span>
                      )}
                    </div>

                    {/* Talep Durumu Varsa Göster */}
                    {item.talep_durumu ? (
                      <div className="flex flex-col items-end gap-1">
                          <span
                            className="rounded-lg border px-3 py-1.5 text-xs font-bold"
                            style={{
                              color: CEK_TALEP_DURUM_META[item.talep_durumu].metin,
                              background: CEK_TALEP_DURUM_META[item.talep_durumu].arka,
                              borderColor: CEK_TALEP_DURUM_META[item.talep_durumu].kenar,
                            }}
                          >
                            {CEK_TALEP_DURUM_META[item.talep_durumu].etiket}
                          </span>
                      </div>
                    ) : (
                      /* Henüz Talep Verilmemişse Aksiyon Butonları */
                      <div className="flex flex-col gap-2 sm:items-end">
                        {!cekTalebiOlusturabilir ? (
                          <div className="rounded-lg bg-slate-100 p-2 text-right text-[11px] font-bold text-slate-700">
                            Hediye çeki talebini yalnız ana eczacı oluşturabilir.
                          </div>
                        ) : !yeterliPuanVarMi ? (
                          <div className="rounded-lg bg-amber-50 p-2 text-right text-[11px] font-bold text-amber-800">
                            Çek için en az {minimumPuan.toLocaleString("tr-TR")} puan gerekir.
                            {(siparissiz || isSerbest) && " Kalan puanlar devredilir."}
                          </div>
                        ) : null}
                        {siparissiz ? (
                          <button type="button" onClick={() => handleTalepVer(item.yayin_id, false, item.urun_adi)} disabled={talepPasif} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                            {islemId === item.yayin_id ? "İşleniyor..." : `${bazCek} TL Çekimi Al`}
                          </button>
                        ) : !isSerbest ? (
                          /* Satış Şartlı */
                          <button
                            type="button"
                            onClick={() =>
                              handleTalepVer(item.yayin_id, true, item.urun_adi)
                            }
                            disabled={talepPasif}
                            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            {islemId === item.yayin_id
                              ? "İşleniyor..."
                              : `${uygunAdet} Kutu + ${uygunMf} MF Sipariş Ver & ${bazCek} TL Çeki Al`}
                          </button>
                        ) : (
                          /* Serbest Sipariş */
                          <div className="flex flex-col gap-1.5 sm:flex-row">
                            <button
                              type="button"
                              onClick={() =>
                                handleTalepVer(item.yayin_id, false, item.urun_adi)
                              }
                              disabled={talepPasif}
                              aria-pressed={etkilesimliTest ? testSiparisSecimi === false : undefined}
                              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Siparişsiz {bazCek} TL Çekimi Al
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleTalepVer(item.yayin_id, true, item.urun_adi)
                              }
                              disabled={talepPasif}
                              aria-pressed={etkilesimliTest ? testSiparisSecimi === true : undefined}
                              className="rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-md hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              {uygunAdet} Kutu + {uygunMf} MF Sipariş Ver & %{katlamaOrani} Katla ({katlanmisCek} TL Çek)
                            </button>
                          </div>
                        )}
                        {etkilesimliTest && testSiparisSecimi !== undefined && (
                          <div aria-live="polite" className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs text-purple-900">
                            <strong className="block">
                              {testSiparisSecimi ? `Sipariş seçildi: ${uygunAdet}+${uygunMf}` : "Siparişsiz seçildi"}
                            </strong>
                            <span>Seçilen çek: {(testSiparisSecimi ? katlanmisCek : bazCek).toLocaleString("tr-TR")} TL</span>
                            <span className="mt-1 block text-[10px]">Test seçimi; gerçek sipariş veya talep oluşturulmadı.</span>
                            <button type="button" className="mt-1 font-bold underline" onClick={() => setTestSiparisSecimleri((onceki) => {
                              const yeni = { ...onceki };
                              delete yeni[item.yayin_id];
                              return yeni;
                            })}>Seçimi sıfırla</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <EclubHaftalikPuanBirikimi birikim={haftalikBirikim} />
              </article>
            );
          })}
              </div>
            </section>
          ))}
        </div>

      <HataMesajiContainer mesajlar={mesajlar} />
    </EclubKisiSayfa>
  );
}
