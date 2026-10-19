import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const oku = (yol: string) => readFileSync(yol, "utf8");

const ortak = oku("components/ui/yenile-butonu.tsx");
const sayfalar = [
  oku("app/(panel)/eczanem/yayinlar/page.tsx"),
  oku("app/(panel)/eclub/yayinlar/page.tsx"),
  oku("app/(panel)/eclub/eczaneler-takimim/page.tsx"),
  oku("app/(panel)/eczanem/eczane/uye-yayinlari/page.tsx"),
  oku("app/(panel)/eczanem/eczane/uyeler/page.tsx"),
];

test("mutlu: operasyon sayfaları ortak, pasiflenebilir ve durum koruyan yenileme kullanır", () => {
  assert.match(ortak, /disabled=\{disabled \|\| yenileniyor\}/);
  assert.match(ortak, /aria-busy=\{yenileniyor\}/);
  assert.match(ortak, /Yenileniyor…/);
  for (const sayfa of sayfalar) assert.match(sayfa, /<YenileButonu/);

  assert.match(oku("app/(panel)/eclub/oneriler/_hooks/useEclubOneriler.ts"), /if \(ilkYukleme\) setLoading\(true\);\s*else setYenileniyor\(true\)/);
  assert.match(oku("app/(panel)/eclub/listem/_hooks/useEclubListem.ts"), /if \(ilkYukleme\) setLoading\(true\);\s*else setYenileniyor\(true\)/);
});

test("red: manuel yenileme tarayıcıyı yeniden yüklemez", () => {
  const tumKaynak = [ortak, ...sayfalar].join("\n");
  assert.doesNotMatch(tumKaynak, /window\.location\.reload|location\.reload|router\.refresh/);
});
