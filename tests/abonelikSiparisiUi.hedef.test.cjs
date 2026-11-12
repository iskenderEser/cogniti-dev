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
  '@/lib/zaman/kontrol': { trGunu: () => '2026-11-28' },
  react: React, 'react/jsx-runtime': require('react/jsx-runtime'),
  '@/components/ui/alert-dialog': dialog, '@/components/ui/button': { Button: props => React.createElement('button', props) },
};
const calls = [];
let status = 200, resolveRequest;
const cache = new Map();
function load(path) {
  if (cache.has(path)) return cache.get(path);
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require: n => mocks[n] ?? (n.endsWith('.css') ? { default: {} } : n.startsWith('@/') ? load(n.slice(2) + '.ts') : require(n)),
    sessionStorage: win.sessionStorage, crypto: globalThis.crypto, AbortSignal, window: win, Event: win.Event,
    fetch: async (url, options) => {
      assert.equal(url, '/api/satin-alma/abonelik');
      calls.push(JSON.parse(options.body));
      if (status === 0) throw new Error('Bağlantı kesildi');
      if (status === 202) await new Promise(resolve => { resolveRequest = resolve; });
      if (status >= 400) return Response.json({ hata: status === 409 ? 'Paket bilgileri değişti.' : 'Sipariş yetkiniz yok.' }, { status });
      return Response.json({ ok: true, siparisId: '00000000-0000-4000-8000-000000000001' });
    } });
  cache.set(path, exports); return exports;
}
const Component = load('app/_components/AbonelikPaketSecimi.tsx').default;
const paketler = [
  { id: 1, ad: 'Paket 1', token: 5000, birim: 5.9, aylik: 29500 },
  { id: 7, ad: 'Paket 2', token: 10000, birim: 4.85, aylik: 48500 },
];

async function mount(rol) {
  const el = document.createElement('div');
  document.body.append(el);
  const root = createRoot(el);
  await React.act(async () => root.render(React.createElement(Component, { rol, kullaniciId: rol, paketler })));
  const button = text => [...el.querySelectorAll('button')].find(node => node.textContent === text);
  const click = async text => {
    assert.ok(button(text), text);
    await React.act(async () => button(text).click());
  };
  const select = async index => React.act(async () => el.querySelectorAll('input')[index].click());
  const close = async () => { await React.act(async () => root.unmount()); el.remove(); };
  return { el, button, click, select, close };
}

(async () => {
  const pm = await mount('pm');
  assert.equal(pm.button('Siparişi Tamamla').disabled, true);
  await pm.select(1);
  await pm.click('Siparişi Tamamla');
  assert.match(pm.el.querySelector('[role=alertdialog]').textContent, /58\.200,00 TL/);
  assert.match(pm.el.querySelector('[role=alertdialog]').textContent, /Başlangıç Kullanım Süreniz \(Abonelik başlangıç sürenize göre hesaplanır\)3 günYüklenecek Token1\.000Yüklenen Token Tutarı4\.850,00 TL/);
  status = 0;
  await pm.click('Onayla');
  assert.match(pm.el.querySelector('[role=alert]').textContent, /doğrulanamadı/);
  assert.equal(pm.el.querySelector('[role=status]').textContent, '');
  status = 202;
  const onay = pm.button('Onayla');
  await React.act(async () => { onay.click(); onay.click(); });
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0], calls[1]);
  assert.equal(calls[0].paketNo, 7);
  assert.equal(calls[0].baslangic, '2026-11-28');
  await React.act(async () => resolveRequest());
  assert.match(pm.el.querySelector('[role=status]').textContent, /Paket 2 · Kişisel Token Hesabı/);
  assert.equal(pm.el.querySelector('[role=alertdialog]'), null);
  await pm.close();

  const firma = await mount('firma_admin');
  await firma.select(0);
  await firma.click('Siparişi Tamamla');
  status = 403;
  await firma.click('Onayla');
  assert.match(firma.el.querySelector('[role=alert]').textContent, /yetkiniz yok/);
  assert.equal(firma.el.querySelector('[role=status]').textContent, '');
  status = 200;
  await firma.click('Onayla');
  assert.match(firma.el.querySelector('[role=status]').textContent, /Paket 1 · Firma Token Hesabı/);
  assert.equal(calls.at(-1).hesapTuru, 'firma_ortak');
  await firma.close();

  const gm = await mount('gm');
  await gm.select(0);
  await gm.click('Siparişi Tamamla');
  status = 409;
  await gm.click('Onayla');
  assert.equal(gm.button('Onayla').disabled, true);
  assert.equal(gm.el.querySelector('[role=status]').textContent, '');
  await gm.click('Vazgeç');
  await gm.click('Siparişi Tamamla');
  assert.match(gm.el.querySelector('[role=alert]').textContent, /Paket bilgileri değişti/);
  assert.equal(gm.button('Onayla').disabled, true);
  await gm.close();

  for (const rol of ['tm', 'admin']) {
    const kapali = await mount(rol);
    assert.equal(kapali.button('Siparişi Tamamla'), undefined);
    await kapali.close();
  }
  await win.happyDOM.close();
  console.log('Paket ve hesap sonucu, fiyat değişikliği, yetki reddi, çift tıklama ve aynı anahtarla tekrar kontrolleri geçti.');
})().catch(error => { console.error(error); process.exitCode = 1; });
