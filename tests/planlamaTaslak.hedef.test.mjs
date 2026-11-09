import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { Window } from 'happy-dom';
import ts from 'typescript';
import * as jsxRuntime from 'react/jsx-runtime';
const win = new Window({ url: 'http://localhost:3000/planlama-araci' });
for (const k of ['window', 'document', 'navigator']) Object.defineProperty(globalThis, k, { configurable: true, value: win[k] });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const html = JSON.parse(fs.readFileSync('app/planlama-araci/icerik.json', 'utf8'));
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
const priceData = {
 surum:1,
 sm2:JSON.parse(fs.readFileSync('tests/fixtures/esnekPaket20261109.json','utf8')).map(h=>({...h,katsayi:h.birim_fiyat/9.9})),
 paketler:[{ad:'Paket 1',token:5000,birim:5.9,aylik:29500},{ad:'Paket 2',token:10000,birim:4.85,aylik:48500},{ad:'Paket 3',token:15000,birim:3.9,aylik:58500},{ad:'Paket 4',token:25000,birim:2.9,aylik:72500}],
 kko:{limit:1500,birim:9.9},
};
function loadPriceModule(file) {
 const result={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
 {exports:result,require:n=>loadPriceModule('lib/fiyat/'+n.replace('./','')+'.ts')});
 return result;
}
const mocks = {
  '@/lib/fiyat/planlama':loadPriceModule('lib/fiyat/planlama.ts'),
  react: React, 'react/jsx-runtime': jsxRuntime,
  'next/navigation': { useRouter: () => ({ replace() {} }) },
  '@/app/providers/AuthProvider': { useAuth: () => ({ kullanici: null, cikisYap: async () => {} }) },
  '@/components/panel/PanelNavbar': { default: () => null },
  '@/lib/panel/baslangic': { panelBaslangici: () => ({ yol: '/admin' }) },
};
let storageFails = false, priceFails = false;
const priceRequests=[];
const storageBridge = {
  getItem: k => win.localStorage.getItem(k),
  setItem: (k, v) => { if (storageFails) throw new Error('Depolama kapalı'); win.localStorage.setItem(k, v); },
};
const exportsObj = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/_components/UyePlanlama.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: exportsObj, require: n => { assert.ok(n in mocks, n); return mocks[n]; }, window: win, localStorage: storageBridge, AbortController, fetch: async(url)=>{priceRequests.push(url);return Response.json(priceFails?{}:priceData);} });
const Planlama = exportsObj.default;
const key = id => `cogniti:planlama:${id}:v1`;
let child;
function attach(container, announce = true) {
  const iframe = container.querySelector('iframe');
  const peer = iframe.contentWindow;
  const docWin = new Window();
  docWin.document.write(html.replace(/<script>[\s\S]*?<\/script>/g, ''));
  const handlers = {};
  const queue = [];
  const parent = { postMessage: data => queue.push(() => win.dispatchEvent(new win.MessageEvent('message', { source: peer, data }))) };
  peer.postMessage = data => queue.push(() => handlers.message?.({ source: parent, data }));
  vm.runInNewContext(script, { document: docWin.document, window: { parent, addEventListener: (type, fn) => { handlers[type] = fn; } }, Intl });
  if (!announce) queue.length = 0;
  return {
    doc: docWin.document,
    async flush() { await React.act(async () => { while (queue.length) queue.shift()(); }); },
    change(id, value) {
      const input = docWin.document.getElementById(id);
      if (input.type === 'checkbox') { input.checked = value; input.dispatchEvent(new docWin.Event('change', { bubbles: true })); }
      else { input.value = String(value); input.dispatchEvent(new docWin.Event('input', { bubbles: true })); }
    },
    close: () => docWin.happyDOM.close(),
  };
}
async function mount(id, early = false, rol = 'admin') {
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  function Host() {
    React.useLayoutEffect(() => { if (early) child = attach(container, false); }, []);
    return React.createElement(Planlama, { rol, kullaniciId: id, icerik: html });
  }
  await React.act(async () => root.render(React.createElement(Host)));
  if (!early) child = attach(container);
  const current = child;
  assert.equal(current.doc.getElementById('cevaplar').disabled, true);
  await current.flush();
  assert.equal(current.doc.getElementById('cevaplar').disabled, false);
  return { ...current, container, async unmount() { await React.act(async () => root.unmount()); container.remove(); await current.close(); } };
}

test('Planlama cevapları: geç/erken iframe, refresh, hesap ayrımı, hepsini sil ve kayıt hatası', async t => {
  win.localStorage.clear();
  let form;
  await t.test('iframe üst sayfadan sonra hazır olur; kimlik contexti beklenmeden kaydeder', async () => {
    form = await mount('hesap-a');
    for (const [id, value] of Object.entries({ tAudience: 100, tPublications: 2, tRecommendationAudience: 50, tRecommendations: 4 })) form.change(id, value);
    for (const k of ['c', 'e', 'm']) form.change('on-' + k, false);
    await form.flush();
    assert.equal(form.doc.getElementById('monthlyTokens').textContent, '400');
    assert.equal(JSON.parse(win.localStorage.getItem(key('hesap-a'))).values.tAudience, '100');
    await form.unmount();
  });
  await t.test('refresh: erken hazır mesajı kaçsa da kayıtlı cevaplar ve seçimler geri gelir', async () => {
    form = await mount('hesap-a', true);
    assert.equal(form.doc.getElementById('tAudience').value, '100');
    assert.equal(form.doc.getElementById('on-c').checked, false);
    assert.equal(form.doc.getElementById('monthlyTokens').textContent, '400');
    // Yinelenen onLoad/StrictMode el sıkışması yeni girdiyi eski taslakla ezmemeli.
    form.change('tAudience', 120);
    await form.flush();
    const iframe = form.container.querySelector('iframe');
    const props = iframe[Object.keys(iframe).find(k => k.startsWith('__reactProps'))];
    await React.act(async () => props.onLoad());
    await form.flush();
    assert.equal(form.doc.getElementById('tAudience').value, '120');
    form.change('tAudience', 130); await form.flush();
    assert.equal(JSON.parse(win.localStorage.getItem(key('hesap-a'))).values.tAudience, '130');
    await form.unmount();
  });
  await t.test('farklı hesap önceki hesabın cevaplarını okumaz veya silmez', async () => {
    form = await mount('hesap-b');
    assert.equal(form.doc.getElementById('tAudience').value, '');
    form.change('tAudience', 5); await form.flush();
    assert.equal(JSON.parse(win.localStorage.getItem(key('hesap-a'))).values.tAudience, '130');
    assert.equal(JSON.parse(win.localStorage.getItem(key('hesap-b'))).values.tAudience, '5');
    await form.unmount();
  });
  await t.test('Hepsini sil cevapları ve taslağı boşaltır; refresh sonrası boş kalır', async () => {
    form = await mount('hesap-a');
    const button = form.doc.getElementById('calculateAll');
    assert.equal(button.textContent, 'Hepsini sil');
    button.click(); await form.flush();
    const draft = JSON.parse(win.localStorage.getItem(key('hesap-a')));
    assert.ok(Object.values(draft.values).every(v => v === ''));
    assert.ok(Object.values(draft.switches).every(v => v === true));
    await form.unmount();
    form = await mount('hesap-a');
    assert.equal(form.doc.getElementById('tAudience').value, '');
    assert.equal(form.doc.getElementById('monthlyTokens').textContent, '—');
    assert.equal(JSON.parse(win.localStorage.getItem(key('hesap-b'))).values.tAudience, '5');
    await form.unmount();
  });
  await t.test('depolama hatası görünür; tekrar kayıt başarılı olunca uyarı kalkar', async () => {
    form = await mount('hesap-a');
    const storage = win.localStorage;
    storageFails = true;
    try {
      form.change('tAudience', 20); await form.flush();
      assert.match(form.container.textContent, /Cevaplar kaydedilemedi/);
    } finally { storageFails = false; }
    form.change('tAudience', 21); await form.flush();
    assert.doesNotMatch(form.container.textContent, /Cevaplar kaydedilemedi/);
    assert.equal(JSON.parse(storage.getItem(key('hesap-a'))).values.tAudience, '21');
    await form.unmount();
  });
  await t.test('partner fiyat API yolu ve fiyat hatasında yeniden deneme cevapları korur', async () => {
    priceFails=true;
    form=await mount('partner-fiyat',false,'partner');
    assert.equal(priceRequests.at(-1),'/partner/api/fiyatlar');
    assert.match(form.container.textContent,/Güncel fiyatlar okunamadı/);
    for(const [id,value] of Object.entries({tAudience:1,tPublications:6500,tRecommendationAudience:0,tRecommendations:0}))form.change(id,value);
    for(const k of ['c','e','m'])form.change('on-'+k,false);
    await form.flush();
    assert.equal(form.doc.getElementById('recommendedPackage').textContent,'');
    priceFails=false;
    const button=form.container.querySelector('button');
    const props=button[Object.keys(button).find(k=>k.startsWith('__reactProps'))];
    await React.act(async()=>props.onClick());await form.flush();
    assert.equal(form.doc.getElementById('tPublications').value,'6500');
    assert.equal(form.doc.getElementById('recommendedPackage').textContent,'44.915,00 TL');
    assert.equal(JSON.parse(win.localStorage.getItem(key('partner-fiyat'))).values.tPublications,'6500');
    await form.unmount();
  });
  await win.happyDOM.close();
});
