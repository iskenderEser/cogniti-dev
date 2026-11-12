/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const { Window } = require('happy-dom');
const win = new Window({ url: 'http://localhost/yayin-takip' });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'Element', 'Node', 'NodeFilter', 'MutationObserver', 'CustomEvent', 'getComputedStyle']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: key === 'getComputedStyle' ? win.getComputedStyle.bind(win) : win[key] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = require('react'), { createRoot } = require('react-dom/client'), ts = require('typescript');
const bos = { paket: null, toplam: 0, kullanilan: 0, kalan: 0, suresi_dolan: 0, ayrilan: 0 };
let payload = { kisisel: null, firma_ortak: bos }, fail = false;
const cache = new Map();
function load(path) {
  if (cache.has(path)) return cache.get(path);
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
  } }).outputText, { exports, window, AbortController, Error, fetch: async () => Response.json(payload, { status: fail ? 503 : 200 }),
    require: name => {
      const mocks = {
        react: React, 'react/jsx-runtime': require('react/jsx-runtime'), 'radix-ui': require('radix-ui'),
        'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
        'lucide-react': { ArrowUpRight: () => null },
        '@/app/providers/AuthProvider': { useAuth: () => ({ kullanici: { id: 'merve', ad: 'Merve' } }) },
        '@/components/ui/button': { Button: props => React.createElement('button', props) },
        '@/components/ui/alert-dialog': { AlertDialogHeader: props => React.createElement('div', props), AlertDialogFooter: props => React.createElement('div', props) },
        '@/components/panel/TokenBakiyeOzeti': { TOKEN_BAKIYE_YENILE_OLAYI: 'cogniti-token-bakiye-yenile' },
        '@/lib/utils/roller': { TUM_ROLLER: [] },
      };
      return mocks[name] ?? (name.startsWith('@/') ? load(name.slice(2) + '.ts') : assert.fail(name));
    },
  });
  cache.set(path, exports); return exports;
}
const Gate = load('components/token/YeniYayinHesapKapisi.tsx').default;
(async () => {
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  await React.act(async () => root.render(React.createElement(React.Fragment, null,
    React.createElement('a', { href: '/ana-sayfa', id: 'menu' }, 'Ana Sayfa'),
    React.createElement(Gate, null, React.createElement('input', { 'aria-label': 'Yayın konusu' })),
  )));
  assert.ok(host.querySelector('[role=dialog]'));
  assert.ok(host.textContent.includes('Merhaba Merve,'));
  assert.ok(host.textContent.includes('Yeni yayın oluşturmak için kullanım paketlerini ve fiyatlarını görebilir, kolaylıkla sipariş verebilirsin.'));
  assert.equal(host.querySelector('[role=dialog] a').getAttribute('href'), '/fiyatlar');
  assert.ok(host.querySelector('[inert]'));
  assert.equal(host.querySelector('#menu').closest('[inert],[aria-hidden=true]'), null);
  const hesap = { ...bos, paket: 'esnek', toplam: 2500, kalan: 2500 };
  payload = { kisisel: null, firma_ortak: hesap };
  await React.act(async () => window.dispatchEvent(new win.Event('cogniti-token-bakiye-yenile')));
  assert.equal(host.querySelector('[role=dialog]'), null);
  assert.equal(host.querySelector('[inert]'), null);
  fail = true;
  await React.act(async () => window.dispatchEvent(new win.Event('cogniti-token-bakiye-yenile')));
  assert.ok(host.textContent.includes('Token hesabınız kontrol edilemedi.'));
  assert.ok(host.querySelector('[inert]'));
  fail = false; payload = { kisisel: null, firma_ortak: bos };
  const render = etkin => React.createElement(Gate, { etkin }, React.createElement('input', { 'aria-label': 'Yayın konusu' }));
  await React.act(async () => root.render(render(false)));
  assert.equal(host.querySelector('[role=dialog]'), null);
  assert.equal(host.querySelector('[inert]'), null);
  const input = host.querySelector('input');
  input.value = 'Korunan form';
  await React.act(async () => root.render(render(true)));
  assert.ok(host.querySelector('[role=dialog]'));
  assert.equal(host.querySelector('input'), input);
  assert.equal(input.value, 'Korunan form');
  await React.act(async () => root.render(render(false)));
  assert.equal(host.querySelector('[role=dialog]'), null);
  await React.act(async () => root.unmount());
  await win.happyDOM.close();
  console.log('Geçti: kişisel hitap, paket bağlantısı, hesapsız form kilidi, firma hesabıyla erişim, menü erişimi ve okuma hatası.');
})().catch(error => { console.error(error); process.exitCode = 1; });
