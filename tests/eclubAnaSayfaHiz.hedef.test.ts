import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { YayinKarti } from "@/components/yayin/YayinKarti";
import { gorunenUrunIdHaritasi } from "@/lib/urunler/gorunenId";
import { eclubFirmaKapsami, eclubFirmaRotasiKapsami } from "@/lib/eclub/firmaGezinme";

test("öncelikli kapak eager/high, diğer yayın kapakları lazy yüklenir", () => {
  const yayin = { yayin_id: "y1", urun_adi: "Ürün", thumbnail_url: "https://example.com/kapak.webp", arac_turu: "gorsel" };
  const normal = renderToStaticMarkup(createElement(YayinKarti, { yayin }));
  const oncelikli = renderToStaticMarkup(createElement(YayinKarti, { yayin, kapakOncelikli: true }));
  assert.match(normal, /loading="lazy"/);
  assert.doesNotMatch(normal, /fetchPriority="high"/);
  assert.match(oncelikli, /loading="eager"/);
  assert.match(oncelikli, /fetchPriority="high"/);
});

function panelApi(failed = "", authenticated = true) {
  const events: string[] = [];
  const tables: Record<string, Record<string, unknown>[]> = {
    eclub_oneri_kayitlari: [{ oneri_id: "o1", yayin_id: "y1", kisi_id: "k1", oneri_baslangic: "2026-01-01", oneri_bitis: "2026-12-31", izlendi_mi: true }],
    eclub_izleme_kayitlari: [{ izleme_id: "i1", oneri_id: "o1", yayin_id: "y1", kisi_id: "k1", tamamlandi_mi: true }],
    eclub_kazanilan_puanlar: [{ yayin_id: "y1", izleme_id: "i1", kisi_id: "k1", puan_turu: "izleme", puan: 100 }],
    eclub_ileri_sarma_kayitlari: [{ yayin_id: "y1", izleme_id: "i1", kisi_id: "k1", kaybedilen_puan: 10 }],
    eclub_dogru_cevap_kayitlari: [{ yayin_id: "y1", izleme_id: "i1", kisi_id: "k1" }],
    eclub_yanlis_cevap_kayitlari: [],
    v_yayin_detay: [{ yayin_id: "y1", firma_id: "f1", urun_adi: "Ürün", arac_turu: "gorsel", durum: "yayinda" },
      { yayin_id: "y2", firma_id: "foreign", urun_adi: "Başka firma", arac_turu: "gorsel", durum: "yayinda" }],
    v_yayin_kunye: [{ yayin_id: "y1", urun_id: "u1" }],
    yayin_yonetimi: [{ yayin_id: "y1", cek_karsiligi_var_mi: true, satis_sarti_tipi: "serbest_siparis", gizli_sart_katlama_orani: 10, barem_tablosu: [{ min_puan: 300, max_puan: 500, adet: 10, mal_fazlasi: 1 }] }],
    urunler: [{ urun_id: "u1", gorunen_urun_id: "30-001" }],
    eclub_video_begeniler: [{ yayin_id: "y1", kisi_id: "k1" }],
    eclub_video_favoriler: [{ yayin_id: "y1", kisi_id: "other" }],
  };
  const admin = { from(name: string) {
    let rows = [...(tables[name] ?? [])];
    const builder = {
      select() { return builder; },
      eq(k: string, v: unknown) { rows = rows.filter(r => r[k] === v); return builder; },
      in(k: string, values: unknown[]) { rows = rows.filter(r => values.includes(r[k])); return builder; },
      lte() { return builder; }, order() { return builder; }, or() { return builder; },
      then(resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) {
        events.push(`start:${name}`);
        return new Promise(resolve => setTimeout(resolve, 1)).then(() => {
          events.push(`end:${name}`);
          return { data: name === failed ? null : rows, error: name === failed ? { message: "test" } : null };
        }).then(resolve, reject);
      },
    };
    return builder;
  } };
  const modules: Record<string, unknown> = {
    "next/server": { NextResponse: Response },
    "@/lib/supabase/server": { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: authenticated ? { id: "auth" } : null }, error: null }) } }), createAdminClient: () => admin },
    "@/lib/eclub/kisiErisim": { eclubKisiErisimi: async () => ({ kisi: { kisi_id: "k1", rol: "eczaci", ad: "Adil" }, eclub_aktif: true, firmalar: [{ firma_id: "f1", firma_adi: "Firma", aktif: true, eclub_aktif: true, eclub_store_aktif: true }] }) },
    "@/lib/eclub/firmaGezinme": { eclubFirmaKapsami, eclubFirmaRotasiKapsami },
    "@/lib/utils/roller": { ECLUB_TUKETICI_ROLLERI: ["eczaci"], hedefRolleriOku: () => [], yayinTuketiciRoluneAcikMi: () => true },
    "@/lib/uretim/rpc": { uuidGecerliMi: () => true },
    "@/lib/utils/hataIsle": { hataYaniti: (hata: string) => Response.json({ hata }, { status: 500 }), sunucuHatasi: () => Response.json({ hata: "sunucu" }, { status: 500 }), yetkiHatasi: () => Response.json({}, { status: 401 }), rolHatasi: () => Response.json({}, { status: 403 }) },
    "@/lib/eclub/izlemeKurali": { eclubOneriDurumu: () => "aktif" },
    "@/lib/ogrenmeAraci/bayraklar": { ogrenmeAraciBayraklari: () => ({ gorsel: true }) },
    "@/lib/ogrenmeAraci/yayinThumbnail": { yayinThumbnailUrlCoz: () => "https://example.com/kapak.webp" },
    "@/lib/urunler/gorunenId": { gorunenUrunIdHaritasi },
  };
  const source = readFileSync("app/(panel)/eclub/panel/api/route.ts", "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports: { GET?: (r: Request) => Promise<Response> } = {};
  vm.runInNewContext(compiled, { exports, require: (id: string) => { if (!(id in modules)) throw new Error(id); return modules[id]; }, URL, Date, Set, Map, Error });
  return { get: (query = "") => exports.GET!(new Request(`http://localhost/eclub/panel/api${query ? `?${query}` : ""}`)), events };
}

test("panel puan, ürün ve etkileşim verisini korur; sorgular paralel ve ürün bağı tek okumadır", async () => {
  const api = panelApi();
  const res = await api.get();
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.oneriler.length, 1);
  assert.equal(data.oneriler[0].urun_id, "u1");
  assert.equal(data.oneriler[0].gorunen_urun_id, "30-001");
  assert.equal(data.oneriler[0].kazanilan_izleme_puani, 100);
  assert.equal(data.oneriler[0].ileri_sarma_kaybi, 10);
  assert.equal(data.oneriler[0].begeni_mi, true);
  assert.equal(data.oneriler[0].favori_mi, false);
  assert.equal(data.oneriler[0].favori_sayisi, 1);
  assert.equal(data.oneriler[0].cek_karsiligi_var_mi, true);
  assert.equal(data.oneriler[0].satis_sarti_tipi, "serbest_siparis");
  assert.equal(data.oneriler[0].gizli_sart_katlama_orani, 10);
  assert.equal(data.oneriler[0].barem_tablosu[0].adet, 10);
  assert.equal(data.ozet.toplam_kazanilan_puan, 100);
  assert.equal(api.events.filter(e => e === "start:v_yayin_kunye").length, 1);
  assert.equal(api.events.filter(e => e === "start:yayin_yonetimi").length, 1);
  assert.ok(api.events.indexOf("start:eclub_izleme_kayitlari") < api.events.indexOf("end:eclub_oneri_kayitlari"));
  assert.ok(api.events.indexOf("start:eclub_video_begeniler") < api.events.indexOf("end:v_yayin_kunye"));
});

test("oturumsuz erişim reddedilir; ürün ve etkileşim sorgusu hataları başarı sayılmaz", async () => {
  const noAuth = panelApi("", false);
  assert.equal((await noAuth.get()).status, 401);
  assert.equal(noAuth.events.length, 0);
  for (const name of ["eclub_oneri_kayitlari", "v_yayin_kunye", "yayin_yonetimi", "urunler", "eclub_video_begeniler", "eclub_video_favoriler"]) {
    assert.equal((await panelApi(name).get()).status, 500, name);
  }
});

test("firma adı panel verisini doğrudan çözer; başka firma ve boş firma isteği veri okumadan reddedilir", async () => {
  const res = await panelApi().get("firma=firma");
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.firma.firma_id, "f1");
  assert.equal(data.oneriler.length, 1);
  assert.equal(data.oneriler[0].firma_id, "f1");
  for (const query of ["firma=yabanci", "firma=", "firma_id=foreign"]) {
    const api = panelApi();
    assert.equal((await api.get(query)).status, 403);
    assert.equal(api.events.length, 0);
  }
});
