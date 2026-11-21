"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Radio, Send } from "lucide-react";
import { HEDEF_ROL_TASARIM } from "@/app/(panel)/talepler/_types";
import {
  CanliYayinHoykKabugu,
  hedefRolKisaEtiketi,
} from "@/app/partner/canli-yayinlar/CanliYayinHoykKabugu";
import { AgoraRafOklari } from "@/components/agora/AgoraRafOklari";
import rafStyles from "@/components/agora/AgoraVitrini.module.css";
import {
  SadeKontrolButonu,
  SadeKontrolGrubu,
} from "@/components/kontrol/SadeKontroller";
import { Button } from "@/components/ui/button";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import MobilYayinAkisi from "@/components/yayin/MobilYayinAkisi";
import { TUM_HEDEF_ROLLER, type HedefRol } from "@/lib/utils/roller";

export interface CanliAgoraSiparisKaydi {
  siparis_id: string;
  oturum_id: string;
  canli_egitim_id: string;
  partner_id: string;
  sirket_adi: string;
  partner_egitim_id: string;
  egitim_adi: string;
  kategori_kodu: string;
  kategori: string;
  hedef_roller: HedefRol[];
  aciklama: string;
  baslangic_at: string;
  bitis_at: string;
  sure_dakika: number;
  kapasite: number;
  satin_alma_bedeli: number;
  token_tutari: number;
  siparis_tarihi: string;
  durum: "musait" | "siparis_verildi" | "tamamlandi" | "iptal";
  viva_etkinlik_id: string | null;
  davetli_sayisi?: number;
}

const ERKEN_GIRIS_MS = 15 * 60_000;
const BITIS_TOLERANS_MS = 10 * 60_000;

export default function CanliAgoraYayinlarim({
  gorunum = "gelecek",
}: {
  gorunum?: "gelecek" | "gecmis";
}) {
  const router = useRouter();
  const raf = useRef<HTMLDivElement>(null);
  const [yayinlar, setYayinlar] = useState<CanliAgoraSiparisKaydi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [hedefFiltresi, setHedefFiltresi] = useState<HedefRol | "">("");
  const [partner, setPartner] = useState("");
  const [aramaMetni, setAramaMetni] = useState("");
  const [arama, setArama] = useState("");
  const [katilinanId, setKatilinanId] = useState<string | null>(null);
  const [simdiMs, setSimdiMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setSimdiMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const yenile = useCallback(async () => {
    setYukleniyor(true);
    setHata("");
    try {
      const r = await fetch("/agora-yayinlari/canli/api", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) {
        setHata(d.hata ?? "Canlı Agora yayınlarınız alınamadı.");
        return;
      }
      setYayinlar(d.yayinlar ?? []);
    } catch {
      setHata("Canlı Agora yayınlarınız alınamadı.");
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    void yenile();
  }, [yenile]);

  const yayinaKatil = async (oturumId: string) => {
    setHata("");
    setKatilinanId(oturumId);
    try {
      const r = await fetch("/agora/api/canli/katil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oturum_id: oturumId }),
      });
      const d = await r.json();
      if (!r.ok || typeof d.url !== "string") {
        setHata(d.hata ?? "Canlı yayın odası açılamadı.");
        return;
      }
      window.open(d.url, "_blank", "noopener,noreferrer");
    } catch {
      setHata("Canlı yayın odası açılamadı.");
    } finally {
      setKatilinanId(null);
    }
  };

  const { gelecekYayinlar, gecmisYayinlar } = useMemo(() => {
    const gelecek: CanliAgoraSiparisKaydi[] = [];
    const gecmis: CanliAgoraSiparisKaydi[] = [];
    for (const y of yayinlar) {
      const bitMs = Date.parse(y.bitis_at);
      if (y.durum === "tamamlandi" || simdiMs > bitMs + BITIS_TOLERANS_MS) {
        gecmis.push(y);
      } else {
        gelecek.push(y);
      }
    }
    return { gelecekYayinlar: gelecek, gecmisYayinlar: gecmis };
  }, [yayinlar, simdiMs]);

  const aktifListe = gorunum === "gecmis" ? gecmisYayinlar : gelecekYayinlar;

  const partnerler = useMemo(
    () =>
      Array.from(
        new Map(
          aktifListe.map((y) => [y.partner_id, { id: y.partner_id, ad: y.sirket_adi }]),
        ).values(),
      ),
    [aktifListe],
  );

  const filtrelenmis = useMemo(() => {
    const sorgu = arama.trim().toLocaleLowerCase("tr-TR");
    return aktifListe.filter((y) => {
      if (hedefFiltresi && !y.hedef_roller.includes(hedefFiltresi)) return false;
      if (partner && y.partner_id !== partner) return false;
      if (!sorgu) return true;
      return `${y.egitim_adi} ${y.partner_egitim_id} ${y.sirket_adi} ${y.kategori}`
        .toLocaleLowerCase("tr-TR")
        .includes(sorgu);
    });
  }, [aktifListe, hedefFiltresi, partner, arama]);

  const gecmisMi = gorunum === "gecmis";
  const rafBasligi = gecmisMi ? "Geçmiş Canlı Yayınlar" : "Agora’daki Canlı Yayınlar";
  const filtreAnahtari = `${gorunum}:${hedefFiltresi}:${partner}:${arama}`;

  const kartOlustur = (y: CanliAgoraSiparisKaydi) => {
    const basMs = Date.parse(y.baslangic_at);
    const bitMs = Date.parse(y.bitis_at);
    const henuzErken = simdiMs < basMs - ERKEN_GIRIS_MS;
    const suresiDoldu = simdiMs > bitMs + BITIS_TOLERANS_MS;

    return (
      <CanliYayinHoykKabugu
        className="h-full"
        sirketAdi={y.sirket_adi}
        logoSrc={`/agora/api/partner-logo/${y.partner_id}`}
        egitimAdi={y.egitim_adi}
        sureDakika={y.sure_dakika}
        kapasite={y.kapasite}
        baslangicMs={basMs}
        pasifMi={gecmisMi}
        sagRozet={
          gecmisMi ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
              Tamamlandı
            </span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              Sipariş Verildi
            </span>
          )
        }
      >
        {/* Hedef kitle pill'leri + PE kodu */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {y.hedef_roller.map((rol) => (
              <span
                key={rol}
                className="inline-flex items-center rounded-full border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] px-2 py-0.5 text-[9.5px] font-bold text-[var(--tema-metin)]"
              >
                {hedefRolKisaEtiketi(rol)}
              </span>
            ))}
          </div>
          {y.partner_egitim_id && (
            <span
              aria-label={`Yayın ID: ${y.partner_egitim_id}`}
              className="shrink-0 pt-0.5 font-mono text-[10.5px] font-bold text-[var(--tema-hoyk-talep-metni)]"
            >
              {y.partner_egitim_id}
            </span>
          )}
        </div>

        {/* Açıklama (2 satır) */}
        <p className="m-0 mt-2 min-h-[2.25rem] line-clamp-2 text-[11px] leading-relaxed text-[var(--tema-ikincil-metin)]">
          {y.aciklama}
        </p>

        {/* Sipariş Tutarı & Kontenjan Özeti */}
        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-lg border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] px-2.5 py-1.5 text-[11px]">
          <span className="text-[var(--tema-ikincil-metin)]">
            {y.kapasite} katılımcı kontenjanı
          </span>
          <strong className="text-[var(--tema-baslik)]">
            {y.token_tutari.toLocaleString("tr-TR")} Token
          </strong>
        </div>

        {/* Alıcı Aksiyonları */}
        <div className="mt-auto pt-2.5">
          <div className="flex flex-wrap items-center gap-1.5 border-t border-[var(--tema-cizgi)] pt-2.5">
            {!gecmisMi ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 min-w-0 flex-1 gap-1 px-2 text-[10.5px] whitespace-nowrap"
                  onClick={() =>
                    router.push(
                      y.viva_etkinlik_id
                        ? `/viva/${y.viva_etkinlik_id}/duzenle?agora_siparis=${y.siparis_id}`
                        : `/viva/yeni?agora_siparis=${y.siparis_id}`,
                    )
                  }
                >
                  <Send className="size-3" aria-hidden="true" />
                  {y.viva_etkinlik_id
                    ? `Davetliler (${y.davetli_sayisi ?? 0}/${y.kapasite})`
                    : "Yayın Daveti"}
                </Button>

                <Button
                  type="button"
                  size="sm"
                  className="h-7 min-w-0 flex-1 gap-1 px-2 text-[10.5px] whitespace-nowrap"
                  disabled={katilinanId === y.oturum_id || henuzErken || suresiDoldu}
                  title={
                    henuzErken
                      ? "Yayın odasına başlangıç saatinden en fazla 15 dakika önce giriş yapılabilir."
                      : undefined
                  }
                  onClick={() => void yayinaKatil(y.oturum_id)}
                >
                  <Radio className="size-3" aria-hidden="true" />
                  {katilinanId === y.oturum_id
                    ? "Bağlanıyor..."
                    : henuzErken
                      ? "15 dk Önce Açılır"
                      : "Yayına Katıl"}
                </Button>
              </>
            ) : (
              <span className="w-full text-center text-[11px] font-semibold text-[var(--tema-ikincil-metin)]">
                Oturum Tamamlandı
              </span>
            )}
          </div>
        </div>
      </CanliYayinHoykKabugu>
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      {/* Üst Başlık */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--tema-cizgi)] pb-4">
        <div>
          <p className="m-0 text-[11px] font-bold uppercase tracking-[1.4px] text-[var(--tema-kontrol-eylem)]">
            COGNITI VIVA &amp; AGORA
          </p>
          <h1 className="m-0 mt-1 text-2xl font-bold text-[var(--tema-baslik)]">
            {gecmisMi ? "Geçmiş Canlı Yayınlar" : "Agora Canlı Yayınlar"}
          </h1>
          <p className="m-0 mt-1 text-xs text-[var(--tema-ikincil-metin)]">
            {gecmisMi
              ? "Tamamlanmış canlı yayın siparişleriniz."
              : "Sipariş verdiğiniz aktif ve gelecek canlı yayın oturumlarınız."}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push("/agora")}
        >
          Agora’ya Git
        </Button>
      </div>

      {hata && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {hata}
        </div>
      )}

      {/* Hedef Kitle Yatay Şeridi */}
      <div className="max-w-full overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="w-max min-w-full">
          <SadeKontrolGrubu tur="sekme" aria-label="Hedef kitle">
            <SadeKontrolButonu
              aria-pressed={hedefFiltresi === ""}
              onClick={() => setHedefFiltresi("")}
            >
              Tüm Hedef Kitleler
            </SadeKontrolButonu>
            {TUM_HEDEF_ROLLER.map((r) => (
              <SadeKontrolButonu
                key={r}
                aria-pressed={hedefFiltresi === r}
                onClick={() => setHedefFiltresi(r)}
              >
                {r === "eczanem"
                  ? "Eczanem (Eczane Danışanı)"
                  : HEDEF_ROL_TASARIM[r].tamEtiket}
              </SadeKontrolButonu>
            ))}
          </SadeKontrolGrubu>
        </div>
      </div>

      {/* Partner Filtresi + Sayaç + Arama + Yenile */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {partnerler.length > 0 && (
            <SadeKontrolGrubu tur="sekme" aria-label="Canlı yayın partnerleri">
              <SadeKontrolButonu aria-pressed={!partner} onClick={() => setPartner("")}>
                Tüm Partnerler
              </SadeKontrolButonu>
              {partnerler.map((p) => (
                <SadeKontrolButonu
                  key={p.id}
                  aria-pressed={partner === p.id}
                  onClick={() => setPartner(p.id)}
                >
                  {p.ad}
                </SadeKontrolButonu>
              ))}
            </SadeKontrolGrubu>
          )}
          {!yukleniyor && (
            <span className="whitespace-nowrap text-xs text-[var(--tema-kontrol-ikincil-metin)]">
              {filtrelenmis.length} Yayın
            </span>
          )}
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <form
            role="search"
            aria-label="Yayın Arama"
            className="flex min-w-0 flex-1 items-center gap-2 sm:flex-initial"
            onSubmit={(ev) => {
              ev.preventDefault();
              setArama(aramaMetni.trim());
            }}
          >
            <label htmlFor="firma-canli-arama" className="sr-only">
              Yayın Adı, PE Kodu veya Partner
            </label>
            <input
              id="firma-canli-arama"
              type="search"
              placeholder="Yayın adı, PE kodu veya partner"
              maxLength={200}
              value={aramaMetni}
              onChange={(ev) => {
                const deger = ev.target.value;
                setAramaMetni(deger);
                if (!deger.trim()) {
                  setArama("");
                }
              }}
              className="h-9 w-full min-w-0 rounded-md border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-yuzey)] px-3 text-xs text-[var(--tema-metin)] sm:w-64"
            />
            <Button type="submit" size="sm" className="h-9 shrink-0">
              Ara
            </Button>
          </form>
          <YenileButonu yenileniyor={yukleniyor} onYenile={() => void yenile()} />
        </div>
      </div>

      {yukleniyor ? (
        <p role="status" className="m-0 py-6 text-sm text-[var(--tema-ikincil-metin)]">
          Canlı Agora yayınlarınız yükleniyor…
        </p>
      ) : filtrelenmis.length === 0 ? (
        <section className="rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-6 text-sm text-[var(--tema-ikincil-metin)] shadow-sm">
          {aktifListe.length === 0
            ? gecmisMi
              ? "Henüz tamamlanmış bir canlı yayın siparişiniz bulunmuyor."
              : "Henüz gerçekleşecek bir canlı yayın siparişiniz bulunmuyor. Üst menüdeki AGORA sekmesinden canlı yayın siparişi verebilirsiniz."
            : "Seçilen filtreye uygun canlı yayın bulunmuyor."}
        </section>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="m-0 text-base font-bold text-[var(--tema-baslik)]">{rafBasligi}</h2>
          </div>

          <MobilYayinAkisi
            kayitlar={filtrelenmis}
            kayitAnahtari={(y) => y.siparis_id}
            renderKart={kartOlustur}
            sayacGoster={false}
            sifirlamaAnahtari={filtreAnahtari}
            masaustuIcerik={
              <div className={rafStyles.rafAlani}>
                <AgoraRafOklari raf={raf} baslik={rafBasligi} />
                <div key={filtreAnahtari} ref={raf} className={rafStyles.kaydir}>
                  {filtrelenmis.map((y) => (
                    <div
                      key={y.siparis_id}
                      className="w-[320px] min-w-0 shrink-0 snap-start"
                    >
                      {kartOlustur(y)}
                    </div>
                  ))}
                </div>
              </div>
            }
          />
        </div>
      )}
    </div>
  );
}
