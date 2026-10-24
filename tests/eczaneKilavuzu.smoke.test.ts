import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { eczaneKilavuzunuSec, eczaneKilavuzFirmasiniSec, type EczaneKilavuzFirmasi } from "../lib/rehber/eczaneKilavuzu.ts";
const a: EczaneKilavuzFirmasi = { firma_id: "a", firma_adi: "A Firması", eclub_store_aktif: true, eczanem_aktif: true };
const b: EczaneKilavuzFirmasi = { firma_id: "b", firma_adi: "B Firması", eclub_store_aktif: false, eczanem_aktif: false };
function metin(firma: EczaneKilavuzFirmasi | null, rol: string) {
  const k = eczaneKilavuzunuSec(firma, rol);
  return k.bolumler.flatMap(b => [b.baslik, ...b.parcalar.flatMap(p => p.tip === "liste" ? p.maddeler : [p.metin])]).join("\n");
}
for (const rol of ["eczaci", "ikinci_eczaci", "yardimci_eczaci", "eczane_teknisyeni"]) {
  for (const cek of [false, true]) for (const eczanem of [false, true]) {
    test(`Eczaneler: ${rol}, çek=${cek}, Eczanem=${eczanem}`, () => {
      const firma = { ...a, eclub_store_aktif: cek, eczanem_aktif: eczanem };
      const k = eczaneKilavuzunuSec(firma, rol), yazi = metin(firma, rol);
      assert.equal(k.bolumler.length, 6);
      if (!eczanem) assert.doesNotMatch(yazi, /Eczanem|Üye Yayınları|İndirim Onayı|Üyeyi pasife/);
      if (!cek) assert.doesNotMatch(yazi, /Hediye çeki işlemleri|Hediye Çeki Takibi|Hediye çeki koşulları|Kullanılmayan çekli puanlar/);
      const sorular = k.bolumler[5].parcalar.filter(p => p.tip === "baslik").map(p => p.tip === "baslik" ? p.metin : "");
      assert.equal(sorular.some(s => s.startsWith("İkinci eczacı,")), cek && rol !== "eczaci");
      assert.doesNotMatch(yazi, /eczanenin eczacısı|E-Club’da tekrar tamamlamalar için Extra puan verilmez|10 puanlık soruyu doğru yanıtlarsanız/);
      for (const b of k.bolumler) b.parcalar.forEach((p, i) => {
        if (p.tip === "baslik") assert.ok(b.parcalar[i + 1] && b.parcalar[i + 1].tip !== "baslik", p.metin);
      });
    });
  }
}
test("Firma seçimi, başka firmanın açık modüllerini taşımaz", () => {
  assert.equal(eczaneKilavuzFirmasiniSec([a,b], "/eclub/firma/b-firmasi/yayinlar", null, "a").firma, b);
  assert.equal(eczaneKilavuzFirmasiniSec([a,b], "/eclub/firma/a/yayinlar", "b", "b").firma, a);
  assert.equal(eczaneKilavuzFirmasiniSec([a,b], "/eclub/firma/yetkisiz/yayinlar", null, "a").firma, null);
  assert.equal(eczaneKilavuzFirmasiniSec([a,b], "/eclub/firmalar", null, "").firma, null);
  assert.equal(eczaneKilavuzFirmasiniSec([a,b], "/eclub/firmalar", null, "b").firma, b);
  assert.equal(eczaneKilavuzFirmasiniSec([a,b], "/eclub/ana-sayfa", "b", "a").firma, b);
  assert.equal(eczaneKilavuzFirmasiniSec([a,b], "/eclub/firma/%ZZ/yayinlar", null, "a").firma, null);
  assert.doesNotMatch(metin(null, "eczaci"), /Eczanem|Hediye Çeki Takibi/);
});
test("Eczaneler metni son onaylı belgeyle eşleşir; firma geçişi kaynağı değiştirmez", () => {
  const belge = readFileSync("docs/KULLANIM_KILAVUZU_ECZANELER.md", "utf8").split("\n").slice(2).join("\n");
  const sade = (s: string) => s.replace(/\*\*/g, "").replace(/<!--.*?-->/g, "").replace(/^## \d+\. /gm, "").replace(/^(?:- |\d+\. )/gm, "").replace(/\s+/g, " ").trim();
  const ilk = metin(a, "eczane_teknisyeni");
  assert.equal(sade(ilk), sade(belge));
  metin(b, "eczaci");
  assert.equal(metin(a, "eczane_teknisyeni"), ilk);
});
