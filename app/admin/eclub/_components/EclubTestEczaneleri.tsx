"use client";

import { useState } from "react";
import { TEST_TEMIZLIK_ONAYI } from "@/lib/eclub/testGln";
import { useEclubTestEczaneler } from "../_hooks/useEclubTestEczaneler";
import { useEclubTestTemizlik } from "../_hooks/useEclubTestTemizlik";
import local from "./eclub-yonetimi.module.css";

interface Props {
  hata: (mesaj: string, adim?: string, detay?: string) => void;
  basari: (mesaj: string) => void;
}

export default function EclubTestEczaneleri({ hata, basari }: Props) {
  const {
    testEczaneler, loading: testLoading, islemLoading: testIslemLoading,
    veriCek: testEczaneleriYenile, olustur: testEczaneOlustur, kullanilmayanlariSil,
  } = useEclubTestEczaneler({ hata, basari });
  const {
    onizleme: testTemizlikOnizleme, loading: testTemizlikLoading,
    onizlemeCek: testTemizlikOnizle, temizle: testVerileriniTemizle,
    onizlemeKapat: testTemizlikKapat,
  } = useEclubTestTemizlik({ hata, basari });

  const [testAdet, setTestAdet] = useState<number | "">("");
  const [testSilOnay, setTestSilOnay] = useState(false);
  const [testTemizlikOnayi, setTestTemizlikOnayi] = useState("");

  return <div className={local.legacy}>
      {/* --- Test Eczane Tanımları --- */}
      <div className="bg-[var(--tema-kart)] border border-[var(--tema-kontrol-cizgi)] rounded-[18px] overflow-hidden">
        <div className="px-4 md:px-5 py-3.5 border-b border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-zemin)] flex items-center justify-between gap-3">
          <div>
            <span className="block text-sm font-extrabold text-[var(--tema-kontrol-metin)]">Test Eczane Tanımları</span>
            <span className="block mt-0.5 text-xs text-[var(--tema-kontrol-ikincil-metin)]">UTT’nin gerçek kayıt akışında kullanacağı 111 önekli test GLN havuzu.</span>
          </div>
          <span className="text-xs text-[var(--tema-kontrol-ikincil-metin)] flex-shrink-0">{testEczaneler.length} kayıt</span>
        </div>

        <div className="px-4 md:px-5 py-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--tema-kontrol-ikincil-metin)]">Oluşturulacak adet</span>
              <input
                type="number"
                min={1}
                max={100}
                value={testAdet}
                onChange={(e) => setTestAdet(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-28 border border-[var(--tema-kontrol-cizgi)] rounded-lg px-3 py-2 text-sm bg-[var(--tema-kart)] text-[var(--tema-kontrol-metin)] outline-none"
              />
            </label>
            <button
              onClick={() => testAdet !== "" && testEczaneOlustur(testAdet)}
              disabled={testIslemLoading || testAdet === "" || !Number.isInteger(testAdet) || testAdet < 1 || testAdet > 100}
              className="px-4 py-2 rounded-lg border-none text-[var(--tema-yerel-yonetim-ters-metin-02)] text-xs font-extrabold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "var(--tema-kontrol-eylem)" }}
            >
              {testIslemLoading ? "İşleniyor..." : testAdet === "" ? "Test Eczanesi Oluştur" : `${testAdet} Test Eczanesi Oluştur`}
            </button>

            {testEczaneler.some((eczane) => !eczane.kullaniliyor_mu) && (
              testSilOnay ? (
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-xs text-[var(--tema-kontrol-ikincil-metin)]">Kullanılmayanlar silinsin mi?</span>
                  <button
                    onClick={async () => { await kullanilmayanlariSil(); setTestSilOnay(false); }}
                    disabled={testIslemLoading}
                    className="text-xs px-2.5 py-2 rounded-lg border-none text-[var(--tema-yerel-yonetim-ters-metin-02)] cursor-pointer disabled:opacity-50"
                    style={{ background: "var(--tema-yerel-yonetim-vurgu-zemin-01)" }}
                  >Evet, sil</button>
                  <button onClick={() => setTestSilOnay(false)} className="text-xs px-2.5 py-2 rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-kart)] text-[var(--tema-kontrol-ikincil-metin)] cursor-pointer">Vazgeç</button>
                </div>
              ) : (
                <button onClick={() => setTestSilOnay(true)} className="ml-auto text-xs px-3 py-2 rounded-lg bg-[var(--tema-kart)] cursor-pointer" style={{ border: "0.5px solid var(--tema-yerel-yonetim-islevsel-cizgi-02)", color: "var(--tema-yerel-yonetim-vurgu-metin-01)" }}>
                  Kullanılmayanları Sil
                </button>
              )
            )}
          </div>

          <p className="m-0 text-xs leading-5 text-[var(--tema-kontrol-ikincil-metin)]">
            Üretilen kayıtlar onaylı master eczane olarak eklenir. UTT, ayrı bir test alanı olmadan mevcut GLN aramasına bu numaralardan birini yazar. “Kullanılmayanları Sil” yalnız boş kayıtları; “Test Sürecini Temizle” ise bağlı test zincirini kaldırır.
          </p>

          {testLoading ? (
            <p className="m-0 py-3 text-center text-xs text-[var(--tema-kontrol-ikincil-metin)]">Test GLN’ler yükleniyor...</p>
          ) : testEczaneler.length > 0 ? (
            <div className="max-h-52 overflow-y-auto rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-zemin)] divide-y divide-[var(--tema-kontrol-cizgi)]">
              {testEczaneler.map((eczane) => (
                <div key={eczane.gln} className="px-3 py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block truncate text-xs font-medium text-[var(--tema-yerel-yonetim-ana-metin-07)]">{eczane.eczane_adi}</span>
                    <span className="block text-[11px] text-[var(--tema-kontrol-ikincil-metin)] font-mono">{eczane.gln}</span>
                  </div>
                  <span className="flex-shrink-0 text-[10px] px-2 py-1 rounded-full" style={{ color: eczane.kullaniliyor_mu ? "var(--tema-yerel-yonetim-islevsel-metin-10)" : "var(--tema-yerel-yonetim-yardimci-metin-02)", background: eczane.kullaniliyor_mu ? "var(--tema-yerel-yonetim-islevsel-zemin-05)" : "var(--tema-yerel-yonetim-sayfa-zemini-04)" }}>
                    {eczane.kullaniliyor_mu ? "UTT listesinde" : "Kullanılabilir"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="m-0 py-3 text-center text-xs text-[var(--tema-kontrol-ikincil-metin)]">Henüz test GLN oluşturulmadı.</p>
          )}

          {!testTemizlikOnizleme && (
            <div className="flex justify-end border-t border-[var(--tema-kontrol-cizgi)] pt-3">
              <button
                onClick={async () => { await testTemizlikOnizle(); }}
                disabled={testTemizlikLoading || testIslemLoading || testEczaneler.length === 0}
                className="text-xs px-3 py-2 rounded-lg bg-[var(--tema-kart)] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
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
            <div className="rounded-[18px] border border-[var(--tema-yerel-yonetim-islevsel-cizgi-09)] bg-[var(--tema-yerel-yonetim-islevsel-zemin-15)] p-4 flex flex-col gap-3">
              <div>
                <span className="block text-sm font-extrabold text-[var(--tema-yerel-yonetim-islevsel-metin-20)]">Test temizliği önizlemesi</span>
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
                  <div key={etiket} className="rounded-lg border border-[var(--tema-yerel-yonetim-islevsel-cizgi-10)] bg-[var(--tema-kart)] px-3 py-2">
                    <span className="block text-[10px] text-[var(--tema-kontrol-ikincil-metin)]">{etiket}</span>
                    <strong className="block mt-0.5 text-sm text-[var(--tema-kontrol-metin)]">{deger}</strong>
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
                  className="w-full border border-[var(--tema-yerel-yonetim-islevsel-cizgi-09)] rounded-lg bg-[var(--tema-kart)] px-3 py-2 text-sm text-[var(--tema-kontrol-metin)] outline-none focus:border-[var(--tema-yerel-yonetim-islevsel-cizgi-11)]"
                />
              </label>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { testTemizlikKapat(); setTestTemizlikOnayi(""); }}
                  disabled={testTemizlikLoading}
                  className="text-xs px-3 py-2 rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-kart)] text-[var(--tema-yerel-yonetim-ana-metin-06)] cursor-pointer"
                >Vazgeç</button>
                <button
                  onClick={async () => {
                    const ok = await testVerileriniTemizle(testTemizlikOnayi);
                    if (ok) { setTestTemizlikOnayi(""); await testEczaneleriYenile(); }
                  }}
                  disabled={testTemizlikLoading || testTemizlikOnayi !== TEST_TEMIZLIK_ONAYI}
                  className="text-xs px-4 py-2 rounded-lg border-none bg-[var(--tema-yerel-yonetim-islevsel-zemin-16)] text-[var(--tema-yerel-yonetim-ters-metin-02)] font-extrabold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {testTemizlikLoading ? "Temizleniyor..." : "Test Zincirini Kalıcı Sil"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
  </div>;
}
