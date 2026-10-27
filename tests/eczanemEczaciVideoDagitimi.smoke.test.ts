import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const oku = (yol: string) => readFileSync(yol, "utf8");
const sayfa = oku("app/(panel)/eczanem/eczane/uye-yayinlari/page.tsx");
const kart = oku("app/(panel)/eczanem/eczane/uye-yayinlari/_components/EczaneDanisanYayinKarti.tsx");
const panel = oku("app/(panel)/eczanem/eczane/uye-yayinlari/_components/EczaneDanisanGonderimPaneli.tsx");
const api = oku("app/(panel)/eczanem/eczane/api/gonderim/route.ts");
const gonderim = oku("lib/eczanem/gonderim.ts");

test("eczacı sayfası HOYK seçimi ve iki aşamalı danışan gönderimi kullanır", () => {
  assert.match(sayfa, /<MobilYayinAkisi/);
  assert.match(sayfa, /<EczaneDanisanYayinKarti/);
  assert.match(kart, /<YayinKarti/);
  assert.match(kart, /puanGoster\s/);
  assert.match(kart, /baslikSagAksiyon=\{yayin\.talep_no/);
  assert.match(kart, /tarihSatiriSagAksiyon=/);
  assert.match(kart, /puanSatiriSagAksiyon=/);
  assert.match(kart, /Göndermek için seçin/);
  assert.match(kart, /Gönderim detayları/);
  assert.match(sayfa, /sadece_uyeler: "1", yayin_id: yayinId/);
  assert.match(panel, /Gönderim oluştur/);
  assert.match(panel, /Danışanlar/);
  assert.match(panel, /Özet/);
  assert.match(panel, /Tüm seçili yayınlar için uygun/);
  assert.doesNotMatch(sayfa, /EczanemVideoGonderimSatiri|AlertDialog/);
});

test("çoklu yayın uygunluğu danışan ve yayın çiftiyle okunur; POST tek atomik toplu RPC yolunu kullanır", () => {
  assert.match(panel, /yayin_idler: parca\.join\(","\)/);
  assert.match(panel, /gonderilmis\.has\(`\$\{yayin\.yayin_id\}::\$\{danisan\.musteri_id\}`\)/);
  assert.match(api, /eczaneUyeGonderimDurumlari/);
  assert.match(gonderim, /\.from\("eczanem_gonderimler"\)/);
  assert.match(gonderim, /\.select\("yayin_id, urun_adi, teknik_adi, firma_adi, talep_no, video_puani, icerik_turu/);
  assert.match(gonderim, /video_puani: ad\?\.video_puani \?\? null/);
  assert.match(sayfa, /yayin_idler: seciliYayinlar\.map/);
  assert.match(sayfa, /musteri_idler: musteriIdler/);
  assert.match(api, /musterilereTopluGonder\(adminSupabase, eden\.eczaneId!, eden\.kisiId!/);
  assert.match(gonderim, /rpc\("cogniti_token_eczanem_toplu_gonder"/);
  assert.match(gonderim, /rpc\("eczanem_musterilere_video_gonder"/);
});

test("önizleme gönderim veya izleme kaydı oluşturmaz", () => {
  const onizleme = sayfa.slice(sayfa.indexOf("if (aktifYayin)"), sayfa.indexOf("return <div className=\"min-h-full bg-gray-50\""));
  assert.match(onizleme, /<OgrenmeAraciOnizleme/);
  assert.doesNotMatch(onizleme, /fetch\(|gonder\(|\/izle\/api\//);
});
