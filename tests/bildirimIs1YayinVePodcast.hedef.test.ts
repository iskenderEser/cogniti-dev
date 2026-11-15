import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { icerikUret } from "@/lib/push/icerik";
import { URETICI_ROLLER, TUKETICI_ROLLER } from "@/lib/utils/roller";
import { podcastTranskriptSonucunuBildir } from "@/lib/ogrenmeAraci/transkriptKuyrukIsleyici";
import type { SupabaseClient } from "@supabase/supabase-js";

test("Karar 1: video_yayini Web Push olayı tüm üretici roller için geçerli yük üretir", () => {
  for (const rol of URETICI_ROLLER) {
    const yuk = icerikUret("video_yayini", rol, { yayinId: "11111111-1111-4111-8111-111111111111" });
    assert.ok(yuk, `${rol} rolü için video_yayini push yükü null olmamalı`);
    assert.equal(yuk.baslik, "Cogniti — Yayın Yönetimi");
    assert.equal(yuk.govde, "Yayınınızın durumu güncellendi.");
    assert.equal(yuk.url, "/yayin-yonetimi");
  }

  for (const rol of TUKETICI_ROLLER) {
    const yuk = icerikUret("video_yayini", rol, { yayinId: "22222222-2222-4222-8222-222222222222" });
    assert.ok(yuk, `${rol} rolü için video_yayini push yükü korunmalı`);
    assert.equal(yuk.baslik, "Cogniti");
    assert.equal(yuk.govde, "Yeni bir öğrenme içeriği yayında.");
  }
});

test("Karar 2: Planlı yayın açılışı SQL ve hemen_yayinla API bildirim/push bağlantıları mevcuttur", () => {
  const sqlYolu = path.join(process.cwd(), "scripts/sql/planli_yayin_uretici_bildirimi.sql");
  const sqlIcerik = fs.readFileSync(sqlYolu, "utf8");
  assert.match(sqlIcerik, /IF p_yayin_id IS NULL AND y\.uretici_id IS NOT NULL THEN/);
  assert.match(sqlIcerik, /nolu planlı yayınız, başarıyla yayınlanmıştır\./);
  assert.match(sqlIcerik, /Yeni öğrenme içeriği yayında:/);

  const apiYolu = path.join(process.cwd(), "app/(panel)/yayin-yonetimi/api/yayinlar/[yayin_id]/route.ts");
  const apiIcerik = fs.readFileSync(apiYolu, "utf8");
  assert.match(apiIcerik, /cogniti_token_yayin_gonderim_alicilari/);
  assert.match(apiIcerik, /pushYayinlaArkada\(adminSupabase, "video_yayini", pushAlicilar/);
});

test("Karar 3: Hazır podcast (üretici) ve İÜ podcast AI transkript tamamlanma/hata bildirimleri doğru alıcıya yazılır", async () => {
  const yazilanBildirimler: Array<Record<string, unknown>> = [];

  const sahteDb = (kaynak: "hazir" | "iu") =>
    ({
      from(tablo: string) {
        if (tablo === "ogrenme_araclari") {
          return {
            select() {
              return {
                eq() {
                  return {
                    async maybeSingle() {
                      return {
                        data: {
                          kaynak,
                          talep_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
                        },
                      };
                    },
                  };
                },
              };
            },
          };
        }
        if (tablo === "talepler") {
          return {
            select() {
              return {
                eq() {
                  return {
                    async maybeSingle() {
                      return {
                        data: { uretici_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" },
                      };
                    },
                  };
                },
              };
            },
          };
        }
        if (tablo === "uretim_gorevleri") {
          return {
            select() {
              return {
                eq() {
                  return {
                    eq() {
                      return {
                        async maybeSingle() {
                          return {
                            data: {
                              atanan_iu_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
                              gorev_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
                            },
                          };
                        },
                      };
                    },
                  };
                },
              };
            },
          };
        }
        if (tablo === "bildirimler") {
          return {
            async upsert(veri: Record<string, unknown>) {
              yazilanBildirimler.push(veri);
              return { error: null };
            },
          };
        }
        throw new Error(`Beklenmeyen tablo: ${tablo}`);
      },
    }) as unknown as SupabaseClient;

  await podcastTranskriptSonucunuBildir(
    sahteDb("hazir"),
    "11111111-1111-4111-8111-111111111111",
    "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    true,
  );
  assert.equal(yazilanBildirimler.length, 1);
  assert.equal(yazilanBildirimler[0].alici_id, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
  assert.equal(yazilanBildirimler[0].kayit_turu, "video");
  assert.match(String(yazilanBildirimler[0].mesaj), /Podcast AI transkript taslağı hazırlandı/);

  await podcastTranskriptSonucunuBildir(
    sahteDb("iu"),
    "22222222-2222-4222-8222-222222222222",
    "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    false,
  );
  assert.equal(yazilanBildirimler.length, 2);
  assert.equal(yazilanBildirimler[1].alici_id, "cccccccc-cccc-4ccc-8ccc-cccccccccccc");
  assert.equal(yazilanBildirimler[1].gorev_id, "dddddddd-dddd-4ddd-8ddd-dddddddddddd");
  assert.match(String(yazilanBildirimler[1].mesaj), /Podcast AI transkript işlemi tamamlanamadı/);
});

test("Karar 3: YayinSonucBildirimi bileşeni Podcast AI transkript sonuç bildirimlerini yakalar", () => {
  const bilesenYolu = path.join(process.cwd(), "components/panel/YayinSonucBildirimi.tsx");
  const icerik = fs.readFileSync(bilesenYolu, "utf8");
  assert.match(icerik, /b\.kayit_turu === "video" && b\.mesaj\.includes\("Podcast AI transkript"\)/);
});

test("İş 2: Üretici Yayın Oluşturma ve Takip rozeti yalnız talep işleme alındığında düşürülür", () => {
  const hookYolu = path.join(process.cwd(), "app/(panel)/talepler/_hooks/useTalepMerkezi.ts");
  const hookIcerik = fs.readFileSync(hookYolu, "utf8");
  assert.doesNotMatch(hookIcerik, /body:\s*JSON\.stringify\(\{\s*talep_id:\s*seciliTalepId\s*\}\)/);
  assert.match(hookIcerik, /const talepBildiriminiKapat = useCallback\(\(talepId: string\)/);
  assert.match(hookIcerik, /talepBildiriminiKapat\(talep\.talep_id\)/);

  const apiYolu = path.join(process.cwd(), "app/bildirimler/api/route.ts");
  const apiIcerik = fs.readFileSync(apiYolu, "utf8");
  assert.match(apiIcerik, /if \(URETICI_ROLLER\.includes\(kullanici\?\.rol \?\? ""\)\)/);
});

test("İş 3: Talep açılışı ve hazır/İÜ öğrenme aracı doğrulama uç noktalarında uretim_durum_gecisi Web Push tetiklenir", () => {
  const dosyalar = [
    "app/(panel)/talepler/api/route.ts",
    "app/api/ogrenme-araclari/[arac_id]/gorsel-dogrula/route.ts",
    "app/api/ogrenme-araclari/[arac_id]/flip-pdf-dogrula/route.ts",
    "app/api/ogrenme-araclari/[arac_id]/podcast-dogrula/route.ts",
    "app/api/ogrenme-araclari/[arac_id]/transkript-yonet/route.ts",
  ];

  for (const goreceliYol of dosyalar) {
    const tamYol = path.join(process.cwd(), goreceliYol);
    const icerik = fs.readFileSync(tamYol, "utf8");
    assert.match(icerik, /pushYayinlaArkada\(/, `${goreceliYol} içinde pushYayinlaArkada çağrısı bulunmalı`);
    assert.match(icerik, /"uretim_durum_gecisi"/, `${goreceliYol} içinde uretim_durum_gecisi olayı kullanılmalı`);
  }
});

test("İş 4: İÜ rozeti yalnız görev tesliminde kapatılır ve Web Push doğrudan ilgili aşama sayfasına yönlendirir", () => {
  const gorevSayfaYolu = path.join(process.cwd(), "app/(panel)/uretim/gorevler/[gorev_id]/page.tsx");
  const gorevSayfaIcerik = fs.readFileSync(gorevSayfaYolu, "utf8");
  assert.doesNotMatch(gorevSayfaIcerik, /body:\s*JSON\.stringify\(\{\s*gorev_id:\s*gelen\.gorev_id\s*\}\)/);
  assert.match(gorevSayfaIcerik, /const gorevBildiriminiKapat = useCallback\(\(gorevId: string\)/);
  assert.match(gorevSayfaIcerik, /gorevBildiriminiKapat\(gorev\.gorev_id\)/);

  const senaryoYuk = icerikUret("uretim_durum_gecisi", "iu", { asama: "senaryo" });
  const aracYuk = icerikUret("uretim_durum_gecisi", "iu", { asama: "video" });
  const soruYuk = icerikUret("uretim_durum_gecisi", "iu", { asama: "soru_seti" });
  const varsayilanYuk = icerikUret("uretim_durum_gecisi", "iu");

  assert.equal(senaryoYuk?.url, "/senaryolar");
  assert.equal(aracYuk?.url, "/ogrenme-araclari");
  assert.equal(soruYuk?.url, "/soru-setleri");
  assert.equal(varsayilanYuk?.url, "/senaryolar");
});

test("İş 5: E-Club kişileri için Firmalar ve Yayınları rozeti yeni (başlanmamış) yayınları içerir ve yalnız yayın başlatılınca düşer", () => {
  const bildirimRouteIcerik = fs.readFileSync(
    path.join(process.cwd(), "app/bildirimler/api/route.ts"),
    "utf8",
  );
  assert.match(bildirimRouteIcerik, /\.from\("eclub_oneri_kayitlari"\)/);
  assert.match(bildirimRouteIcerik, /!baslanmisOneriIdler\.has\(o\.oneri_id\)/);
  assert.match(bildirimRouteIcerik, /sayilar\.cek = \(sayilar\.cek \?\? 0\) \+ eclubYeniYayinSayisi/);

  const baslatRouteIcerik = fs.readFileSync(
    path.join(process.cwd(), "app/(panel)/eclub/panel/api/baslat/route.ts"),
    "utf8",
  );
  assert.match(baslatRouteIcerik, /\.from\("eclub_bildirimler"\)\s*\.update\(\{\s*goruldu_mu:\s*true\s*\}\)/);
  assert.match(baslatRouteIcerik, /\.eq\("kayit_turu",\s*"oneri"\)/);

  const oynaticiIcerik = fs.readFileSync(
    path.join(process.cwd(), "app/(panel)/eclub/panel/_components/EclubVideoOynatici.tsx"),
    "utf8",
  );
  assert.match(oynaticiIcerik, /bildirimRozetleriniYenile\(\)/);
});

test("İş 6: BM için yeni T-Club yayını uyandırma bildirimi/Web Push üretilir ve Öneri Takibi sekmesinde karşılıksız rozet bulunmaz", () => {
  const bmPush = icerikUret("video_yayini", "bm", { yayinId: "11111111-1111-4111-8111-111111111111" });
  assert.ok(bmPush, "bm için video_yayini Web Push yükü üretilmelidir");
  assert.equal(bmPush.url, "/egitim-yayinlari/urun-egitimleri");
  assert.match(bmPush.govde, /Ekibinize önerebileceğiniz yeni bir öğrenme içeriği yayında/);

  const tmPush = icerikUret("video_yayini", "tm", { yayinId: "11111111-1111-4111-8111-111111111111" });
  assert.equal(tmPush, null, "tm için yayın bildirim trafiği açılmamalıdır");

  const navIcerik = fs.readFileSync(
    path.join(process.cwd(), "components/panel/panelNav.config.ts"),
    "utf8",
  );
  assert.doesNotMatch(
    navIcerik,
    /etiket:\s*"Öneri Takibi"[\s\S]{0,80}badgeKey:\s*"oneri"/,
  );
  assert.match(
    navIcerik,
    /etiket:\s*"Önerilen Yayınlar"[\s\S]{0,120}badgeKey:\s*"oneri"/,
  );

  const yayinlarRoute = fs.readFileSync(
    path.join(process.cwd(), "app/(panel)/yayin-yonetimi/api/yayinlar/route.ts"),
    "utf8",
  );
  assert.match(yayinlarRoute, /Ekibinize önerebileceğiniz yeni öğrenme içeriği yayında:/);
  assert.match(yayinlarRoute, /pushYayinlaArkada\(adminSupabase,\s*"video_yayini",\s*pushAlicilar/);
});

test("İş 7: 30sn görünür sekme yoklaması tüm rollere açıktır ve canlı toast iş kuyruğu rozetlerini sıfırlamaz", () => {
  const layoutIcerik = fs.readFileSync(
    path.join(process.cwd(), "app/(panel)/layout.tsx"),
    "utf8",
  );
  assert.doesNotMatch(layoutIcerik, /const zamanlayici = isEclubKisi\s*\?/);
  assert.match(layoutIcerik, /const zamanlayici = window\.setInterval\(\(\) => \{\s*if \(document\.visibilityState === "visible"\) bildirimRozetleriniYenile\(\);/);

  const toastIcerik = fs.readFileSync(
    path.join(process.cwd(), "components/panel/YayinSonucBildirimi.tsx"),
    "utf8",
  );
  assert.match(toastIcerik, /GOSTERILEN_TOAST_ANAHTARI = "cogniti_gosterilen_bildirim_toastlari"/);
  assert.match(toastIcerik, /const okunduIsaretlenecekMi = b\.kayit_turu === "yayin" \|\| transkriptBildirimi;/);
  assert.match(toastIcerik, /if \(okunduIsaretlenecekMi\)/);
});

test("İş 8: FirmaStore store_siparis, E-Club çek teslim ve planlı yayın otomatik açılış Web Push bağlantıları aktiftir", () => {
  const adminStoreSiparis = fs.readFileSync(
    path.join(process.cwd(), "app/admin/store/api/siparis/route.ts"),
    "utf8",
  );
  assert.match(adminStoreSiparis, /pushYayinlaArkada\(db,\s*"store_siparis"/);

  const eclubBildirim = fs.readFileSync(
    path.join(process.cwd(), "lib/utils/eclubBildirim.ts"),
    "utf8",
  );
  assert.match(eclubBildirim, /const olay = kayit_turu === "cek" \? "eclub_cek_teslim" : "eclub_oneri"/);

  const planKuyrugu = fs.readFileSync(
    path.join(process.cwd(), "lib/eclub/gonderimPlanKuyrugu.ts"),
    "utf8",
  );
  assert.match(planKuyrugu, /export async function planliYayinlariAktiveEtVePushGonder/);
  assert.match(planKuyrugu, /await pushYayinla\(supabase,\s*'video_yayini',\s*pushAlicilar/);

  const cronRoute = fs.readFileSync(
    path.join(process.cwd(), "app/api/cron/eclub-yayin-gonderim/route.ts"),
    "utf8",
  );
  assert.match(cronRoute, /planliYayinlariAktiveEtVePushGonder\(\)/);
});

test("İş 9: Eczanem üyesi (musteri) Tüm İçerikler rozeti yeni içerikleri gösterir ve başlatılınca düşer; firma_admin yayın trafiğine kapalıdır", () => {
  const uyeMenusu = fs.readFileSync(
    path.join(process.cwd(), "app/eczanem/_components/eczanemUyeMenusu.ts"),
    "utf8",
  );
  assert.match(uyeMenusu, /Tüm İçerikler[\s\S]{0,200}badgeKey:\s*"eczanem_yeni"/);

  const panelBaglantisi = fs.readFileSync(
    path.join(process.cwd(), "app/eczanem/_components/EczanemPanelBaglantisi.tsx"),
    "utf8",
  );
  assert.match(panelBaglantisi, /badge=\{\{\s*eczanem_yeni:\s*yeniIcerikSayisi\s*\?\?\s*uzakYeniSayisi\s*\}\}/);

  const oynatici = fs.readFileSync(
    path.join(process.cwd(), "app/eczanem/_components/EczanemVideoOynatici.tsx"),
    "utf8",
  );
  assert.match(oynatici, /onBasladi\?\.\(\)/);
  assert.match(oynatici, /bildirimRozetleriniYenile\(\)/);

  assert.equal(icerikUret("video_yayini", "firma_admin", { yayinId: "11111111-1111-4111-8111-111111111111" }), null);
  assert.equal(icerikUret("video_onerisi", "firma_admin", { yayinId: "11111111-1111-4111-8111-111111111111" }), null);
});
