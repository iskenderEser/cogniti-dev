import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const kaynak = readFileSync("app/(panel)/uretim/api/gorevler/route.ts", "utf8");
const { outputText } = ts.transpileModule(kaynak, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});

for (const tur of ["video", "podcast", "gorsel", "flip_pdf"]) {
  test(`Görev detayı ${tur} için yalnız kendi araç türünü sorgular`, async () => {
    const sorgulananTurler = [];
    const satirlar = {
      uretim_gorevleri: [{ gorev_id: "gorev", talep_id: "talep", asama: "video", arac_id: "arac", atanan_iu_id: "iu" }],
      talepler: [{ talep_id: "talep", ogrenme_araci_turu: tur }],
      kullanicilar: [],
      ogrenme_araci_durumu: [],
    };
    const db = {
      from(tablo) {
        const sorgu = {
          select() { return this; },
          order() { return this; },
          in() { return this; },
          eq(alan, deger) {
            if (alan === "arac_turu") sorgulananTurler.push(deger);
            return this;
          },
          async maybeSingle() {
            assert.equal(tablo, "ogrenme_araclari");
            const data = sorgulananTurler.at(-1) === tur
              ? { dosya_yolu: tur === "video" ? null : "yuklenen-dosya" }
              : null;
            return { data };
          },
          then(resolve) { return Promise.resolve({ data: satirlar[tablo] }).then(resolve); },
        };
        return sorgu;
      },
    };
    const moduller = {
      "next/server": { NextResponse: Response },
      "@/lib/supabase/server": {
        createAdminClient: () => db,
        createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: "iu" } } }) } }),
      },
      "@/lib/utils/hataIsle": {
        hataYaniti: (hata) => Response.json({ hata }, { status: 500 }),
        sunucuHatasi: (hata) => { throw hata; },
      },
      "@/lib/utils/roller": { ADMIN_ROLLER: [], IU_ROLU: "iu", ROL_ADLARI: {}, URETICI_ROLLER: [] },
      "@/lib/utils/rolCozucu": { rolCozucu: async () => "iu" },
      "@/lib/uretim/rpc": { uuidGecerliMi: () => true },
      "@/lib/ogrenmeAraci/yayinThumbnail": { bunnyEmbedUrlUret: (yol) => yol ?? null },
      "@/lib/ogrenmeAraci/bunnyStorage": { bunnyCdnImzaliUrl: (yol) => yol },
      "@/lib/ogrenmeAraci/sozlesme": { podcastTranskriptTercihiCoz: () => false },
    };
    const exports = {};
    runInNewContext(outputText, { exports, require: (ad) => moduller[ad] });
    const yanit = await exports.GET({ nextUrl: new URL("http://localhost/uretim/api/gorevler?gorev_id=gorev") });
    const veri = await yanit.json();
    assert.equal(yanit.status, 200, veri.hata);
    assert.deepEqual(sorgulananTurler, [tur], JSON.stringify(veri));
    assert.equal(veri.gorevler[0].icerik.asama, tur);
    if (tur === "video") assert.equal(veri.gorevler[0].icerik.video_url, null);
  });
}
