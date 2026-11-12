/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path'), assert = require('node:assert/strict');
const { Window } = require('happy-dom');
const win = new Window({ url: 'http://localhost/admin' });
for (const k of ['window', 'document', 'navigator']) Object.defineProperty(globalThis, k, { configurable: true, value: win[k] });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = require('react'), { createRoot } = require('react-dom/client'), ts = require('typescript');
const id = n => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const ortak = { siparis_tarihi: '2026-11-10T09:55:00Z', satin_alan_ad_soyad: 'Merve Duran', bakiye_turu: 'kisisel' };
const rows = [
 { ...ortak, kayit_id: id(10), paket_turu: 'esnek', token_adedi: 2500, birim_fiyat: 5.5, toplam_tutar: 13750, kdv: 2750 },
 { ...ortak, kayit_id: id(11), paket_turu: 'abonelik_baslangic', token_adedi: 167, birim_fiyat: 5.9, toplam_tutar: 983.33, kdv: 196.67 },
 { ...ortak, kayit_id: id(12), paket_turu: 'abonelik_devam', token_adedi: 5000, birim_fiyat: 5.9, toplam_tutar: 29500, kdv: 5900 },
];
let mode = 'normal', extra = false, calls = [];
const cache = new Map();
function load(file) {
 if (cache.has(file)) return cache.get(file);
 const exports = {};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
  module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
 } }).outputText, { exports, window, Date, Intl, URLSearchParams, AbortController, Error,
  fetch: async url => {
   calls.push(url); const q = new URL(url, 'http://localhost').searchParams;
   if (mode === 'error') return Response.json({}, { status: 503 });
   const paket = q.get('paket'), sayfa = Number(q.get('sayfa'));
   let siparisler = rows.filter(r => paket === 'esnek' ? r.paket_turu === 'esnek' : r.paket_turu.startsWith('abonelik_'));
   if (extra && paket === 'esnek') siparisler.push({ ...rows[0], kayit_id: id(15) });
   if (mode === 'empty') siparisler = [];
   return Response.json({ firma_id: mode === 'foreign' ? id(2) : id(1), siparisler, toplam: mode === 'paged' ? 21 : siparisler.length, sayfa, sayfa_boyutu: 20 });
  },
  require: name => {
   if (name === 'react') return React;
   if (name === 'react/jsx-runtime') return require(name);
   if (name === '@/components/ui/button') return { Button: p => React.createElement('button', p) };
   if (name === './EsnekPaketAlimlari') return { default: () => null };
   if (name === './MobilUyumluTablo') return { default: ({ children, basliklar, ...props }) => { assert.ok(Array.isArray(basliklar)); return React.createElement('table', props, children); } };
   if (name.endsWith('.css')) return { default: {} };
   if (name.startsWith('@/')) return load(name.slice(2) + '.ts');
   if (name.startsWith('.')) return load(path.join(path.dirname(file), name) + '.tsx');
   assert.fail(name);
  },
 });
 cache.set(file, exports); return exports;
}
const Page = load('app/admin/_components/FirmaFaturalari.tsx').default;
async function mount(paket) {
 const host = document.createElement('div'); document.body.append(host);
 const root = createRoot(host);
 await React.act(async () => root.render(React.createElement(Page, { firmaId: id(1), proforma: true, kalem: paket })));
 return { host, close: async () => { await React.act(async () => root.unmount()); host.remove(); } };
}
async function click(s, name) {
 await React.act(async () => [...s.host.querySelectorAll('button')].find(b => b.textContent === name).click());
}
(async () => {
 let s = await mount('abonelik');
 assert.ok(s.host.textContent.includes('Abonelik Başlangıç'));
 assert.ok(s.host.textContent.includes('Abonelik Devam'));
 assert.ok(!s.host.textContent.includes('Esnek Paket'));
 assert.ok(s.host.textContent.includes('1.180,00 TL'));
 assert.ok(s.host.textContent.includes('35.400,00 TL'));
 await click(s, 'Detay');
 assert.ok(s.host.textContent.includes('983,33 TL'));
 assert.ok(s.host.textContent.includes('196,67 TL'));
 await s.close();
 mode = 'paged'; s = await mount('abonelik');
 await click(s, 'Sonraki');
 assert.ok(calls.at(-1).includes('paket=abonelik&sayfa=1'));
 assert.ok(s.host.textContent.includes('Sayfa 2 / 2'));
 await s.close();
 mode = 'empty'; s = await mount('abonelik');
 assert.ok(s.host.textContent.includes('Henüz proformaya yansıyacak'));
 await s.close();
 for (mode of ['error', 'foreign']) {
  s = await mount('abonelik'); assert.ok(s.host.querySelector('[role=alert]'));
  assert.ok(!s.host.textContent.includes('Merve Duran')); await s.close();
 }
 await win.happyDOM.close();
 console.log('Geçti: Esnek/Abonelik proforma bağlantısı, ilk dönem tutarı, KDV, hesap, tekil referans, otomatik yeniden okuma, sayfalama, boş/hata ve firma izolasyonu.');
})().catch(e => { console.error(e); process.exitCode = 1; });
