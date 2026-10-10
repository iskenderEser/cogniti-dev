import test from "node:test";
import assert from "node:assert/strict";
import { bannerAdedi, bannerDosyaUzantisi, bannerSirasiGecerli, ECLUB_BANNER_MAX_BOYUT } from "@/lib/eclub/banner";

test("Hapbilgi beş, diğer firmalar üç banner kullanır", () => {
  assert.equal(bannerAdedi("Hapbilgi"), 5);
  assert.equal(bannerAdedi("HapBilgi"), 5);
  assert.equal(bannerAdedi("Hepifarma"), 3);
  assert.equal(bannerSirasiGecerli(4, "Hapbilgi"), true);
  assert.equal(bannerSirasiGecerli(5, "Hapbilgi"), true);
  assert.equal(bannerSirasiGecerli(6, "Hapbilgi"), false);
  assert.equal(bannerSirasiGecerli(4, "Hepifarma"), false);
});

test("Banner sırası yalnız üç yükleme alanını kabul eder", () => {
  for (const sira of [1, 2, 3]) assert.equal(bannerSirasiGecerli(sira), true);
  for (const sira of [0, 4, -1, 1.5, NaN]) assert.equal(bannerSirasiGecerli(sira), false);
});

test("Optimize edilen görselin uzantısı eski dosya adından değil içerikten alınır", async () => {
  const png = new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], "eski.webp", { type: "image/png" });
  assert.equal(await bannerDosyaUzantisi(png), "png");
  assert.equal(await bannerDosyaUzantisi(new File([new Uint8Array([255, 216, 255])], "banner.jpg", { type: "image/jpeg" })), "jpg");
  assert.equal(await bannerDosyaUzantisi(new File(["RIFF0000WEBP"], "banner.webp", { type: "image/webp" })), "webp");
});

test("Yanlış içerik, boş dosya, SVG ve boyut aşımı reddedilir", async () => {
  for (const dosya of [
    new File(["<script>"], "banner.png", { type: "image/png" }),
    new File([], "banner.png", { type: "image/png" }),
    new File(["<svg></svg>"], "banner.svg", { type: "image/svg+xml" }),
    new File([new Uint8Array(ECLUB_BANNER_MAX_BOYUT + 1)], "banner.png", { type: "image/png" }),
  ]) assert.equal(await bannerDosyaUzantisi(dosya), null);
});
