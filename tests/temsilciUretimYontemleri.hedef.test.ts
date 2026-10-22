import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import React, { act } from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { Window } from 'happy-dom';
import ts from 'typescript';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ADMIN_ROLLER, URETICI_ROLLER, YONETICI_ROLLER } from '@/lib/utils/roller';
import * as roller from '@/lib/utils/roller';
import * as yetenekler from '@/lib/uretici/yetenekler';
import { haftaBaslangici, ayBaslangici, ceyrekBaslangici, yilBaslangici } from '@/lib/zaman/kontrol';

function yukle<T>(dosya: string, modules: Record<string, unknown>, globals: Record<string, unknown> = {}): T {
  const exports = {};
  const compiled = ts.transpileModule(readFileSync(dosya, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(compiled, { exports, URL, URLSearchParams, AbortController, DOMException, ...globals,
    require: (id: string) => { assert.ok(id in modules, `${dosya}: ${id}`); return modules[id]; } });
  return exports as T;
}

type Kapsam = { tur: 'uretici' | 'firma'; firmaId: string; raporKimligi: string; ureticiId: string | null };
type Ozet = { donem_normal_uretim: number; donem_hazir_video: number; donem_hazir_soru_seti: number; donem_hazir_video_ve_soru_seti: number };
type Veri = Awaited<ReturnType<typeof import('@/lib/rapor/uretim/getUretimData').getUretimData>>;
const helper = yukle<{ getTemsilciVaryantOzeti: (db: SupabaseClient, kapsam: Kapsam, bas: string, bit: string) => Promise<Ozet> }>('lib/rapor/uretim/getTemsilciVaryantOzeti.ts', {});
const rapor = yukle<{
  getUretimData: (db: SupabaseClient, kapsam: Kapsam, bas: string, bit: string, rol?: 'tumu' | 'utt' | 'bm' | 'eczaci' | 'eczane_teknisyeni' | 'eczanem') => Promise<Veri>;
  uretimRaporKapsaminiCoz: (db: SupabaseClient, user: { kullanici_id: string; firma_id: string; rol: string }) => Promise<Kapsam>;
}>('lib/rapor/uretim/getUretimData.ts', {
  './getTemsilciVaryantOzeti': helper, '@/lib/utils/roller': roller, '@/lib/uretici/yetenekler': yetenekler,
});
const simdi = new Date('2026-10-22T12:00:00.000Z');
const bitis = simdi.toISOString();
const uretici: Kapsam = { tur: 'uretici', firmaId: 'f1', raporKimligi: 'p1', ureticiId: 'p1' };
const firma: Kapsam = { tur: 'firma', firmaId: 'f1', raporKimligi: 'gm', ureticiId: null };
type Satir = Record<string, unknown>;
type OnbellekModulu = typeof import('@/app/(panel)/raporlar/yayin-raporlari/_hooks/uretimRaporuOnbellek');
type RaporData = import('@/app/(panel)/raporlar/yayin-raporlari/_hooks/uretimRaporuOnbellek').RaporData;

function onbellekRaporu(n: number): RaporData {
  return {
    kullanici: { ad: 'Sentetik', soyad: 'Kişi', rol: 'pm', firma_adi: 'Sentetik Firma' },
    arac_turu_dagilimi: [],
    arac_turu_tarih_araligi: { baslangic: '2026-10-01T00:00:00.000Z', bitis: '2026-10-22T12:00:00.000Z' },
    uretim: {
      toplam_yayina_alma: n, donemde_yayina_alinan: n, su_an_yayinda: n,
      turler: [{ kod: 'urun_egitimi', ad: 'Ürün Eğitimi', adet: n }],
      varyantlar: [{ kod: 'normal', ad: 'Tam Üretim', adet: n }, { kod: 'hazir_video', ad: 'Hazır Öğrenme Aracı', adet: n * 3 }],
    },
    egitim_turu_etkisi: [{
      egitim_turu: 'urun_egitimi', egitim_adi: `Sentetik Konu ${n}`,
      donemde_yayina_alinan: n, tamamlanan_izleme: n * 2,
      kazanilan_toplam: n * 10, kaybedilen_toplam: n, net_puan: n * 9,
      begeni_sayisi: 0, favori_sayisi: 0, extra_izleme_sayisi: 0,
      urun_dagilimi: [{ urun_id: 'sentetik-cache-urun', urun_adi: `Sentetik Ürün ${n}`, kazanilan_toplam: n * 10, kaybedilen_toplam: n, net_puan: n * 9 }],
    }],
  };
}

function veritabani(varyantSabiti?: readonly number[]) {
  const hatalar = new Set<string>();
  const cagrilar: string[] = [];
  const rpcCagrilari: Array<{ ad: string; argumanlar: Satir }> = [];
  const yanitlar = new Map<string, unknown[]>();
  // Sabit SQL cevapları: hesaplama değil, RPC bağlantısı ve parametre aktarımı sınanır.
  const egitimYanitlari = {
    eczanem: [{ egitim_turu: 'urun_egitimi', donemde_yayina_alinan: 17, tamamlanan_izleme: 23, kazanilan_toplam: 211, kaybedilen_toplam: 7, net_puan: 204,
      urun_dagilimi: [{ urun_id: 'sentetik-eczanem-urun', urun_adi: 'Sentetik Üye Ürünü', yayina_alinan: 17, kazanilan_toplam: 211, kaybedilen_toplam: 7, net_puan: 204, eclub_puani: 0 }] }],
    eczane_teknisyeni: [{ egitim_turu: 'urun_egitimi', donemde_yayina_alinan: 6, tamamlanan_izleme: 13, kazanilan_toplam: 151, kaybedilen_toplam: 12, net_puan: 139,
      urun_dagilimi: [{ urun_id: 'sentetik-teknisyen-urun', urun_adi: 'Sentetik Teknisyen Ürünü', yayina_alinan: 6, kazanilan_toplam: 151, kaybedilen_toplam: 12, net_puan: 139, eclub_puani: 151 }] }],
    eczaci: [{ egitim_turu: 'urun_egitimi', donemde_yayina_alinan: 11, tamamlanan_izleme: 21, kazanilan_toplam: 111, kaybedilen_toplam: 12, net_puan: 99,
      urun_dagilimi: [{ urun_id: 'sentetik-eczaci-urun', urun_adi: 'Sentetik Eczacı Ürünü', yayina_alinan: 11, kazanilan_toplam: 111, kaybedilen_toplam: 12, net_puan: 99, eclub_puani: 111 }] }],
    bm: [{ egitim_turu: 'urun_egitimi', donemde_yayina_alinan: 7, tamamlanan_izleme: 19, kazanilan_toplam: 89, kaybedilen_toplam: 13, net_puan: 76,
      urun_dagilimi: [{ urun_id: 'sentetik-bm-urun', urun_adi: 'Sentetik BM Ürünü', yayina_alinan: 7, kazanilan_toplam: 89, kaybedilen_toplam: 13, net_puan: 76, eclub_puani: 0 }] }],
    tumu: [{ egitim_turu: 'urun_egitimi', donemde_yayina_alinan: 31, tamamlanan_izleme: 67, kazanilan_toplam: 170, kaybedilen_toplam: 20, net_puan: 150, urun_dagilimi: [] }],
    utt: [{ egitim_turu: 'urun_egitimi', donemde_yayina_alinan: 5, tamamlanan_izleme: 12, kazanilan_toplam: 63, kaybedilen_toplam: 8, net_puan: 55,
      urun_dagilimi: [{ urun_id: 'sentetik-utt-urun', urun_adi: 'Sentetik Temsilci Ürünü', yayina_alinan: 5, kazanilan_toplam: 63, kaybedilen_toplam: 8, net_puan: 55, eclub_puani: 4 }] }],
  };
  const q = { select: () => q, eq: () => q, in: () => q, limit: () => q,
    maybeSingle: async () => ({ data: { kullanici_id: 'gm' }, error: null }) };
  const db = {
    from: (table: string) => {
      assert.equal(table, 'kullanicilar', 'Varyant sayımı için ham kayıt çekilmemeli');
      cagrilar.push(table); return q;
    },
    rpc: async (name: string, args: Satir) => {
      cagrilar.push(name); rpcCagrilari.push({ ad: name, argumanlar: { ...args } });
      if (hatalar.has(name)) return { data: null, error: { message: 'Sentetik RPC hatası' } };
      if (yanitlar.has(name)) return { data: yanitlar.get(name), error: null };
      if (name === 'get_yonetici_egitim_turu_etkisi_v3') return { data: egitimYanitlari[args.p_rapor_rolu === 'eczanem' ? 'eczanem' : args.p_rapor_rolu === 'eczane_teknisyeni' ? 'eczane_teknisyeni' : args.p_rapor_rolu === 'eczaci' ? 'eczaci' : args.p_rapor_rolu === 'bm' ? 'bm' : args.p_rapor_rolu === 'utt' ? 'utt' : 'tumu'], error: null };
      if (name === 'get_yayin_raporlari_varyant_ozeti_v1') {
        const senaryo = donemler.find((s) => s[1].toISOString() === args.p_baslangic) ?? donemler[1];
        const degerler = varyantSabiti ?? (args.p_yonetici_id === 'p1' ? senaryo[2] : senaryo[3]);
        return { data: [Object.fromEntries(['donem_normal_uretim','donem_hazir_video','donem_hazir_soru_seti','donem_hazir_video_ve_soru_seti'].map((ad, i) => [ad, String(degerler[i])]))], error: null };
      }
      return { data: [{ toplam_yayina_alma: 31, donemde_yayina_alinan: 11, su_an_yayinda: 24, donem_normal_uretim: '13', donem_hazir_video: 7, donem_hazir_soru_seti: 3, donem_hazir_video_ve_soru_seti: 8 }], error: null };
    },
  } as unknown as SupabaseClient;
  return { db, hatalar, cagrilar, rpcCagrilari, egitimYanitlari, yanitlar };
}

const donemler = [
  ['Haftalık', haftaBaslangici(simdi), [0, 1, 1, 0], [0, 1, 1, 1]],
  ['Aylık', ayBaslangici(simdi), [3, 1, 1, 1], [2, 1, 1, 2]],
  ['Dönemlik', ceyrekBaslangici(simdi), [3, 1, 1, 1], [2, 1, 1, 2]],
  // Eylül'de yayımlanan V4 aylıkta yoktur, yıllıkta sayılır.
  ['Yıllık', yilBaslangici(simdi), [4, 1, 1, 2], [3, 1, 1, 3]],
] as const;
for (const [ad, baslangic, ureticiBeklenen, firmaBeklenen] of donemler) {
  for (const [kapsam, beklenen] of [[uretici, ureticiBeklenen], [firma, firmaBeklenen]] as const) {
    test(`${ad}/${kapsam.tur}: doğru dönem ve kapsam parametreleri SQL’e gönderilir; dört sayı aktarılır`, async () => {
      const { db, rpcCagrilari } = veritabani();
      const data = await rapor.getUretimData(db, kapsam, baslangic.toISOString(), bitis, 'utt');
      assert.deepEqual(Array.from(data.uretim.varyantlar, (v) => v.adet), [...beklenen]);
      assert.deepEqual(rpcCagrilari.find((c) => c.ad === 'get_yonetici_egitim_turu_etkisi_v3')?.argumanlar, {
        p_yonetici_id: kapsam.raporKimligi, p_baslangic: baslangic.toISOString(), p_bitis: bitis, p_rapor_rolu: 'utt',
      });
    });
  }
}

for (const rol of [...URETICI_ROLLER, ...YONETICI_ROLLER, ...ADMIN_ROLLER]) {
  test(`${rol}: erişim kapsamı çözümlenerek Temsilci SQL sayıları sunulur`, async () => {
    const { db, rpcCagrilari } = veritabani();
    const kendi = URETICI_ROLLER.includes(rol);
    const kapsam = await rapor.uretimRaporKapsaminiCoz(db, { kullanici_id: kendi ? 'p1' : rol, firma_id: 'f1', rol });
    const data = await rapor.getUretimData(db, kapsam, ayBaslangici(simdi).toISOString(), bitis, 'utt');
    assert.deepEqual(Array.from(data.uretim.varyantlar, (v) => v.adet), kendi ? [3, 1, 1, 1] : [2, 1, 1, 2]);
    assert.deepEqual(rpcCagrilari.find((c) => c.ad === 'get_yonetici_egitim_turu_etkisi_v3')?.argumanlar, {
      p_yonetici_id: kapsam.raporKimligi, p_baslangic: ayBaslangici(simdi).toISOString(), p_bitis: bitis, p_rapor_rolu: 'utt',
    });
  });
}

test('Tümü çağrısı üç parametreyi korur; Temsilci aynı eğitim RPC’sine utt gönderir', async () => {
  const { db, cagrilar, rpcCagrilari } = veritabani();
  const tumu = await rapor.getUretimData(db, uretici, ayBaslangici(simdi).toISOString(), bitis);
  assert.deepEqual(Array.from(tumu.uretim.varyantlar, (v) => v.adet), [13, 7, 3, 8]);
  assert.equal(cagrilar.includes('v_yayin_kunye'), false);
  const eskiArgs = { p_yonetici_id: 'p1', p_baslangic: ayBaslangici(simdi).toISOString(), p_bitis: bitis };
  assert.deepEqual(rpcCagrilari.find((c) => c.ad === 'get_yonetici_egitim_turu_etkisi_v3')?.argumanlar, eskiArgs);
  const temsilci = await rapor.getUretimData(db, uretici, ayBaslangici(simdi).toISOString(), bitis, 'utt');
  assert.deepEqual(rpcCagrilari.filter((c) => c.ad === 'get_yonetici_egitim_turu_etkisi_v3').map((c) => c.argumanlar), [eskiArgs, { ...eskiArgs, p_rapor_rolu: 'utt' }]);
  assert.equal(rpcCagrilari.filter((c) => c.ad === 'get_uretici_yayin_ana_ozet_v1').every((c) => !('p_rapor_rolu' in c.argumanlar)), true);
  const digerleri = (data: Veri) => JSON.parse(JSON.stringify({ ...data, egitim_turu_etkisi: [], uretim: { ...data.uretim, varyantlar: [], turler: [] } }));
  assert.deepEqual(digerleri(temsilci), digerleri(tumu));
  assert.notDeepEqual(temsilci.egitim_turu_etkisi, tumu.egitim_turu_etkisi);
});

test('konu kutuları, ayrıntıları ve ürün kırılımı aynı Temsilci SQL yanıtından aktarılır', async () => {
  const { db, egitimYanitlari } = veritabani();
  const data = await rapor.getUretimData(db, uretici, ayBaslangici(simdi).toISOString(), bitis, 'utt');
  const kaynak = egitimYanitlari.utt[0];
  const etki = data.egitim_turu_etkisi.find((e) => e.egitim_turu === kaynak.egitim_turu)!;
  const konu = data.uretim.turler.find((e) => e.kod === kaynak.egitim_turu)!;
  assert.equal(konu.adet, kaynak.donemde_yayina_alinan);
  for (const alan of ['donemde_yayina_alinan', 'tamamlanan_izleme', 'kazanilan_toplam', 'kaybedilen_toplam', 'net_puan'] as const) {
    assert.equal(etki[alan], kaynak[alan]);
  }
  assert.deepEqual(JSON.parse(JSON.stringify(etki.urun_dagilimi)), kaynak.urun_dagilimi);
  assert.deepEqual(Array.from(data.egitim_turu_etkisi, (e) => e.egitim_turu), [...yetenekler.TALEP_TURU_SIRA]);
  assert.equal(data.uretim.turler.length, 6);
  assert.equal(data.egitim_turu_etkisi[1].net_puan, 0);
});

test('Temsilci eğitim RPC hatasında Tümü yanıtına geri dönülmez', async () => {
  const { db, hatalar, rpcCagrilari } = veritabani();
  hatalar.add('get_yonetici_egitim_turu_etkisi_v3');
  await assert.rejects(rapor.getUretimData(db, uretici, ayBaslangici(simdi).toISOString(), bitis, 'utt'), /Üretim raporu okunamadı/);
  const egitim = rpcCagrilari.filter((c) => c.ad === 'get_yonetici_egitim_turu_etkisi_v3');
  assert.equal(egitim.length, 1);
  assert.equal(egitim[0].argumanlar.p_rapor_rolu, 'utt');
});

test('1.000 üzerindeki SQL sayıları eksiksiz aktarılır; ham yayın kayıtları çekilmez', async () => {
  const { db, cagrilar, rpcCagrilari } = veritabani([1007, 0, 0, 0]);
  const sonuc = await helper.getTemsilciVaryantOzeti(db, uretici, ayBaslangici(simdi).toISOString(), bitis);
  assert.deepEqual(Object.values(sonuc), [1007, 0, 0, 0]);
  assert.deepEqual(cagrilar, ['get_yayin_raporlari_varyant_ozeti_v1']);
  assert.equal(rpcCagrilari[0].argumanlar.p_yonetici_id, uretici.raporKimligi);
  assert.equal(rpcCagrilari[0].argumanlar.p_rapor_rolu, 'utt');
});

test('SQL boş kapsamda dört sıfır verdiğinde uygulama bu değerleri aynen aktarır', async () => {
  const { db, cagrilar } = veritabani([0, 0, 0, 0]);
  const sonuc = await helper.getTemsilciVaryantOzeti(db, uretici, ayBaslangici(simdi).toISOString(), bitis);
  assert.deepEqual(Object.values(sonuc), [0, 0, 0, 0]);
  assert.deepEqual(cagrilar, ['get_yayin_raporlari_varyant_ozeti_v1']);
});

test('Temsilci varyant SQL hatasında Tümü rakamlarına geri dönülmez', async () => {
  const { db, hatalar } = veritabani();
  hatalar.add('get_yayin_raporlari_varyant_ozeti_v1');
  await assert.rejects(rapor.getUretimData(db, uretici, ayBaslangici(simdi).toISOString(), bitis, 'utt'), /Temsilci üretim yöntemleri okunamadı/);
});
for (const satirSayisi of [0, 2]) {
  test(`Temsilci varyant SQL yanıtında ${satirSayisi} satır olduğunda eksik/çift sonuç gösterilmez`, async () => {
    const { db, yanitlar } = veritabani();
    yanitlar.set('get_yayin_raporlari_varyant_ozeti_v1', Array.from({ length: satirSayisi }, () => ({})));
    await assert.rejects(helper.getTemsilciVaryantOzeti(db, uretici, ayBaslangici(simdi).toISOString(), bitis), /Temsilci üretim yöntemleri okunamadı/);
  });
}

test('API rolü üç kartın servisine iletir; aynı rapor kimliği korunur', async () => {
  const rolCagrilari: unknown[] = [];
  const aracCagrilari: unknown[] = [];
  const q = { select: () => q, eq: () => q,
    single: async () => ({ data: { kullanici_id: 'p1', rol: 'pm', firma_id: 'f1' } }),
    maybeSingle: async () => ({ data: { firma_adi: 'Sentetik Firma' } }) };
  const { GET } = yukle<{ GET: (r: Request) => Promise<Response> }>('app/(panel)/raporlar/api/uretim/route.ts', {
    'next/server': { NextResponse: { json: Response.json } },
    '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { email: 'test@example.invalid' } } }) } }), createAdminClient: () => ({ from: () => q }) },
    '@/lib/utils/hataIsle': { hataYaniti: (mesaj: string) => { throw new Error(mesaj); }, yetkiHatasi: () => Response.json({}, { status: 401 }), validasyonHatasi: () => Response.json({}, { status: 400 }) },
    '@/lib/utils/tarihAraligi': { tarihAraligi: () => ({ baslangic: 'bas', bitis: 'bit' }) },
    '@/lib/rapor/uretim/getUretimData': { uretimRaporunuGorebilir: () => true, uretimRaporKapsaminiCoz: async () => uretici,
      getUretimData: async (...args: unknown[]) => { rolCagrilari.push(args[4]); return {}; } },
    '@/lib/rapor/paylasilan/aracTuruDagilimi': { aracTuruDagilimi: async (_db: unknown, girdi: unknown) => { aracCagrilari.push(girdi); return []; } },
  });
  assert.equal((await GET(new Request('http://localhost/raporlar/api/uretim?periyot=bu_ay'))).status, 200);
  assert.equal((await GET(new Request('http://localhost/raporlar/api/uretim?periyot=bu_ay&rapor_rolu=utt'))).status, 200);
  assert.equal((await GET(new Request('http://localhost/raporlar/api/uretim?periyot=bu_ay&rapor_rolu=bm'))).status, 200);
  assert.equal((await GET(new Request('http://localhost/raporlar/api/uretim?periyot=bu_ay&rapor_rolu=eczaci'))).status, 200);
  assert.equal((await GET(new Request('http://localhost/raporlar/api/uretim?periyot=bu_ay&rapor_rolu=eczane_teknisyeni'))).status, 200);
  assert.equal((await GET(new Request('http://localhost/raporlar/api/uretim?periyot=bu_ay&rapor_rolu=eczanem'))).status, 200);
  assert.deepEqual(rolCagrilari, ['tumu', 'utt', 'bm', 'eczaci', 'eczane_teknisyeni', 'eczanem']);
  assert.deepEqual(JSON.parse(JSON.stringify(aracCagrilari)), [
    { baslangic: 'bas', bitis: 'bit', raporKimligi: 'p1', raporRolu: 'tumu' },
    { baslangic: 'bas', bitis: 'bit', raporKimligi: 'p1', raporRolu: 'utt' },
    { baslangic: 'bas', bitis: 'bit', raporKimligi: 'p1', raporRolu: 'bm' },
    { baslangic: 'bas', bitis: 'bit', raporKimligi: 'p1', raporRolu: 'eczaci' },
    { baslangic: 'bas', bitis: 'bit', raporKimligi: 'p1', raporRolu: 'eczane_teknisyeni' },
    { baslangic: 'bas', bitis: 'bit', raporKimligi: 'p1', raporRolu: 'eczanem' },
  ]);
  assert.equal((await GET(new Request('http://localhost/raporlar/api/uretim?rapor_rolu=gecersiz'))).status, 400);
});

test('eski iki rolün önbelleği okunmaz; yeni kayıtlar dört dönem ve kullanıcıya göre ayrılır', async () => {
  const dom = new Window();
  const dosya = 'app/(panel)/raporlar/yayin-raporlari/_hooks/uretimRaporuOnbellek.ts';
  const globals = { window: dom, sessionStorage: dom.sessionStorage };
  const beklenenler: Array<{ kullanici: string; periyot: string; deger: number }> = [];
  try {
    for (const [kullaniciIndeks, kullanici] of ['p1', 'p2'].entries()) {
      for (const [periyotIndeks, periyot] of ['bu_hafta', 'bu_ay', 'bu_donem', 'bu_yil'].entries()) {
        const deger = 10 + kullaniciIndeks * 100 + periyotIndeks;
        beklenenler.push({ kullanici, periyot, deger });
        dom.sessionStorage.setItem(`hb_uretim_raporu_v2_${kullanici}_${periyot}_tumu`, JSON.stringify(onbellekRaporu(deger * 10)));
        dom.sessionStorage.setItem(`hb_uretim_raporu_v2_${kullanici}_${periyot}_utt`, JSON.stringify(onbellekRaporu(9999)));
        dom.sessionStorage.setItem(`hb_uretim_raporu_v2_${kullanici}_${periyot}_utt_v3`, JSON.stringify(onbellekRaporu(8888)));
      }
    }
    const cache = yukle<OnbellekModulu>(dosya, {}, globals);
    assert.equal(cache.getUretimRaporuOnbellek('bu_ay'), null);
    for (const { kullanici, periyot, deger } of beklenenler) {
      assert.equal(cache.getUretimRaporuOnbellek(periyot, kullanici, 'utt'), null);
      assert.equal(cache.getUretimRaporuOnbellek(periyot, kullanici), null);
      cache.setUretimRaporuOnbellek(periyot, kullanici, onbellekRaporu(deger * 10));
      cache.setUretimRaporuOnbellek(periyot, kullanici, onbellekRaporu(deger), 'utt');
    }
    // Yeni modül belleğiyle okumak, ayrımın sessionStorage'da da korunduğunu doğrular.
    const yenidenYuklenen = yukle<OnbellekModulu>(dosya, {}, globals);
    for (const { kullanici, periyot, deger } of beklenenler) {
      assert.equal(yenidenYuklenen.getUretimRaporuOnbellek(periyot, kullanici, 'utt')?.egitim_turu_etkisi[0].donemde_yayina_alinan, deger);
      assert.equal(yenidenYuklenen.getUretimRaporuOnbellek(periyot, kullanici, 'tumu')?.uretim.turler[0].adet, deger * 10);
      assert.equal(JSON.parse(dom.sessionStorage.getItem(`hb_uretim_raporu_v2_${kullanici}_${periyot}_utt`)!).uretim.turler[0].adet, 9999);
      assert.equal(JSON.parse(dom.sessionStorage.getItem(`hb_uretim_raporu_v2_${kullanici}_${periyot}_tumu`)!).uretim.turler[0].adet, deger * 10);
    }
    assert.equal(yenidenYuklenen.getUretimRaporuOnbellek('bu_ay', 'baska-kullanici', 'utt'), null);
  } finally { await dom.happyDOM.close(); }
});

test('prefetch yeni Temsilci kapsamına yazar; hata geçerli önbelleği veya Tümü kapsamını değiştirmez', async () => {
  const dom = new Window();
  const istekler: string[] = [];
  let mod: 'utt' | 'tumu' | 'http-hatasi' | 'ag-hatasi' = 'utt';
  dom.sessionStorage.setItem('hb_uretim_raporu_v2_p1_bu_ay_utt', JSON.stringify(onbellekRaporu(9999)));
  dom.sessionStorage.setItem('hb_uretim_raporu_v3_p1_bu_ay_tumu', JSON.stringify(onbellekRaporu(100)));
  const cache = yukle<OnbellekModulu>('app/(panel)/raporlar/yayin-raporlari/_hooks/uretimRaporuOnbellek.ts', {}, {
    window: dom, sessionStorage: dom.sessionStorage,
    fetch: async (url: string) => {
      istekler.push(url);
      if (mod === 'ag-hatasi') throw new Error('Sentetik bağlantı hatası');
      if (mod === 'http-hatasi') return Response.json({ success: false }, { status: 500 });
      return Response.json({ success: true, data: onbellekRaporu(mod === 'utt' ? 5 : 200) });
    },
  });
  try {
    assert.equal((await cache.prefetchUretimRaporu('bu_ay', 'p1', 'utt'))?.uretim.turler[0].adet, 5);
    assert.match(istekler[0], /periyot=bu_ay&rapor_rolu=utt/);
    assert.equal(cache.getUretimRaporuOnbellek('bu_ay', 'p1', 'utt')?.uretim.turler[0].adet, 5);
    assert.equal(cache.getUretimRaporuOnbellek('bu_ay', 'p1')?.uretim.turler[0].adet, 100);
    for (const hata of ['http-hatasi', 'ag-hatasi'] as const) {
      mod = hata;
      assert.equal(await cache.prefetchUretimRaporu('bu_ay', 'p1', 'utt'), null);
      assert.equal(cache.getUretimRaporuOnbellek('bu_ay', 'p1', 'utt')?.uretim.turler[0].adet, 5);
      assert.equal(cache.getUretimRaporuOnbellek('bu_ay', 'p1')?.uretim.turler[0].adet, 100);
    }
    mod = 'tumu';
    assert.equal((await cache.prefetchUretimRaporu('bu_ay', 'p1'))?.uretim.turler[0].adet, 200);
    assert.match(istekler[istekler.length - 1], /rapor_rolu=tumu/);
    assert.equal(JSON.parse(dom.sessionStorage.getItem('hb_uretim_raporu_v3_p1_bu_ay_tumu')!).uretim.turler[0].adet, 200);
    assert.equal(cache.getUretimRaporuOnbellek('bu_ay', 'p1', 'utt')?.uretim.turler[0].adet, 5);
  } finally { await dom.happyDOM.close(); }
});

test('sayfa, hook ve önbellek: iki kartın rol/dönem verileri, hata ve geciken yanıtlar ayrılır', async () => {
  const dom = new Window();
  for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'Event'] as const) {
    Object.defineProperty(globalThis, key, { configurable: true, value: dom[key] });
  }
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const { createRoot } = await import('react-dom/client');
  dom.sessionStorage.setItem('hb_uretim_raporu_v2_p1_bu_ay_utt', JSON.stringify(onbellekRaporu(777)));
  dom.sessionStorage.setItem('hb_uretim_raporu_v2_p1_bu_yil_utt', JSON.stringify(onbellekRaporu(888)));
  const cache = yukle<OnbellekModulu>('app/(panel)/raporlar/yayin-raporlari/_hooks/uretimRaporuOnbellek.ts', {}, { window: dom, sessionStorage: dom.sessionStorage });
  const istekler: Array<{ url: string; signal: AbortSignal; cevapla: (r: Response) => void }> = [];
  const hook = yukle<Record<string, unknown>>('app/(panel)/raporlar/yayin-raporlari/_hooks/useUretimRaporu.ts', { react: React, './uretimRaporuOnbellek': cache },
    { fetch: (url: string, options: { signal: AbortSignal }) => new Promise<Response>((cevapla) => istekler.push({ url, signal: options.signal, cevapla })) });
  const bos = () => null;
  const { default: Page } = yukle<{ default: React.ComponentType }>('app/(panel)/raporlar/yayin-raporlari/page.tsx', {
    react: React, 'react/jsx-runtime': jsxRuntime, 'next/link': { default: bos },
    'lucide-react': { ArrowLeft: bos, BookOpenCheck: bos, Layers: bos, X: bos },
    '@/lib/panel/baslangic': { panelBaslangici: () => ({ yol: '/', etiket: '' }) },
    '@/app/providers/AuthProvider': { useAuth: () => ({ kullanici: { id: 'p1', rol: 'pm' } }) },
    './_hooks/useUretimRaporu': hook,
    '@/components/ui/yenile-butonu': { YenileButonu: ({ onYenile }: { onYenile: () => void }) => React.createElement('button', { onClick: onYenile }, 'Yenile') },
    '@/components/raporlar/RaporPeriyotSecici': { default: ({ onDegistir }: { onDegistir: (x: string) => void }) => React.createElement('button', { onClick: () => onDegistir('bu_yil') }, 'Yıllık test') },
    '@/lib/utils/raporUtils': { formatPuan: String }, '@/components/rehber/SayfaRehberi': { default: bos },
    '@/components/rehber/UretimVaryantlariModal': { default: bos },
    '@/components/raporlar/OgrenmeAraciPerformansi': { default: ({ detayKapsami }: { detayKapsami?: { raporRolu: string } }) => React.createElement('span', {}, 'Araç rapor rolü: ' + detayKapsami?.raporRolu) },
    '@/lib/uretici/yetenekler': { ureticiYetenegi: () => ({ acabilecegiTalepTurleri: ['urun_egitimi'] }) },
    '../utt/utt-report.module.css': { default: {} }, './yayin-raporlari.module.css': { default: {} },
    '@/components/ui/sayfa-yenile-basligi': { SayfaYenileBasligi: ({ aksiyon }: { aksiyon: React.ReactNode }) => aksiyon },
    '@/components/kontrol/SadeKontroller': {
      SadeKontrolButonu: ({ children, ...props }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => React.createElement('button', props, children),
      SadeKontrolGrubu: ({ children }: React.PropsWithChildren) => React.createElement('div', {}, children),
    },
  });
  const container = dom.document.createElement('div');
  const root = createRoot(container);
  const sec = async (etiket: string) => { const button = [...container.querySelectorAll('button')].find((b) => b.textContent === etiket); assert.ok(button); await act(async () => button.click()); };
  const cevap = (n: number) => Response.json({ success: true, data: onbellekRaporu(n) });
  const son = () => istekler[istekler.length - 1];
  const metin = () => container.textContent ?? '';
  try {
    await act(async () => root.render(React.createElement(Page)));
    assert.match(son().url, /periyot=bu_ay&rapor_rolu=tumu/);
    await act(async () => son().cevapla(cevap(100)));
    assert.match(metin(), /100 Yayın/);
    assert.match(metin(), /Sentetik Ürün 100/);
    await sec('Temsilci');
    assert.doesNotMatch(metin(), /100 Yayın/);
    assert.doesNotMatch(metin(), /Sentetik Ürün 100|Sentetik Ürün 777/);
    assert.match(son().url, /rapor_rolu=utt/);
    await act(async () => son().cevapla(cevap(10)));
    assert.match(metin(), /10 Yayın/); assert.match(metin(), /%25/); assert.match(metin(), /%75/);
    assert.match(metin(), /Sentetik Ürün 10/);
    await sec('Yıllık test');
    const geciken = son();
    await sec('Tümü');
    assert.equal(geciken.signal.aborted, true);
    const tumuYillik = son();
    await act(async () => geciken.cevapla(cevap(999)));
    assert.doesNotMatch(metin(), /999 Yayın/);
    assert.doesNotMatch(metin(), /Sentetik Ürün 999/);
    assert.equal(cache.getUretimRaporuOnbellek('bu_yil', 'p1', 'utt'), null);
    await act(async () => tumuYillik.cevapla(cevap(200)));
    await sec('Temsilci');
    assert.doesNotMatch(metin(), /200 Yayın/);
    assert.doesNotMatch(metin(), /Sentetik Ürün 200|Sentetik Ürün 888/);
    await act(async () => son().cevapla(Response.json({ success: false, hata: 'Temsilci verisi okunamadı' }, { status: 500 })));
    assert.match(metin(), /Temsilci verisi okunamadı/);
    assert.doesNotMatch(metin(), /Sentetik Ürün 200|Sentetik Ürün 888/);
    await sec('Tümü'); assert.match(metin(), /200 Yayın/);
    await sec('Temsilci'); await act(async () => son().cevapla(cevap(20)));
    assert.match(metin(), /20 Yayın/);
    assert.match(metin(), /Sentetik Ürün 20/);
    await sec('Yenile'); assert.match(son().url, /periyot=bu_yil&rapor_rolu=utt/);
    await act(async () => son().cevapla(cevap(21)));
    assert.match(metin(), /21 Yayın/);
    assert.match(metin(), /Sentetik Ürün 21/);
    await sec('Yenile');
    await act(async () => son().cevapla(Response.json({ success: false, hata: 'Sentetik yenileme hatası' }, { status: 500 })));
    assert.match(metin(), /Sentetik Ürün 21/);
    assert.doesNotMatch(metin(), /Sentetik Ürün 200|Sentetik Ürün 888/);
    await sec('BM'); assert.match(son().url, /periyot=bu_yil&rapor_rolu=bm/);
    assert.doesNotMatch(metin(), /Sentetik Ürün 21|21 Yayın/);
    await act(async () => son().cevapla(cevap(70)));
    assert.match(metin(), /70 Yayın/); assert.match(metin(), /Sentetik Ürün 70/); assert.match(metin(), /Araç rapor rolü: bm/);
    await sec('Yenile'); const gecikenBm = son(); await sec('Temsilci');
    assert.equal(gecikenBm.signal.aborted, true);
    await act(async () => gecikenBm.cevapla(cevap(999)));
    assert.doesNotMatch(metin(), /999 Yayın|Sentetik Ürün 999|Sentetik Ürün 70/);
    assert.match(metin(), /21 Yayın/); assert.match(metin(), /Araç rapor rolü: utt/);
    await sec('Tümü'); assert.match(metin(), /200 Yayın/); assert.match(metin(), /Araç rapor rolü: tumu/);
    await sec('BM'); assert.match(metin(), /70 Yayın/); assert.match(metin(), /Araç rapor rolü: bm/);
    assert.equal(cache.getUretimRaporuOnbellek('bu_yil', 'p1', 'bm')?.uretim.turler[0].adet, 70);
    assert.equal(cache.getUretimRaporuOnbellek('bu_yil', 'p1', 'utt')?.uretim.turler[0].adet, 21);
    assert.equal(cache.getUretimRaporuOnbellek('bu_yil', 'p1', 'tumu')?.uretim.turler[0].adet, 200);
    await sec('Eczacı'); assert.match(son().url, /periyot=bu_yil&rapor_rolu=eczaci/);
    assert.doesNotMatch(metin(), /Sentetik Ürün 70|70 Yayın/);
    await act(async () => son().cevapla(cevap(80)));
    assert.match(metin(), /80 Yayın/); assert.match(metin(), /Araç rapor rolü: eczaci/);
    await sec('Yenile'); const gecikenEczaci = son(); await sec('BM');
    assert.equal(gecikenEczaci.signal.aborted, true);
    await act(async () => gecikenEczaci.cevapla(cevap(998)));
    assert.doesNotMatch(metin(), /998 Yayın|Sentetik Ürün 998/); assert.match(metin(), /70 Yayın/);
    await sec('Eczacı'); assert.match(metin(), /80 Yayın/);
    assert.equal(cache.getUretimRaporuOnbellek('bu_yil', 'p1', 'eczaci')?.uretim.turler[0].adet, 80);
    assert.equal(cache.getUretimRaporuOnbellek('bu_yil', 'p1', 'bm')?.uretim.turler[0].adet, 70);
    await sec('Eczane Teknisyeni'); assert.match(son().url, /periyot=bu_yil&rapor_rolu=eczane_teknisyeni/);
    assert.doesNotMatch(metin(), /Sentetik Ürün 80|80 Yayın/);
    await act(async () => son().cevapla(cevap(90)));
    assert.match(metin(), /90 Yayın/); assert.match(metin(), /Araç rapor rolü: eczane_teknisyeni/);
    await sec('Yenile'); const gecikenTeknisyen = son(); await sec('Eczacı');
    assert.equal(gecikenTeknisyen.signal.aborted, true);
    await act(async () => gecikenTeknisyen.cevapla(cevap(997)));
    assert.doesNotMatch(metin(), /997 Yayın|Sentetik Ürün 997/); assert.match(metin(), /80 Yayın/);
    await sec('Eczane Teknisyeni'); assert.match(metin(), /90 Yayın/);
    assert.equal(cache.getUretimRaporuOnbellek('bu_yil', 'p1', 'eczane_teknisyeni')?.uretim.turler[0].adet, 90);
    assert.equal(cache.getUretimRaporuOnbellek('bu_yil', 'p1', 'eczaci')?.uretim.turler[0].adet, 80);
    await sec('Eczanem Üyesi'); assert.match(son().url, /periyot=bu_yil&rapor_rolu=eczanem/);
    assert.doesNotMatch(metin(), /Sentetik Ürün 90|90 Yayın/);
    await act(async () => son().cevapla(cevap(110)));
    assert.match(metin(), /110 Yayın/); assert.match(metin(), /Araç rapor rolü: eczanem/);
    await sec('Yenile'); const gecikenUye = son(); await sec('Eczane Teknisyeni');
    assert.equal(gecikenUye.signal.aborted, true);
    await act(async () => gecikenUye.cevapla(cevap(996)));
    assert.doesNotMatch(metin(), /996 Yayın|Sentetik Ürün 996/); assert.match(metin(), /90 Yayın/);
    await sec('Eczanem Üyesi'); assert.match(metin(), /110 Yayın/);
    assert.equal(cache.getUretimRaporuOnbellek('bu_yil', 'p1', 'eczanem')?.uretim.turler[0].adet, 110);
    assert.equal(cache.getUretimRaporuOnbellek('bu_yil', 'p1', 'eczane_teknisyeni')?.uretim.turler[0].adet, 90);
  } finally { await act(async () => root.unmount()); await dom.happyDOM.close(); }
});

for (const [ad, bas] of donemler) {
  for (const kapsam of [uretici, firma]) {
    test('BM/' + ad + '/' + kapsam.tur + ': iki kart aynı rol/dönem SQL yanıtını aktarır', async () => {
      const { db, rpcCagrilari, egitimYanitlari } = veritabani([2, 3, 5, 7]);
      const data = await rapor.getUretimData(db, kapsam, bas.toISOString(), bitis, 'bm');
      assert.deepEqual(Array.from(data.uretim.varyantlar, (v) => v.adet), [2, 3, 5, 7]);
      for (const ad of ['get_yonetici_egitim_turu_etkisi_v3', 'get_yayin_raporlari_varyant_ozeti_v1']) {
        assert.deepEqual(rpcCagrilari.find((c) => c.ad === ad)?.argumanlar, { p_yonetici_id: kapsam.raporKimligi, p_baslangic: bas.toISOString(), p_bitis: bitis, p_rapor_rolu: 'bm' });
      }
      const kaynak = egitimYanitlari.bm[0]; const konu = data.egitim_turu_etkisi[0];
      assert.equal(data.uretim.turler[0].adet, kaynak.donemde_yayina_alinan);
      for (const alan of ['donemde_yayina_alinan', 'tamamlanan_izleme', 'kazanilan_toplam', 'kaybedilen_toplam', 'net_puan'] as const) assert.equal(konu[alan], kaynak[alan]);
      assert.deepEqual(JSON.parse(JSON.stringify(konu.urun_dagilimi)), kaynak.urun_dagilimi);
    });
  }
}
for (const rol of [...URETICI_ROLLER, ...YONETICI_ROLLER, ...ADMIN_ROLLER]) {
  test('BM/' + rol + ': erişim kapsamı üç kartta kullanılan rapor kimliğini korur', async () => {
    const { db, rpcCagrilari } = veritabani([7, 11, 13, 17]); const kendi = URETICI_ROLLER.includes(rol);
    const kapsam = await rapor.uretimRaporKapsaminiCoz(db, { kullanici_id: kendi ? 'p1' : rol, firma_id: 'f1', rol });
    assert.equal(kapsam.ureticiId, kendi ? 'p1' : null);
    const data = await rapor.getUretimData(db, kapsam, ayBaslangici(simdi).toISOString(), bitis, 'bm');
    assert.deepEqual(Array.from(data.uretim.varyantlar, (v) => v.adet), [7, 11, 13, 17]);
    for (const ad of ['get_yonetici_egitim_turu_etkisi_v3', 'get_yayin_raporlari_varyant_ozeti_v1']) {
      assert.deepEqual(rpcCagrilari.find((c) => c.ad === ad)?.argumanlar, { p_yonetici_id: kapsam.raporKimligi, p_baslangic: ayBaslangici(simdi).toISOString(), p_bitis: bitis, p_rapor_rolu: 'bm' });
    }
  });
}
for (const kaynak of ['get_yayin_raporlari_varyant_ozeti_v1', 'get_yonetici_egitim_turu_etkisi_v3']) {
  test('BM/' + kaynak + ': hata olduğunda Tümü veya Temsilciye geri dönülmez', async () => {
    const { db, hatalar, rpcCagrilari } = veritabani(); hatalar.add(kaynak);
    await assert.rejects(rapor.getUretimData(db, firma, ayBaslangici(simdi).toISOString(), bitis, 'bm'), /okunamadı/);
    for (const ad of ['get_yayin_raporlari_varyant_ozeti_v1', 'get_yonetici_egitim_turu_etkisi_v3']) {
      const calls = rpcCagrilari.filter((c) => c.ad === ad); assert.equal(calls.length, 1); assert.equal(calls[0].argumanlar.p_rapor_rolu, 'bm');
    }
  });
}

for (const [ad, bas] of donemler) {
  for (const kapsam of [uretici, firma]) {
    test('Eczacı/' + ad + '/' + kapsam.tur + ': iki kart aynı rol/dönem SQL yanıtını aktarır', async () => {
      const { db, rpcCagrilari, egitimYanitlari } = veritabani([2, 3, 5, 7]);
      const data = await rapor.getUretimData(db, kapsam, bas.toISOString(), bitis, 'eczaci');
      assert.deepEqual(Array.from(data.uretim.varyantlar, (v) => v.adet), [2, 3, 5, 7]);
      for (const ad of ['get_yonetici_egitim_turu_etkisi_v3', 'get_yayin_raporlari_varyant_ozeti_v1']) {
        assert.deepEqual(rpcCagrilari.find((c) => c.ad === ad)?.argumanlar, { p_yonetici_id: kapsam.raporKimligi, p_baslangic: bas.toISOString(), p_bitis: bitis, p_rapor_rolu: 'eczaci' });
      }
      const kaynak = egitimYanitlari.eczaci[0]; const konu = data.egitim_turu_etkisi[0];
      assert.equal(data.uretim.turler[0].adet, kaynak.donemde_yayina_alinan);
      for (const alan of ['donemde_yayina_alinan', 'tamamlanan_izleme', 'kazanilan_toplam', 'kaybedilen_toplam', 'net_puan'] as const) assert.equal(konu[alan], kaynak[alan]);
      assert.deepEqual(JSON.parse(JSON.stringify(konu.urun_dagilimi)), kaynak.urun_dagilimi);
    });
  }
}
for (const rol of [...URETICI_ROLLER, ...YONETICI_ROLLER, ...ADMIN_ROLLER]) {
  test('Eczacı/' + rol + ': erişim kapsamı üç kartta kullanılan rapor kimliğini korur', async () => {
    const { db, rpcCagrilari } = veritabani([7, 11, 13, 17]); const kendi = URETICI_ROLLER.includes(rol);
    const kapsam = await rapor.uretimRaporKapsaminiCoz(db, { kullanici_id: kendi ? 'p1' : rol, firma_id: 'f1', rol });
    assert.equal(kapsam.ureticiId, kendi ? 'p1' : null);
    const data = await rapor.getUretimData(db, kapsam, ayBaslangici(simdi).toISOString(), bitis, 'eczaci');
    assert.deepEqual(Array.from(data.uretim.varyantlar, (v) => v.adet), [7, 11, 13, 17]);
    for (const ad of ['get_yonetici_egitim_turu_etkisi_v3', 'get_yayin_raporlari_varyant_ozeti_v1']) {
      assert.deepEqual(rpcCagrilari.find((c) => c.ad === ad)?.argumanlar, { p_yonetici_id: kapsam.raporKimligi, p_baslangic: ayBaslangici(simdi).toISOString(), p_bitis: bitis, p_rapor_rolu: 'eczaci' });
    }
  });
}
for (const kaynak of ['get_yayin_raporlari_varyant_ozeti_v1', 'get_yonetici_egitim_turu_etkisi_v3']) {
  test('Eczacı/' + kaynak + ': hata olduğunda Tümü veya Temsilciye geri dönülmez', async () => {
    const { db, hatalar, rpcCagrilari } = veritabani(); hatalar.add(kaynak);
    await assert.rejects(rapor.getUretimData(db, firma, ayBaslangici(simdi).toISOString(), bitis, 'eczaci'), /okunamadı/);
    for (const ad of ['get_yayin_raporlari_varyant_ozeti_v1', 'get_yonetici_egitim_turu_etkisi_v3']) {
      const calls = rpcCagrilari.filter((c) => c.ad === ad); assert.equal(calls.length, 1); assert.equal(calls[0].argumanlar.p_rapor_rolu, 'eczaci');
    }
  });
}

for (const [ad, bas] of donemler) {
  for (const kapsam of [uretici, firma]) {
    test('Eczane Teknisyeni/' + ad + '/' + kapsam.tur + ': iki kart aynı rol/dönem SQL yanıtını aktarır', async () => {
      const { db, rpcCagrilari, egitimYanitlari } = veritabani([2, 3, 5, 7]);
      const data = await rapor.getUretimData(db, kapsam, bas.toISOString(), bitis, 'eczane_teknisyeni');
      assert.deepEqual(Array.from(data.uretim.varyantlar, (v) => v.adet), [2, 3, 5, 7]);
      for (const ad of ['get_yonetici_egitim_turu_etkisi_v3', 'get_yayin_raporlari_varyant_ozeti_v1']) {
        assert.deepEqual(rpcCagrilari.find((c) => c.ad === ad)?.argumanlar, { p_yonetici_id: kapsam.raporKimligi, p_baslangic: bas.toISOString(), p_bitis: bitis, p_rapor_rolu: 'eczane_teknisyeni' });
      }
      const kaynak = egitimYanitlari.eczane_teknisyeni[0]; const konu = data.egitim_turu_etkisi[0];
      assert.equal(data.uretim.turler[0].adet, kaynak.donemde_yayina_alinan);
      for (const alan of ['donemde_yayina_alinan', 'tamamlanan_izleme', 'kazanilan_toplam', 'kaybedilen_toplam', 'net_puan'] as const) assert.equal(konu[alan], kaynak[alan]);
      assert.deepEqual(JSON.parse(JSON.stringify(konu.urun_dagilimi)), kaynak.urun_dagilimi);
    });
  }
}
for (const rol of [...URETICI_ROLLER, ...YONETICI_ROLLER, ...ADMIN_ROLLER]) {
  test('Eczane Teknisyeni/' + rol + ': erişim kapsamı üç kartta kullanılan rapor kimliğini korur', async () => {
    const { db, rpcCagrilari } = veritabani([7, 11, 13, 17]); const kendi = URETICI_ROLLER.includes(rol);
    const kapsam = await rapor.uretimRaporKapsaminiCoz(db, { kullanici_id: kendi ? 'p1' : rol, firma_id: 'f1', rol });
    assert.equal(kapsam.ureticiId, kendi ? 'p1' : null);
    const data = await rapor.getUretimData(db, kapsam, ayBaslangici(simdi).toISOString(), bitis, 'eczane_teknisyeni');
    assert.deepEqual(Array.from(data.uretim.varyantlar, (v) => v.adet), [7, 11, 13, 17]);
    for (const ad of ['get_yonetici_egitim_turu_etkisi_v3', 'get_yayin_raporlari_varyant_ozeti_v1']) {
      assert.deepEqual(rpcCagrilari.find((c) => c.ad === ad)?.argumanlar, { p_yonetici_id: kapsam.raporKimligi, p_baslangic: ayBaslangici(simdi).toISOString(), p_bitis: bitis, p_rapor_rolu: 'eczane_teknisyeni' });
    }
  });
}
for (const kaynak of ['get_yayin_raporlari_varyant_ozeti_v1', 'get_yonetici_egitim_turu_etkisi_v3']) {
  test('Eczane Teknisyeni/' + kaynak + ': hata olduğunda Tümü veya Temsilciye geri dönülmez', async () => {
    const { db, hatalar, rpcCagrilari } = veritabani(); hatalar.add(kaynak);
    await assert.rejects(rapor.getUretimData(db, firma, ayBaslangici(simdi).toISOString(), bitis, 'eczane_teknisyeni'), /okunamadı/);
    for (const ad of ['get_yayin_raporlari_varyant_ozeti_v1', 'get_yonetici_egitim_turu_etkisi_v3']) {
      const calls = rpcCagrilari.filter((c) => c.ad === ad); assert.equal(calls.length, 1); assert.equal(calls[0].argumanlar.p_rapor_rolu, 'eczane_teknisyeni');
    }
  });
}

for (const [ad, bas] of donemler) {
  for (const kapsam of [uretici, firma]) {
    test('Eczanem Üyesi/' + ad + '/' + kapsam.tur + ': iki kart aynı rol/dönem SQL yanıtını aktarır', async () => {
      const { db, rpcCagrilari, egitimYanitlari } = veritabani([2, 3, 5, 7]);
      const data = await rapor.getUretimData(db, kapsam, bas.toISOString(), bitis, 'eczanem');
      assert.deepEqual(Array.from(data.uretim.varyantlar, (v) => v.adet), [2, 3, 5, 7]);
      for (const ad of ['get_yonetici_egitim_turu_etkisi_v3', 'get_yayin_raporlari_varyant_ozeti_v1']) {
        assert.deepEqual(rpcCagrilari.find((c) => c.ad === ad)?.argumanlar, { p_yonetici_id: kapsam.raporKimligi, p_baslangic: bas.toISOString(), p_bitis: bitis, p_rapor_rolu: 'eczanem' });
      }
      const kaynak = egitimYanitlari.eczanem[0]; const konu = data.egitim_turu_etkisi[0];
      assert.equal(data.uretim.turler[0].adet, kaynak.donemde_yayina_alinan);
      for (const alan of ['donemde_yayina_alinan', 'tamamlanan_izleme', 'kazanilan_toplam', 'kaybedilen_toplam', 'net_puan'] as const) assert.equal(konu[alan], kaynak[alan]);
      assert.deepEqual(JSON.parse(JSON.stringify(konu.urun_dagilimi)), kaynak.urun_dagilimi);
    });
  }
}
for (const rol of [...URETICI_ROLLER, ...YONETICI_ROLLER, ...ADMIN_ROLLER]) {
  test('Eczanem Üyesi/' + rol + ': erişim kapsamı üç kartta kullanılan rapor kimliğini korur', async () => {
    const { db, rpcCagrilari } = veritabani([7, 11, 13, 17]); const kendi = URETICI_ROLLER.includes(rol);
    const kapsam = await rapor.uretimRaporKapsaminiCoz(db, { kullanici_id: kendi ? 'p1' : rol, firma_id: 'f1', rol });
    assert.equal(kapsam.ureticiId, kendi ? 'p1' : null);
    const data = await rapor.getUretimData(db, kapsam, ayBaslangici(simdi).toISOString(), bitis, 'eczanem');
    assert.deepEqual(Array.from(data.uretim.varyantlar, (v) => v.adet), [7, 11, 13, 17]);
    for (const ad of ['get_yonetici_egitim_turu_etkisi_v3', 'get_yayin_raporlari_varyant_ozeti_v1']) {
      assert.deepEqual(rpcCagrilari.find((c) => c.ad === ad)?.argumanlar, { p_yonetici_id: kapsam.raporKimligi, p_baslangic: ayBaslangici(simdi).toISOString(), p_bitis: bitis, p_rapor_rolu: 'eczanem' });
    }
  });
}
for (const kaynak of ['get_yayin_raporlari_varyant_ozeti_v1', 'get_yonetici_egitim_turu_etkisi_v3']) {
  test('Eczanem Üyesi/' + kaynak + ': hata olduğunda Tümü veya Temsilciye geri dönülmez', async () => {
    const { db, hatalar, rpcCagrilari } = veritabani(); hatalar.add(kaynak);
    await assert.rejects(rapor.getUretimData(db, firma, ayBaslangici(simdi).toISOString(), bitis, 'eczanem'), /okunamadı/);
    for (const ad of ['get_yayin_raporlari_varyant_ozeti_v1', 'get_yonetici_egitim_turu_etkisi_v3']) {
      const calls = rpcCagrilari.filter((c) => c.ad === ad); assert.equal(calls.length, 1); assert.equal(calls[0].argumanlar.p_rapor_rolu, 'eczanem');
    }
  });
}
