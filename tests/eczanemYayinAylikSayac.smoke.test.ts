import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { eczanemAylikSayacPenceresi, uttEczanemAylikIstatistikleri } from "@/lib/eczanem/gonderim";
import { uttEczanemUyeGonderimOzeti, uttEczanemUyeGonderimRafi } from "@/lib/eczanem/uyeGonderimOzeti";

test("Eczanem aylık sayaç penceresi Türkiye saatinde ayın son gününü kapsar ve sonraki ay başında sıfırlanır", () => {
  const sonGun = eczanemAylikSayacPenceresi(new Date("2026-10-31T20:59:59.999Z"));
  assert.deepEqual(sonGun, {
    baslangic: "2026-09-30T21:00:00.000Z",
    bitisHaric: "2026-10-31T21:00:00.000Z",
  });
  const yeniAy = eczanemAylikSayacPenceresi(new Date("2026-10-31T21:00:00.000Z"));
  assert.deepEqual(yeniAy, {
    baslangic: "2026-10-31T21:00:00.000Z",
    bitisHaric: "2026-11-30T21:00:00.000Z",
  });
});

test("Ay içindeki UTT gönderileri ayrı ayrı, aynı eczane bir kez sayılır", async () => {
  const sayfalar = [
    [{ gonderim_id: "1", eczane_id: "eczane-1" }, { gonderim_id: "2", eczane_id: "eczane-2" }],
    [{ gonderim_id: "3", eczane_id: "eczane-1" }],
    [],
  ];
  const sorgular: Array<{ tablo: string; filtreler: Array<[string, string, unknown]> }> = [];
  const db = {
    from(tablo: string) {
      const kayit = { tablo, filtreler: [] as Array<[string, string, unknown]> };
      sorgular.push(kayit);
      const sorgu = {
        select() { return sorgu; },
        eq(alan: string, deger: unknown) { kayit.filtreler.push(["eq", alan, deger]); return sorgu; },
        gt(alan: string, deger: unknown) { kayit.filtreler.push(["gt", alan, deger]); return sorgu; },
        gte(alan: string, deger: unknown) { kayit.filtreler.push(["gte", alan, deger]); return sorgu; },
        lt(alan: string, deger: unknown) { kayit.filtreler.push(["lt", alan, deger]); return sorgu; },
        order() { return sorgu; },
        limit() { return sorgu; },
        then(resolve: (value: { data: (typeof sayfalar)[number]; error: null }) => void) {
          const data = sayfalar.shift();
          assert.ok(data);
          return Promise.resolve({ data, error: null }).then(resolve);
        },
      };
      return sorgu;
    },
  } as unknown as SupabaseClient;

  const sonuc = await uttEczanemAylikIstatistikleri(db, "utt-1", new Date("2026-10-15T12:00:00Z"));
  assert.deepEqual(sonuc, {
    gonderilenEczaneSayisi: 2,
    uttGonderimSayisi: 3,
    sonrakiAyBaslangici: "2026-10-31T21:00:00.000Z",
  });
  assert.equal(sorgular.length, 3);
  assert.deepEqual(sorgular.slice(1).map((sorgu) => sorgu.filtreler.find(([islem]) => islem === "gt")), [
    ["gt", "gonderim_id", "2"],
    ["gt", "gonderim_id", "3"],
  ]);
  for (const sorgu of sorgular) {
    assert.equal(sorgu.tablo, "eczanem_eczane_gonderimleri");
    assert.ok(sorgu.filtreler.some((filtre) => filtre[0] === "eq" && filtre[1] === "gonderen_utt_id" && filtre[2] === "utt-1"));
    assert.ok(sorgu.filtreler.some((filtre) => filtre[0] === "gte" && filtre[1] === "created_at" && filtre[2] === "2026-09-30T21:00:00.000Z"));
    assert.ok(sorgu.filtreler.some((filtre) => filtre[0] === "lt" && filtre[1] === "created_at" && filtre[2] === "2026-10-31T21:00:00.000Z"));
  }
});

test("Üye özeti yalnız UTT'nin firma kapsamındaki dağıtımlarını sayar ve üyeleri tekilleştirir", async () => {
  const oncekiAy = "2026-09-26T08:00:00+00:00";
  const yanitlar = [
    { tablo: "eczanem_eczane_gonderimleri", data: [
      { gonderim_id: "d1", yayin_id: "y1", eczane_id: "e1", created_at: oncekiAy },
      { gonderim_id: "d2", yayin_id: "y2", eczane_id: "e2", created_at: oncekiAy },
      { gonderim_id: "d3", yayin_id: "y3", eczane_id: "e3", created_at: oncekiAy },
    ] },
    { tablo: "v_yayin_detay", data: [{ yayin_id: "y1" }, { yayin_id: "y2" }] },
    { tablo: "eczanem_gonderimler", data: [
      { gonderim_id: "g1", eczane_id: "e1", musteri_id: "u1" },
      { gonderim_id: "g2", eczane_id: "e2", musteri_id: "u1" },
    ] },
    { tablo: "eczanem_gonderimler", data: [{ gonderim_id: "g3", eczane_id: "e2", musteri_id: "u2" }] },
    { tablo: "eczanem_gonderimler", data: [] },
    { tablo: "eczanem_eczane_gonderimleri", data: [] },
  ];
  const sorgular: Array<{ tablo: string; filtreler: unknown[][] }> = [];
  const db = {
    from(tablo: string) {
      const filtreler: unknown[][] = [];
      sorgular.push({ tablo, filtreler });
      const sorgu = {
        select() { return sorgu; },
        eq(...args: unknown[]) { filtreler.push(["eq", ...args]); return sorgu; },
        in(...args: unknown[]) { filtreler.push(["in", ...args]); return sorgu; },
        gt(...args: unknown[]) { filtreler.push(["gt", ...args]); return sorgu; },
        gte(...args: unknown[]) { filtreler.push(["gte", ...args]); return sorgu; },
        lt(...args: unknown[]) { filtreler.push(["lt", ...args]); return sorgu; },
        or(...args: unknown[]) { filtreler.push(["or", ...args]); return sorgu; },
        order() { return sorgu; },
        limit() { return sorgu; },
        then(resolve: (value: { data: (typeof yanitlar)[number]["data"]; error: null }) => void) {
          const yanit = yanitlar.shift();
          assert.ok(yanit);
          assert.equal(yanit.tablo, tablo);
          return Promise.resolve({ data: yanit.data, error: null }).then(resolve);
        },
      };
      return sorgu;
    },
  } as unknown as SupabaseClient;

  assert.deepEqual(
    await uttEczanemUyeGonderimOzeti(db, "utt-1", "firma-1", new Date("2026-10-15T12:00:00Z")),
    { eczaneSayisi: 2, uyeSayisi: 2, gonderiSayisi: 3 },
  );
  assert.equal(yanitlar.length, 0);
  assert.deepEqual(sorgular[0].filtreler, [
    ["eq", "gonderen_utt_id", "utt-1"],
    ["lt", "created_at", "2026-10-31T21:00:00.000Z"],
  ]);
  assert.deepEqual(sorgular[1].filtreler, [["eq", "firma_id", "firma-1"], ["in", "yayin_id", ["y1", "y2", "y3"]]]);
  assert.deepEqual(sorgular[2].filtreler, [
    ["gte", "created_at", "2026-09-30T21:00:00.000Z"],
    ["lt", "created_at", "2026-10-31T21:00:00.000Z"],
    ["or", `and(yayin_id.eq.y1,eczane_id.eq.e1,created_at.gte.${oncekiAy}),and(yayin_id.eq.y2,eczane_id.eq.e2,created_at.gte.${oncekiAy})`],
  ]);
  assert.deepEqual(sorgular[3].filtreler.at(-1), ["gt", "gonderim_id", "g2"]);
});

test("Üye rafı yayın ayını Türkiye saatine göre seçer ve kısmi gönderimi hazır tutar", async () => {
  const yayin = { urun_adi: "Ürün", durum: "yayinda", arac_turu: "video" };
  const satirlar: Record<string, Record<string, unknown>[]> = {
    eczanem_eczane_gonderimleri: [
      { gonderim_id: "d1", yayin_id: "y1", eczane_id: "e1", created_at: "2026-10-01T08:00:00Z" },
      { gonderim_id: "d2", yayin_id: "y2", eczane_id: "e1", created_at: "2026-09-01T08:00:00Z" },
      { gonderim_id: "d3", yayin_id: "y1", eczane_id: "e2", created_at: "2026-10-01T09:00:00Z" },
    ],
    v_yayin_detay: [
      { ...yayin, yayin_id: "y1", yayin_tarihi: "2026-09-30T21:00:00Z" },
      { ...yayin, yayin_id: "y2", yayin_tarihi: "2026-09-30T20:59:59Z" },
    ],
    eczanem_gonderimler: [
      { gonderim_id: "g1", yayin_id: "y1", eczane_id: "e1", musteri_id: "u1" },
      { gonderim_id: "g2", yayin_id: "y1", eczane_id: "e1", musteri_id: "u1" },
    ],
    eclub_eczaneler: [{ eczane_id: "e1", gln: "1" }, { eczane_id: "e2", gln: "2" }],
    eclub_eczane_master: [{ gln: "1", eczane_adi: "Test Eczanesi 001" }, { gln: "2", eczane_adi: "Test Eczanesi 002" }],
    eczanem_yayin_gonderim_sureleri: [{ yayin_id: "y1", baslangic_at: "2026-09-30T21:00:00Z", uretici_rol: "pm" }],
    eczanem_medikal_eski_yayinlar: [],
    eclub_eczane_firma: [{ eczane_id: "e1" }],
    eczanem_uyelikler: [{ musteri_id: "u1" }, { musteri_id: "u2" }],
    eczanem_musteriler: [{ musteri_id: "u1", ad_soyad: "Üye A" }, { musteri_id: "u2", ad_soyad: "Üye B" }],
    eczanem_eclub_gecis_talepleri: [],
  };
  const db = {
    from(tablo: string) {
      assert.ok(tablo in satirlar);
      let data = satirlar[tablo];
      const sorgu = {
        select() { return sorgu; },
        eq() { return sorgu; },
        in() { return sorgu; },
        lt() { return sorgu; },
        or(filtre: string) {
          assert.match(filtre, /yayin_id\.eq\.y1,eczane_id\.eq\.e1/);
          assert.doesNotMatch(filtre, /yayin_id\.eq\.y2/);
          return sorgu;
        },
        order() { return sorgu; },
        limit() { return sorgu; },
        gt() { data = []; return sorgu; },
        then(resolve: (value: { data: typeof data; error: null }) => void) {
          return Promise.resolve({ data, error: null }).then(resolve);
        },
      };
      return sorgu;
    },
  } as unknown as SupabaseClient;
  const tarih = new Date("2026-10-15T12:00:00Z");
  const raf = await uttEczanemUyeGonderimRafi(db, "utt-1", "firma-1", tarih, tarih, true);
  assert.deepEqual(raf.yillar, ["2026"]);
  assert.deepEqual(
    raf.yayinlar.map(({ yayin_id, gonderimeHazir, gonderenEczaneSayisi, gonderilenUyeSayisi }) =>
      ({ yayin_id, gonderimeHazir, gonderenEczaneSayisi, gonderilenUyeSayisi })),
    [{ yayin_id: "y1", gonderimeHazir: true, gonderenEczaneSayisi: 1, gonderilenUyeSayisi: 1 }],
  );
  assert.deepEqual(raf.yayinlar[0].eczaneDetaylari, [
    { eczaneId: "e1", eczaneAdi: "Test Eczanesi 001", gonderilenUyeSayisi: 1, aktifUyeSayisi: 2 },
    { eczaneId: "e2", eczaneAdi: "Test Eczanesi 002", gonderilenUyeSayisi: 0, aktifUyeSayisi: 2 },
  ]);
});
