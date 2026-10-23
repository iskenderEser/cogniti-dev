// SQL RPC bağlantısı ve React davranışı. DB hesabı çalıştırılmaz; SQL yanıtları sentetiktir.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import React, { act } from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import { Window } from 'happy-dom';
import ts from 'typescript';
import type { SupabaseClient } from '@supabase/supabase-js';
import * as roller from '@/lib/utils/roller';
import * as yetenekler from '@/lib/uretici/yetenekler';
import type { AracTuruRaporSatiri } from '@/lib/rapor/paylasilan/aracTuruDagilimi';

function yukle<T>(dosya: string, modules: Record<string, unknown> = {}, globals: Record<string, unknown> = {}): T {
  const exports = {};
  const code = ts.transpileModule(readFileSync(dosya, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, URL, URLSearchParams, AbortController, DOMException, ...globals,
    require: (id: string) => { assert.ok(id in modules, `${dosya}: ${id}`); return modules[id]; } });
  return exports as T;
}
const ortak = yukle<typeof import('@/lib/rapor/paylasilan/aracTuruDagilimi')>('lib/rapor/paylasilan/aracTuruDagilimi.ts');
const kapsamModulu = yukle<typeof import('@/lib/rapor/uretim/getUretimData')>('lib/rapor/uretim/getUretimData.ts', {
  './getTemsilciVaryantOzeti': {}, '@/lib/utils/roller': roller, '@/lib/uretici/yetenekler': yetenekler,
});
const plain = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const turler = ['video', 'podcast', 'gorsel', 'flip_pdf'] as const;
const baslangic = '2026-10-01T00:00:00.000Z', bitis = '2026-10-22T12:00:00.000Z';
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
type Fixture = { anahtar: string; kapsam: { raporKimligi: string }; aralik: { baslangic: string; bitis: string }; araclar: AracTuruRaporSatiri[]; kart_metni: string };
const referans: Fixture[] = JSON.parse(readFileSync('tests/fixtures/yayin-arac-performansi-tumu.json', 'utf8'));
const bos = () => null;
const metrik = (kart: Element, alan: string) => kart.querySelector('[data-metrik="' + alan + '"]')!.textContent;
const tuketimSatirlari = (rows: AracTuruRaporSatiri[]) => rows.map((r) => ({
  arac_turu: r.arac_turu, toplam_yayin_sayisi: r.toplam_yayin_sayisi ?? r.yayin_sayisi,
  baslatma: r.baslatma, tamamlama: r.tamamlama,
  tamamlama_orani: r.baslatma > 0 ? Math.min(100, Math.round(100 * r.tamamlama / r.baslatma)) : null,
}));
const potansiyelSatirlari = (rows: AracTuruRaporSatiri[]) => rows.map((r) => ({ arac_turu: r.arac_turu, potansiyel_puan: r.potansiyel_puan ?? r.kayitli_arac_puani }));
function kartModulu(fetchMock?: typeof fetch) {
  return yukle<typeof import('@/components/raporlar/OgrenmeAraciPerformansi')>('components/raporlar/OgrenmeAraciPerformansi.tsx', {
    react: React, 'react/jsx-runtime': jsxRuntime, 'next/link': { default: bos },
    '@/app/providers/AuthProvider': { useAuth: () => ({ kullanici: { id: 'pm', rol: 'pm' } }) },
    '@/lib/utils/roller': roller,
    'lucide-react': Object.fromEntries(['Video','Headphones','Image','BookOpen','Users','Sparkles','ExternalLink','Info'].map((x) => [x, bos])),
    './YayinDetayModal': { default: bos },
    './OgrenmeAraciPerformansi.module.css': { default: new Proxy({}, { get: (_target, key) => String(key) }) },
  }, fetchMock ? { fetch: fetchMock } : {});
}

for (const f of referans) {
  test(`${f.anahtar}: SQL yanıtının mevcut değerleri korunur, dört araç onaylı YAPKA düzeninde gösterilir`, async () => {
    const calls: Array<{ name: string; args: unknown }> = [];
    const db = { rpc: async (name: string, args: unknown) => {
      calls.push({ name, args: plain(args) });
      if (name.endsWith('tuketimi_v1')) return { data: tuketimSatirlari(f.araclar).reverse(), error: null };
      if (name.endsWith('potansiyel_puani_v1')) return { data: potansiyelSatirlari(f.araclar).reverse(), error: null };
      const rows = name.endsWith('performansi_v1') ? f.araclar.map((x) => ({ ...x, yayin_sayisi: String(x.yayin_sayisi), etkilesim_yayin_sayisi: x.yayinlar.length })).reverse()
        : f.araclar.find((x) => x.arac_turu === (args as { p_arac_turu: string }).p_arac_turu)!.yayinlar;
      return { data: rows, error: null };
    }, from: () => { throw new Error('Ham olay sorgusu açılmamalı'); } } as unknown as SupabaseClient;
    const input = { ...f.aralik, raporKimligi: f.kapsam.raporKimligi, raporRolu: 'tumu' as const };
    const result = await ortak.aracTuruDagilimi(db, input);
    for (const [i, row] of result.entries()) {
      const old = f.araclar[i];
      const oldSummary = Object.fromEntries(Object.entries(old).filter(([key]) => key !== 'yayinlar'));
      const newSummary = Object.fromEntries(Object.entries(row).filter(([key]) => !['yayinlar','etkilesim_yayin_sayisi','toplam_yayin_sayisi','tamamlama_orani','potansiyel_puan'].includes(key)));
      const { etkilesim_yayin_sayisi } = row;
      assert.deepEqual(plain(newSummary), oldSummary);
      assert.equal(etkilesim_yayin_sayisi, old.yayinlar.length);
      assert.equal(row.yayinlar.length, 0);
      const detail = await ortak.aracYayinlari(db, { ...input, aracTuru: row.arac_turu, sonYayinId: null });
      assert.deepEqual(plain(detail.yayinlar), old.yayinlar);
      row.yayinlar = detail.yayinlar;
    }
    assert.equal(calls.length, 7);
    assert.deepEqual(calls[0], { name: 'get_yayin_raporlari_arac_performansi_v1', args: {
      p_yonetici_id: input.raporKimligi, p_baslangic: input.baslangic, p_bitis: input.bitis, p_rapor_rolu: 'tumu',
    } });
    const { default: Card } = kartModulu();
    const labels: Record<string, string> = { bu_hafta: 'Bu Hafta', bu_ay: 'Bu Ay', bu_donem: 'Bu Dönem', bu_yil: 'Bu Yıl' };
    const period = Object.keys(labels).find((p) => f.anahtar.includes(p))!;
    const dom = new Window();
    try {
      dom.document.body.innerHTML = renderToStaticMarkup(React.createElement(Card, { dagilim: result, periyotBasligi: labels[period] }));
      const section = dom.document.querySelector('section')!;
      const cards = [...section.children[1].children];
      assert.equal(cards.length, 4);
      const sum = result.reduce((n, r) => n + Math.max(0, r.net_kazanilan_puan), 0);
      for (const [index, card] of cards.entries()) {
        const row = result[index];
        const points = card.querySelector('section[aria-label="Puan Katkısı"]')!;
        const num = (n: number) => n.toLocaleString('tr-TR');
        const ratio = row.baslatma > 0 ? '%' + Math.min(100, Math.round(100 * row.tamamlama / row.baslatma)) : '—';
        const share = sum > 0 && row.net_kazanilan_puan > 0 ? '%' + Math.round(100 * row.net_kazanilan_puan / sum) : '—';
        assert.deepEqual(['toplam_yayin_sayisi','baslatma','tamamlama','tamamlama_orani'].map((alan) => metrik(card, alan)), [num(row.toplam_yayin_sayisi!), num(row.baslatma), num(row.tamamlama), ratio]);
        assert.deepEqual(['potansiyel_puan','kazanilan_puan','kaybedilen_puan','net_kazanilan_puan','basari'].map((alan) => metrik(card, alan)), [num(row.potansiyel_puan!), num(row.kazanilan_puan), num(row.kaybedilen_puan), num(row.net_kazanilan_puan), share]);
        assert.equal(points.getAttribute('aria-label'), 'Puan Katkısı');
        assert.match(card.querySelector('[role="img"]')!.getAttribute('aria-label')!, /Tamamlanma oranı/);
        assert.equal(card.querySelector('.eyebrow')!.textContent, labels[period]);
        assert.doesNotMatch(card.textContent!, /Yeni Yayın|Yeni yayın puanı|Oluşan Puan/);
      }
      assert.equal(section.querySelectorAll('details').length, 4);
    } finally { await dom.happyDOM.close(); }
  });
}

test('SQL neti ve başarı yüzdesi uygulamada yeniden hesaplanmaz; eksik/hatalı yanıt Tümü’ye dönmez', async () => {
  const original = referans[0].araclar.map((x) => ({ ...x, net_kazanilan_puan: 987, dogru_cevap_yuzdesi: 12.3 }));
  const args: unknown[] = [];
  const db = { rpc: async (_n: string, a: unknown) => { args.push(a); return _n.endsWith('tuketimi_v1') ? { data: tuketimSatirlari(original), error: null } : _n.endsWith('potansiyel_puani_v1') ? { data: potansiyelSatirlari(original), error: null } : { data: original, error: null }; } } as unknown as SupabaseClient;
  const input = { baslangic, bitis, raporKimligi: 'pm', raporRolu: 'utt' as const };
  const result = await ortak.aracTuruDagilimi(db, input);
  assert.equal(result[0].net_kazanilan_puan, 987);
  assert.equal(result[0].dogru_cevap_yuzdesi, 12.3);
  assert.equal((args[0] as { p_rapor_rolu: string }).p_rapor_rolu, 'utt');
  for (const response of [{ data: [], error: null }, { data: original, error: {} }, { data: [original[0],original[0],original[0],original[0]], error: null }]) {
    const bad = { rpc: async () => response } as unknown as SupabaseClient;
    await assert.rejects(ortak.aracTuruDagilimi(bad, input), /rapor kaynağı/);
  }
});

test('yayınlar 50’lik sayfalarla okunur; imleç, araç ve rol SQL’e aynen aktarılır', async () => {
  const calls: Array<Record<string, unknown>> = [];
  const pages = [Array.from({ length: 50 }, (_, i) => ({ yayin_id: id(i + 1), yayin_kodu: `Firma_${i}`, kazanilan_puan: '8', kaybedilen_puan: '2' })), [{ yayin_id: id(51), yayin_kodu: 'Firma_51' }], []];
  const db = { rpc: async (name: string, args: Record<string, unknown>) => { assert.equal(name, 'get_yayin_raporlari_arac_yayinlari_v1'); calls.push(args); return { data: pages.shift(), error: null }; } } as unknown as SupabaseClient;
  const input = { baslangic, bitis, raporKimligi: 'pm', raporRolu: 'utt' as const, aracTuru: 'podcast' as const };
  const first = await ortak.aracYayinlari(db, { ...input, sonYayinId: null });
  assert.equal(first.yayinlar.length, 50); assert.equal(first.sonrakiImlec, id(50));
  assert.equal(first.yayinlar[0].kazanilan_puan, 8);
  const second = await ortak.aracYayinlari(db, { ...input, sonYayinId: first.sonrakiImlec });
  assert.equal(second.yayinlar.length, 1); assert.equal(second.sonrakiImlec, null);
  assert.deepEqual(plain(await ortak.aracYayinlari(db, { ...input, sonYayinId: id(51) })), { yayinlar: [], sonrakiImlec: null });
  assert.equal(calls[1].p_son_yayin_id, id(50)); assert.equal(calls[1].p_sayfa_boyutu, 50);
  assert.equal(calls[1].p_arac_turu, 'podcast'); assert.equal(calls[1].p_rapor_rolu, 'utt');
});

function apiFixture(rol = 'pm', authenticated = true, fail = false) {
  const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
  let firstTwo = 0;
  const logged = { kullanici_id: id(1), firma_id: id(2), rol };
  const q = { select: () => q, eq: () => q, in: () => q, limit: () => q,
    single: async () => ({ data: logged }),
    maybeSingle: async () => ({ data: { kullanici_id: id(3), firma_adi: 'Sentetik Firma' } }) };
  const db = { from: () => q, rpc: async (name: string, args: Record<string, unknown>) => {
    calls.push({ name, args: plain(args) });
    if (name.endsWith('tuketimi_v1') && !fail) return { data: tuketimSatirlari(referans[0].araclar), error: null };
    if (name.endsWith('potansiyel_puani_v1') && !fail) return { data: potansiyelSatirlari(referans[0].araclar), error: null };
    return fail ? { data: null, error: {} } : { data: name.endsWith('performansi_v1') ? referans[0].araclar : [], error: null };
  } };
  const { GET } = yukle<typeof import('@/app/(panel)/raporlar/api/uretim/route')>('app/(panel)/raporlar/api/uretim/route.ts', {
    'next/server': { NextResponse: { json: Response.json } },
    '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: authenticated ? { email: 'sentetik@example.invalid' } : null } }) } }), createAdminClient: () => db },
    '@/lib/utils/hataIsle': { hataYaniti: (hata: string) => Response.json({ hata }, { status: 500 }), yetkiHatasi: () => Response.json({}, { status: 401 }), validasyonHatasi: () => Response.json({}, { status: 400 }) },
    '@/lib/utils/tarihAraligi': { tarihAraligi: () => ({ baslangic, bitis }) },
    '@/lib/rapor/uretim/getUretimData': { ...kapsamModulu, getUretimData: async () => { firstTwo++; return {}; } },
    '@/lib/rapor/paylasilan/aracTuruDagilimi': ortak,
  });
  return { GET, calls, firstTwo: () => firstTwo };
}
const request = (query: string) => new Request('http://localhost/raporlar/api/uretim?' + query);
const detailsQuery = new URLSearchParams({ arac_turu: 'video', baslangic, bitis, rapor_rolu: 'utt' }).toString();

for (const role of [...roller.URETICI_ROLLER, ...roller.YONETICI_ROLLER, ...roller.ADMIN_ROLLER]) {
  test(`${role}: özet ve dört araç detayı aynı yetkili rapor kimliğine / role bağlıdır`, async () => {
    const f = apiFixture(role);
    const reportId = roller.ADMIN_ROLLER.includes(role) ? id(3) : id(1);
    for (const reportRole of ['tumu', 'utt', 'bm', 'eczaci', 'eczane_teknisyeni', 'eczanem']) {
      const res = await f.GET(request('rapor_rolu=' + reportRole)); assert.equal(res.status, 200);
      assert.deepEqual((await res.json()).data.arac_turu_tarih_araligi, { baslangic, bitis });
      for (const tool of turler) assert.equal((await f.GET(request(detailsQuery.replace('arac_turu=video', 'arac_turu=' + tool).replace('rapor_rolu=utt', 'rapor_rolu=' + reportRole)))).status, 200);
    }
    assert.equal(f.calls.length, 42); assert.equal(f.firstTwo(), 6);
    assert.ok(f.calls.every((c) => c.args.p_yonetici_id === reportId));
    assert.ok(f.calls.every((c) => c.args.p_baslangic === baslangic && c.args.p_bitis === bitis));
    assert.deepEqual(f.calls.map((c) => c.args.p_rapor_rolu), [...Array(7).fill('tumu'), ...Array(7).fill('utt'), ...Array(7).fill('bm'), ...Array(7).fill('eczaci'), ...Array(7).fill('eczane_teknisyeni'), ...Array(7).fill('eczanem')]);
  });
}

test('API oturum/yetki, hatalı araç/imleç/tarih ve RPC hatalarını reddeder', async () => {
  for (const [role, auth] of [['pm', false], ['utt', true]] as const) {
    const f = apiFixture(role, auth); assert.equal((await f.GET(request(detailsQuery))).status, 401); assert.equal(f.calls.length, 0);
  }
  const f = apiFixture();
  for (const query of ['rapor_rolu=gecersiz', detailsQuery.replace('arac_turu=video', 'arac_turu=yanlis'), detailsQuery + '&son_yayin_id=bozuk', 'arac_turu=video', detailsQuery.replace(encodeURIComponent(bitis), encodeURIComponent('2035-01-01T00:00:00.000Z'))]) {
    assert.equal((await f.GET(request(query))).status, 400, query);
  }
  assert.equal(f.calls.length, 0);
  const bad = apiFixture('pm', true, true);
  assert.equal((await bad.GET(request('rapor_rolu=utt'))).status, 500);
  assert.equal((await bad.GET(request(detailsQuery))).status, 500);
  assert.equal(bad.calls.length, 4);
});

test('React: detay açılana kadar istek yok; dört araç, sayfalama, hata/tekrar ve eski yanıtın iptali', async () => {
  const dom = new Window();
  for (const key of ['window','document','navigator','HTMLElement','Element','Node','Event'] as const) Object.defineProperty(globalThis, key, { configurable: true, value: dom[key] });
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const { createRoot } = await import('react-dom/client');
  const requests: Array<{ url: string; signal: AbortSignal; respond: (r: Response) => void }> = [];
  const fetchMock = ((url: string, opts: { signal: AbortSignal }) => new Promise<Response>((respond) => requests.push({ url, signal: opts.signal, respond }))) as typeof fetch;
  const { default: Card } = kartModulu(fetchMock);
  const container = dom.document.createElement('div'), root = createRoot(container);
  const rows = referans[0].araclar.map((r) => ({ ...r, etkilesim_yayin_sayisi: 53, yayinlar: [] }));
  const render = (role: 'utt' | 'tumu' | 'bm' | 'eczaci' | 'eczane_teknisyeni' | 'eczanem', end = bitis) => root.render(React.createElement(Card, {
    key: role + end, dagilim: rows, detayKapsami: { baslangic, bitis: end, periyot: 'bu_ay', raporRolu: role },
  }));
  const open = async (index: number) => { await act(async () => { const el = container.querySelectorAll('details')[index]; el.open = true; el.dispatchEvent(new dom.Event('toggle')); }); };
  const answer = (list: AracTuruRaporSatiri['yayinlar'], cursor: string | null) => Response.json({ success: true, data: { yayinlar: list, sonrakiImlec: cursor } });
  const list = (start: number, n: number) => Array.from({ length: n }, (_, i) => ({ yayin_id: id(start + i), yayin_kodu: 'Sentetik_' + (start + i), talep_id: null, talep_no: start + i, kayitli_arac_puani: 0, baslatma: 2, tamamlama: 1, kazanilan_puan: 8, kaybedilen_puan: 2 }));
  const click = async (label: string) => { const b = [...container.querySelectorAll('button')].find((x) => x.textContent === label); assert.ok(b, label); await act(async () => b.click()); };
  try {
    await act(async () => render('utt')); assert.equal(requests.length, 0);
    await open(0); assert.equal(requests.length, 1); assert.match(requests[0].url, /arac_turu=video/); assert.match(requests[0].url, /rapor_rolu=utt/);
    assert.equal(new URL(requests[0].url, 'http://localhost').searchParams.get('bitis'), bitis);
    await act(async () => requests[0].respond(answer(list(1, 50), id(50))));
    assert.match(container.textContent!, /Sentetik_1/); assert.match(container.textContent!, /Sentetik_50/);
    await click('Daha fazla yayın göster'); assert.match(requests[1].url, new RegExp('son_yayin_id=' + id(50)));
    await act(async () => requests[1].respond(Response.json({ hata: 'Sentetik hata' }, { status: 500 })));
    assert.match(container.textContent!, /Sentetik hata/); assert.match(container.textContent!, /Sentetik_50/);
    await click('Tekrar dene'); await act(async () => requests[2].respond(answer(list(51, 3), null)));
    assert.match(container.textContent!, /Sentetik_53/); assert.doesNotMatch(container.textContent!, /Daha fazla yayın göster/);
    await open(1); const late = requests[3]; assert.match(late.url, /arac_turu=podcast/);
    await act(async () => render('eczanem', '2026-10-22T12:00:01.000Z')); assert.equal(late.signal.aborted, true);
    await act(async () => late.respond(answer(list(999, 1), null))); assert.doesNotMatch(container.textContent!, /Sentetik_999|Sentetik_53/);
    for (const [index, tool] of [[2,'gorsel'],[3,'flip_pdf']] as const) {
      await open(index); const req = requests[requests.length - 1]; assert.match(req.url, new RegExp('arac_turu=' + tool)); assert.match(req.url, /rapor_rolu=eczanem/);
      await act(async () => req.respond(answer(list(200 + index, 1), null)));
    }
  } finally { await act(async () => root.unmount()); await dom.happyDOM.close(); }
});

test('React: dört aracın boş özetinde sıfırlar görünür; boş detaylar için istek açılmaz', async () => {
  const dom = new Window();
  for (const key of ['window','document','navigator','HTMLElement','Element','Node','Event'] as const) Object.defineProperty(globalThis, key, { configurable: true, value: dom[key] });
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const { createRoot } = await import('react-dom/client');
  let requests = 0;
  const { default: Card } = kartModulu((async () => { requests++; throw new Error('Boş kapsam sorgulanmamalı'); }) as typeof fetch);
  const db = { rpc: async (name: string) => name.endsWith('potansiyel_puani_v1') ? { data: turler.map((arac_turu) => ({ arac_turu, potansiyel_puan: 0 })), error: null } : name.endsWith('tuketimi_v1') ? { data: turler.map((arac_turu) => ({ arac_turu, toplam_yayin_sayisi: 0, baslatma: 0, tamamlama: 0, tamamlama_orani: null })), error: null } : { data: turler.map((arac_turu) => ({ arac_turu })), error: null } } as unknown as SupabaseClient;
  const rows = await ortak.aracTuruDagilimi(db, { baslangic, bitis, raporKimligi: 'pm', raporRolu: 'utt' });
  const container = dom.document.createElement('div'), root = createRoot(container);
  try {
    await act(async () => root.render(React.createElement(Card, { dagilim: rows, detayKapsami: { baslangic, bitis, periyot: 'bu_ay', raporRolu: 'utt' } })));
    assert.doesNotMatch(container.textContent!, /Yeni Yayın/);
    assert.equal((container.textContent!.match(/Potansiyel/g) ?? []).length, 4);
    assert.equal(metrik(container.querySelector('article')!, 'toplam_yayin_sayisi'), '0');
    for (const el of container.querySelectorAll('details')) await act(async () => { el.open = true; el.dispatchEvent(new dom.Event('toggle')); });
    assert.equal(requests, 0);
    assert.equal((container.textContent!.match(/Bu dönemde etkileşim alan yayın yok/g) ?? []).length, 4);
  } finally { await act(async () => root.unmount()); await dom.happyDOM.close(); }
});


for (const reportRole of ['tumu','utt','bm','eczaci','eczane_teknisyeni','eczanem'] as const) {
  for (const scope of ['uretici','firma'] as const) {
    test(scope + '/' + reportRole + ': 1. alt kart dört dönemde yeni SQL’den gelir; puanlar ve detaylar korunur', async () => {
      for (const period of referans.filter((r) => r.anahtar.startsWith(scope + ':'))) {
        const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
        const sqlRows = turler.map((arac_turu, i) => ({
          arac_turu, toplam_yayin_sayisi: String(100 + i), baslatma: String(200 + i),
          tamamlama: String(50 + i), tamamlama_orani: i === 3 ? null : String(40 + i),
        })).reverse();
        const db = { rpc: async (name: string, args: Record<string, unknown>) => {
          calls.push({ name, args: plain(args) });
          return { data: name.endsWith('tuketimi_v1') ? sqlRows : name.endsWith('potansiyel_puani_v1') ? turler.map((arac_turu, i) => ({ arac_turu, potansiyel_puan: String(800 + i) })).reverse() : period.araclar, error: null };
        } } as unknown as SupabaseClient;
        const result = await ortak.aracTuruDagilimi(db, { ...period.aralik, raporKimligi: scope, raporRolu: reportRole });
        assert.deepEqual(plain(result.map((r) => r.toplam_yayin_sayisi)), [100,101,102,103]);
        assert.deepEqual(plain(result.map((r) => r.baslatma)), [200,201,202,203]);
        assert.deepEqual(plain(result.map((r) => r.tamamlama)), [50,51,52,53]);
        assert.deepEqual(plain(result.map((r) => r.tamamlama_orani)), [40,41,42,null]);
        assert.deepEqual(plain(result.map((r) => r.potansiyel_puan)), [800,801,802,803]);
        assert.deepEqual(calls[2], { name: 'get_yayin_raporlari_arac_potansiyel_puani_v1', args: {
          p_yonetici_id: scope, p_baslangic: period.aralik.baslangic, p_bitis: period.aralik.bitis, p_rapor_rolu: reportRole,
        } });
        assert.deepEqual(calls[1], { name: 'get_yayin_raporlari_arac_tuketimi_v1', args: {
          p_yonetici_id: scope, p_baslangic: period.aralik.baslangic, p_bitis: period.aralik.bitis, p_rapor_rolu: reportRole,
        } });
        for (const [i, row] of result.entries()) {
          assert.equal(row.yayin_sayisi, period.araclar[i].yayin_sayisi);
          assert.equal(row.kazanilan_puan, period.araclar[i].kazanilan_puan);
          assert.equal(row.kaybedilen_puan, period.araclar[i].kaybedilen_puan);
          assert.equal(row.net_kazanilan_puan, period.araclar[i].net_kazanilan_puan);
          assert.deepEqual(plain(row.roller), period.araclar[i].roller);
        }
        const { default: Card } = kartModulu();
        const dom = new Window();
        try {
          dom.document.body.innerHTML = renderToStaticMarkup(React.createElement(Card, { dagilim: result }));
          const cards = [...dom.document.querySelector('section')!.children[1].children];
          assert.deepEqual(['toplam_yayin_sayisi','baslatma','tamamlama','tamamlama_orani'].map((alan) => metrik(cards[0], alan)), ['100','200','50','%40']);
          for (const [i, card] of cards.entries()) assert.equal(metrik(card, 'potansiyel_puan'), String(800 + i));
        } finally { await dom.happyDOM.close(); }
      }
    });
  }
}

test('tüketim SQL hatası/eksik yanıtı gizlenmez; eski toplam RPC’ye veya yerel hesaba dönülmez', async () => {
  const input = { baslangic, bitis, raporKimligi: 'pm', raporRolu: 'utt' as const };
  const good = tuketimSatirlari(referans[0].araclar);
  const response = (answer: unknown) => ({ rpc: async (name: string) => {
    assert.doesNotMatch(name, /toplamlari_v1/);
    return name.endsWith('tuketimi_v1') ? answer : { data: referans[0].araclar, error: null };
  } }) as unknown as SupabaseClient;
  for (const bad of [
    ...['PGRST202','42883','42501'].map((code) => ({ data: null, error: { code } })),
    { data: [], error: null },
    { data: good.map((r) => ({ ...r, toplam_yayin_sayisi: -1 })), error: null },
    { data: good.map((r) => ({ ...r, baslatma: null })), error: null },
    { data: good.map((r) => ({ ...r, tamamlama: 1.5 })), error: null },
    { data: good.map((r) => ({ ...r, tamamlama_orani: 101 })), error: null },
    { data: good.map((r) => ({ ...r, tamamlama_orani: undefined })), error: null },
    { data: turler.map(() => good[0]), error: null },
  ]) await assert.rejects(ortak.aracTuruDagilimi(response(bad), input), /tüketim özeti/);
});


test('Potansiyel Puan SQL hataları/eksik tutarlar gizlenmez; sıfır puan sıfır olarak gösterilir', async () => {
  const input = { baslangic, bitis, raporKimligi: 'pm', raporRolu: 'utt' as const };
  const base = referans[0].araclar;
  const good = turler.map((arac_turu) => ({ arac_turu, potansiyel_puan: 0 }));
  const response = (answer: unknown) => ({ rpc: async (name: string) => {
    if (name.endsWith('potansiyel_puani_v1')) return answer;
    return { data: name.endsWith('tuketimi_v1') ? tuketimSatirlari(base) : base, error: null };
  } }) as unknown as SupabaseClient;
  for (const bad of [
    ...['PGRST202','42883','42501'].map((code) => ({ data: null, error: { code } })),
    { data: [], error: null },
    { data: good.map((r) => ({ ...r, potansiyel_puan: null })), error: null },
    { data: good.map((r) => ({ ...r, potansiyel_puan: -1 })), error: null },
    { data: good.map((r) => ({ ...r, potansiyel_puan: 1.5 })), error: null },
    { data: good.map((r) => ({ ...r, potansiyel_puan: 'bozuk' })), error: null },
    { data: good.map(() => good[0]), error: null },
  ]) await assert.rejects(ortak.aracTuruDagilimi(response(bad), input), /potansiyel puanı/);
  const rows = await ortak.aracTuruDagilimi(response({ data: good, error: null }), input);
  assert.deepEqual(plain(rows.map((r) => r.potansiyel_puan)), [0,0,0,0]);
  const { default: Card } = kartModulu();
  const dom = new Window();
  try {
    dom.document.body.innerHTML = renderToStaticMarkup(React.createElement(Card, { dagilim: rows }));
    const cards = [...dom.document.querySelector('section')!.children[1].children];
    for (const card of cards) {
      assert.equal(metrik(card, 'potansiyel_puan'), '0');
    }
  } finally { await dom.happyDOM.close(); }
});


test('Rol sayıları: dört araçta tek satırda beş grup, ikinci eczacı toplamı ve boş kayıtta sıfır', async () => {
  const rolVerisi = {
    utt: { baslatma: 80, tamamlama: 2 }, kd_utt: { baslatma: 90, tamamlama: 3 },
    bm: { baslatma: 50, tamamlama: 4 },
    eczaci: { baslatma: 40, tamamlama: 5 }, ikinci_eczaci: { baslatma: 30, tamamlama: 7 },
    yardimci_eczaci: { baslatma: 20, tamamlama: 1 },
    eczane_teknisyeni: { baslatma: 10, tamamlama: 6 },
    musteri: { baslatma: 100, tamamlama: 8 },
    yonetici: { baslatma: 200, tamamlama: 99 }, diger: { baslatma: 300, tamamlama: 99 },
  };
  const rows = referans[0].araclar.map((r, i) => ({ ...r, roller: i === 3 ? {} : rolVerisi }));
  const { default: Card } = kartModulu();
  const dom = new Window();
  try {
    dom.document.body.innerHTML = renderToStaticMarkup(React.createElement(Card, { dagilim: rows }));
    const cards = [...dom.document.querySelector('section')!.children[1].children];
    const titles = ['İzleme Sayıları','Dinleme Sayıları','İnceleme Sayıları','Okuma Sayıları'];
    for (const [i, card] of cards.entries()) {
      const area = card.querySelector('.audience')!;
      assert.equal(area.getAttribute('aria-label'), titles[i]);
      const cells = [...area.querySelectorAll('[data-rol]')];
      assert.equal(cells.length, 5);
      assert.deepEqual(cells.map((cell) => cell.getAttribute('data-rol')), ['UTT','BM','Eczacı','Ecz.Tekn.','Danışan']);
      assert.deepEqual(cells.map((cell) => cell.lastElementChild!.textContent), i === 3 ? ['0','0','0','0','0'] : ['5','4','13','6','8']);
      assert.doesNotMatch(area.textContent!, /Yönetici|Diğer|henüz tüketim kaydı/);
    }
  } finally { await dom.happyDOM.close(); }
});
