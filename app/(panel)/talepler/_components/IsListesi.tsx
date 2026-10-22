// app/talepler/_components/IsListesi.tsx
//
// Sol kolon — üretimi devam eden taleplerin iş kuyruğu.
//
// Bugün AŞAMA bilgisi Talepler sayfasında, DURUM bilgisi Senaryolar/Videolar/
// Soru Setleri sayfalarında duruyor; kullanıcı "nerede" ve "kimde" sorularını iki
// ayrı ekrandan topluyordu. Bu listede ikisi yan yana.
//
// Satır tıklaması ROTA DEĞİŞTİRMEZ, yalnız sağdaki şeridi seçer — sayfanın
// temel ilkesi bu (aşama ayrı bir yer değil, talebin içindeki adım).
//
// Sıra önemli: önce aşama süzgeci, sonra arama, sonra kademeli listeleme.
// Arama ve "daha fazla göster" merkezden (components/liste); süzme ve seçim
// sayfanın hook'unda — bu bileşen ne süzer ne durum yorumlar.

"use client";

import { SadeListeSecimi } from "@/components/kontrol/SadeKontroller";

import { DahaFazlaGoster, ListeArama, useListe } from "@/components/liste";
import { AsamaPill, DurumPill } from "@/components/pill";
import SayfaRehberi from "@/components/rehber/SayfaRehberi";
import { TALEP_TURU_KURALLARI } from "@/lib/uretici/yetenekler";
import { ureticiDurumMesaji } from "@/lib/utils/durum/mesaj";
import { yayin_kodu } from "@/lib/utils/yayinKodu";
import { useState } from "react";
import { ASAMA_SUZGEC_SECENEKLERI, type AsamaSuzgeci, type TalepSatiri } from "../_ureticiRolTypes";

interface Props {
  talepler: TalepSatiri[];
  seciliTalepId: string | null;
  rol: string;
  onSec: (talep_id: string) => void;
}

/** Ürünsüz türlerde (medikal / İK) izleyiciye görünen ad türün kendi adıdır. */
const baslikVer = (t: TalepSatiri) =>
  t.urun_adi !== "-" ? t.urun_adi : (TALEP_TURU_KURALLARI[t.egitim_turu]?.ad ?? t.egitim_turu);

export function IsListesi({ talepler, seciliTalepId, rol, onSec }: Props) {
  const [asamaSuzgeci, setAsamaSuzgeci] = useState<AsamaSuzgeci>("hepsi");

  const asamaSuzulmus =
    asamaSuzgeci === "hepsi" ? talepler : talepler.filter((t) => t.asama === asamaSuzgeci);

  // Aranabilir alanları sayfa tanımlar; merkez "talep no" diye bir kavram bilmez.
  const liste = useListe({
    veri: asamaSuzulmus,
    aramaAlanlari: [
      { anahtar: "no", etiket: "Talep No", deger: (t: TalepSatiri) => t.talep_no },
      { anahtar: "ad", etiket: "Ürün / Eğitim", deger: (t: TalepSatiri) => baslikVer(t) },
    ],
  });

  return (
    <section aria-labelledby="talep-takip-listesi-baslik" className="overflow-hidden rounded-2xl border border-[var(--tema-yerel-uretim-cizgi-09)] bg-[var(--tema-yerel-uretim-kart-01)] shadow-[0_10px_28px_var(--tema-yerel-uretim-golge-01)]">
      <div className="flex flex-col gap-3 border-b border-[var(--tema-yerel-uretim-cizgi-10)] px-4 py-4 md:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center">
              <h2 id="talep-takip-listesi-baslik" className="text-base font-extrabold text-[var(--tema-yerel-uretim-ana-metin-05)]">Yayın Takip Listesi</h2>
              <SayfaRehberi anahtar="talepler-aktif-operasyon" className="ml-1.5 -translate-y-1.5" />
            </div>
          </div>
          <span className="rounded-full bg-[var(--tema-yerel-uretim-secim-zemin-04)] px-3 py-1 text-xs font-extrabold text-[var(--tema-yerel-uretim-eylem-metin-05)]">{liste.toplam} aktif</span>
        </div>
        <div className="flex flex-col gap-2">
          <SadeListeSecimi aria-label="Üretim aşamasına göre süz" value={asamaSuzgeci} onChange={(e) => setAsamaSuzgeci(e.target.value as AsamaSuzgeci)} className="w-full">
            {ASAMA_SUZGEC_SECENEKLERI.map((s) => (
              <option key={s.deger} value={s.deger}>{s.etiket}</option>
            ))}
          </SadeListeSecimi>
          <ListeArama arama={liste.arama} yukseklik="secim" className="w-full" />
        </div>
      </div>

      {liste.toplam === 0 ? (
        <div className="px-6 py-12 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--tema-yerel-uretim-secim-zemin-05)] text-[var(--tema-yerel-uretim-yardimci-metin-08)]">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M4 5h16v14H4zM8 9h8M8 13h5" /></svg>
          </span>
          <p className="mt-3 text-sm font-bold text-[var(--tema-yerel-uretim-yardimci-metin-09)]">
            {talepler.length === 0
              ? "Devam eden yayınınız yok."
              : liste.hamToplam === 0
              ? "Bu aşamada yayın yok."
              : "Aramanıza uyan yayın bulunamadı."}
          </p>
        </div>
      ) : (
        <>
          {/* Dar ekranlarda tablo yerine bilgi hiyerarşisi korunmuş kartlar. */}
          <div className="flex flex-col gap-2.5 bg-[var(--tema-yerel-uretim-sayfa-zemini-02)] p-3 md:hidden">
            {liste.gorunen.map((t) => {
              const durum = ureticiDurumMesaji(t.durum_kodu, t.created_at, t.ogrenme_araci_turu);
              const aksiyonBende = durum.top === "uretici";
              const secili = t.talep_id === seciliTalepId;
              return (
                <button
                  type="button"
                  key={t.talep_id}
                  onClick={() => onSec(t.talep_id)}
                  aria-pressed={secili}
                  className="relative w-full overflow-hidden rounded-xl border bg-[var(--tema-yerel-uretim-kart-01)] p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tema-yerel-uretim-odak-01)]"
                  style={{
                    borderColor: secili ? "var(--tema-yerel-uretim-cizgi-11)" : aksiyonBende ? "var(--tema-yerel-uretim-islevsel-cizgi-10)" : "var(--tema-yerel-uretim-cizgi-12)",
                    boxShadow: secili ? "0 7px 20px var(--tema-yerel-uretim-golge-02)" : undefined,
                  }}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-extrabold text-[var(--tema-yerel-uretim-ana-metin-06)]">{baslikVer(t)}</span>
                      <span className="mt-0.5 block text-[11px] font-semibold text-[var(--tema-yerel-uretim-yardimci-metin-10)]">{yayin_kodu(t.firma_adi, t.talep_no)}</span>
                    </span>
                    <span aria-hidden="true" className="shrink-0 text-lg text-[var(--tema-yerel-uretim-yardimci-metin-11)]">›</span>
                  </span>
                  <span className="mt-3 flex flex-wrap items-center gap-2">
                    <AsamaPill asama={t.asama} ogrenmeAraciTuru={t.ogrenme_araci_turu} />
                    <DurumPill kod={t.durum_kodu} rol={rol} tarih={t.created_at} girdi={{ ogrenmeAraciTuru: t.ogrenme_araci_turu }} />
                  </span>
                  {t.teknik_adi !== "-" && (
                    <span className="mt-2 block truncate text-xs text-[var(--tema-yerel-uretim-yardimci-metin-12)]">Teknik: {t.teknik_adi}</span>
                  )}
                  {aksiyonBende && <span className="absolute inset-y-0 left-0 w-1 bg-[var(--tema-yerel-uretim-islevsel-zemin-10)]" />}
                </button>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--tema-yerel-uretim-cizgi-10)] bg-[var(--tema-yerel-uretim-sayfa-zemini-02)]">
                  <th className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-[var(--tema-yerel-uretim-yardimci-metin-13)]">Yayın</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-[var(--tema-yerel-uretim-yardimci-metin-13)]">Aşama</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-[var(--tema-yerel-uretim-yardimci-metin-13)]">Sorumluluk</th>
                  <th className="w-9 px-2 py-2.5"><span className="sr-only">Seç</span></th>
                </tr>
              </thead>
              <tbody>
                {liste.gorunen.map((t) => {
                  // "Top kimde" sorusunun cevabı sözlükten okunur; burada durum
                  // listesi yazılmaz — sözlük değişirse bu satır kendiliğinden uyar.
                  const aksiyonBende = ureticiDurumMesaji(t.durum_kodu, t.created_at, t.ogrenme_araci_turu).top === "uretici";
                  const secili = t.talep_id === seciliTalepId;
                  return (
                    <tr
                      key={t.talep_id}
                      onClick={() => onSec(t.talep_id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSec(t.talep_id);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-pressed={secili}
                      className="cursor-pointer border-b border-[var(--tema-yerel-uretim-cizgi-13)] transition-colors duration-100 hover:bg-[var(--tema-yerel-uretim-sayfa-zemini-03)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--tema-yerel-uretim-odak-01)]"
                      style={{
                        background: secili ? "var(--tema-yerel-uretim-secim-zemin-06)" : undefined,
                        boxShadow: aksiyonBende ? "inset 4px 0 0 0 var(--tema-yerel-uretim-islevsel-golge-01)" : undefined,
                      }}
                    >
                      <td className="min-w-[190px] px-4 py-3">
                        <span className="block text-sm text-[var(--tema-yerel-uretim-ana-metin-06)]" style={{ fontWeight: aksiyonBende ? 800 : 700 }}>{baslikVer(t)}</span>
                        <span className="mt-0.5 block text-[11px] font-semibold text-[var(--tema-yerel-uretim-yardimci-metin-10)]">
                          {yayin_kodu(t.firma_adi, t.talep_no)}
                          {t.teknik_adi !== "-" ? ` · ${t.teknik_adi}` : ""}
                        </span>
                      </td>
                      <td className="px-3 py-3"><AsamaPill asama={t.asama} ogrenmeAraciTuru={t.ogrenme_araci_turu} /></td>
                      <td className="px-3 py-3"><DurumPill kod={t.durum_kodu} rol={rol} tarih={t.created_at} girdi={{ ogrenmeAraciTuru: t.ogrenme_araci_turu }} /></td>
                      <td className="px-2 py-3 text-lg text-[var(--tema-yerel-uretim-yardimci-metin-11)]">›</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <DahaFazlaGoster
            dahaVar={liste.dahaVar}
            gorunenSayi={liste.gorunen.length}
            toplam={liste.toplam}
            onGoster={liste.dahaFazlaGoster}
          />
        </>
      )}
    </section>
  );
}
