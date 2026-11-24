/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict'), ts = require('typescript');
const { Window } = require('happy-dom');
const win = new Window({ url: 'http://localhost/fiyatlar' });
for (const k of ['window', 'document', 'navigator']) Object.defineProperty(globalThis, k, { configurable: true, value: win[k] });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = require('react'), { createRoot } = require('react-dom/client');
const context = React.createContext(null);
const div = ({ children, ...props }) => React.createElement('div', props, children);
const dialog = {
  AlertDialog: ({ open, onOpenChange, children }) => React.createElement(context.Provider, { value: { open, onOpenChange } }, children),
  AlertDialogTrigger: ({ children }) => {
    const c = React.useContext(context);
    return React.cloneElement(children, { onClick: () => c.onOpenChange(true) });
  },
  AlertDialogContent: ({ children }) => React.useContext(context).open ? React.createElement('section', { role: 'alertdialog' }, children) : null,
  AlertDialogCancel: ({ children }) => {
    const c = React.useContext(context);
    return React.createElement('button', { onClick: () => c.onOpenChange(false) }, children);
  },
  AlertDialogHeader: div, AlertDialogFooter: div, AlertDialogTitle: div, AlertDialogDescription: div,
};
const mocks = {
  react: React, 'react/jsx-runtime': require('react/jsx-runtime'),
  '@/components/ui/alert-dialog': dialog, '@/components/ui/button': { Button: props => React.createElement('button', props) },
};
let calls = [], mode = 'ok', resolveRequest;
const cache = new Map();
function load(path) {
  if (cache.has(path)) return cache.get(path);
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require: n => mocks[n] ?? (n.startsWith('@/') ? load(fs.existsSync(n.slice(2) + '.ts') ? n.slice(2) + '.ts' : n.slice(2) + '.tsx') : require(n)),
    sessionStorage: win.sessionStorage, crypto: globalThis.crypto, AbortSignal, window: win, Event: win.Event, setTimeout, clearTimeout,
    fetch: async (url, options) => { calls.push({ url, body: JSON.parse(options.body) }); if (mode === 'lost') throw Error('network'); if (mode === 'wait') await new Promise(r => resolveRequest = r); if (mode === 'conflict') return Response.json({hata:'Kullanılabilir paket tokenı varken KKÖ seçilemez.'},{status:409}); return Response.json({ok:true,hesapId:'00000000-0000-4000-8000-000000000001'}); } });
  cache.set(path, exports); return exports;
}
const Component = load('components/satinAlma/KkoSecimModali.tsx').default;
const { URETICI_ROLLER, YONETICI_ROLLER, TUM_ROLLER } = load('lib/utils/roller.ts');
let passed = 0;
const ok = value => { assert.ok(value); passed++; };
async function mount(rol, kullaniciId = 'test-user') {
  const el = document.createElement('div'); document.body.append(el); const root = createRoot(el);
  const render = async (r, id = kullaniciId) => React.act(async () => root.render(React.createElement(Component, { rol: r, kullaniciId: id })));
  await render(rol);
  return { el, render, close: async () => { await React.act(async () => root.unmount()); el.remove(); } };
}
async function click(s, text) {
  await React.act(async () => {
    const button = [...s.el.querySelectorAll('button')].find(b => b.textContent === text);
    assert.ok(button, text); button.click();
  });
}
(async () => {
  const allowed = [...URETICI_ROLLER, ...YONETICI_ROLLER, 'firma_admin'];
  for (const rol of [...TUM_ROLLER.filter(r => !allowed.includes(r)), 'partner', 'eczaci', 'eczane_teknisyeni', 'musteri', 'bilinmeyen']) {
    const s = await mount(rol); ok(!s.el.querySelector('button')); await s.close();
  }
  for (const rol of allowed) {
    const s = await mount(rol);
    ok(!s.el.querySelector('[role=alertdialog]')); await click(s, 'Siparişi Tamamla');
    ok(s.el.querySelector('[role=alertdialog]'));
    ok(s.el.textContent.includes(URETICI_ROLLER.includes(rol) ? 'Kişisel Token Hesabı' : 'Firma Token Hesabı'));
    for (const text of ['1.500 token', '9,90 TL', 'Kullandığınız token miktarı ay sonunda faturalanır.', 'sonraki aya devretmez', 'KDV hariçtir']) ok(s.el.textContent.includes(text));
    const approve = [...s.el.querySelectorAll('button')].find(b => b.textContent === 'Onayla');
    ok(!approve.disabled);
    await click(s, 'Onayla'); ok(!s.el.querySelector('[role=alertdialog]'));
    ok(s.el.textContent.includes(URETICI_ROLLER.includes(rol) ? 'Kullandığın Kadar Öde (KKÖ) paketi kişisel hesabınız için tanımlandı.' : 'Kullandığın Kadar Öde (KKÖ) paketi firma ortak hesabı için tanımlandı.'));
    ok(calls.at(-1).body.hesapTuru === (URETICI_ROLLER.includes(rol) ? 'kisisel' : 'firma_ortak'));
    await click(s, 'Siparişi Tamamla'); await click(s, 'Vazgeç'); ok(!s.el.querySelector('[role=alertdialog]'));
    await s.close();
  }
  let s = await mount('pm', ''); ok(!s.el.querySelector('button')); await s.close();
  s = await mount('pm'); await click(s, 'Siparişi Tamamla');
  await s.render('gm'); ok(!s.el.querySelector('[role=alertdialog]'));
  await click(s, 'Siparişi Tamamla'); ok(s.el.textContent.includes('Firma Token Hesabı'));
  await s.render('gm', 'different-user'); ok(!s.el.querySelector('[role=alertdialog]'));
  await s.close();
  mode='lost'; s=await mount('pm'); await click(s,'Siparişi Tamamla'); await click(s,'Onayla'); const old=calls.at(-1).body; ok(s.el.textContent.includes('sonucu doğrulanamadı')); await s.close();
  mode='ok'; s=await mount('pm'); await click(s,'Siparişi Tamamla'); await click(s,'Onayla'); assert.deepEqual(calls.at(-1).body,old); passed++; ok(win.sessionStorage.length===0); await s.close();
  mode='conflict';s=await mount('pm');await click(s,'Siparişi Tamamla');await click(s,'Onayla');ok(s.el.textContent.includes('KKÖ seçilemez'));ok(win.sessionStorage.length===0);await s.close();
  mode='wait';s=await mount('pm');await click(s,'Siparişi Tamamla');const before=calls.length;
  await React.act(async()=>{const b=[...s.el.querySelectorAll('button')].find(b=>b.textContent==='Onayla');b.click();b.click();});ok(calls.length===before+1);await React.act(async()=>resolveRequest());await s.close();
  const page = fs.readFileSync('app/_components/FiyatlarIcerigi.tsx', 'utf8');
  ok(page.indexOf('<KkoSecimModali') > page.indexOf('className={styles.kkoSagAlan}'));
  ok(page.indexOf('<KkoSecimModali') < page.indexOf('aria-labelledby="esnek-baslik"'));
  await win.happyDOM.close();
  console.log(JSON.stringify({ passed, scope: 'Gerçek React bileşeni, sahte ortak modal kabuğu; tüm roller, içerik, hesap ayrımı, açma/kapatma, kimlik değişimi, kayıt, kayıp yanıt/idempotency, çift tıklama, 409' }));
})().catch(error => { console.error(error); process.exitCode = 1; });
