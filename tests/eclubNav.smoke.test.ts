import test from "node:test";
import assert from "node:assert/strict";
import { PANEL_NAV, type NavContext } from "@/components/panel/panelNav.config";

const uttBaglami: NavContext = {
  rolKucu: "utt",
  storeAcik: true,
  ccAcik: true,
  eclubAcik: true,
  eclubStoreAcik: true,
  eczanemAcik: true,
};

test("UTT E-Club altında kararlaştırılan yönetim alanlarını doğru sırada görür", () => {
  const eclub = PANEL_NAV.find((grup) => grup.baslik === "E-Club");
  assert.ok(eclub);
  assert.deepEqual(
    eclub.oglar.filter((oge) => oge.gate(uttBaglami)).map((oge) => [oge.etiket, oge.path]),
    [
      ["E-Club Takımım", "/eclub/eczanelerim"],
      ["E-Club Yayınları", "/eclub/yayinlar"],
      ["E-Club Ligi", "/eclub/ligi"],
    ],
  );

  const yayinlar = eclub.oglar.find((oge) => oge.etiket === "E-Club Yayınları");
  assert.equal(yayinlar?.altOglar, undefined);
});

test("BM ve TM E-Club Takımım, Yayınları ve ligi; diğer üst roller yalnız ligi görür", () => {
  const eclub = PANEL_NAV.find((grup) => grup.baslik === "E-Club");
  const tclub = PANEL_NAV.find((grup) => grup.baslik === "T-Club");
  assert.ok(eclub);
  assert.ok(tclub);
  assert.deepEqual(
    eclub.oglar.filter((oge) => oge.gate({ ...uttBaglami, rolKucu: "bm" })).map((oge) => oge.etiket),
    ["E-Club Takımım", "E-Club Yayınları", "E-Club Ligi"],
  );
  assert.deepEqual(
    eclub.oglar.filter((oge) => oge.gate({ ...uttBaglami, rolKucu: "tm" })).map((oge) => oge.etiket),
    ["E-Club Takımım", "E-Club Yayınları", "E-Club Ligi"],
  );
  for (const rolKucu of ["pm", "gm"]) {
    assert.deepEqual(
      eclub.oglar.filter((oge) => oge.gate({ ...uttBaglami, rolKucu })).map((oge) => oge.etiket),
      ["E-Club Ligi"],
    );
  }
  assert.equal(tclub.oglar.some((oge) => oge.etiket === "E-Club Ligi"), false);
});

test("eczane sidebarı firma sayısından bağımsız tek Firmalar ve Yayınları bağlantısı gösterir", async () => {
  const { eclubKisiNavOlustur } = await import("@/components/panel/panelNav.config");
  const firmalar = Array.from({ length: 10 }, (_, i) => ({ firma_id: `f${i}`, firma_adi: `Firma ${i}`, eclub_store_aktif: i % 2 === 0 }));
  const nav = eclubKisiNavOlustur(firmalar);
  assert.deepEqual(nav.map((g) => g.baslik), ["E-Club", "Eczanem"]);
  assert.deepEqual(nav[0].oglar.map((o) => [o.etiket, o.path]), [["Firmalar ve Yayınları", "/eclub/firmalar"]]);
  assert.equal(nav[0].oglar[0].altOglar, undefined);
  assert.equal(nav[0].oglar[0].badgeKey, "cek");
  assert.deepEqual(nav[0].oglar[0].aktifYollar, ["/eclub/firma"]);
  assert.equal(nav[0].oglar[0].gate({ ...uttBaglami, eclubAcik: false }), false);
  assert.deepEqual(nav[1].oglar.filter((o) => o.gate(uttBaglami)).map((o) => [o.etiket, o.path]), [["Üyeler", "/eczanem/eczane/uyeler"], ["Üye Yayınları", "/eczanem/eczane/uye-yayinlari"], ["İndirim Onayı", "/eczanem/eczane/inidirm-onayi"]]);
});
