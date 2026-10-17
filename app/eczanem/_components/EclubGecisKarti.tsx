"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, RefreshCw, ShieldCheck, X } from "lucide-react";
import { ECLUB_KISI_ROL_ETIKETLERI } from "@/lib/utils/roller";

interface GecisTalebi {
  gecis_id: string;
  eczane_adi: string;
  rol: keyof typeof ECLUB_KISI_ROL_ETIKETLERI;
  ad: string;
  soyad: string;
  durum: "karar_bekliyor" | "puan_kullaniliyor";
  karar: "puan_kullan" | null;
  kullanilabilir_puan: number;
  bekleyen_siparis: number;
  created_at: string;
}

type KritikKarar = "puandan_vazgec" | "puan_kullanimi_tamamlandi" | "reddet";

interface Props {
  hata: (mesaj: string, adim?: string) => void;
  basari: (mesaj: string) => void;
}

const KARAR_METINLERI: Record<KritikKarar, { baslik: string; aciklama: string; buton: string }> = {
  puandan_vazgec: {
    baslik: "Puanlarınızdan vazgeçmek istediğinize emin misiniz?",
    aciklama: "Kullanılabilir puanlarınız geri alınamaz biçimde kapatılır, bekleyen siparişleriniz düşer ve E-Club üyeliğiniz aynı giriş hesabıyla etkinleşir.",
    buton: "Vazgeç ve E-Club'a geç",
  },
  puan_kullanimi_tamamlandi: {
    baslik: "E-Club üyeliğinizi tamamlayın",
    aciklama: "Müşteri kimliğiniz kapanacak ve aynı giriş hesabınız seçilen eczanede E-Club kimliğine geçirilecektir.",
    buton: "Üyeliği tamamla",
  },
  reddet: {
    baslik: "E-Club üyelik talebini reddedin mi?",
    aciklama: "Talep kapanır; müşteri hesabınız, puanlarınız ve siparişleriniz değişmeden kalır.",
    buton: "Talebi reddet",
  },
};

export default function EclubGecisKarti({ hata, basari }: Props) {
  const [talep, setTalep] = useState<GecisTalebi | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [isliyor, setIsliyor] = useState(false);
  const [kritikKarar, setKritikKarar] = useState<KritikKarar | null>(null);
  const [sifre, setSifre] = useState("");
  const [vazgecmeOnayi, setVazgecmeOnayi] = useState(false);
  const [modalHatasi, setModalHatasi] = useState("");

  const cek = useCallback(async () => {
    setYukleniyor(true);
    try {
      const response = await fetch("/eczanem/api/eclub-gecisi", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        hata(data.hata ?? "E-Club geçiş bilgisi yüklenemedi.", data.adim);
        return;
      }
      setTalep(data.talep ?? null);
    } catch {
      hata("E-Club geçiş bilgisi yüklenemedi.", "E-Club geçişi");
    } finally {
      setYukleniyor(false);
    }
  }, [hata]);

  useEffect(() => { void cek(); }, [cek]);

  const modalKapat = (zorla = false) => {
    if (isliyor && !zorla) return;
    setKritikKarar(null);
    setSifre("");
    setVazgecmeOnayi(false);
    setModalHatasi("");
  };

  const kararGonder = async (karar: "puan_kullan" | KritikKarar) => {
    if (!talep) return;
    setIsliyor(true);
    setModalHatasi("");
    try {
      const response = await fetch("/eczanem/api/eclub-gecisi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gecis_id: talep.gecis_id,
          karar,
          ...(karar !== "puan_kullan" ? { sifre } : {}),
          ...(karar === "puandan_vazgec" ? { vazgecme_onayi: vazgecmeOnayi } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (karar === "puan_kullan") hata(data.hata ?? "Tercihiniz kaydedilemedi.", data.adim);
        else setModalHatasi(data.hata ?? "Kararınız uygulanamadı.");
        return;
      }
      basari(data.mesaj ?? "Kararınız kaydedildi.");
      if (data.tamamlandi) {
        window.location.assign("/eclub/ana-sayfa");
        return;
      }
      modalKapat(true);
      await cek();
    } catch {
      if (karar === "puan_kullan") hata("Tercihiniz kaydedilemedi.", "E-Club geçiş kararı");
      else setModalHatasi("Kararınız uygulanamadı; yeniden deneyin.");
    } finally {
      setIsliyor(false);
    }
  };

  if (yukleniyor || !talep) return null;

  const puanBitti = talep.kullanilabilir_puan === 0;
  const siparisBitti = talep.bekleyen_siparis === 0;
  const tamamlanabilir = puanBitti && siparisBitti;
  const rolEtiketi = ECLUB_KISI_ROL_ETIKETLERI[talep.rol] ?? talep.rol;

  return (
    <>
      <section className="mb-4 overflow-hidden rounded-2xl border border-[var(--tema-yerel-eczanem-cizgi-25)] bg-[var(--tema-yerel-eczanem-kart-01)] shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--tema-yerel-eczanem-cizgi-26)] bg-[var(--tema-yerel-eczanem-secim-zemin-09)] px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--tema-yerel-eczanem-eylem-zemin-05)] text-[var(--tema-yerel-eczanem-ters-metin-01)]"><ShieldCheck className="size-5" /></span>
            <div>
              <h2 className="text-sm font-extrabold text-[var(--tema-yerel-eczanem-ana-metin-15)]">E-Club üyelik geçişiniz onayınızı bekliyor</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--tema-yerel-eczanem-eylem-metin-06)]">{talep.eczane_adi} · {rolEtiketi}</p>
            </div>
          </div>
          <button type="button" onClick={() => void cek()} disabled={isliyor} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--tema-yerel-eczanem-cizgi-25)] bg-[var(--tema-yerel-eczanem-kart-01)] px-3 py-1.5 text-xs font-bold text-[var(--tema-yerel-eczanem-eylem-metin-07)] disabled:opacity-50"><RefreshCw className="size-3.5" /> Güncelle</button>
        </div>

        <div className="p-5">
          <p className="text-sm leading-6 text-[var(--tema-yerel-eczanem-ana-metin-13)]">E-Club üyeliğiniz etkinleşmeden önce mevcut Eczanem puanlarınız için karar vermeniz gerekiyor. Geçiş tamamlanana kadar yeni puan kazanımı ve yeni eczane bağlantısı yapılmaz.</p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[var(--tema-yerel-eczanem-cizgi-06)] bg-[var(--tema-yerel-eczanem-sayfa-zemini-05)] p-3"><span className="block text-[10px] font-bold uppercase tracking-wide text-[var(--tema-yerel-eczanem-yardimci-metin-04)]">Kullanılabilir puan</span><strong className="mt-1 block text-xl text-[var(--tema-yerel-eczanem-ana-metin-02)]">{talep.kullanilabilir_puan.toLocaleString("tr-TR")}</strong></div>
            <div className="rounded-xl border border-[var(--tema-yerel-eczanem-cizgi-06)] bg-[var(--tema-yerel-eczanem-sayfa-zemini-05)] p-3"><span className="block text-[10px] font-bold uppercase tracking-wide text-[var(--tema-yerel-eczanem-yardimci-metin-04)]">Onay bekleyen sipariş</span><strong className="mt-1 block text-xl text-[var(--tema-yerel-eczanem-ana-metin-02)]">{talep.bekleyen_siparis}</strong></div>
          </div>

          {talep.durum === "karar_bekliyor" ? (
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {tamamlanabilir ? (
                <button type="button" onClick={() => setKritikKarar("puan_kullanimi_tamamlandi")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--tema-yerel-eczanem-eylem-zemin-05)] px-4 py-3 text-sm font-extrabold text-[var(--tema-yerel-eczanem-ters-metin-01)] hover:bg-[var(--tema-yerel-eczanem-eylem-zemin-06)]"><BadgeCheck className="size-4" /> E-Club üyeliğimi onayla</button>
              ) : (
                <button type="button" disabled={isliyor} onClick={() => void kararGonder("puan_kullan")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--tema-yerel-eczanem-eylem-zemin-05)] px-4 py-3 text-sm font-extrabold text-[var(--tema-yerel-eczanem-ters-metin-01)] hover:bg-[var(--tema-yerel-eczanem-eylem-zemin-06)] disabled:opacity-50"><ArrowRight className="size-4" /> Puanlarımı kullanacağım</button>
              )}
              {!puanBitti && <button type="button" onClick={() => setKritikKarar("puandan_vazgec")} className="rounded-xl border border-[var(--tema-yerel-eczanem-islevsel-cizgi-12)] bg-[var(--tema-yerel-eczanem-islevsel-zemin-25)] px-4 py-3 text-sm font-extrabold text-[var(--tema-yerel-eczanem-islevsel-metin-25)] hover:bg-[var(--tema-yerel-eczanem-islevsel-zemin-26)]">Puanlarımdan vazgeçeceğim</button>}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-[var(--tema-yerel-eczanem-islevsel-cizgi-13)] bg-[var(--tema-yerel-eczanem-islevsel-zemin-27)] p-4">
              <h3 className="text-sm font-extrabold text-[var(--tema-yerel-eczanem-islevsel-metin-26)]">Puan kullanımı tercihiniz kayıtlı</h3>
              <p className="mt-1 text-xs leading-5 text-[var(--tema-yerel-eczanem-islevsel-metin-27)]">{!puanBitti ? "Aşağıdaki İndirim Kullan alanından puanlarınızı siparişe dönüştürün." : !siparisBitti ? "Siparişlerinizin eczane tarafından sonuçlandırılmasını bekleyin." : "Puan ve sipariş süreci tamamlandı; E-Club üyeliğinizi etkinleştirebilirsiniz."}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {tamamlanabilir && <button type="button" onClick={() => setKritikKarar("puan_kullanimi_tamamlandi")} className="rounded-lg bg-[var(--tema-yerel-eczanem-islevsel-zemin-28)] px-4 py-2 text-xs font-extrabold text-[var(--tema-yerel-eczanem-ters-metin-01)] hover:bg-[var(--tema-yerel-eczanem-islevsel-zemin-29)]">E-Club üyeliğini tamamla</button>}
                {!puanBitti && <button type="button" onClick={() => setKritikKarar("puandan_vazgec")} className="rounded-lg border border-[var(--tema-yerel-eczanem-islevsel-cizgi-12)] bg-[var(--tema-yerel-eczanem-kart-01)] px-4 py-2 text-xs font-extrabold text-[var(--tema-yerel-eczanem-islevsel-metin-25)]">Kalan puanlarımdan vazgeç</button>}
              </div>
            </div>
          )}

          <button type="button" onClick={() => setKritikKarar("reddet")} className="mt-4 text-xs font-bold text-[var(--tema-yerel-eczanem-yardimci-metin-04)] underline-offset-2 hover:text-[var(--tema-yerel-eczanem-islevsel-metin-07)] hover:underline">Bu E-Club üyelik talebini reddet</button>
        </div>
      </section>

      {kritikKarar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--tema-yerel-eczanem-ortu-01)]/45 px-4" role="dialog" aria-modal="true" aria-labelledby="eclub-gecis-modal-baslik">
          <form onSubmit={(event) => { event.preventDefault(); void kararGonder(kritikKarar); }} className="relative w-full max-w-md rounded-2xl bg-[var(--tema-yerel-eczanem-kart-01)] p-6 shadow-2xl">
            <button type="button" onClick={() => modalKapat()} disabled={isliyor} aria-label="Kapat" className="absolute right-4 top-4 rounded-lg p-1 text-[var(--tema-yerel-eczanem-yardimci-metin-03)] hover:bg-[var(--tema-yerel-eczanem-sayfa-zemini-15)] hover:text-[var(--tema-yerel-eczanem-ana-metin-13)]"><X className="size-5" /></button>
            <h2 id="eclub-gecis-modal-baslik" className="pr-8 text-lg font-extrabold text-[var(--tema-yerel-eczanem-ana-metin-02)]">{KARAR_METINLERI[kritikKarar].baslik}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--tema-yerel-eczanem-ana-metin-16)]">{KARAR_METINLERI[kritikKarar].aciklama}</p>

            {kritikKarar === "puandan_vazgec" && (
              <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-xl border border-[var(--tema-yerel-eczanem-islevsel-cizgi-14)] bg-[var(--tema-yerel-eczanem-islevsel-zemin-25)] p-3 text-xs font-semibold leading-5 text-[var(--tema-yerel-eczanem-islevsel-metin-25)]">
                <input type="checkbox" checked={vazgecmeOnayi} onChange={(event) => setVazgecmeOnayi(event.target.checked)} className="mt-0.5 size-4" />
                <span>Kullanılabilir puanlarımdan geri alınamaz biçimde vazgeçtiğimi ve bekleyen siparişlerimin düşeceğini onaylıyorum.</span>
              </label>
            )}

            <label className="mt-4 block text-xs font-bold text-[var(--tema-yerel-eczanem-ana-metin-13)]" htmlFor="eclub-gecis-sifre">Mevcut şifreniz</label>
            <input id="eclub-gecis-sifre" type="password" value={sifre} onChange={(event) => setSifre(event.target.value)} autoComplete="current-password" required disabled={isliyor} className="mt-2 w-full rounded-xl border border-[var(--tema-yerel-eczanem-cizgi-27)] px-3 py-2.5 text-sm outline-none focus:border-[var(--tema-yerel-eczanem-cizgi-28)] disabled:bg-[var(--tema-yerel-eczanem-sayfa-zemini-15)]" />
            {modalHatasi && <div className="mt-3 rounded-lg border border-[var(--tema-yerel-eczanem-islevsel-cizgi-02)] bg-[var(--tema-yerel-eczanem-islevsel-zemin-08)] px-3 py-2 text-xs font-semibold text-[var(--tema-yerel-eczanem-islevsel-metin-07)]">{modalHatasi}</div>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => modalKapat()} disabled={isliyor} className="rounded-xl border border-[var(--tema-yerel-eczanem-cizgi-27)] px-4 py-2 text-sm font-bold text-[var(--tema-yerel-eczanem-ana-metin-13)] disabled:opacity-50">Vazgeç</button>
              <button type="submit" disabled={isliyor || !sifre || (kritikKarar === "puandan_vazgec" && !vazgecmeOnayi)} className={`rounded-xl px-4 py-2 text-sm font-extrabold text-[var(--tema-yerel-eczanem-ters-metin-01)] disabled:opacity-50 ${kritikKarar === "reddet" || kritikKarar === "puandan_vazgec" ? "bg-[var(--tema-yerel-eczanem-islevsel-zemin-30)] hover:bg-[var(--tema-yerel-eczanem-islevsel-zemin-31)]" : "bg-[var(--tema-yerel-eczanem-eylem-zemin-07)] hover:bg-[var(--tema-yerel-eczanem-eylem-zemin-08)]"}`}>{isliyor ? "İşleniyor…" : KARAR_METINLERI[kritikKarar].buton}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
