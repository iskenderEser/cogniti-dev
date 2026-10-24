import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bmKilavuzunuSec, type BmKilavuzModulleri } from "../lib/rehber/bmKilavuzu.ts";

const hepsi: BmKilavuzModulleri = { ccAcik: true, eclubAcik: true, eclubStoreAcik: true, eczanemAcik: true };
function metin(moduller: BmKilavuzModulleri) {
  const kilavuz = bmKilavuzunuSec(moduller);
  return [...kilavuz.giris, ...kilavuz.bolumler.flatMap(b => [b.baslik, ...b.parcalar.flatMap(p => p.tip === "liste" ? p.maddeler : [p.metin])])].join("\n");
}

for (let secim = 0; secim < 16; secim++) {
  const moduller: BmKilavuzModulleri = { ccAcik: !!(secim & 1), eclubAcik: !!(secim & 2), eclubStoreAcik: !!(secim & 4), eczanemAcik: !!(secim & 8) };
  test(`BM kılavuzu modül birleşimi ${secim}: bağlı içerikler ve başlıkları birlikte gösterilir`, () => {
    const kilavuz = bmKilavuzunuSec(moduller);
    const yazi = metin(moduller);
    assert.equal(kilavuz.bolumler.length, 6);
    assert.match(yazi, /Temsilcilerinize yayın önerme/);
    assert.match(yazi, /T-Club Raporları/);
    if (moduller.ccAcik) assert.match(yazi, /Challenge Club/);
    else assert.doesNotMatch(yazi, /challenge|Challenge|C-Club|Referral|iki kez daha|Kendi puanınız/);
    if (moduller.eclubAcik) assert.match(yazi, /E-Club takımlarını takip etme/);
    else assert.doesNotMatch(yazi, /E-Club|Eczanem|Mutabakat|Hediye çeki/);
    if (moduller.eclubAcik && moduller.eczanemAcik) assert.match(yazi, /Mutabakat Takip/);
    else assert.doesNotMatch(yazi, /Eczanem|Mutabakat|mutabakat/);
    if (moduller.eclubAcik && moduller.eclubStoreAcik) assert.match(yazi, /Hediye çeki taleplerini değerlendirme/);
    else assert.doesNotMatch(yazi, /Hediye çeki taleplerini değerlendirme/);
    for (const bolum of kilavuz.bolumler) {
      assert.ok(bolum.parcalar.length);
      bolum.parcalar.forEach((p, i) => {
        if (p.tip === "baslik") assert.ok(bolum.parcalar[i + 1] && bolum.parcalar[i + 1].tip !== "baslik", p.metin);
      });
    }
  });
}

test("BM tam metni onaylı belgeyle aynı sırada gösterilir", () => {
  const belge = readFileSync("docs/KULLANIM_KILAVUZU_BM.md", "utf8").split("\n").slice(2).join("\n");
  const sadelestir = (yazi: string) => yazi.replace(/\*\*/g, "").replace(/<!--.*?-->/g, "").replace(/^## \d+\. /gm, "").replace(/^(?:- |\d+\. )/gm, "").replace(/\s+/g, " ").trim();
  assert.equal(sadelestir(metin(hepsi)), sadelestir(belge));
});

test("BM modül seçimleri kaynak metni değiştirmez ve menü maddelerini çoğaltmaz", () => {
  const ilk = metin(hepsi);
  metin({ ccAcik: false, eclubAcik: false, eclubStoreAcik: false, eczanemAcik: false });
  metin({ ...hepsi, ccAcik: false, eczanemAcik: false });
  assert.equal(metin(hepsi), ilk);
});
