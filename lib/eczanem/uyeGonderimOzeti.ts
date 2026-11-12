import type { SupabaseClient } from "@supabase/supabase-js";
import { eczaneAdMap, eczaneAktifUyeler, eczanemAylikSayacPenceresi } from "./gonderim";
import { eczanemGonderimSuresi } from "./gonderimSuresi";
import { eczanemGonderimBaslangiclari } from "./gonderimSuresiSunucu";
import { yayinThumbnailCevabi } from "@/lib/ogrenmeAraci/yayinThumbnail";
import type { YayinKartiVerisi } from "@/components/yayin/YayinKarti";

export interface UyeGonderimOzeti {
  eczaneSayisi: number;
  uyeSayisi: number;
  gonderiSayisi: number;
}

export interface UyeGonderimEczaneDetayi {
  eczaneId: string;
  eczaneAdi: string;
  gonderilenUyeSayisi: number;
  aktifUyeSayisi: number;
}

export interface UyeGonderimYayini extends YayinKartiVerisi {
  gonderimeHazir: boolean;
  gonderenEczaneSayisi: number;
  gonderilenUyeSayisi: number;
  eczaneDetaylari?: UyeGonderimEczaneDetayi[];
}

export interface UyeGonderimRafi {
  yillar: string[];
  yayinlar: UyeGonderimYayini[];
}

interface EczaneDagitimi {
  yayin_id: string;
  eczane_id: string;
  created_at: string;
}

async function* uttDagitimSayfalari(db: SupabaseClient, uttId: string | string[], bitisHaric: string) {
  let sonDagitimId: string | undefined;
  for (;;) {
    const temelSorgu = db.from("eczanem_eczane_gonderimleri")
      .select("gonderim_id, yayin_id, eczane_id, created_at");
    const sorgu = (typeof uttId === "string"
      ? temelSorgu.eq("gonderen_utt_id", uttId)
      : temelSorgu.in("gonderen_utt_id", uttId))
      .lt("created_at", bitisHaric)
      .order("gonderim_id")
      .limit(25);
    const { data, error } = await (sonDagitimId ? sorgu.gt("gonderim_id", sonDagitimId) : sorgu);
    if (error) throw error;
    if (!data?.length) return;
    yield data;
    sonDagitimId = data[data.length - 1].gonderim_id;
  }
}

async function* uyeGonderimSayfalari(db: SupabaseClient, kapsam: EczaneDagitimi[], baslangic?: string, bitisHaric?: string) {
  const ciftler = kapsam.map(({ yayin_id, eczane_id, created_at }) =>
    `and(yayin_id.eq.${yayin_id},eczane_id.eq.${eczane_id},created_at.gte.${created_at})`
  ).join(",");
  let sonGonderimId: string | undefined;
  for (;;) {
    let sorgu = db.from("eczanem_gonderimler").select("gonderim_id, yayin_id, eczane_id, musteri_id, created_at");
    if (baslangic) sorgu = sorgu.gte("created_at", baslangic);
    if (bitisHaric) sorgu = sorgu.lt("created_at", bitisHaric);
    sorgu = sorgu.or(ciftler).order("gonderim_id").limit(1000);
    const { data, error } = await (sonGonderimId ? sorgu.gt("gonderim_id", sonGonderimId) : sorgu);
    if (error) throw error;
    if (!data?.length) return;
    yield data;
    sonGonderimId = data[data.length - 1].gonderim_id;
  }
}

export async function uttEczanemUyeGonderimOzeti(
  db: SupabaseClient,
  uttId: string | string[],
  firmaId: string,
  simdi = new Date(),
): Promise<UyeGonderimOzeti> {
  const { baslangic, bitisHaric } = eczanemAylikSayacPenceresi(simdi);
  const eczaneler = new Set<string>();
  const uyeler = new Set<string>();
  let gonderiSayisi = 0;

  // Eczane bugün başka bir UTT'ye bağlı olsa da yayını ileten UTT, dağıtım kaydında sabittir.
  for await (const dagitimlar of uttDagitimSayfalari(db, uttId, bitisHaric)) {
    const { data: yayinlar, error: yayinHatasi } = await db.from("v_yayin_detay")
      .select("yayin_id")
      .eq("firma_id", firmaId)
      .in("yayin_id", [...new Set(dagitimlar.map((dagitim) => dagitim.yayin_id))]);
    if (yayinHatasi) throw yayinHatasi;
    const firmaYayinlari = new Set(yayinlar?.map((yayin) => yayin.yayin_id));
    const kapsam = dagitimlar.filter((dagitim) => firmaYayinlari.has(dagitim.yayin_id));
    if (!kapsam.length) continue;

    for await (const gonderimler of uyeGonderimSayfalari(db, kapsam, baslangic, bitisHaric)) {
      for (const gonderim of gonderimler) {
        eczaneler.add(gonderim.eczane_id);
        uyeler.add(gonderim.musteri_id);
      }
      gonderiSayisi += gonderimler.length;
    }
  }

  return { eczaneSayisi: eczaneler.size, uyeSayisi: uyeler.size, gonderiSayisi };
}

const yilBicimi = new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Europe/Istanbul" });

export async function uttEczanemUyeGonderimRafi(
  db: SupabaseClient,
  uttId: string | string[],
  firmaId: string,
  secilenAy: Date,
  simdi = new Date(),
  eczaneDetayi = false,
): Promise<UyeGonderimRafi> {
  const { baslangic, bitisHaric } = eczanemAylikSayacPenceresi(secilenAy);
  const ayBaslangici = Date.parse(baslangic);
  const ayBitisi = Date.parse(bitisHaric);
  const simdiIso = simdi.toISOString();
  const yillar = new Set([yilBicimi.format(simdi)]);
  const yayinlar = new Map<string, UyeGonderimYayini>();
  const durumlar = new Map<string, { eczaneler: Set<string>; uyeler: Set<string> }>();
  const aktifUyeler = new Map<string, ReturnType<typeof eczaneAktifUyeler>>();
  const detaylar = new Map<string, Map<string, Set<string>>>();

  function aktifUyeleriGetir(eczaneId: string) {
    const uyeler = aktifUyeler.get(eczaneId) ?? eczaneAktifUyeler(db, eczaneId);
    aktifUyeler.set(eczaneId, uyeler);
    return uyeler;
  }

  for await (const dagitimlar of uttDagitimSayfalari(db, uttId, simdiIso)) {
    const { data, error } = await db.from("v_yayin_detay")
      .select("yayin_id, urun_adi, teknik_adi, firma_adi, talep_no, yayin_tarihi, durum, arac_id, arac_turu, thumbnail_url, arac_kapak_yolu, arac_dosya_yolu, arac_metadata")
      .eq("firma_id", firmaId)
      .in("yayin_id", [...new Set(dagitimlar.map((dagitim) => dagitim.yayin_id))]);
    if (error) throw error;

    const secilenYayinlar = new Map<string, string>();
    for (const yayin of data ?? []) {
      const tarih = Date.parse(yayin.yayin_tarihi ?? "");
      if (!Number.isFinite(tarih)) continue;
      yillar.add(yilBicimi.format(tarih));
      if (tarih < ayBaslangici || tarih >= ayBitisi) continue;
      secilenYayinlar.set(yayin.yayin_id, yayin.durum);
      if (!yayinlar.has(yayin.yayin_id)) {
        yayinlar.set(yayin.yayin_id, {
          yayin_id: yayin.yayin_id,
          urun_adi: yayin.urun_adi ?? "Eczanem yayını",
          teknik_adi: yayin.teknik_adi,
          firma_adi: yayin.firma_adi,
          talep_no: yayin.talep_no,
          yayin_tarihi: yayin.yayin_tarihi,
          arac_id: yayin.arac_id,
          arac_turu: yayin.arac_turu,
          thumbnail_url: yayinThumbnailCevabi(yayin).thumbnail_url,
          gonderimeHazir: false,
          gonderenEczaneSayisi: 0,
          gonderilenUyeSayisi: 0,
        });
        durumlar.set(yayin.yayin_id, { eczaneler: new Set(), uyeler: new Set() });
      }
    }
    const kapsam = dagitimlar.filter(({ yayin_id }) => secilenYayinlar.has(yayin_id));
    if (!kapsam.length) continue;
    const gonderilenUyeler = new Map<string, Set<string>>();
    for (const { yayin_id, eczane_id } of kapsam) {
      const yayinDetaylari = detaylar.get(yayin_id) ?? new Map<string, Set<string>>();
      const uyeler = yayinDetaylari.get(eczane_id) ?? new Set<string>();
      gonderilenUyeler.set(`${yayin_id}:${eczane_id}`, uyeler);
      if (eczaneDetayi) {
        yayinDetaylari.set(eczane_id, uyeler);
        detaylar.set(yayin_id, yayinDetaylari);
      }
    }
    for await (const gonderimler of uyeGonderimSayfalari(db, kapsam, undefined, simdiIso)) {
      for (const gonderim of gonderimler) {
        const { yayin_id, eczane_id, musteri_id } = gonderim;
        gonderilenUyeler.get(`${yayin_id}:${eczane_id}`)?.add(musteri_id);
        const durum = durumlar.get(yayin_id);
        durum?.eczaneler.add(eczane_id);
        durum?.uyeler.add(musteri_id);
      }
    }

    const acikYayinlar = [...secilenYayinlar].filter(([, durum]) => durum === "yayinda").map(([id]) => id);
    const sureler = await eczanemGonderimBaslangiclari(db, acikYayinlar);
    const acikDagitimlar = kapsam.filter(({ yayin_id }) => {
      const sure = sureler.get(yayin_id);
      return sure && !yayinlar.get(yayin_id)?.gonderimeHazir &&
        eczanemGonderimSuresi(sure.baslangic, simdi.getTime(), sure.sureMuaf).acik;
    });
    if (!acikDagitimlar.length) continue;
    const { data: baglar, error: bagHatasi } = await db.from("eclub_eczane_firma")
      .select("eczane_id")
      .eq("firma_id", firmaId)
      .eq("aktif_mi", true)
      .in("eczane_id", [...new Set(acikDagitimlar.map(({ eczane_id }) => eczane_id))]);
    if (bagHatasi) throw bagHatasi;
    const bagliEczaneler = new Set(baglar?.map(({ eczane_id }) => eczane_id));
    for (const { yayin_id, eczane_id } of acikDagitimlar) {
      const yayin = yayinlar.get(yayin_id)!;
      if (yayin.gonderimeHazir || !bagliEczaneler.has(eczane_id)) continue;
      const uyeler = aktifUyeleriGetir(eczane_id);
      const gonderilenler = gonderilenUyeler.get(`${yayin_id}:${eczane_id}`);
      yayin.gonderimeHazir = (await uyeler).some((uye) => !gonderilenler?.has(uye.musteri_id));
    }
  }

  const eczaneIdleri = [...new Set([...detaylar.values()].flatMap((detay) => [...detay.keys()]))];
  const eczaneAdlari = new Map<string, string>();
  const eczaneUyeSayilari = new Map<string, number>();
  for (let ilk = 0; ilk < eczaneIdleri.length; ilk += 100) {
    const adlar = await eczaneAdMap(db, eczaneIdleri.slice(ilk, ilk + 100));
    for (const [id, ad] of adlar) eczaneAdlari.set(id, ad);
  }
  for (let ilk = 0; ilk < eczaneIdleri.length; ilk += 10) {
    await Promise.all(eczaneIdleri.slice(ilk, ilk + 10).map(async (id) => {
      eczaneUyeSayilari.set(id, (await aktifUyeleriGetir(id)).length);
    }));
  }
  for (const [id, yayin] of yayinlar) {
    const durum = durumlar.get(id)!;
    yayin.gonderenEczaneSayisi = durum.eczaneler.size;
    yayin.gonderilenUyeSayisi = durum.uyeler.size;
    if (eczaneDetayi) {
      yayin.eczaneDetaylari = [...(detaylar.get(id) ?? [])].map(([eczaneId, uyeler]) => ({
        eczaneId,
        eczaneAdi: eczaneAdlari.get(eczaneId) ?? "Eczane adı bulunamadı",
        gonderilenUyeSayisi: uyeler.size,
        aktifUyeSayisi: eczaneUyeSayilari.get(eczaneId) ?? 0,
      })).sort((a, b) => a.eczaneAdi.localeCompare(b.eczaneAdi, "tr"));
    }
  }
  return {
    yillar: [...yillar].sort((a, b) => Number(b) - Number(a)),
    yayinlar: [...yayinlar.values()].sort((a, b) =>
      Date.parse(b.yayin_tarihi ?? "") - Date.parse(a.yayin_tarihi ?? "") || a.yayin_id.localeCompare(b.yayin_id)),
  };
}
