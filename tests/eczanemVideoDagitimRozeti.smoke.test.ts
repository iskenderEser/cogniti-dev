// Eczaneye gelen ve müşterilere hâlâ gönderilebilen videoların menü rozeti.
// Tavan: bir mutlu yol ve bir red senaryosu.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const rozetRoute = readFileSync("app/(panel)/eczanem/eczane/api/rozet/route.ts", "utf8");
const panelNav = readFileSync("components/panel/panelNav.config.ts", "utf8");
const dagitimSayfasi = readFileSync("app/(panel)/eczanem/eczane/uye-yayinlari/page.tsx", "utf8");

test("mutlu: gönderilebilir yayını olan eczanenin Üye Yayınları rozeti güncellenir", () => {
  assert.match(panelNav, /Üye Yayınları[\s\S]*badgeKey: "eczanem_video_gonderilecek"/);
  assert.match(rozetRoute, /eczanem_video_gonderilecek/);
  assert.match(rozetRoute, /eczaneVideoGonderimOzetleri[\s\S]*gonderilebilir_uye_sayisi > 0/);
  assert.match(dagitimSayfasi, /await veriCek\(\);[\s\S]*bildirimRozetleriniYenile\(\)/);
});

test("red: rozet ham video sayısını veya tüm müşterilere gönderilmiş videoyu saymaz", () => {
  assert.doesNotMatch(rozetRoute, /gonderilecekVideoSayisi\s*=\s*videolar\.length/);
  assert.match(rozetRoute, /filter\(\(ozet\) => ozet\.gonderilebilir_uye_sayisi > 0\)\.length/);
});
