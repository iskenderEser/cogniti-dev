"use client";

import { SadeKisiSecimi } from "@/components/kontrol/KisiKontroller";
import { SadeKontrolButonu, SadeKontrolGrubu, SadeSecim } from "@/components/kontrol/SadeKontroller";
import { useEczanemGonderimSaati } from "@/components/eczanem/GonderimSuresi";
import type { YayinTuruFiltreDegeri } from "@/components/ogrenme-araci/YayinTuruFiltresi";
import { PeriyotButonlari } from "@/components/ui/periyot-butonlari";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import MobilYayinAkisi from "@/components/yayin/MobilYayinAkisi";
import filtreStyles from "@/components/yayin/egitim-yayin-filtreleri.module.css";
import { UttYayinTuruToggle } from "@/components/yayin/UttYayinListeOrtaklari";
import { eczanemGonderimSuresi } from "@/lib/eczanem/gonderimSuresi";
import type { UyeGonderimOzeti, UyeGonderimRafi, UyeGonderimYayini } from "@/lib/eczanem/uyeGonderimOzeti";
import { Building2, Send, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EczanemYayinDonemiSecimi, yayinDonemi } from "../../_components/EczanemYayinDonemiSecimi";
import { EczanemYayinSayfasi, OzetKarti, OzetKartlari } from "../../_components/EczanemYayinSayfasi";
import { UyeYayinKarti } from "../../_components/UyeYayinKarti";
import { EczanemYayinGonderimKarti } from "../../yayinlar/_components/EczanemYayinGonderimKarti";
import type { UttEczanemGonderim, UttEczanemVeri, UttEczanemYayin } from "../../yayinlar/_types";

type Gorunum = "eczane" | "uye";
type Durum = "tumu" | "hazir" | "gonderilen";
type EczaneVerisi = Omit<UttEczanemVeri, "gonderimler"> & {
  gonderimler: (Omit<UttEczanemGonderim, "created_at"> & { created_at: string | null })[];
};
interface BmYayinYaniti {
  urunBaglari?: Record<string, string>;
  bmGruplari: { id: string; ad: string; uttIdleri: string[] }[];
  bolgeler: { deger: string; etiket: string }[];
  uttler: { utt_id: string; utt_adi: string }[];
  seciliUttId: string | null;
  veri: EczaneVerisi | { ozet: UyeGonderimOzeti; raf: UyeGonderimRafi } | null;
}
type EczaneTakipYayini = UttEczanemYayin & {
  gonderimler: EczaneVerisi["gonderimler"];
  hazir: boolean;
  gonderenEczaneSayisi: number;
};
type TakipYayini = EczaneTakipYayini | (UyeGonderimYayini & { hazir: boolean });

function eczaneYayinlariniHazirla(veri: EczaneVerisi, simdi: number): EczaneTakipYayini[] {
  const hazirEczaneler = veri.eczaneler.filter((eczane) => eczane.esik_uygun);
  const kayitlar = new Map<string, EczaneVerisi["gonderimler"]>();
  for (const gonderim of veri.gonderimler) {
    const yayinKayitlari = kayitlar.get(gonderim.yayin_id) ?? [];
    yayinKayitlari.push(gonderim);
    kayitlar.set(gonderim.yayin_id, yayinKayitlari);
  }
  return veri.yayinlar.map((yayin) => {
    const gonderimler = kayitlar.get(yayin.yayin_id) ?? [];
    const gonderilen = new Set(gonderimler.map((gonderim) => gonderim.eczane_id));
    const gonderimeAcik = yayin.gonderim_incelemesi_tamamlandi &&
      eczanemGonderimSuresi(yayin.gonderim_baslangic_at, simdi, yayin.gonderim_sure_muaf).acik;
    return {
      ...yayin,
      hazir: gonderimeAcik && hazirEczaneler.some((eczane) => !gonderilen.has(eczane.eczane_id)),
      gonderimler,
      gonderenEczaneSayisi: gonderimler.filter((gonderim) => gonderim.created_at !== null).length,
    };
  });
}

export default function BmEczanemYayinlari({ gorunum, yonetici = "bm", urunler = [] }: {
  gorunum: Gorunum;
  yonetici?: "bm" | "tm" | "uretici";
  urunler?: { urun_id: string; urun_adi: string }[];
}) {
  const [donem, setDonem] = useState(() => yayinDonemi(new Date()));
  const [acikDetay, setAcikDetay] = useState<string | null>(null);
  const [uttId, setUttId] = useState<string | null>(null);
  const [bolgeId, setBolgeId] = useState("");
  const [bmId, setBmId] = useState("");
  const [uttSecimiYapildi, setUttSecimiYapildi] = useState(false);
  const [durum, setDurum] = useState<Durum>("tumu");
  const [arac, setArac] = useState<YayinTuruFiltreDegeri>("tumu");
  const [urunId, setUrunId] = useState<string | null>(null);
  const [yenileme, setYenileme] = useState(0);
  const [sonuc, setSonuc] = useState<(BmYayinYaniti & { anahtar: string }) | null>(null);
  const [hata, setHata] = useState<{ anahtar: string; mesaj: string } | null>(null);
  const uyeGorunumu = gorunum === "uye";
  const urunFiltresiVar = yonetici === "uretici";
  const tmGorunumu = yonetici !== "bm";
  const bmSecimi = tmGorunumu && !uyeGorunumu;
  const yerlesimSabit = yonetici === "bm" || bmSecimi;
  const kapsamAdi = yonetici === "uretici" ? "Yetki kapsamınızda" : yonetici === "tm" ? "Takımınızda" : "Bölgenizde";
  const baslik = uyeGorunumu ? "Üyelere Gönderilen Yayınlar" : "Eczaneye Gönderilen Yayınlar";
  const donemAnahtari = `${donem.yil}-${donem.ay}`;
  const sorgu = new URLSearchParams({ gorunum });
  if (bmSecimi && bmId) sorgu.set("bm_id", bmId);
  if (tmGorunumu && uyeGorunumu && bolgeId) sorgu.set("bolge_id", bolgeId);
  if (uttId) sorgu.set("utt_id", uttId);
  if (uyeGorunumu) sorgu.set("donem", donemAnahtari);
  const sorguMetni = sorgu.toString();
  const istekAnahtari = `${sorguMetni}:${yenileme}`;
  const guncelSonuc = sonuc?.anahtar === istekAnahtari ? sonuc : null;
  const hataMesaji = hata?.anahtar === istekAnahtari ? hata.mesaj : null;
  const yukleniyor = !guncelSonuc && !hataMesaji;
  const gorunenSonuc = yerlesimSabit && yukleniyor ? sonuc : guncelSonuc;

  useEffect(() => {
    const denetleyici = new AbortController();
    async function getir() {
      try {
        const yanit = await fetch(`/eczanem/${yonetici}/api/yayinlar?${sorguMetni}`, { cache: "no-store", signal: denetleyici.signal });
        const veri = await yanit.json();
        if (!yanit.ok) throw new Error(veri.hata ?? veri.error ?? "Yayınlar yüklenemedi.");
        if (!denetleyici.signal.aborted) {
          const yanitVerisi: BmYayinYaniti = veri;
          setSonuc({ ...yanitVerisi, anahtar: istekAnahtari });
        }
      } catch (err) {
        if (!denetleyici.signal.aborted) {
          setHata({ anahtar: istekAnahtari, mesaj: err instanceof Error ? err.message : "Yayınlar yüklenemedi." });
        }
      }
    }
    void getir();
    return () => denetleyici.abort();
  }, [istekAnahtari, sorguMetni, yonetici]);

  const veri = gorunenSonuc?.veri ?? null;
  const eczaneVerisi = veri && "eczaneler" in veri ? veri : null;
  const uyeVerisi = veri && "raf" in veri ? veri : null;
  const zaman = useEczanemGonderimSaati((eczaneVerisi?.yayinlar ?? []).map((yayin) => yayin.gonderim_baslangic_at));
  const eczaneYayinlari = useMemo(() => eczaneVerisi ? eczaneYayinlariniHazirla(eczaneVerisi, zaman) : [], [eczaneVerisi, zaman]);
  const donemYayinlari: TakipYayini[] = uyeVerisi ? uyeVerisi.raf.yayinlar.map((yayin) => ({
    ...yayin,
    hazir: yayin.gonderimeHazir,
  })) : eczaneYayinlari.filter((yayin) => {
    if (!yayin.yayin_tarihi) return false;
    const ay = yayinDonemi(new Date(yayin.yayin_tarihi));
    return ay.yil === donem.yil && ay.ay === donem.ay;
  });
  const yayinlar = urunFiltresiVar && urunId !== null
    ? donemYayinlari.filter((yayin) => gorunenSonuc?.urunBaglari?.[yayin.yayin_id] === urunId)
    : donemYayinlari;
  const yillar = new Set([donem.yil, yayinDonemi(new Date()).yil, ...(uyeVerisi?.raf.yillar ?? [])]);
  for (const yayin of eczaneYayinlari) {
    if (yayin.yayin_tarihi) yillar.add(yayinDonemi(new Date(yayin.yayin_tarihi)).yil);
  }
  const hazir = yayinlar.filter((yayin) => yayin.hazir);
  const gonderilen = yayinlar.filter((yayin) => yayin.gonderenEczaneSayisi > 0);
  const durumFiltreli = { tumu: yayinlar, hazir, gonderilen }[durum];
  const gorunen = durumFiltreli.filter((yayin) => arac === "tumu" || yayin.arac_turu === arac);
  const durumSayisi = (liste: TakipYayini[]) => urunFiltresiVar && arac !== "tumu"
    ? liste.filter((yayin) => yayin.arac_turu === arac).length
    : liste.length;
  const kartiGoster = (yayin: TakipYayini) => {
    if (!("gonderimler" in yayin)) return <UyeYayinKarti key={yayin.yayin_id} yayin={yayin} />;
    if (!eczaneVerisi) return null;
    const detayAnahtari = `${istekAnahtari}:${donemAnahtari}:${durum}:${arac}:${urunId}:${yayin.yayin_id}`;
    return <EczanemYayinGonderimKarti
      key={yayin.yayin_id}
      yayin={yayin}
      simdi={zaman}
      esik={eczaneVerisi.esik}
      eczaneler={eczaneVerisi.eczaneler}
      gonderimler={yayin.gonderimler}
      gonderilecekGoster={durum === "hazir" || (durum === "tumu" && yayin.hazir)}
      gonderimDetayiAcik={acikDetay === detayAnahtari}
      onGonderimDetayiAc={() => setAcikDetay(detayAnahtari)}
      onGonderimDetayiKapat={() => setAcikDetay(null)}
    />;
  };
  const eczaneler = eczaneVerisi?.eczaneler;
  const gonderilebilirEczaneler = eczaneler && new Set(eczaneler.filter((eczane) => eczane.esik_uygun).map((eczane) => eczane.eczane_id)).size;
  const aylikIstatistikler = eczaneVerisi?.aylikIstatistikler;
  const kartlar = uyeGorunumu ? [
    { etiket: "Gönderim Yapan Eczane Sayısı", deger: uyeVerisi?.ozet.eczaneSayisi, detay: "Bu ay üyelere yayın gönderen farklı eczaneler." },
    { etiket: "Gönderilen Üye Sayısı", deger: uyeVerisi?.ozet.uyeSayisi, detay: "Bu ay en az bir yayın gönderilen farklı üyeler." },
    { etiket: "Gönderi Sayısı", deger: uyeVerisi?.ozet.gonderiSayisi, detay: "Bu ay üyelere yapılan toplam yayın gönderisi." },
  ] : [
    { etiket: "Gönderilebilen Eczane Sayısı", deger: gonderilebilirEczaneler, detay: "Seçilen UTT’nin üyelik eşiğini karşılayan eczaneleri." },
    { etiket: "Gönderilen Eczane Sayısı", deger: aylikIstatistikler?.gonderilenEczaneSayisi, detay: "Seçilen UTT’nin bu ay yayın gönderdiği farklı eczaneler." },
    { etiket: "Gönderi Sayısı", deger: aylikIstatistikler?.uttGonderimSayisi, detay: "Seçilen UTT’nin bu ay eczanelere yaptığı toplam gönderi." },
  ];

  return <EczanemYayinSayfasi
    baslik={baslik}
    aciklama={uyeGorunumu ? `${kapsamAdi} yer alan UTT’lerin eczanelerinden üyelere yapılan yayın gönderimlerini inceleyin.`
      : `${kapsamAdi} yer alan UTT’lerin eczanelere yaptığı yayın gönderimlerini inceleyin.`}
    aksiyon={<YenileButonu yenileniyor={yukleniyor} onYenile={() => setYenileme((sira) => sira + 1)} />}
  >
    <OzetKartlari>
      <OzetKarti ikon={Building2} {...kartlar[0]} deger={kartlar[0].deger ?? null} renk="var(--tema-yerel-eczanem-eylem-metin-01)" zemin="var(--tema-yerel-eczanem-secim-zemin-01)" />
      <OzetKarti ikon={UsersRound} {...kartlar[1]} deger={kartlar[1].deger ?? null} renk="var(--tema-yerel-eczanem-islevsel-metin-02)" zemin="var(--tema-yerel-eczanem-islevsel-zemin-01)" />
      <OzetKarti ikon={Send} {...kartlar[2]} deger={kartlar[2].deger ?? null} renk="var(--tema-yerel-eczanem-islevsel-metin-03)" zemin="var(--tema-yerel-eczanem-islevsel-zemin-02)" />
    </OzetKartlari>
    {urunFiltresiVar && <div className={filtreStyles.urunler}>
      <SadeKontrolGrubu tur="sekme" aria-label="Ürün filtresi">
        <SadeKontrolButonu aria-pressed={urunId === null} onClick={() => setUrunId(null)}>Tüm Ürünler</SadeKontrolButonu>
        {urunler.map(({ urun_id: id, urun_adi: ad }) => <SadeKontrolButonu key={id} aria-pressed={urunId === id} onClick={() => setUrunId(id)}>{ad}</SadeKontrolButonu>)}
      </SadeKontrolGrubu>
    </div>}
    <div className={bmSecimi
      ? "flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
      : "flex flex-wrap items-center justify-between gap-3"}>
      <PeriyotButonlari<Durum>
        secenekler={[
          { key: "tumu", label: veri ? `Tümü ${durumSayisi(yayinlar)}` : "Tümü" },
          { key: "hazir", label: veri ? `Gönderime Hazır ${durumSayisi(hazir)}` : "Gönderime Hazır" },
          { key: "gonderilen", label: veri ? `Gönderilenler ${durumSayisi(gonderilen)}` : "Gönderilenler" },
        ]}
        deger={durum} onDegistir={setDurum} ariaLabel="Gönderim durumu" className="w-fit flex-none"
      />
      <div className={bmSecimi
        ? "grid w-full max-w-full flex-none grid-cols-2 items-center gap-2 sm:ml-auto sm:w-[328px]"
        : tmGorunumu
        ? "ml-auto grid w-full max-w-[20.5rem] grid-cols-2 items-center gap-2"
        : "ml-auto flex max-w-full items-center"}>
        {bmSecimi && <SadeKisiSecimi
          baslik="Bölge Müdürleri" bosSecenekEtiketi="Tüm Bölgeler"
          kisiler={(sonuc?.bmGruplari ?? []).map(({ id, ad }) => ({ deger: id, adSoyad: ad }))}
          deger={bmId}
          disabled={yukleniyor || !sonuc?.bmGruplari.length}
          onDegistir={(id) => {
            const oncekiUtt = sonuc?.seciliUttId ?? null;
            const grup = sonuc?.bmGruplari.find((bm) => bm.id === id);
            setUttId(oncekiUtt && (!id || grup?.uttIdleri.includes(oncekiUtt)) ? oncekiUtt : null);
            setBmId(id);
            setUttSecimiYapildi(false);
            setDurum("tumu");
            setArac("tumu");
          }}
        />}
        {tmGorunumu && uyeGorunumu && <SadeSecim
          etiket="Bölge"
          placeholder="Tüm Bölgeler"
          secenekler={[{ deger: "", etiket: "Tüm Bölgeler" }, ...(sonuc?.bolgeler ?? [])]}
          deger={bolgeId}
          disabled={!sonuc?.bolgeler.length}
          onDegistir={(id) => { setBolgeId(id); setUttId(null); setDurum("tumu"); setArac("tumu"); }}
        />}
        <SadeKisiSecimi baslik={tmGorunumu && uyeGorunumu && !uttId ? "Tüm Temsilciler" : "Temsilciler"}
          baslikGoster={bmSecimi && !uttSecimiYapildi} bosSecenekEtiketi={tmGorunumu && uyeGorunumu ? "Tüm Temsilciler" : false}
          kisiler={((tmGorunumu ? gorunenSonuc : sonuc)?.uttler ?? []).map((utt) => ({ deger: utt.utt_id, adSoyad: utt.utt_adi }))}
          deger={uttId ?? (tmGorunumu ? gorunenSonuc : sonuc)?.seciliUttId ?? ""}
          disabled={(yerlesimSabit && yukleniyor) || !(tmGorunumu ? gorunenSonuc : sonuc)?.uttler.length}
          onDegistir={(id) => { setUttSecimiYapildi(true); setUttId(id || null); setDurum("tumu"); setArac("tumu"); }}
        />
      </div>
    </div>
    <section aria-busy={yukleniyor} data-eczanem-sabit-kaydirma={yerlesimSabit ? "" : undefined}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <UttYayinTuruToggle yayinlar={durumFiltreli} deger={arac} onDegistir={setArac} sayilariGoster={!!veri}
          className="h-10 min-w-0 [scrollbar-width:none]" />
        <EczanemYayinDonemiSecimi donem={donem}
          yilSecenekleri={[...yillar].sort((a, b) => Number(b) - Number(a)).map((yil) => ({ deger: yil, etiket: yil }))}
          onDegistir={(secim) => setDonem((onceki) => ({ ...onceki, ...secim }))} />
      </div>
      <h2 className="mb-3 text-base font-extrabold text-[var(--tema-yerel-eczanem-ana-metin-03)]">
        {{ tumu: "Tüm Yayınlar", hazir: "Gönderime Hazır Yayınlar", gonderilen: baslik }[durum]}
      </h2>
      {gorunen.length > 0 ? <MobilYayinAkisi
        kayitlar={gorunen} kayitAnahtari={(yayin) => yayin.yayin_id}
        renderKart={kartiGoster}
        sayacGoster={false} sifirlamaAnahtari={`${gorunenSonuc?.seciliUttId}-${donemAnahtari}-${durum}-${arac}-${urunId}`}
        masaustuIcerik={<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {gorunen.map(kartiGoster)}
        </div>}
      /> : <div role={hataMesaji ? "alert" : "status"} className="rounded-2xl border border-[var(--tema-yerel-eczanem-cizgi-05)] bg-[var(--tema-yerel-eczanem-kart-01)] px-4 py-14 text-center text-sm font-semibold text-[var(--tema-yerel-eczanem-yardimci-metin-05)]">
        {hataMesaji ?? (yukleniyor ? "Yayınlar yükleniyor…" : !guncelSonuc?.uttler.length ? `${kapsamAdi} bağlı UTT bulunmuyor.` : "Bu seçimde yayın bulunmuyor.")}
      </div>}
    </section>
  </EczanemYayinSayfasi>;
}
