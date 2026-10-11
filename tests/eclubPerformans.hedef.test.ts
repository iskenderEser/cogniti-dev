import test from "node:test";
import assert from "node:assert/strict";
import { eclubPerformansDonemi, eclubPerformansiHesapla, type PerformansIzlemesi, type PerformansPuani, type PerformansKaybi, type PerformansBagi } from "@/lib/eclub/performans";

const donem = eclubPerformansDonemi(new Date("2026-10-31T20:59:59Z"));
const bag: PerformansBagi = { kisi_id: "k1", eczane_id: "e1", baslangic_tarihi: "2026-01-01T00:00:00Z", bitis_tarihi: null, created_at: null, aktif_mi: true };
const izleme = (id: string, zaman: string, ekstra: Partial<PerformansIzlemesi> = {}): PerformansIzlemesi => ({ izleme_id: id, kisi_id: "k1", yayin_id: "y1", arac_turu: "video", tamamlandi_mi: true, izleme_bitis: zaman, ...ekstra });
const puan = (id: string, izlemeId: string, deger: number, ekstra: Partial<PerformansPuani> = {}): PerformansPuani => ({ kazanilan_puan_id: id, izleme_id: izlemeId, kisi_id: "k1", yayin_id: "y1", eczane_id: "e1", puan_turu: "izleme", puan: deger, ...ekstra });
function hesapla(izlemeler: PerformansIzlemesi[], puanlar: PerformansPuani[] = [], kayiplar: PerformansKaybi[] = [], baglar: PerformansBagi[] = [bag]) {
  return eclubPerformansiHesapla({ donem, izlemeler, puanlar, kayiplar, baglar, uyeler: [{ kisi_id: "k1", ad: "Adil", soyad: "Güçlü" }, { kisi_id: "k2", ad: "Ayşe", soyad: "Yılmaz" }], eczaneIdler: ["e1"], yayinIdler: ["y1"] });
}
test("iki aylık takvim Türkiye saatinde başlar; yıl ve artık yıl son günleri kaybolmaz", () => {
  assert.equal(donem.baslangic, "2026-08-31T21:00:00.000Z");
  assert.equal(donem.bitisHaric, "2026-10-31T21:00:00.000Z");
  assert.equal(donem.haftalar.length, 8);
  assert.equal(donem.haftalar[7].bitisHaric, donem.bitisHaric);
  assert.equal(eclubPerformansDonemi(new Date("2026-12-31T21:00:00Z")).kod, "2027-P1");
  assert.equal(eclubPerformansDonemi(new Date("2024-02-29T20:59:59Z")).bitisHaric, "2024-02-29T21:00:00.000Z");
  assert.equal(eclubPerformansDonemi(new Date("2026-10-11T09:00:00Z")).aktifHafta, 6);
});
test("tamamlamalar doğru haftaya bir kez yazılır; izleme, cevap ve ileri sarma net hesaplanır", () => {
  const i = izleme("i1", donem.haftalar[1].baslangic);
  const p = puan("p1", "i1", 100);
  const sonuc = hesapla([i, i], [p, p, puan("p2", "i1", 40, { puan_turu: "cevaplama" })], [{ kayit_id: "s1", izleme_id: "i1", kisi_id: "k1", yayin_id: "y1", kaybedilen_puan: 20 }]);
  assert.deepEqual(sonuc.ozet, { puan: 120, tamamlanan: 1, uye: 1 });
  assert.equal(sonuc.satirlar[0].haftalar[0].puan, 0);
  assert.deepEqual(sonuc.satirlar[0].haftalar[1].uyeler[0], { kisi_id: "k1", ad: "Adil", soyad: "Güçlü", tamamlanan: 1, tamamlamaPuani: 100, dogruCevapPuani: 40, kayipPuani: 20, puan: 120 });
});
test("eczane, ürün ve üye kimlikleri birbirine karışmaz; üyenin yeni eczanesi geçmiş puanı taşımaz", () => {
  const sonuc = hesapla([izleme("biz", donem.haftalar[1].baslangic), izleme("diger", donem.haftalar[1].baslangic), izleme("yabanci-urun", donem.haftalar[1].baslangic, { yayin_id: "y2" })],
    [puan("p1", "biz", 80), puan("p2", "diger", 500, { eczane_id: "e2" }), puan("p3", "yabanci-urun", 700, { yayin_id: "y2" }), puan("p4", "biz", 900, { kisi_id: "k2" })], [], []);
  assert.deepEqual(sonuc.ozet, { puan: 80, tamamlanan: 1, uye: 1 });
});
test("puan kazanmadan tamamlanan yayın yalnız tamamlandığı eczanede sayılır", () => {
  const an = donem.haftalar[1].baslangic;
  assert.equal(hesapla([izleme("i", an)]).ozet.tamamlanan, 1);
  assert.equal(hesapla([izleme("i", an)], [], [], [{ ...bag, bitis_tarihi: an, aktif_mi: false }]).ozet.tamamlanan, 0);
  assert.equal(hesapla([izleme("i", an)], [], [], [{ ...bag, baslangic_tarihi: donem.haftalar[2].baslangic }]).ozet.tamamlanan, 0);
});
test("yarım, gelecek, dönem dışı ve görünüm testi kayıtları performans oluşturmaz", () => {
  const an = donem.haftalar[1].baslangic;
  const sonuc = hesapla([izleme("yarim", an, { tamamlandi_mi: false }), izleme("onceki", "2026-08-31T20:59:59Z"), izleme("sonraki", donem.bitisHaric), izleme("fake", an, { ilerleme_durumu: { gorunum_testi: "eclub-cek-karti-v1" } }), izleme("hata", "hatalı")]);
  assert.deepEqual(sonuc.ozet, { puan: 0, tamamlanan: 0, uye: 0 });
});
test("dört yayın türü ve kişi katkılarının toplamları cetvel ve dönem toplamıyla aynıdır", () => {
  const an = donem.haftalar[2].baslangic;
  const sonuc = hesapla([izleme("v", an), izleme("p", an, { arac_turu: "podcast" }), izleme("g", an, { arac_turu: "gorsel", kisi_id: "k2" }), izleme("l", an, { arac_turu: "flip_pdf" })],
    [puan("pv", "v", 100), puan("pp", "p", 60), puan("pg", "g", 30, { kisi_id: "k2" }), puan("pl", "l", 50)]);
  assert.deepEqual(sonuc.ozet, { puan: 240, tamamlanan: 4, uye: 2 });
  const hucreler = sonuc.satirlar.flatMap(s => s.haftalar);
  assert.equal(hucreler.reduce((s,h) => s + h.puan, 0), 240);
  for (const h of hucreler) assert.equal(h.uyeler.reduce((s,u) => s + u.puan, 0), h.puan);
});
test("dönemin son günleri sekizinci bölümdedir, negatif puan gösterilmez", () => {
  const sonuc = hesapla([izleme("son", "2026-10-31T20:59:58Z")], [puan("p", "son", 10)], [{ kayit_id: "s", izleme_id: "son", kisi_id: "k1", yayin_id: "y1", kaybedilen_puan: 25 }]);
  assert.equal(sonuc.satirlar[0].haftalar[7].tamamlanan, 1);
  assert.equal(sonuc.ozet.puan, 0);
});

test("her yayın türünde kişi kazanımları ayrılır ve aynı haftanın izlemeleri birleştirilir", () => {
  for (const tur of ["video", "podcast", "gorsel", "flip_pdf"]) {
    const an = donem.haftalar[2].baslangic;
    const kayiplar = tur === "video" ? [{ kayit_id: "s1", izleme_id: "i1", kisi_id: "k1", yayin_id: "y1", kaybedilen_puan: 20 }] : [];
    const sonuc = hesapla([izleme("i1", an, { arac_turu: tur }), izleme("i2", an, { arac_turu: tur })],
      [puan("p1", "i1", 100), puan("p2", "i2", 60), puan("c1", "i2", 40, { puan_turu: "cevaplama" })], kayiplar);
    const katki = sonuc.satirlar.find(s => s.tur === tur)!.haftalar[2].uyeler[0];
    assert.equal(katki.tamamlanan, 2);
    assert.equal(katki.tamamlamaPuani, 160);
    assert.equal(katki.dogruCevapPuani, 40);
    assert.equal(katki.kayipPuani, tur === "video" ? 20 : 0);
    assert.equal(katki.puan, katki.tamamlamaPuani + katki.dogruCevapPuani - katki.kayipPuani);
  }
});
