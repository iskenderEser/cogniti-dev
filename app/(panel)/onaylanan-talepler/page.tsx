// app/onaylanan-talepler/page.tsx
//
// F-12 (docs/test_pm_iu_21072026.md) + ikinci tur talebi (21.07): IU'nun
// "Onaylanan Talepler" sekmesi — tablo görünümü (Talep No | Talep Adı |
// Talep Tarihi | Talep Onay Tarihi); satıra tıklanınca talebin onaylı
// senaryosu, videosu (oynatılabilir) ve soru seti salt-okuma açılır.
// Talep No görünümü: `${firma_adi}_${talep_no}` (İskender kararı, 21.07).

"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import { HedefRolPilleri } from "@/components/pill";
import type { TalepBilgisi } from "@/lib/utils/talepZinciri";
import type { HedefRoller } from "@/app/(panel)/talepler/_types";
import { useAuth } from "@/app/providers/AuthProvider";
import { talepIdGoster } from "@/lib/utils/talepId";
import VideoOnizleme from "@/components/video/VideoOnizleme";
import TalepKlasorleri from "@/components/talep/TalepKlasorleri";
import { useListe, ListeArama } from "@/components/liste";
import type { DepartmanKey } from "@/lib/video/departman";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import { SayfaYenileBasligi } from "@/components/ui/sayfa-yenile-basligi";

interface SoruKaydi {
  soru_metni: string;
  secenekler: { harf: string; metin: string; dogru: boolean }[];
}

interface SenaryoOnayiSatiri {
  senaryo_durum_id: string;
  created_at: string;
  senaryolar: { talep_id: string; senaryo_metni: string } | null;
}

interface VideoOnayiSatiri {
  arac_durum_id: string;
  ogrenme_araclari: { dosya_yolu: string | null; senaryo_durum_id: string | null } | null;
}

interface SoruSetiOnayiSatiri {
  soru_setleri: { arac_durum_id: string | null; sorular: SoruKaydi[] | null } | null;
}

// Klasörleme alanları (firma_adi, departman, urun_adi) künyeden gelir ve
// TalepKlasorleri'nin beklediği sözleşmeyi karşılar — ekran ayrıca hesaplamaz.
interface OnayliTalep {
  talep_id: string;
  talep_no_goster: string;
  firma_adi: string;
  departman: DepartmanKey;
  urun_adi: string;
  teknik_adi: string;
  hedef_roller: HedefRoller;
  talep_tarihi: string | null;
  onay_tarihi: string;
  senaryo_metni: string;
  video_url: string | null;
  sorular: SoruKaydi[] | null;
  yayin_oncesi_silindi: boolean;
}

export default function OnaylananTaleplerPage() {
  const router = useRouter();
  const { kullanici, yukleniyor: authYukleniyor } = useAuth();
  const [kayitlar, setKayitlar] = useState<OnayliTalep[]>([]);
  const [acikTalep, setAcikTalep] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);
  const { mesajlar, hata } = useHataMesaji();

  // Yalnız ARAMA (İskender kararı 27.07): sayfada klasör kırılımı var, klasör
  // içinde "daha fazla göster" tuhaf durur. adim: Infinity → dilimleme kapalı.
  // Arama klasörlemeden ÖNCE uygulanır ki klasörler arama sonucunu yansıtsın.
  const liste = useListe({
    veri: kayitlar,
    adim: Infinity,
    aramaAlanlari: [
      { anahtar: "no", etiket: "Talep No", deger: (k: OnayliTalep) => k.talep_no_goster },
      { anahtar: "ad", etiket: "Ürün / Eğitim", deger: (k: OnayliTalep) => k.urun_adi },
    ],
  });

  useEffect(() => {
    if (authYukleniyor) return;
    if (!kullanici) {
      router.push("/login");
      return;
    }
    if (kullanici.rol.toLowerCase() !== "iu") {
      router.push("/ana-sayfa");
      return;
    }
  }, [kullanici, authYukleniyor, router]);

  const veriCek = useCallback(async (ilkYukleme = false) => {
    if (ilkYukleme) setLoading(true);
    else setYenileniyor(true);
    try {
    const yanit = await fetch("/onaylanan-talepler/api", { cache: "no-store" });
    const veri = await yanit.json();
    if (!yanit.ok) { hata(veri.hata ?? "Onaylı içerikler yüklenemedi.", veri.adim ?? "ortak öğrenme aracı zinciri"); return; }
    const { senaryoOnaylari, videoOnaylari, setOnaylari } = veri;

    const videoMap = new Map<string, { video_url: string; arac_durum_id: string }>();
    const videoOnayiSatirlari = (videoOnaylari ?? []) as unknown as VideoOnayiSatiri[];
    videoOnayiSatirlari.forEach((v) => {
      const video = v.ogrenme_araclari;
      if (video?.senaryo_durum_id && video.dosya_yolu) {
        videoMap.set(video.senaryo_durum_id, { video_url: video.dosya_yolu, arac_durum_id: v.arac_durum_id });
      }
    });

    const setMap = new Map<string, SoruKaydi[]>();
    const soruSetiOnayiSatirlari = (setOnaylari ?? []) as unknown as SoruSetiOnayiSatiri[];
    soruSetiOnayiSatirlari.forEach((s) => {
      const set = s.soru_setleri;
      if (set?.arac_durum_id && set.sorular?.length) setMap.set(set.arac_durum_id, set.sorular);
    });

    // Talep künyeleri TEK KAPIDAN, toplu (25.07, Aşama 3).
    const talepIdler = Array.from(new Set(
      ((senaryoOnaylari ?? []) as unknown as SenaryoOnayiSatiri[])
        .map((o) => o.senaryolar?.talep_id)
        .filter(Boolean)
    )) as string[];
    const kunyeMap = new Map<string, TalepBilgisi>();
    if (talepIdler.length > 0) {
      const res = await fetch(`/talepler/api/kunye?talep_idler=${talepIdler.join(",")}`);
      const veri = await res.json();
      if (res.ok) for (const k of veri.kunyeler as TalepBilgisi[]) kunyeMap.set(k.talep_id, k);
    }

    // Talep başına EN SON onaylı senaryo esas alınır (sıralama zaten yeni→eski).
    const gorulen = new Set<string>();
    const liste: OnayliTalep[] = [];
    ((senaryoOnaylari ?? []) as unknown as SenaryoOnayiSatiri[]).forEach((o) => {
      const senaryo = o.senaryolar;
      if (!senaryo) return;
      const talep = kunyeMap.get(senaryo.talep_id);
      if (!talep || gorulen.has(talep.talep_id)) return;
      gorulen.add(talep.talep_id);
      const video = videoMap.get(o.senaryo_durum_id) ?? null;
      liste.push({
        talep_id: talep.talep_id,
        talep_no_goster: talepIdGoster(talep.firma_adi, talep.talep_no),
        firma_adi: talep.firma_adi,
        departman: talep.departman,
        urun_adi: talep.urun_adi,
        teknik_adi: talep.teknik_adi,
        hedef_roller: talep.hedef_roller,
        talep_tarihi: talep.created_at,
        onay_tarihi: o.created_at,
        senaryo_metni: senaryo.senaryo_metni,
        video_url: video?.video_url ?? null,
        sorular: video ? (setMap.get(video.arac_durum_id) ?? null) : null,
        yayin_oncesi_silindi: talep.yayin_oncesi_silme_durumu === "tamamlandi",
      });
    });

      setKayitlar(liste);
    } catch (err) {
      hata("Onaylanan talepler yüklenemedi.", "Onaylanan Talepler", err instanceof Error ? err.message : undefined);
    } finally {
      if (ilkYukleme) setLoading(false);
      else setYenileniyor(false);
    }
  }, [hata]);

  useEffect(() => { if (kullanici) void veriCek(true); }, [kullanici, veriCek]);

  const formatTarih = (tarih: string | null) =>
    tarih ? new Date(tarih).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";

  // Auth guard layout'ta; IU erişim kontrolü useEffect'te; burada veri spinner'ı.
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--tema-yerel-uretim-sayfa-zemini-01)] flex items-center justify-center">
        <svg className="animate-spin w-6 h-6 text-[var(--tema-yerel-uretim-yardimci-metin-01)]" fill="none" viewBox="0 0 24 24">
          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const DetayIcerik = ({ k }: { k: OnayliTalep }) => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-[var(--tema-yerel-uretim-ana-metin-01)]">{k.urun_adi}</span>
          <span className="text-xs text-[var(--tema-yerel-uretim-yardimci-metin-01)]">{k.teknik_adi}</span>
        </div>
        <HedefRolPilleri hedefRoller={k.hedef_roller} />
        {k.yayin_oncesi_silindi && (
          <span className="rounded-full border border-[var(--tema-yerel-uretim-cizgi-01)] bg-[var(--tema-yerel-uretim-sayfa-zemini-01)] px-2.5 py-1 text-[11px] font-bold text-[var(--tema-yerel-uretim-ana-metin-02)]">Yayın öncesi silindi</span>
        )}
      </div>

      <div>
        <div className="text-xs font-semibold text-[var(--tema-yerel-uretim-yardimci-metin-01)] mb-1.5">Onaylı Senaryo</div>
        <p className="text-sm text-[var(--tema-yerel-uretim-ana-metin-03)] leading-relaxed whitespace-pre-wrap m-0">{k.senaryo_metni}</p>
      </div>

      {k.video_url && !k.yayin_oncesi_silindi && (
        <div>
          <div className="text-xs font-semibold text-[var(--tema-yerel-uretim-yardimci-metin-01)] mb-1.5">Onaylı Video</div>
          <VideoOnizleme
            videoUrl={k.video_url}
            className="rounded-lg border border-[var(--tema-yerel-uretim-cizgi-01)]"
            ariaLabel={`${k.urun_adi} videosunu oynat`}
          />
        </div>
      )}

      {k.sorular && k.sorular.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-[var(--tema-yerel-uretim-yardimci-metin-01)] mb-1.5">Onaylı Soru Seti</div>
          <div className="flex flex-col gap-2">
            {k.sorular.map((soru, i) => (
              <div key={i} className="border border-[var(--tema-yerel-uretim-cizgi-01)] rounded-lg px-3 py-2.5 bg-[var(--tema-yerel-uretim-kart-01)]">
                <div className="text-sm text-[var(--tema-yerel-uretim-ana-metin-01)] mb-1.5">{i + 1}. {soru.soru_metni}</div>
                {soru.secenekler?.map(sec => (
                  <div key={sec.harf} className="text-xs mb-0.5 flex items-center gap-1.5"
                    style={{ color: sec.dogru ? "var(--tema-yerel-uretim-islevsel-metin-01)" : "var(--tema-yerel-uretim-islevsel-metin-02)", fontWeight: sec.dogru ? 700 : 400 }}>
                    <span>{sec.harf}) {sec.metin}</span>
                    {sec.dogru && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--tema-yerel-uretim-islevsel-metin-01)" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="max-w-6xl mx-auto px-3 py-4 md:px-6 md:py-5 lg:px-8 lg:py-7 flex flex-col gap-4">
        <SayfaYenileBasligi className="flex flex-wrap items-center justify-between gap-3"
          baslik={<h1 className="text-lg font-bold text-[var(--tema-yerel-uretim-ana-metin-01)] m-0">Onaylanan Talepler</h1>}

          aksiyon={<YenileButonu yenileniyor={yenileniyor} onYenile={() => veriCek()} />}

        />

        <div className="mb-3 flex justify-end"><ListeArama arama={liste.arama} /></div>

        {liste.toplam === 0 ? (
          <div className="bg-[var(--tema-yerel-uretim-kart-01)] border border-[var(--tema-yerel-uretim-cizgi-01)] rounded-xl overflow-hidden">
            <p className="text-sm text-[var(--tema-yerel-uretim-yardimci-metin-02)] text-center py-8 m-0">
              {kayitlar.length === 0 ? "Henüz onaylanmış talep yok." : "Aramanıza uyan talep bulunamadı."}
            </p>
          </div>
        ) : (
          // Klasör kırılımı (26.07): düz liste talep geldikçe uzuyordu ve onaylı
          // bir işin hangi firmaya/müdürlüğe/ürüne ait olduğu okunmuyordu.
          // Gösterim aşağıda aynı kaldı — yalnız hangi taleplerin görüneceğini
          // klasör belirliyor.
          <TalepKlasorleri talepler={liste.gorunen} render={(liste) => (
          <div className="bg-[var(--tema-yerel-uretim-kart-01)] border border-[var(--tema-yerel-uretim-cizgi-01)] rounded-xl overflow-hidden">
            <div className="md:hidden divide-y divide-[var(--tema-yerel-uretim-cizgi-02)]">
              {liste.map(k => (
                <div key={k.talep_id}>
                  <div onClick={() => setAcikTalep(acikTalep === k.talep_id ? null : k.talep_id)}
                    className="px-4 py-3 cursor-pointer flex items-center justify-between gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-[var(--tema-yerel-uretim-yardimci-metin-02)]">{k.talep_no_goster}</span>
                      <span className="text-sm font-semibold text-[var(--tema-yerel-uretim-ana-metin-01)] truncate">{k.urun_adi}</span>
                      {k.yayin_oncesi_silindi && <span className="mt-1 w-fit rounded-full border border-[var(--tema-yerel-uretim-cizgi-01)] bg-[var(--tema-yerel-uretim-sayfa-zemini-01)] px-2 py-0.5 text-[10px] font-bold text-[var(--tema-yerel-uretim-ana-metin-02)]">Yayın öncesi silindi</span>}
                      <span className="text-xs text-[var(--tema-yerel-uretim-yardimci-metin-01)]">{formatTarih(k.talep_tarihi)} → {formatTarih(k.onay_tarihi)}</span>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--tema-yerel-uretim-yardimci-metin-03)" strokeWidth="2" width="14" height="14" className="flex-shrink-0"
                      style={{ transform: acikTalep === k.talep_id ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                  {acikTalep === k.talep_id && (
                    <div className="px-4 py-4 bg-[var(--tema-yerel-uretim-sayfa-zemini-01)] border-t border-[var(--tema-yerel-uretim-cizgi-03)]">
                      <DetayIcerik k={k} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="hidden md:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--tema-yerel-uretim-cizgi-03)] bg-[var(--tema-yerel-uretim-sayfa-zemini-01)]">
                    <th className="text-left px-5 py-2.5 text-[var(--tema-yerel-uretim-yardimci-metin-02)] font-medium text-xs uppercase">Talep No</th>
                    <th className="text-left px-3 py-2.5 text-[var(--tema-yerel-uretim-yardimci-metin-02)] font-medium text-xs uppercase">Talep Adı (Ürün Adı)</th>
                    <th className="text-left px-3 py-2.5 text-[var(--tema-yerel-uretim-yardimci-metin-02)] font-medium text-xs uppercase">Talep Tarihi</th>
                    <th className="text-left px-3 py-2.5 text-[var(--tema-yerel-uretim-yardimci-metin-02)] font-medium text-xs uppercase">Talep Onay Tarihi</th>
                    <th className="px-5 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {liste.map(k => (
                    <Fragment key={k.talep_id}>
                      <tr onClick={() => setAcikTalep(acikTalep === k.talep_id ? null : k.talep_id)}
                        className="border-b border-[var(--tema-yerel-uretim-cizgi-02)] cursor-pointer hover:bg-[var(--tema-yerel-uretim-sayfa-zemini-01)] transition-colors duration-100">
                        <td className="px-5 py-3 text-[var(--tema-yerel-uretim-ana-metin-03)] font-semibold">{k.talep_no_goster}</td>
                        <td className="px-3 py-3 text-[var(--tema-yerel-uretim-ana-metin-01)]">
                          <div>{k.urun_adi}</div>
                          {k.yayin_oncesi_silindi && <span className="mt-1 inline-flex rounded-full border border-[var(--tema-yerel-uretim-cizgi-01)] bg-[var(--tema-yerel-uretim-sayfa-zemini-01)] px-2 py-0.5 text-[10px] font-bold text-[var(--tema-yerel-uretim-ana-metin-02)]">Yayın öncesi silindi</span>}
                        </td>
                        <td className="px-3 py-3 text-[var(--tema-yerel-uretim-yardimci-metin-01)] text-xs">{formatTarih(k.talep_tarihi)}</td>
                        <td className="px-3 py-3 text-[var(--tema-yerel-uretim-yardimci-metin-01)] text-xs">{formatTarih(k.onay_tarihi)}</td>
                        <td className="px-5 py-3">
                          <svg viewBox="0 0 24 24" fill="none" stroke="var(--tema-yerel-uretim-yardimci-metin-03)" strokeWidth="2" width="14" height="14"
                            style={{ transform: acikTalep === k.talep_id ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </td>
                      </tr>
                      {acikTalep === k.talep_id && (
                        <tr>
                          <td colSpan={5} className="px-5 py-4 bg-[var(--tema-yerel-uretim-sayfa-zemini-01)] border-b border-[var(--tema-yerel-uretim-cizgi-03)]">
                            <DetayIcerik k={k} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )} />
        )}
      </div>

      <HataMesajiContainer mesajlar={mesajlar} />
    </>
  );
}
