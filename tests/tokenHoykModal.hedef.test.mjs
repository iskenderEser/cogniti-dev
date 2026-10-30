import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React, { act } from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import * as icons from 'lucide-react';
import { Window } from 'happy-dom';

const dom = new Window({ url: 'http://localhost/token' });
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'NodeFilter', 'DocumentFragment', 'HTMLInputElement', 'HTMLButtonElement', 'HTMLDivElement', 'MutationObserver', 'CustomEvent', 'Event', 'KeyboardEvent', 'MouseEvent', 'PointerEvent', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) {
  Object.defineProperty(globalThis, name, { configurable: true, value: name === 'window' ? dom : typeof dom[name] === 'function' && ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame'].includes(name) ? dom[name].bind(dom) : dom[name] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const radix = await import('radix-ui');
const { createRoot } = await import('react-dom/client');
const h = React.createElement;
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const code = n => `Hepifarma_${30036 + n}`;
const modules = { react: React, 'react/jsx-runtime': jsxRuntime, 'radix-ui': radix, 'lucide-react': icons };
let fetcher;
function load(path) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  vm.runInNewContext(source, { exports, require: name => { assert(name in modules, name); return modules[name]; }, window: dom, document: dom.document, URLSearchParams, AbortController, console, fetch: (...args) => fetcher(...args) });
  return exports;
}
modules['@/lib/utils/roller'] = load('lib/utils/roller.ts');
modules['@/lib/utils/yayinKodu'] = load('lib/utils/yayinKodu.ts');
modules['@/lib/ogrenmeAraci/turSunumu'] = load('lib/ogrenmeAraci/turSunumu.ts');
modules['@/lib/eclub/gonderimDurumlari'] = load('lib/eclub/gonderimDurumlari.ts');
modules['@/lib/eclub/yayinGonderimFiltreleri'] = load('lib/eclub/yayinGonderimFiltreleri.ts');
modules['@/lib/ogrenmeAraci/thumbnailIstemci'] = { yayinThumbnailIstemciCoz: yayin => yayin.thumbnail_url };
modules['@/components/ogrenme-araci/AracVarsayilanKapak'] = { AracVarsayilanKapak: () => null };
modules['@/components/ogrenme-araci/YayinTuruPill'] = { YayinTuruPill: ({ tur }) => h('span', {}, tur) };
modules['@/components/eclub/EclubHoykSureCercevesi'] = { EclubHoykSureCercevesi: () => null };
modules['@/components/yayin/YayinKarti'] = load('components/yayin/YayinKarti.tsx');
modules['@/components/kontrol/SadeKontroller'] = {
  SadeKontrolGrubu: ({ children, tur, ...props }) => h('div', props, children),
  SadeKontrolButonu: ({ children, ...props }) => h('button', props, children),
};
modules['./EclubGonderimDetayKarti'] = load('app/(panel)/eclub/yayinlar/_components/EclubGonderimDetayKarti.tsx');
modules['@/app/(panel)/eclub/yayinlar/_components/EclubYayinGonderimKarti'] = load('app/(panel)/eclub/yayinlar/_components/EclubYayinGonderimKarti.tsx');
modules['@/lib/bildirimler/rozet'] = { bildirimRozetleriniYenile() {} };
modules['@/app/(panel)/eclub/oneriler/_hooks/useEclubOneriler'] = load('app/(panel)/eclub/oneriler/_hooks/useEclubOneriler.ts');
modules['../token.module.css'] = { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
modules['@/components/ui/button'] = { Button: ({ children, variant, size, ...props }) => h('button', props, children) };
modules['@/components/video/VideoOnizleme'] = { __esModule: true, default: ({ videoUrl }) => h('div', { 'data-video-url': videoUrl }) };
for (const name of ['FlipPdfOynatici', 'GorselOynatici', 'PodcastOynatici']) modules[`@/components/ogrenme-araci/${name}`] = { __esModule: true, default: ({ aracId, yayinId, saltGoruntuleme }) => h('div', { 'data-arac-id': aracId, 'data-yayin-id': yayinId, 'data-salt': String(saltGoruntuleme) }) };
modules['@/components/ogrenme-araci/OgrenmeAraciOnizleme'] = load('components/ogrenme-araci/OgrenmeAraciOnizleme.tsx');
modules['./TokenHoykModal'] = load('app/(panel)/token/_components/TokenHoykModal.tsx');
modules['@/components/ui/table'] = {};
for (const [name, tag] of Object.entries({ Table: 'table', TableBody: 'tbody', TableCell: 'td', TableHead: 'th', TableHeader: 'thead', TableRow: 'tr' })) modules['@/components/ui/table'][name] = ({ children, ...props }) => h(tag, props, children);
const Table = load('app/(panel)/token/_components/TokenKullanimTablosu.tsx').default;

async function setup({ missing = false, fail = false, arac = 'video', bm = false, tm = false, yonetici = false, tmId = '', bmId = '', uttId = '' } = {}) {
  const requests = [];
  const yayinlar = [1, 2].map(n => ({ yayin_id: id(n), urun_adi: 'Normavas', gorunen_urun_id: '30-001', firma_adi: 'Hepifarma', talep_no: 30036 + n, arac_id: id(n + 100), arac_turu: 'video', hedef_roller: ['eczaci'], icerik_turu: 'urun', gonderim_incelemesi_tamamlandi: true, yayin_tarihi: '2026-10-15', video_puani: n === 1 ? 60 : 70, begeni_sayisi: 1, favori_sayisi: 0, cek_karsiligi_var_mi: true, satis_sarti_tipi: 'satis_sartli', barem_tablosu: [{ min_puan: 200, max_puan: 399, adet: 10, mal_fazlasi: 1 }], thumbnail_url: `/kapak-${n}.jpg` }));
  const satirlar = [1, 2].map(n => ({ id: `row${n}`, yayinId: id(n), yayinKodu: code(n), gonderimTarihi: '29.10.2026', urun: 'Normavas', yayinAraci: 'Video', gonderilenRol: 'Eczacı', gonderilenSayi: 1, toplamToken: 1 }));
  for (const yayin of yayinlar) { yayin.arac_turu = arac; yayin.video_url = id(300); }
  fetcher = async (url, init) => {
    requests.push({ url, init });
    let data;
    if (url.startsWith('/token/api/detay')) data = { satirlar, devamiVar: false };
    else if (fail) return { ok: false, json: async () => ({ hata: 'Veriler alınamadı.' }) };
    else if(url.startsWith('/eclub/yayinlar/api/bm?'))data={yayinlar,kisiler:[{kisi_id:id(20),rol:'eczaci',aktif_mi:true,auth_user_id:id(21)}],oneriler:missing?[]:[1,2].map(n=>({oneri_id:id(n+200),yayin_id:id(n),kisi_id:id(20),kisi_ad:'Deneme',kisi_soyad:'Üye',kisi_rol:'eczaci',eczane_adi:'Deneme Eczanesi',oneri_baslangic:'2026-10-29',oneri_bitis:'2099-01-01',created_at:'2026-10-29',izlendi_mi:false}))};
    else if (url === '/eclub/oneriler/api/yayinlar') data = { videolar: yayinlar };
    else if (url === '/eclub/listem/api/kisiler') data = { kisiler: [{ kisi_id: id(20), rol: 'eczaci', aktif_mi: true, auth_user_id: id(21) }] };
    else if (url.includes('kaynak=planlar')) data = { planlar: [], sayfalama: { devam_var: false } };
    else data = { oneriler: missing ? [] : [1, 2].map(n => ({ oneri_id: id(n + 200), yayin_id: id(n), kisi_id: id(20), kisi_ad: 'Deneme', kisi_soyad: 'Üye', kisi_rol: 'eczaci', eczane_adi: 'Deneme Eczanesi', oneri_baslangic: '2026-10-29', oneri_bitis: '2099-01-01', created_at: '2026-10-29', izlendi_mi: false })), sayfalama: { devam_var: false } };
    return { ok: true, json: async () => data };
  };
  const c = document.createElement('div'); document.body.append(c); const root = createRoot(c);
  await act(async () => root.render(h(Table, { hoykGoster: true, bm, tm, yonetici, tmId, bmId, uttId })));
  return { c, requests, setFail: value => { fail = value; }, open: async (n, mobile = false) => {
    const selector = mobile ? '.darEkranKartlari' : '.masaustuTablo';
    const button = [...c.querySelectorAll(`${selector} button`)].find(x => x.textContent === code(n)); assert(button);
    await act(async () => { button.focus(); button.click(); }); return button;
  }, close: async () => { await act(async () => root.unmount()); c.remove(); } };
}

test('Masaüstü ve mobil kodu mevcut HOYK’u modalda açar; aynı ürünün yayınları karışmaz', async () => {
  const e = await setup();
  try {
    for (const [n, mobile] of [[1, false], [2, true]]) {
      const trigger = await e.open(n, mobile);
      const dialog = document.querySelector('[role="dialog"]'); assert(dialog);
      assert.equal(dialog.querySelectorAll('[data-hoyk-kart]').length, 1);
      for (const text of [code(n), 'Normavas', '30-001', '15.10.2026', 'Çekli Puan', 'Sipariş zorunlu', '200–399', '10+1', '1/1 Gönderilen', 'Gönderim detayları']) assert(dialog.textContent.includes(text), text);
      assert.equal(dialog.querySelector('[data-hoyk-puan]').textContent.startsWith(n === 1 ? '60' : '70'), true);
      assert.equal(dialog.querySelector('img').getAttribute('src'), `/kapak-${n}.jpg`);
      assert(!dialog.textContent.includes(code(n === 1 ? 2 : 1)));
      assert(![...dialog.querySelectorAll('button')].some(x => ['Seç', 'Önizle'].includes(x.textContent.trim())));
      assert.equal(dialog.querySelector('video,iframe,audio'), null);
      await act(async () => [...dialog.querySelectorAll('button')].find(x => x.textContent === 'Gönderim detayları').click());
      const details = dialog.querySelector('[role="region"][aria-hidden="false"]'); assert(details);
      assert(details.textContent.includes('Deneme Eczanesi')); assert(details.textContent.includes('Deneme Üye'));
      await act(async () => dialog.querySelector('[aria-label="Kapat"]').click());
      // Radix kapanış odağını unmount sonrasındaki zamanlayıcıda geri verir.
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
      assert.equal(document.querySelector('[role="dialog"]'), null);
      assert(document.activeElement === trigger, 'Kapanış odağı tıklanan yayın koduna döner');
    }
    assert.equal(dom.location.pathname, '/token');
    assert(e.requests.every(x => !x.init?.method || x.init.method === 'GET'));
  } finally { await e.close(); }
});
test('Escape modalı kapatır; gönderim kaydı yoksa başka HOYK gösterilmez', async () => {
  const e = await setup({ missing: true });
  try {
    await e.open(1);
    assert(document.querySelector('[role="dialog"]').textContent.includes('artık görüntülenemiyor'));
    assert.equal(document.querySelector('[role="dialog"] [data-hoyk-kart]'), null);
    await act(async () => document.activeElement.dispatchEvent(new dom.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    assert.equal(document.querySelector('[role="dialog"]'), null);
  } finally { await e.close(); }
});
test('Kart tıklaması doğru yayını modal içinde açar; karta dönüş bilgileri korur', async () => {
  for (const arac of ['video', 'podcast', 'gorsel', 'flip_pdf']) {
    const e = await setup({ arac });
    try {
      await e.open(2);
      const dialog = document.querySelector('[role="dialog"]');
      await act(async () => dialog.querySelector('[data-hoyk-kart]').click());
      assert(dialog.classList.contains('hoykOnizlemeModal'));
      assert.equal(dialog.querySelector('[data-hoyk-kart]'), null);
      if (arac === 'video') assert.equal(dialog.querySelector('[data-video-url]').dataset.videoUrl, id(300));
      else {
        const player = dialog.querySelector('[data-arac-id]');
        assert.equal(player.dataset.aracId, id(102)); assert.equal(player.dataset.yayinId, id(2)); assert.equal(player.dataset.salt, 'true');
      }
      await act(async () => [...dialog.querySelectorAll('button')].find(x => x.textContent.includes('Karta dön')).click());
      assert(dialog.querySelector('[data-hoyk-kart]'));
      assert(dialog.textContent.includes(code(2))); assert(dialog.textContent.includes('Sipariş zorunlu'));
      assert.equal(dom.location.pathname, '/token');
      assert(e.requests.every(x => !x.init?.method || x.init.method === 'GET'));
    } finally { await e.close(); }
  }
});
test('Veri hatası modal içinde gösterilir; yeniden dene doğru HOYK’u yükler', async () => {
  const e = await setup({ fail: true });
  try {
    await e.open(1);
    assert(document.querySelector('[role="dialog"] [role="alert"]'));
    e.setFail(false);
    await act(async () => [...document.querySelectorAll('[role="dialog"] button')].find(x => x.textContent === 'Yeniden dene').click());
    assert(document.querySelector('[role="dialog"] [data-hoyk-kart]'));
  } finally { await e.close(); }
});
test('BM modalı tüm bölge veya seçilen UTT kapsamını kullanır; UTTnin kişisel APIlerine gitmez',async()=>{
 for(const uttId of ['',id(4)]){
  const e=await setup({bm:true,uttId});
  try{
   await e.open(2);const dialog=document.querySelector('[role="dialog"]');assert(dialog.querySelector('[data-hoyk-kart]'));assert(dialog.textContent.includes(code(2)));
   const req=e.requests.find(r=>r.url.startsWith('/eclub/yayinlar/api/bm?'));assert(req);
   const params=new URL(req.url,'http://localhost').searchParams;assert.equal(params.get('token_yayin_id'),id(2));assert.equal(params.get('utt_id'),uttId||null);
   assert(!e.requests.some(r=>r.url.startsWith('/eclub/oneriler/')||r.url.startsWith('/eclub/listem/')));
   await act(async()=>dialog.querySelector('[data-hoyk-kart]').click());assert(dialog.querySelector('[data-video-url]'));assert(e.requests.every(r=>!r.init?.method||r.init.method==='GET'));
  }finally{await e.close();}
 }
});
test('TM modalı takım/BM/UTT seçimini kart isteğinde korur',async()=>{
 for(const [bmId,uttId]of [['',''],[id(3),''],[id(3),id(4)]]){
  const e=await setup({tm:true,bmId,uttId});try{
   await e.open(1);assert(document.querySelector('[role="dialog"] [data-hoyk-kart]'));
   const request=e.requests.find(r=>r.url.startsWith('/eclub/yayinlar/api/bm?'));const q=new URL(request.url,'http://localhost').searchParams;
   assert.equal(q.get('token_gorunum'),'tm');assert.equal(q.get('bm_id'),bmId||null);assert.equal(q.get('utt_id'),uttId||null);
   const detail=e.requests.find(r=>r.url.startsWith('/token/api/detay'));const d=new URL(detail.url,'http://localhost').searchParams;
   assert.equal(d.get('gorunum'),'tm');assert.equal(d.get('bm_id'),bmId||null);assert.equal(d.get('utt_id'),uttId||null);
   assert(!e.requests.some(r=>r.url.startsWith('/eclub/oneriler/')||r.url.startsWith('/eclub/listem/')));
  }finally{await e.close();}
 }
});
test('Yönetici modalı firma/TM/BM/UTT seçimini kart ve detay isteğinde korur',async()=>{
 for(const [tmId,bmId,uttId]of [['','',''],[id(2),'',''],[id(2),id(3),''],[id(2),id(3),id(4)]]){
  const e=await setup({yonetici:true,tmId,bmId,uttId});try{
   await e.open(1);assert(document.querySelector('[role="dialog"] [data-hoyk-kart]'));
   for(const prefix of ['/eclub/yayinlar/api/bm?','/token/api/detay']){
    const request=e.requests.find(r=>r.url.startsWith(prefix));const q=new URL(request.url,'http://localhost').searchParams;
    assert.equal(q.get(prefix.includes('yayinlar')?'token_gorunum':'gorunum'),'yonetici');assert.equal(q.get('tm_id'),tmId||null);assert.equal(q.get('bm_id'),bmId||null);assert.equal(q.get('utt_id'),uttId||null);
   }
   assert(!e.requests.some(r=>r.url.startsWith('/eclub/oneriler/')||r.url.startsWith('/eclub/listem/')));
  }finally{await e.close();}
 }
});
