import assert from "node:assert/strict";
import test from "node:test";
import { tohumaGoreYayinSirala } from "@/lib/eclub/yayinRafiSirasi";

test("E-Club ilk raf: giriş boyunca sıra sabit kalır; yeni giriş farklı sıralanabilir", () => {
  const yayinlar = Array.from({ length: 20 }, (_, index) => ({
    oneri_id: `oneri-${index.toString().padStart(2, "0")}`,
  }));
  const ilkGiris = tohumaGoreYayinSirala(yayinlar, "giris-1").map((yayin) => yayin.oneri_id);
  const ayniGiristeGuncellenenListe = tohumaGoreYayinSirala([...yayinlar].reverse(), "giris-1")
    .map((yayin) => yayin.oneri_id);
  const ikinciGiris = tohumaGoreYayinSirala(yayinlar, "giris-2").map((yayin) => yayin.oneri_id);

  assert.deepEqual(ayniGiristeGuncellenenListe, ilkGiris);
  assert.notDeepEqual(ikinciGiris, ilkGiris);
  assert.deepEqual(yayinlar.map((yayin) => yayin.oneri_id), Array.from({ length: 20 }, (_, index) => `oneri-${index.toString().padStart(2, "0")}`));
});
