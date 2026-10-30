import assert from "node:assert/strict";
import test from "node:test";
import { vivaFormDogrula, vivaYerelZamaniUtc, type VivaEtkinlik } from "@/lib/viva/sozlesme";
import { vivaGoogleTakvim, vivaOutlookTakvim } from "@/lib/viva/takvim";

const id = "00000000-0000-4000-8000-000000000001";
const anlik = { yayin_turu: "anlik", baslik: "Toplantı", aciklama: "", egitim_turu: "medikal_egitim", urun_id: null, durum: "planlandi", sure_dakika: 60, katilimcilar: [] };
const e: VivaEtkinlik = { etkinlik_id: id, baslik: "Türkçe, başlık; \\ eğitim", aciklama: "Açıklama\nİkinci satır", baslangic: "2027-01-01T21:30:00Z", bitis: "2027-01-01T22:30:00Z", yayin_turu: "planli", durum: "planlandi", surum: 2, sahip_id: id, sahip_adi: "Sunucu", firma_adi: "Firma", yonetebilir: true, oda_acik: true };
test('Eğitim türü zorunlu; yalnız iki ürün eğitimi ürün gerektirir',()=>{
 for(const type of ['urun_egitimi','urun_medikal_egitim','medikal_egitim','satis_teknikleri','yonetim_egitimi','genel']){
  assert.equal(vivaFormDogrula({...anlik,egitim_turu:type,urun_id:id}),null);
  assert.equal(vivaFormDogrula({...anlik,egitim_turu:type,urun_id:null})===null,!type.startsWith('urun_'));
 }
 for(const type of [undefined,null,'','bilinmeyen','ik_egitimi'])assert.match(vivaFormDogrula({...anlik,egitim_turu:type})!,/Etkinlik türünü seçin/);
 for(const product of ['',123,'gecersiz'])assert.match(vivaFormDogrula({...anlik,urun_id:product})!,/Geçerli bir ürün/);
});
test("anlık yayın sunucu zamanı kullanır; sahte tarih ve geçersiz süre reddedilir", () => {
  assert.equal(vivaFormDogrula(anlik), null);
  for (const ek of [{ sure_dakika: 0 }, { sure_dakika: 1441 }, { sure_dakika: 1.5 }, { sure_dakika: "60" }, { durum: "canli" }, { durum: "taslak" }, { baslangic: e.baslangic }, { bitis: e.bitis }, { yayin_turu: "sahte" }]) assert.ok(vivaFormDogrula({ ...anlik, ...ek }));
});
test("bugün bir saat sonrası planlanabilir; geçmiş başlangıç ve olmayan tarih reddedilir", () => {
  const simdi = Date.parse("2027-01-02T07:00:00Z");
  const v = { ...anlik, yayin_turu: "planli", baslangic: vivaYerelZamaniUtc("2027-01-02T11:00"), bitis: vivaYerelZamaniUtc("2027-01-02T12:00") };
  assert.equal(vivaFormDogrula(v, simdi), null);
  assert.ok(vivaFormDogrula(v, Date.parse(v.baslangic)));
  assert.throws(() => vivaYerelZamaniUtc("2027-02-29T12:00"));
});
test("Google takviminde Türkiye saat dilimi, UTC tarihler ve normal Viva bağlantısı kullanılır", () => {
  const u = new URL(vivaGoogleTakvim(e, "https://cogniti.test"));
  assert.equal(u.origin, "https://calendar.google.com");assert.equal(u.searchParams.get("text"), e.baslik);
  assert.equal(u.searchParams.get("dates"), "20270101T213000Z/20270101T223000Z");
  assert.equal(u.searchParams.get("stz"), "Europe/Istanbul");assert.equal(u.searchParams.get("location"), `https://cogniti.test/viva/${id}`);
});
test("Outlook ICS metin enjeksiyonunu kaçırır ve satırları UTF-8 sınırında katlar", () => {
  const ics = vivaOutlookTakvim({ ...e, aciklama: `${"Türkçe🗓️".repeat(40)}\r\nBEGIN:VEVENT\nSon` }, "https://cogniti.test", new Date("2026-10-25T12:00:00Z"));
  for (const line of ics.split("\r\n")) assert.ok(Buffer.byteLength(line) <= 75);
  const acik = ics.replace(/\r\n /g, "");
  assert.equal(acik.split("\r\nBEGIN:VEVENT\r\n").length, 2);assert.ok(acik.includes("\\nBEGIN:VEVENT\\nSon"));
  assert.ok(acik.includes("SUMMARY:Türkçe\\, başlık\\; \\\\ eğitim"));assert.ok(acik.includes("DTEND:20270101T223000Z"));
  assert.ok(acik.includes(`URL:https://cogniti.test/viva/${id}`));assert.ok(!acik.includes("daily.co"));
});
test("anlık, taslak ve bozuk tarihler takvime aktarılamaz", () => {
  for (const ek of [{ yayin_turu: "anlik" as const }, { durum: "taslak" as const }, { bitis: e.baslangic }, { baslangic: "bozuk" }]) {
    assert.throws(() => vivaGoogleTakvim({ ...e, ...ek }, "https://cogniti.test"));assert.throws(() => vivaOutlookTakvim({ ...e, ...ek }, "https://cogniti.test"));
  }
});

test("anlık ve planlı süreler yalnız 30, 60 ve 90 dakika kabul edilir",()=>{
 const bas=Date.parse("2027-01-02T12:00:00Z"),simdi=bas-3600000;
 for(const dakika of [30,60,90]){
  assert.equal(vivaFormDogrula({...anlik,sure_dakika:dakika},simdi),null);
  assert.equal(vivaFormDogrula({...anlik,yayin_turu:"planli",baslangic:new Date(bas).toISOString(),bitis:new Date(bas+dakika*60000).toISOString()},simdi),null);
 }
 for(const dakika of [0,5,29,31,45,60.5,91,120,1440,1441,1470]){
  assert.match(vivaFormDogrula({...anlik,sure_dakika:dakika},simdi)!,/30, 60 veya 90/);
  assert.ok(vivaFormDogrula({...anlik,yayin_turu:"planli",baslangic:new Date(bas).toISOString(),bitis:new Date(bas+dakika*60000).toISOString()},simdi));
 }
});
