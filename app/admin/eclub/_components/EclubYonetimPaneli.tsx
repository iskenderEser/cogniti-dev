// app/admin/eclub/_components/EclubYonetimPaneli.tsx
//
// M2-b — E-Club yönetim içeriği (onay bekleyen eczaneler + kayıtlı
// firma/eczane/kişi). Eski /admin/eclub sayfasının kabuksuz hâli: auth,
// Navbar ve hata konteyneri ANA panelin işidir; bu bileşen yalnız içeriktir
// ve ana paneldeki E-Club sekmesine gömülür (plan B.2).

"use client";

import { SadeListeSecimi } from "@/components/kontrol/SadeKontroller";

import { TEST_TEMIZLIK_ONAYI } from "@/lib/eclub/testGln";
import { eclubKisiRolEtiketi } from "@/lib/utils/roller";
import { useState } from "react";
import { RENK_BORDO, RENK_BORDO_ZEMIN } from "../../_constants";
import { useEclubKayitli } from "../_hooks/useEclubKayitli";
import { useEclubOnaylar } from "../_hooks/useEclubOnaylar";
import { useEclubTestEczaneler } from "../_hooks/useEclubTestEczaneler";
import { useEclubTestTemizlik } from "../_hooks/useEclubTestTemizlik";

interface EclubYonetimPaneliProps {
  hata: (mesaj: string, adim?: string, detay?: string) => void;
  basari: (mesaj: string) => void;
}

export default function EclubYonetimPaneli({ hata, basari }: EclubYonetimPaneliProps) {
  // Ana panel bu bileşeni yalnız admin doğrulandıktan sonra render eder.
  const { bekleyenler, loading, islemLoading, kararVer } = useEclubOnaylar({ hazir: true, hata, basari });
  const {
    firmalar, seciliFirmaId, eczaneler, acikEczaneId, kisiler,
    firmaSec, eczaneTikla, kisiPasifeAl,
  } = useEclubKayitli({ hata, basari });
  const {
    testEczaneler, loading: testLoading, islemLoading: testIslemLoading,
    veriCek: testEczaneleriYenile, olustur: testEczaneOlustur, kullanilmayanlariSil,
  } = useEclubTestEczaneler({ hata, basari });
  const {
    onizleme: testTemizlikOnizleme, loading: testTemizlikLoading,
    onizlemeCek: testTemizlikOnizle, temizle: testVerileriniTemizle,
    onizlemeKapat: testTemizlikKapat,
  } = useEclubTestTemizlik({ hata, basari });

  const [reddetOnay, setReddetOnay] = useState<string | null>(null);
  const [pasifeOnay, setPasifeOnay] = useState<string | null>(null);
  const [testAdet, setTestAdet] = useState<number | "">("");
  const [testSilOnay, setTestSilOnay] = useState(false);
  const [testTemizlikOnayi, setTestTemizlikOnayi] = useState("");

  if (loading) {
    return <p className="text-sm text-[var(--tema-yerel-yonetim-yardimci-metin-07)] py-4 m-0">E-Club verileri yükleniyor...</p>;
  }

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: "860px", fontFamily: "'Nunito', sans-serif" }}>

      {/* --- Test Eczane Tanımları --- */}
      <div className="bg-[var(--tema-yerel-yonetim-kart-04)] border border-[var(--tema-yerel-yonetim-cizgi-08)] rounded-xl overflow-hidden">
        <div className="px-4 md:px-5 py-3.5 border-b border-[var(--tema-yerel-yonetim-cizgi-09)] bg-[var(--tema-yerel-yonetim-sayfa-zemini-08)] flex items-center justify-between gap-3">
          <div>
            <span className="block text-sm font-semibold text-[var(--tema-yerel-yonetim-ana-metin-05)]">Test Eczane Tanımları</span>
            <span className="block mt-0.5 text-xs text-[var(--tema-yerel-yonetim-yardimci-metin-06)]">UTT’nin gerçek kayıt akışında kullanacağı 111 önekli test GLN havuzu.</span>
          </div>
          <span className="text-xs text-[var(--tema-yerel-yonetim-yardimci-metin-07)] flex-shrink-0">{testEczaneler.length} kayıt</span>
        </div>

        <div className="px-4 md:px-5 py-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--tema-yerel-yonetim-yardimci-metin-06)]">Oluşturulacak adet</span>
              <input
                type="number"
                min={1}
                max={100}
                value={testAdet}
                onChange={(e) => setTestAdet(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-28 border border-[var(--tema-yerel-yonetim-cizgi-08)] rounded-lg px-3 py-2 text-sm bg-[var(--tema-yerel-yonetim-kart-04)] text-[var(--tema-yerel-yonetim-ana-metin-05)] outline-none"
              />
            </label>
            <button
              onClick={() => testAdet !== "" && testEczaneOlustur(testAdet)}
              disabled={testIslemLoading || testAdet === "" || !Number.isInteger(testAdet) || testAdet < 1 || testAdet > 100}
              className="px-4 py-2 rounded-lg border-none text-[var(--tema-yerel-yonetim-ters-metin-02)] text-xs font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: RENK_BORDO }}
            >
              {testIslemLoading ? "İşleniyor..." : testAdet === "" ? "Test Eczanesi Oluştur" : `${testAdet} Test Eczanesi Oluştur`}
            </button>

            {testEczaneler.some((eczane) => !eczane.kullaniliyor_mu) && (
              testSilOnay ? (
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-xs text-[var(--tema-yerel-yonetim-yardimci-metin-06)]">Kullanılmayanlar silinsin mi?</span>
                  <button
                    onClick={async () => { await kullanilmayanlariSil(); setTestSilOnay(false); }}
                    disabled={testIslemLoading}
                    className="text-xs px-2.5 py-2 rounded-lg border-none text-[var(--tema-yerel-yonetim-ters-metin-02)] cursor-pointer disabled:opacity-50"
                    style={{ background: "var(--tema-yerel-yonetim-vurgu-zemin-01)" }}
                  >Evet, sil</button>
                  <button onClick={() => setTestSilOnay(false)} className="text-xs px-2.5 py-2 rounded-lg border border-[var(--tema-yerel-yonetim-cizgi-08)] bg-[var(--tema-yerel-yonetim-kart-04)] text-[var(--tema-yerel-yonetim-yardimci-metin-06)] cursor-pointer">Vazgeç</button>
                </div>
              ) : (
                <button onClick={() => setTestSilOnay(true)} className="ml-auto text-xs px-3 py-2 rounded-lg bg-[var(--tema-yerel-yonetim-kart-04)] cursor-pointer" style={{ border: "0.5px solid var(--tema-yerel-yonetim-islevsel-cizgi-02)", color: "var(--tema-yerel-yonetim-vurgu-metin-01)" }}>
                  Kullanılmayanları Sil
                </button>
              )
            )}
          </div>

          <p className="m-0 text-xs leading-5 text-[var(--tema-yerel-yonetim-yardimci-metin-06)]">
            Üretilen kayıtlar onaylı master eczane olarak eklenir. UTT, ayrı bir test alanı olmadan mevcut GLN aramasına bu numaralardan birini yazar. “Kullanılmayanları Sil” yalnız boş kayıtları; “Test Sürecini Temizle” ise bağlı test zincirini kaldırır.
          </p>

          {testLoading ? (
            <p className="m-0 py-3 text-center text-xs text-[var(--tema-yerel-yonetim-yardimci-metin-07)]">Test GLN’ler yükleniyor...</p>
          ) : testEczaneler.length > 0 ? (
            <div className="max-h-52 overflow-y-auto rounded-lg border border-[var(--tema-yerel-yonetim-cizgi-09)] bg-[var(--tema-yerel-yonetim-sayfa-zemini-08)] divide-y divide-[var(--tema-yerel-yonetim-cizgi-09)]">
              {testEczaneler.map((eczane) => (
                <div key={eczane.gln} className="px-3 py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block truncate text-xs font-medium text-[var(--tema-yerel-yonetim-ana-metin-07)]">{eczane.eczane_adi}</span>
                    <span className="block text-[11px] text-[var(--tema-yerel-yonetim-yardimci-metin-07)] font-mono">{eczane.gln}</span>
                  </div>
                  <span className="flex-shrink-0 text-[10px] px-2 py-1 rounded-full" style={{ color: eczane.kullaniliyor_mu ? "var(--tema-yerel-yonetim-islevsel-metin-10)" : "var(--tema-yerel-yonetim-yardimci-metin-02)", background: eczane.kullaniliyor_mu ? "var(--tema-yerel-yonetim-islevsel-zemin-05)" : "var(--tema-yerel-yonetim-sayfa-zemini-04)" }}>
                    {eczane.kullaniliyor_mu ? "UTT listesinde" : "Kullanılabilir"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="m-0 py-3 text-center text-xs text-[var(--tema-yerel-yonetim-yardimci-metin-07)]">Henüz test GLN oluşturulmadı.</p>
          )}

          {!testTemizlikOnizleme && (
            <div className="flex justify-end border-t border-[var(--tema-yerel-yonetim-cizgi-09)] pt-3">
              <button
                onClick={async () => { await testTemizlikOnizle(); }}
                disabled={testTemizlikLoading || testIslemLoading || testEczaneler.length === 0}
                className="text-xs px-3 py-2 rounded-lg bg-[var(--tema-yerel-yonetim-kart-04)] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                style={{ border: "0.5px solid var(--tema-yerel-yonetim-islevsel-cizgi-02)", color: "var(--tema-yerel-yonetim-vurgu-metin-01)" }}
              >
                {testTemizlikLoading
                  ? "Önizleniyor..."
                  : testEczaneler.length === 0
                    ? "Temizlenecek Test Verisi Yok"
                    : "Test Sürecini Temizle"}
              </button>
            </div>
          )}

          {testTemizlikOnizleme && (
            <div className="rounded-xl border border-[var(--tema-yerel-yonetim-islevsel-cizgi-09)] bg-[var(--tema-yerel-yonetim-islevsel-zemin-15)] p-4 flex flex-col gap-3">
              <div>
                <span className="block text-sm font-semibold text-[var(--tema-yerel-yonetim-islevsel-metin-20)]">Test temizliği önizlemesi</span>
                <span className="block mt-0.5 text-xs leading-5 text-[var(--tema-yerel-yonetim-islevsel-metin-21)]">Bu işlem yalnız 111 test zincirini siler ve geri alınamaz. Gerçek eczaneyle bağı bulunan kişi ve müşteriler korunur.</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  ["Test GLN", testTemizlikOnizleme.test_master_sayisi],
                  ["Eczane", testTemizlikOnizleme.eczane_sayisi],
                  ["Kişi", testTemizlikOnizleme.silinecek_kisi_sayisi],
                  ["Auth hesabı", testTemizlikOnizleme.auth_hesabi_sayisi],
                  ["E-Club öneri", testTemizlikOnizleme.eclub_oneri_sayisi],
                  ["E-Club izleme", testTemizlikOnizleme.eclub_izleme_sayisi],
                  ["E-Club sipariş", testTemizlikOnizleme.eclub_siparis_sayisi],
                  ["Eczanem sipariş", testTemizlikOnizleme.eczanem_siparis_sayisi],
                ].map(([etiket, deger]) => (
                  <div key={etiket} className="rounded-lg border border-[var(--tema-yerel-yonetim-islevsel-cizgi-10)] bg-[var(--tema-yerel-yonetim-kart-04)] px-3 py-2">
                    <span className="block text-[10px] text-[var(--tema-yerel-yonetim-yardimci-metin-06)]">{etiket}</span>
                    <strong className="block mt-0.5 text-sm text-[var(--tema-yerel-yonetim-ana-metin-05)]">{deger}</strong>
                  </div>
                ))}
              </div>

              {(testTemizlikOnizleme.korunacak_kisi_sayisi > 0 || testTemizlikOnizleme.korunacak_musteri_sayisi > 0) && (
                <div className="rounded-lg border border-[var(--tema-yerel-yonetim-islevsel-cizgi-07)] bg-[var(--tema-yerel-yonetim-islevsel-zemin-13)] px-3 py-2 text-xs text-[var(--tema-yerel-yonetim-islevsel-metin-22)]">
                  Gerçek bağları nedeniyle {testTemizlikOnizleme.korunacak_kisi_sayisi} E-Club kişisi ve {testTemizlikOnizleme.korunacak_musteri_sayisi} Eczanem müşterisi korunacak.
                </div>
              )}

              <label className="flex flex-col gap-1">
                <span className="text-xs text-[var(--tema-yerel-yonetim-islevsel-metin-23)]">Onaylamak için <strong>{TEST_TEMIZLIK_ONAYI}</strong> yazın</span>
                <input
                  value={testTemizlikOnayi}
                  onChange={(e) => setTestTemizlikOnayi(e.target.value)}
                  placeholder={TEST_TEMIZLIK_ONAYI}
                  className="w-full border border-[var(--tema-yerel-yonetim-islevsel-cizgi-09)] rounded-lg bg-[var(--tema-yerel-yonetim-kart-04)] px-3 py-2 text-sm text-[var(--tema-yerel-yonetim-ana-metin-05)] outline-none focus:border-[var(--tema-yerel-yonetim-islevsel-cizgi-11)]"
                />
              </label>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { testTemizlikKapat(); setTestTemizlikOnayi(""); }}
                  disabled={testTemizlikLoading}
                  className="text-xs px-3 py-2 rounded-lg border border-[var(--tema-yerel-yonetim-cizgi-08)] bg-[var(--tema-yerel-yonetim-kart-04)] text-[var(--tema-yerel-yonetim-ana-metin-06)] cursor-pointer"
                >Vazgeç</button>
                <button
                  onClick={async () => {
                    const ok = await testVerileriniTemizle(testTemizlikOnayi);
                    if (ok) { setTestTemizlikOnayi(""); await testEczaneleriYenile(); }
                  }}
                  disabled={testTemizlikLoading || testTemizlikOnayi !== TEST_TEMIZLIK_ONAYI}
                  className="text-xs px-4 py-2 rounded-lg border-none bg-[var(--tema-yerel-yonetim-islevsel-zemin-16)] text-[var(--tema-yerel-yonetim-ters-metin-02)] font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {testTemizlikLoading ? "Temizleniyor..." : "Test Zincirini Kalıcı Sil"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Onay Bekleyen Eczaneler --- */}
      <div className="bg-[var(--tema-yerel-yonetim-kart-04)] border border-[var(--tema-yerel-yonetim-cizgi-08)] rounded-xl overflow-hidden">
        <div className="px-4 md:px-5 py-3.5 border-b border-[var(--tema-yerel-yonetim-cizgi-09)] bg-[var(--tema-yerel-yonetim-sayfa-zemini-08)] flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--tema-yerel-yonetim-ana-metin-05)]">Onay Bekleyen Eczaneler</span>
          <span className="text-xs text-[var(--tema-yerel-yonetim-yardimci-metin-07)]">{bekleyenler.length} kayıt</span>
        </div>

        {bekleyenler.length === 0 ? (
          <p className="text-sm text-[var(--tema-yerel-yonetim-yardimci-metin-07)] text-center py-8 m-0">Onay bekleyen eczane yok.</p>
        ) : (
          <div className="divide-y divide-[var(--tema-yerel-yonetim-cizgi-09)]">
            {bekleyenler.map((b) => (
              <div key={b.gln} className="px-4 md:px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-[var(--tema-yerel-yonetim-ana-metin-05)]">{b.eczane_adi}</span>
                  <span className="text-xs text-[var(--tema-yerel-yonetim-yardimci-metin-07)] font-mono">{b.gln}</span>
                  <span className="text-xs text-[var(--tema-yerel-yonetim-yardimci-metin-06)]">
                    {b.il}{b.ilce ? ` / ${b.ilce}` : ""}
                    {b.ekleyen_ad ? ` · Ekleyen: ${b.ekleyen_ad}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {reddetOnay === b.gln ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[var(--tema-yerel-yonetim-yardimci-metin-06)]">Silinsin mi?</span>
                      <button onClick={async () => { await kararVer(b.gln, "reddet"); setReddetOnay(null); }}
                        disabled={islemLoading}
                        className="text-xs px-2.5 py-1 rounded-lg border-none text-[var(--tema-yerel-yonetim-ters-metin-02)] cursor-pointer" style={{ background: "var(--tema-yerel-yonetim-vurgu-zemin-01)" }}>
                        Evet, reddet
                      </button>
                      <button onClick={() => setReddetOnay(null)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-[var(--tema-yerel-yonetim-cizgi-08)] bg-transparent text-[var(--tema-yerel-yonetim-yardimci-metin-06)] cursor-pointer">Vazgeç</button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => kararVer(b.gln, "onayla")} disabled={islemLoading}
                        className="text-xs px-3 py-1.5 rounded-lg border-none bg-[var(--tema-yerel-yonetim-islevsel-zemin-17)] text-[var(--tema-yerel-yonetim-ters-metin-02)] font-semibold cursor-pointer">Onayla</button>
                      <button onClick={() => setReddetOnay(b.gln)} disabled={islemLoading}
                        className="text-xs px-3 py-1.5 rounded-lg bg-transparent cursor-pointer"
                        style={{ border: "0.5px solid var(--tema-yerel-yonetim-islevsel-cizgi-02)", color: "var(--tema-yerel-yonetim-vurgu-metin-01)" }}>Reddet</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Kayıtlı Firma / Eczane / Kişi --- */}
      <div className="bg-[var(--tema-yerel-yonetim-kart-04)] border border-[var(--tema-yerel-yonetim-cizgi-08)] rounded-xl overflow-hidden">
        <div className="px-4 md:px-5 py-3.5 border-b border-[var(--tema-yerel-yonetim-cizgi-09)] bg-[var(--tema-yerel-yonetim-sayfa-zemini-08)]">
          <span className="text-sm font-semibold text-[var(--tema-yerel-yonetim-ana-metin-05)]">Kayıtlı Eczaneler ve Kişiler</span>
        </div>

        <div className="px-4 md:px-5 py-3 border-b border-[var(--tema-yerel-yonetim-cizgi-09)]">
          <label className="block text-xs text-[var(--tema-yerel-yonetim-yardimci-metin-06)] mb-1">Firma</label>
          <SadeListeSecimi value={seciliFirmaId} onChange={(e) => firmaSec(e.target.value)} aria-label="Firma" className="w-full">
            <option value="">Firma seçin...</option>
            {firmalar.map((f) => (
              <option key={f.firma_id} value={f.firma_id}>
                {f.firma_adi}{f.eclub_aktif ? "" : " (E-Club kapalı)"}
              </option>
            ))}
          </SadeListeSecimi>
        </div>

        {!seciliFirmaId ? (
          <p className="text-sm text-[var(--tema-yerel-yonetim-yardimci-metin-07)] text-center py-8 m-0">Eczaneleri görmek için firma seçin.</p>
        ) : eczaneler.length === 0 ? (
          <p className="text-sm text-[var(--tema-yerel-yonetim-yardimci-metin-07)] text-center py-8 m-0">Bu firmada kayıtlı eczane yok.</p>
        ) : (
          <div className="divide-y divide-[var(--tema-yerel-yonetim-cizgi-09)]">
            {eczaneler.map((e) => (
              <div key={e.eczane_id}>
                <div
                  onClick={() => eczaneTikla(e.eczane_id)}
                  className="px-4 md:px-5 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-[var(--tema-yerel-yonetim-sayfa-zemini-08)]"
                >
                  <div className="flex items-center gap-2.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tema-yerel-yonetim-yardimci-metin-02)" strokeWidth="2"
                      style={{ transform: acikEczaneId === e.eczane_id ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-[var(--tema-yerel-yonetim-ana-metin-05)]">{e.eczane_adi}</span>
                      <span className="text-xs text-[var(--tema-yerel-yonetim-yardimci-metin-07)] font-mono">{e.gln} · {e.il}{e.ilce ? ` / ${e.ilce}` : ""}</span>
                    </div>
                  </div>
                  <span className="text-xs text-[var(--tema-yerel-yonetim-yardimci-metin-06)]">{e.aktif_kisi_sayisi} kişi</span>
                </div>

                {acikEczaneId === e.eczane_id && (
                  <div className="bg-[var(--tema-yerel-yonetim-sayfa-zemini-08)] border-t border-[var(--tema-yerel-yonetim-cizgi-09)]">
                    {kisiler.length === 0 ? (
                      <p className="text-xs text-[var(--tema-yerel-yonetim-yardimci-metin-07)] text-center py-4 m-0">Bu eczanede kayıtlı kişi yok.</p>
                    ) : (
                      kisiler.map((k) => (
                        <div key={k.kisi_id} className="pl-11 pr-4 md:pr-5 py-2.5 flex items-center justify-between gap-3 border-b border-[var(--tema-yerel-yonetim-cizgi-09)] last:border-b-0">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                              style={{ background: RENK_BORDO_ZEMIN, color: RENK_BORDO }}>
                              {`${k.ad?.[0] ?? ""}${k.soyad?.[0] ?? ""}`}
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm text-[var(--tema-yerel-yonetim-ana-metin-05)]">{k.ad} {k.soyad}</span>
                              <span className="text-xs text-[var(--tema-yerel-yonetim-yardimci-metin-07)]">
                                {eclubKisiRolEtiketi(k.rol)} · {k.aktif_mi ? "aktif" : "pasif"}
                              </span>
                            </div>
                          </div>

                          {k.aktif_mi ? (
                            pasifeOnay === k.kisi_id ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-[var(--tema-yerel-yonetim-yardimci-metin-06)]">Emin misiniz?</span>
                                <button
                                  onClick={async () => { await kisiPasifeAl(k.kisi_id, e.eczane_id); setPasifeOnay(null); }}
                                  className="text-xs px-2.5 py-1 rounded-lg border-none text-[var(--tema-yerel-yonetim-ters-metin-02)] cursor-pointer"
                                  style={{ background: "var(--tema-yerel-yonetim-vurgu-zemin-01)" }}>
                                  Evet, pasife al
                                </button>
                                <button onClick={() => setPasifeOnay(null)}
                                  className="text-xs px-2.5 py-1 rounded-lg border border-[var(--tema-yerel-yonetim-cizgi-08)] bg-transparent text-[var(--tema-yerel-yonetim-yardimci-metin-06)] cursor-pointer">Vazgeç</button>
                              </div>
                            ) : (
                              <button onClick={() => setPasifeOnay(k.kisi_id)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-transparent cursor-pointer"
                                style={{ border: "0.5px solid var(--tema-yerel-yonetim-islevsel-cizgi-02)", color: "var(--tema-yerel-yonetim-vurgu-metin-01)" }}>Pasife al</button>
                            )
                          ) : (
                            <span className="text-xs text-[var(--tema-yerel-yonetim-yardimci-metin-07)]">Pasif</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
