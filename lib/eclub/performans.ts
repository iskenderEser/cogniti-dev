import { trZamanParcalari, trZamanUtc } from "@/lib/zaman/turkiye";

export const ECLUB_PERFORMANS_TURLERI = [
  { tur: "video", ad: "Video", renk: "#237ac8", zemin: "#edf5ff" },
  { tur: "podcast", ad: "Podcast", renk: "#8c65c9", zemin: "#f3effa" },
  { tur: "gorsel", ad: "Görsel", renk: "#d99438", zemin: "#fff6e8" },
  { tur: "flip_pdf", ad: "Literatür", renk: "#23947a", zemin: "#edf8f4" },
] as const;
export type PerformansTuru = typeof ECLUB_PERFORMANS_TURLERI[number]["tur"];
export interface PerformansHaftasi { hafta: number; baslangic: string; bitisHaric: string }
export interface PerformansDonemi { kod: string; ad: string; baslangic: string; bitisHaric: string; simdi: string; aktifHafta: number; haftalar: PerformansHaftasi[] }

/** İki takvim ayını korur. İlk yedi bölüm 7 gün, son bölüm dönemin sonuna kadardır. */
export function eclubPerformansDonemi(simdi = new Date()): PerformansDonemi {
  const { yil, ay } = trZamanParcalari(simdi);
  const ilkAy = ay % 2 === 1 ? ay : ay - 1;
  const baslangic = trZamanUtc(yil, ilkAy, 1), bitis = trZamanUtc(yil, ilkAy + 2, 1);
  const haftalar = Array.from({ length: 8 }, (_, i) => ({ hafta: i + 1,
    baslangic: new Date(baslangic.getTime() + i * 7 * 86400000).toISOString(),
    bitisHaric: i === 7 ? bitis.toISOString() : new Date(baslangic.getTime() + (i + 1) * 7 * 86400000).toISOString(),
  }));
  const ayAdi = (t: Date) => t.toLocaleDateString("tr-TR", { month: "long", timeZone: "Europe/Istanbul" });
  return { kod: `${yil}-P${(ilkAy + 1) / 2}`, ad: `${ayAdi(baslangic)} – ${ayAdi(trZamanUtc(yil, ilkAy + 1, 1))} ${yil}`,
    baslangic: baslangic.toISOString(), bitisHaric: bitis.toISOString(), simdi: simdi.toISOString(),
    aktifHafta: haftalar.find(h => simdi.getTime() >= Date.parse(h.baslangic) && simdi.getTime() < Date.parse(h.bitisHaric))?.hafta ?? 8, haftalar };
}
export interface PerformansUyesi { kisi_id: string; ad: string; soyad: string }
export interface PerformansIzlemesi { izleme_id: string; kisi_id: string; yayin_id: string; arac_turu: string; izleme_bitis: string | null; tamamlandi_mi: boolean | null; ilerleme_durumu?: Record<string, unknown> | null }
export interface PerformansPuani { kazanilan_puan_id: string; izleme_id: string; kisi_id: string; yayin_id: string; eczane_id: string; puan: number }
export interface PerformansKaybi { kayit_id: string; izleme_id: string; kisi_id: string; yayin_id: string; kaybedilen_puan: number }
export interface PerformansBagi { kisi_id: string; eczane_id: string; baslangic_tarihi: string | null; bitis_tarihi: string | null; created_at: string | null; aktif_mi: boolean }
export interface UyeKatkisi extends PerformansUyesi { tamamlanan: number; puan: number }
export interface HaftalikKatki { hafta: number; puan: number; tamamlanan: number; uyeler: UyeKatkisi[] }
export interface PerformansVerisi { donem: PerformansDonemi; satirlar: { tur: PerformansTuru; haftalar: HaftalikKatki[] }[]; ozet: { puan: number; tamamlanan: number; uye: number } }

export function eclubPerformansiHesapla({ donem, izlemeler, puanlar, kayiplar, uyeler, baglar, eczaneIdler, yayinIdler }: {
  donem: PerformansDonemi; izlemeler: PerformansIzlemesi[]; puanlar: PerformansPuani[]; kayiplar: PerformansKaybi[];
  uyeler: PerformansUyesi[]; baglar: PerformansBagi[]; eczaneIdler: string[]; yayinIdler: string[];
}): PerformansVerisi {
  const eczaneler = new Set(eczaneIdler), yayinlar = new Set(yayinIdler);
  const kisiMap = new Map(uyeler.map(u => [u.kisi_id, u]));
  const puanMap = new Map<string, PerformansPuani[]>();
  for (const p of new Map(puanlar.map(p => [p.kazanilan_puan_id, p])).values()) {
    if (!yayinlar.has(p.yayin_id)) continue;
    const liste = puanMap.get(p.izleme_id) ?? []; liste.push(p); puanMap.set(p.izleme_id, liste);
  }
  const kayipMap = new Map<string, PerformansKaybi[]>();
  for (const k of new Map(kayiplar.map(k => [k.kayit_id, k])).values()) {
    const liste = kayipMap.get(k.izleme_id) ?? []; liste.push(k); kayipMap.set(k.izleme_id, liste);
  }
  const satirlar = ECLUB_PERFORMANS_TURLERI.map(t => ({ tur: t.tur, haftalar: donem.haftalar.map(h => ({ hafta: h.hafta, puan: 0, tamamlanan: 0, uyeler: [] as UyeKatkisi[] })) }));
  const katkicilar = new Set<string>(); let toplamPuan = 0, toplamTamamlanan = 0;
  for (const izleme of new Map(izlemeler.map(i => [i.izleme_id, i])).values()) {
    if (!izleme.tamamlandi_mi || !izleme.izleme_bitis || !yayinlar.has(izleme.yayin_id) || izleme.ilerleme_durumu?.gorunum_testi) continue;
    const an = Date.parse(izleme.izleme_bitis);
    if (!Number.isFinite(an) || an > Date.parse(donem.simdi)) continue;
    const hafta = donem.haftalar.find(h => an >= Date.parse(h.baslangic) && an < Date.parse(h.bitisHaric));
    const satir = satirlar.find(s => s.tur === izleme.arac_turu);
    if (!hafta || !satir) continue;
    const izlemePuanlari = (puanMap.get(izleme.izleme_id) ?? []).filter(p => p.kisi_id === izleme.kisi_id && p.yayin_id === izleme.yayin_id);
    // Puan varsa kazanım anındaki eczane snapshot'ı, yoksa tamamlamadaki üyelik aralığı esastır.
    if (izlemePuanlari.length ? !izlemePuanlari.some(p => eczaneler.has(p.eczane_id)) : !baglar.some(b =>
      b.kisi_id === izleme.kisi_id && eczaneler.has(b.eczane_id) &&
      an >= Date.parse(b.baslangic_tarihi ?? b.created_at ?? "9999-01-01") &&
      (b.bitis_tarihi ? an < Date.parse(b.bitis_tarihi) : b.aktif_mi))) continue;
    const kazanilan = izlemePuanlari.filter(p => eczaneler.has(p.eczane_id)).reduce((s,p) => s + Number(p.puan), 0);
    const kayip = (kayipMap.get(izleme.izleme_id) ?? []).filter(k => k.kisi_id === izleme.kisi_id && k.yayin_id === izleme.yayin_id).reduce((s,k) => s + Number(k.kaybedilen_puan), 0);
    const net = Math.max(0, kazanilan - kayip);
    const hucre = satir.haftalar[hafta.hafta - 1];
    const kisi = kisiMap.get(izleme.kisi_id) ?? { kisi_id: izleme.kisi_id, ad: "Eski üye", soyad: "" };
    let katki = hucre.uyeler.find(u => u.kisi_id === kisi.kisi_id);
    if (!katki) { katki = { ...kisi, puan: 0, tamamlanan: 0 }; hucre.uyeler.push(katki); }
    katki.puan += net; katki.tamamlanan++; hucre.puan += net; hucre.tamamlanan++;
    toplamPuan += net; toplamTamamlanan++; katkicilar.add(kisi.kisi_id);
  }
  for (const satir of satirlar) for (const h of satir.haftalar) h.uyeler.sort((a,b) => b.puan - a.puan || a.ad.localeCompare(b.ad, "tr"));
  return { donem, satirlar, ozet: { puan: toplamPuan, tamamlanan: toplamTamamlanan, uye: katkicilar.size } };
}
