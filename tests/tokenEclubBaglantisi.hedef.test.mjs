import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React, { act } from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { Window } from 'happy-dom';

const dom = new Window({ url: 'http://localhost/eclub/yayinlar' });
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'Event', 'MouseEvent']) {
  Object.defineProperty(globalThis, name, { configurable: true, value: name === 'window' ? dom : dom[name] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import('react-dom/client');
const h = React.createElement;
function load(path, modules, extra = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { exports, require: name => { assert(name in modules, name); return modules[name]; }, window: dom, document: dom.document, URLSearchParams, AbortController, console, ...extra });
  return exports;
}
const temel = { react: React, 'react/jsx-runtime': jsxRuntime };
const roller = load('lib/utils/roller.ts', temel);
temel['@/lib/utils/roller'] = roller;
const filtreler = load('lib/eclub/yayinGonderimFiltreleri.ts', { ...temel, '@/lib/utils/roller': roller });
const mobil = load('components/yayin/MobilYayinAkisi.tsx', temel);
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const bos = () => null;

async function ekran({ query = '', hedef = 'eczane_teknisyeni', sent = true, loading = false, arac = 'video' } = {}) {
  const yayinlar = Array.from({ length: 6 }, (_, i) => ({ yayin_id: id(i + 1), hedef_roller: hedef === 'ortak' ? ['eczaci', 'eczane_teknisyeni'] : [hedef], yayin_tarihi: `2026-10-${String(i + 1).padStart(2, '0')}`, arac_turu: arac, arac_id: id(i + 100), video_url: id(i + 200), urun_adi: `Ürün ${i + 1}` }));
  yayinlar.push({ yayin_id: id(20), hedef_roller: ['eczaci'], yayin_tarihi: '2026-10-28', arac_turu: 'gorsel' });
  let params = new URLSearchParams(query);
  let data = { yayinlar, kisiler: [], planlar: [], veriSurumu: 0, gonderilenYayinIdleri: sent ? yayinlar.map(x => x.yayin_id) : [], gonderilenKisiler: sent ? Object.fromEntries(yayinlar.map(x => [x.yayin_id, ['uye']])) : {}, gonderimGecmisi: [], loading, yenileniyor: false, gonderLoading: false };
  const notifications = { mesajlar: [], hata() {}, basari() {} };
  const router = { push() {} };
  const modules = { ...temel,
    '@/lib/panel/baslangic': { panelBaslangici: () => ({ yol: '/' }) },
    '@/app/(panel)/talepler/_types': { HEDEF_ROL_TASARIM: { eczaci: { renk: 'blue' }, eczane_teknisyeni: { renk: 'green' } } },
    '@/app/providers/AuthProvider': { useAuth: () => ({ kullanici: { id: 'utt', rol: 'utt' }, yukleniyor: false }) },
    '@/components/HataMesaji': { useHataMesaji: () => notifications, HataMesajiContainer: bos },
    '@/components/ui/periyot-butonlari': { PeriyotButonlari: ({ secenekler, deger, onDegistir }) => h('nav', {}, secenekler.map(x => h('button', { key: x.key, 'data-filter': x.key, 'aria-pressed': deger === x.key, onClick: () => onDegistir(x.key) }, x.label))) },
    '@/components/ui/yenile-butonu': { YenileButonu: bos },
    '@/components/ui/sayfa-yenile-basligi': { SayfaYenileBasligi: bos },
    '@/components/yayin/MobilYayinAkisi': mobil,
    '@/components/yayin/UttYayinListeOrtaklari': { UttYayinTuruToggle: bos },
    '@/lib/eclub/yayinGonderimFiltreleri': filtreler,
    '@/lib/utils/roller': roller,
    'lucide-react': { ChevronLeft: bos },
    'next/navigation': { useRouter: () => router, useSearchParams: () => params },
    '../oneriler/_hooks/useEclubOneriler': { useEclubOneriler: () => data },
    './_components/EclubYayinGonderimKarti': { EclubYayinGonderimKarti: ({ yayin, gonderimDetayiGoster, onOnizle }) => h('article', { 'data-card': yayin.yayin_id, 'data-sent': String(gonderimDetayiGoster) }, h('button', { onClick: onOnizle }, 'Önizle')) },
    '@/components/eclub/UttGonderimIncelemesi': { default: ({ yayinId, aracId, aracTuru, videoUrl, urunAdi }) => h('section', { 'data-preview': yayinId, 'data-arac': aracId, 'data-tur': aracTuru, 'data-url': videoUrl, 'data-urun': urunAdi }) },
  };
  for (const name of ['./_components/EclubGonderimPaneli', './_components/EclubPlanlananlar', './_components/BmEclubYayinlari', '@/components/rehber/SayfaRehberi']) modules[name] = { default: bos };
  const Page = load('app/(panel)/eclub/yayinlar/page.tsx', modules).default;
  const c = dom.document.createElement('div'); dom.document.body.append(c); const root = createRoot(c);
  const render = async () => { await act(async () => root.render(h(Page))); };
  await render();
  return { c, render, setQuery: value => { params = new URLSearchParams(value); }, finishLoading: () => { data = { ...data, loading: false }; }, close: async () => { await act(async () => root.unmount()); c.remove(); } };
}

test('Yayın bağlantısı üç hedef kitle ve dört araçta doğrudan mevcut Önizle ekranını açar', async () => {
  for (const hedef of ['eczaci', 'eczane_teknisyeni', 'ortak']) for (const arac of ['video', 'podcast', 'gorsel', 'flip_pdf']) {
    const e = await ekran({ query: `gonderim=gonderilen&yayin_id=${id(1)}`, hedef, arac });
    try {
      const preview = e.c.querySelector('[data-preview]');
      assert.equal(preview?.getAttribute('data-preview'), id(1));
      assert.equal(preview.getAttribute('data-arac'), id(100));
      assert.equal(preview.getAttribute('data-tur'), arac);
      assert.equal(preview.getAttribute('data-url'), id(200));
      assert.equal(preview.getAttribute('data-urun'), 'Ürün 1');
      assert.equal(e.c.querySelector('[data-card]'), null);
      await act(async () => e.c.querySelector('button').click());
      await e.render();
      assert.equal(e.c.querySelector('[data-preview]'), null);
      assert.equal(e.c.querySelector('[data-filter="gonderilen"]').getAttribute('aria-pressed'), 'true');
      const alan = e.c.querySelector('[aria-label="E-Club öğrenme içeriği hedefleri"]');
      const index = ['eczaci', 'eczane_teknisyeni', 'ortak'].indexOf(hedef);
      assert.equal(alan.children[index].getAttribute('aria-pressed'), 'true');
      assert.equal(e.c.querySelectorAll('[class~="sm:hidden"] [data-card]').length, 2);
      await act(async () => e.c.querySelector('[data-filter="tumu"]').click());
      await e.render();
      assert.equal(e.c.querySelector('[data-filter="tumu"]').getAttribute('aria-pressed'), 'true');
      assert.equal(e.c.querySelector('[data-preview]'), null);
    } finally { await e.close(); }
  }
});
test('Bağlantı veriler yüklenince uygulanır; URL değişince yeni yayına gider', async () => {
  const e = await ekran({ query: `gonderim=gonderilen&yayin_id=${id(1)}`, loading: true });
  try {
    assert.equal(e.c.querySelector('[data-preview]'), null);
    e.finishLoading(); await e.render(); assert.equal(e.c.querySelector('[data-preview]').getAttribute('data-preview'), id(1));
    e.setQuery(`gonderim=gonderilen&yayin_id=${id(20)}`); await e.render();
    assert.equal(e.c.querySelector('[data-preview]').getAttribute('data-preview'), id(20));
    e.setQuery(''); await e.render(); assert.equal(e.c.querySelector('[data-preview]'), null);
  } finally { await e.close(); }
});
test('Silinmiş veya gönderilmemiş yayın yerine farklı kart açılmaz; normal giriş değişmez', async () => {
  for (const options of [{ query: `gonderim=gonderilen&yayin_id=${id(99)}` }, { query: `gonderim=gonderilen&yayin_id=${id(1)}`, sent: false }, { query: 'gonderim=gonderilen&yayin_id=invalid' }, {}]) {
    const e = await ekran(options);
    try {
      assert.equal(e.c.querySelector('[data-preview]'), null);
      assert.equal(e.c.textContent.includes('Bu yayın artık'), !!options.query?.includes('00000000'));
      if (!options.query || options.query.includes('invalid')) assert.equal(e.c.querySelector('[data-filter="tumu"]').getAttribute('aria-pressed'), 'true');
    } finally { await e.close(); }
  }
});
test('Bağlantıdan açılan içerik, aynı yayının Önizle düğmesiyle açılan içerikle aynıdır', async () => {
  const e = await ekran({ query: `gonderim=gonderilen&yayin_id=${id(1)}` });
  try {
    const linked = e.c.querySelector('[data-preview]').outerHTML;
    await act(async () => e.c.querySelector('button').click());
    await act(async () => e.c.querySelector(`[data-card="${id(1)}"] button`).click());
    assert.equal(e.c.querySelector('[data-preview]').outerHTML, linked);
  } finally { await e.close(); }
});
test('Token diğer rollerde veya yayın kimliği yokken düz metin olarak kalır', async () => {
  const row = { id: 'row', gonderimTarihi: '29.10.2026', yayinKodu: 'hepifarma_30008', yayinId: id(1), urun: 'Ürün', yayinAraci: 'Video', gonderilenRol: 'Eczacı', gonderilenSayi: 1, toplamToken: 1 };
  for (const [hoykGoster, yayinId] of [[false, row.yayinId], [true, null]]) {
    const modules = { ...temel, './TokenHoykModal': { default: bos }, '../token.module.css': { default: new Proxy({}, { get: (_, key) => String(key) }) }, 'lucide-react': { BarChart3: bos }, '@/components/ui/button': { Button: bos }, '@/components/ui/table': {} };
    for (const [name, tag] of Object.entries({ Table: 'table', TableBody: 'tbody', TableCell: 'td', TableHead: 'th', TableHeader: 'thead', TableRow: 'tr' })) modules['@/components/ui/table'][name] = ({ children, ...props }) => h(tag, props, children);
    const Table = load('app/(panel)/token/_components/TokenKullanimTablosu.tsx', modules, { fetch: async () => ({ ok: true, json: async () => ({ satirlar: [{ ...row, yayinId }], devamiVar: false }) }) }).default;
    const c = dom.document.createElement('div'); dom.document.body.append(c); const root = createRoot(c);
    try {
      await act(async () => root.render(h(Table, { hoykGoster })));
      assert.equal(c.querySelectorAll('a').length, 0);
      assert.equal(c.querySelectorAll('[aria-haspopup="dialog"]').length, 0);
      assert.equal(c.querySelector('tbody tr td:nth-child(2)').textContent, row.yayinKodu);
      const mobileCode = [...c.querySelectorAll('dt')].find(x => x.textContent === 'Yayın Kodu');
      assert.equal(mobileCode.nextElementSibling.textContent, row.yayinKodu);
    } finally { await act(async () => root.unmount()); c.remove(); }
  }
});
test('Token kapsülleri sorguyu değiştirir, sayfayı sıfırlar ve geciken eski yanıtı göstermez', async()=>{
  const calls=[],pending=new Map();
  const fetcher=async(url)=>{
    if(url==='/token/api/rapor')return{ok:true,json:async()=>({hesap_var:true,gun_sonu:{hazir:true,veri_tarihi:'2026-10-28',plan_limiti:1500,firma_toplam_token:31,eclub_token:11,eczanem_token:10}})};
    calls.push(url);const p=new URL(url,'http://localhost').searchParams;
    const arac=p.get('arac')??'tumu';
    const data={satirlar:[{id:`${arac}-${p.get('sayfa')}`,gonderimTarihi:'29.10.2026',yayinKodu:'hepifarma_30037',yayinId:null,yayinAdi:'Deneme_11_27_10_2026',urun:`Kayıt ${arac}`,yayinAraci:arac,gonderilenRol:'Eczacı',davetliler:'Eclub üyesi',davetliSayisi:20,katilimSayisi:13,eczaneSayisi:2,gonderilenSayi:37,toplamToken:10}],devamiVar:arac==='tumu'&&p.get('sayfa')==='0'};
    if(arac==='video')await new Promise(resolve=>pending.set(arac,resolve));
    return{ok:true,json:async()=>data};
  };
  const modules={...temel,'@/app/providers/AuthProvider':{useAuth:()=>({kullanici:{id:'utt',rol:'utt'}})},
    '@/components/kontrol/KisiKontroller':{SadeKisiSecimi:bos},
    './TokenHoykModal':{default:bos},'../token.module.css':{default:new Proxy({},{get:(_,k)=>String(k)})},'./token.module.css':{default:new Proxy({},{get:(_,k)=>String(k)})},'lucide-react':{BarChart3:bos},
    '@/components/ui/button':{Button:({children,variant,size,...props})=>h('button',props,children)},'@/components/ui/table':{},
    '@/components/kontrol/SadeKontroller':{SadeKapsulFiltre:({secenekler,deger,onDegistir,etiket})=>h('nav',{'aria-label':etiket},secenekler.map(x=>h('button',{key:x.deger,'aria-pressed':deger===x.deger,onClick:()=>onDegistir(x.deger)},x.etiket)))},
    '@/lib/ogrenmeAraci/turSunumu':load('lib/ogrenmeAraci/turSunumu.ts',temel)};
  for(const [name,tag]of Object.entries({Table:'table',TableBody:'tbody',TableCell:'td',TableHead:'th',TableHeader:'thead',TableRow:'tr'}))modules['@/components/ui/table'][name]=({children,...props})=>h(tag,props,children);
  modules['./_components/TokenKullanimTablosu']=load('app/(panel)/token/_components/TokenKullanimTablosu.tsx',modules,{fetch:fetcher});
  const Page=load('app/(panel)/token/page.tsx',modules,{fetch:fetcher}).default;
  const c=document.createElement('div');document.body.append(c);const root=createRoot(c);
  const click=async(label)=>{const b=[...c.querySelectorAll('button')].find(x=>x.textContent===label);assert(b,label);await act(async()=>b.click());};
  try{
    await act(async()=>root.render(h(Page)));
    const stats=[...c.querySelectorAll('.uttStats article')];
    assert.equal(stats.length,4);
    assert.deepEqual(stats.map(x=>x.querySelector('span').textContent),['Token Kullanım Limiti','Toplam Kullanılan Token','Eclub Token Kullanımı','Eczanem Token Kullanımı']);
    assert.deepEqual(stats.map(x=>x.querySelector('strong').textContent),['1.500 Token/Ay','31','11','10']);
    assert.deepEqual(stats.map(x=>x.querySelector('small').textContent),['Kullandığın kadar öde paketi tercih edilmiştir.','Tüm firma kullanımı','Eclub üyeleri için gönderi ve etkinlik yayınları tüketimi','Eczanem üyeleri için gönderilerdeki tüketim']);
    assert(c.textContent.includes('28.10.2026 gün sonu itibarıyladır'));
    assert(calls[0].includes('gonderi=eclub'));assert(c.textContent.includes('Kayıt tumu'));
    const nameShown=()=>[...c.querySelectorAll('th')].some(x=>x.textContent==='Etkinlik Adı');
    const codeShown=()=>[...c.querySelectorAll('th')].some(x=>x.textContent==='Yayın Kodu');
    const checkCode=shown=>{
      assert.equal(codeShown(),shown);
      assert.equal([...c.querySelectorAll('dt')].some(x=>x.textContent==='Yayın Kodu'),shown);
      assert.equal(c.querySelectorAll('col').length,c.querySelectorAll('th').length);
      assert.equal(c.querySelectorAll('tbody tr:first-child td').length,c.querySelectorAll('th').length);
    };
    checkCode(true);
    assert(nameShown());assert(c.textContent.includes('Deneme_11_27_10_2026'));
    await click('Daha fazla göster');assert(calls.at(-1).includes('sayfa=1'));
    await click('Videolar');assert(calls.at(-1).includes('sayfa=0'));assert(calls.at(-1).includes('arac=video'));
    assert(!nameShown());
    await click('Podcastler');assert(c.textContent.includes('Kayıt podcast'));assert(!c.textContent.includes('Kayıt tumu'));
    await act(async()=>pending.get('video')());assert(!c.textContent.includes('Kayıt video'));
    for(const [label,arac]of [['Dijital Broşürler','gorsel'],['Literatürler','flip_pdf'],['Viva','viva']]){await click(label);assert(calls.at(-1).includes(`arac=${arac}`));assert(c.textContent.includes(`Kayıt ${arac}`));assert.equal(nameShown(),arac==='viva');checkCode(arac!=='viva');}
    assert.deepEqual([...c.querySelectorAll('th')].map(x=>x.textContent),['Gönderim Tarihi','Etkinlik Adı','Ürün Adı','Yayın Aracı','Davetliler','Davetli Sayısı','Katılım Sayısı','Kullanılan Token']);
    assert.deepEqual([...c.querySelectorAll('tbody tr td')].slice(4).map(x=>x.textContent),['Eclub üyesi','20','13','10']);
    for(const[label,value]of [['Davetliler','Eclub üyesi'],['Davetli Sayısı','20'],['Katılım Sayısı','13']])assert.equal([...c.querySelectorAll('dt')].find(x=>x.textContent===label)?.nextElementSibling.textContent,value);
    await click('Tümü');assert(!calls.at(-1).includes('arac='));assert(c.textContent.includes('Kayıt tumu'));checkCode(true);
    assert(![...c.querySelectorAll('th')].some(x=>x.textContent==='Davetli Sayısı'));
    await click('Eczanem Detayları');assert.equal(c.querySelectorAll('table').length,2);
    assert.deepEqual([...c.querySelectorAll('.uttStats strong')].map(x=>x.textContent),['1.500 Token/Ay','31','11','10']);
    assert(calls.at(-1).includes('gonderi=eczanem'));
    const eczaTable=c.querySelectorAll('table')[1];
    assert.deepEqual([...eczaTable.querySelectorAll('th')].map(x=>x.textContent),['Gönderim Tarihi','Yayın Kodu','Ürün Adı','Yayın Aracı','Gönderilen Eczane Sayısı','İletilen Üye Sayısı','Kullanılan Token']);
    assert.deepEqual([...eczaTable.querySelectorAll('tbody tr td')].slice(4).map(x=>x.textContent),['2','37','10']);
    await click('Literatürler');assert(calls.at(-1).includes('gonderi=eczanem'));assert(calls.at(-1).includes('arac=flip_pdf'));
    await click('E-Club Detayları');assert.equal(c.querySelector('[hidden]'),null);
  }finally{await act(async()=>root.unmount());c.remove();}
});
test('BM: dört kart, bölge toplamı, UTT seçimi, geciken yanıt ve iki tablonun kapsamı birlikte değişir',async()=>{
 const calls=[],pending=[];const a=id(4),b=id(5);
 const fetcher=async(url)=>{
  calls.push(url);const q=new URL(url,'http://localhost').searchParams,utt=q.get('utt_id')??'';
  assert.equal(q.get('gorunum'),'bm');
  if(utt===a)await new Promise(resolve=>pending.push(resolve));
  if(url.startsWith('/token/api/rapor'))return{ok:true,json:async()=>({hesap_var:true,secili_utt_id:utt||null,uttler:[{utt_id:a,utt_adi:'Ali Bir'},{utt_id:b,utt_adi:'Berk İki'}],gun_sonu:{hazir:true,veri_tarihi:'2026-10-28',plan_limiti:1500,firma_toplam_token:31,eclub_token:utt===b?6:utt===a?11:17,eczanem_token:utt===b?2:utt===a?5:7}})};
  return{ok:true,json:async()=>({satirlar:[{id:`${utt}-${q.get('sayfa')}`,gonderimTarihi:'28.10.2026',yayinKodu:'Hepifarma_30037',yayinId:null,yayinAdi:'Etkinlik',urun:utt===b?'Berk kaydı':utt===a?'Ali kaydı':'Bölge kaydı',yayinAraci:'Video',gonderilenRol:'Eczacı',gonderilenSayi:1,toplamToken:1}],devamiVar:q.get('sayfa')==='0'})};
 };
 const modules={...temel,'@/app/providers/AuthProvider':{useAuth:()=>({kullanici:{id:'bm',rol:'bm'}})},
  './TokenHoykModal':{default:bos},'../token.module.css':{default:new Proxy({},{get:(_,k)=>String(k)})},'./token.module.css':{default:new Proxy({},{get:(_,k)=>String(k)})},'lucide-react':{BarChart3:bos},
  '@/components/ui/button':{Button:({children,variant,size,...props})=>h('button',props,children)},'@/components/ui/table':{},
  '@/components/kontrol/KisiKontroller':{SadeKisiSecimi:({baslik,kisiler,deger,onDegistir,bosSecenekEtiketi})=>h('select',{'aria-label':baslik,value:deger,onChange:e=>onDegistir(e.target.value)},h('option',{value:''},bosSecenekEtiketi),kisiler.map(k=>h('option',{key:k.deger,value:k.deger},k.adSoyad)))},
  '@/components/kontrol/SadeKontroller':{SadeKapsulFiltre:({secenekler,deger,onDegistir,etiket})=>h('nav',{'aria-label':etiket},secenekler.map(x=>h('button',{key:x.deger,'aria-pressed':deger===x.deger,onClick:()=>onDegistir(x.deger)},x.etiket)))},
  '@/lib/ogrenmeAraci/turSunumu':load('lib/ogrenmeAraci/turSunumu.ts',temel)};
 for(const[name,tag]of Object.entries({Table:'table',TableBody:'tbody',TableCell:'td',TableHead:'th',TableHeader:'thead',TableRow:'tr'}))modules['@/components/ui/table'][name]=({children,...props})=>h(tag,props,children);
 modules['./_components/TokenKullanimTablosu']=load('app/(panel)/token/_components/TokenKullanimTablosu.tsx',modules,{fetch:fetcher});
 const Page=load('app/(panel)/token/page.tsx',modules,{fetch:fetcher}).default;
 const c=document.createElement('div');document.body.append(c);const root=createRoot(c);
 const click=async label=>{const el=[...c.querySelectorAll('button')].find(x=>x.textContent===label);assert(el,label);await act(async()=>el.click());};
 const choose=async value=>{const el=c.querySelector('select');await act(async()=>{Object.getOwnPropertyDescriptor(dom.HTMLSelectElement.prototype,'value').set.call(el,value);el.dispatchEvent(new dom.Event('change',{bubbles:true}));});};
 const values=()=>[...c.querySelectorAll('.uttStats strong')].map(x=>x.textContent);
 try{
  await act(async()=>root.render(h(Page)));assert.deepEqual(values(),['1.500 Token/Ay','31','17','7']);assert(c.textContent.includes('Bölge kaydı'));
  assert.equal(c.querySelector('select').value,'');assert.equal(c.querySelectorAll('option').length,3);
  await click('Daha fazla göster');assert(calls.at(-1).includes('sayfa=1'));
  await choose(a);assert.deepEqual(values(),['1.500 Token/Ay','31','—','—']);assert(!c.textContent.includes('Bölge kaydı'));
  await choose(b);assert.deepEqual(values(),['1.500 Token/Ay','31','6','2']);assert(c.textContent.includes('Berk kaydı'));assert(calls.some(url=>url.includes(`utt_id=${b}`)&&url.includes('sayfa=0')));
  await act(async()=>pending.forEach(resolve=>resolve()));assert.deepEqual(values(),['1.500 Token/Ay','31','6','2']);assert(!c.textContent.includes('Ali kaydı'));
  await click('Viva');assert(calls.at(-1).includes('arac=viva'));assert(calls.at(-1).includes(`utt_id=${b}`));assert([...c.querySelectorAll('th')].some(x=>x.textContent==='Katılım Sayısı'));
  await click('Eczanem Detayları');assert(calls.at(-1).includes('gonderi=eczanem'));assert(calls.at(-1).includes(`utt_id=${b}`));
  await choose('');assert.deepEqual(values(),['1.500 Token/Ay','31','17','7']);assert(!calls.at(-1).includes('utt_id='));
  await click('Tümü');assert(calls.at(-1).includes('gonderi=eczanem'));assert(!calls.at(-1).includes('arac='));
 }finally{await act(async()=>root.unmount());c.remove();}
});
test('TM: iki bağlı seçim takım/bölge/UTT toplamlarını değiştirir; BM değişince UTT ve sayfa sıfırlanır',async()=>{
 const calls=[],pending=[];const bmA=id(3),bmB=id(30),uttA=id(4),uttB=id(5);
 const fetcher=async url=>{
  calls.push(url);const q=new URL(url,'http://localhost').searchParams,bm=q.get('bm_id')??'',utt=q.get('utt_id')??'';
  assert.equal(q.get('gorunum'),'tm');assert(!utt||bm);
  if(utt===uttA)await new Promise(resolve=>pending.push(resolve));
  if(url.startsWith('/token/api/rapor'))return{ok:true,json:async()=>({hesap_var:true,secili_bm_id:bm||null,secili_utt_id:utt||null,
   bmler:[{bm_id:bmA,bm_adi:'A Müdür'},{bm_id:bmB,bm_adi:'B Müdür'}],uttler:bm?[{utt_id:bm===bmA?uttA:uttB,utt_adi:bm===bmA?'A Temsilci':'B Temsilci'}]:[],
   gun_sonu:{hazir:true,veri_tarihi:'2026-10-28',plan_limiti:1500,firma_toplam_token:50,eclub_token:utt?4:bm===bmA?11:bm===bmB?6:17,eczanem_token:utt?2:bm===bmA?5:bm===bmB?3:8}})};
  return{ok:true,json:async()=>({satirlar:[{id:`${bm}-${utt}-${q.get('sayfa')}`,gonderimTarihi:'28.10.2026',yayinKodu:'Hepifarma_30037',yayinId:null,yayinAdi:'Etkinlik',urun:utt?'Temsilci kaydı':bm===bmA?'A bölge kaydı':bm===bmB?'B bölge kaydı':'Takım kaydı',yayinAraci:'Video',gonderilenRol:'Eczacı',gonderilenSayi:1,toplamToken:1}],devamiVar:q.get('sayfa')==='0'})};
 };
 const modules={...temel,'@/app/providers/AuthProvider':{useAuth:()=>({kullanici:{id:'tm',rol:'tm'}})},
  './TokenHoykModal':{default:bos},'../token.module.css':{default:new Proxy({},{get:(_,k)=>String(k)})},'./token.module.css':{default:new Proxy({},{get:(_,k)=>String(k)})},'lucide-react':{BarChart3:bos},
  '@/components/ui/button':{Button:({children,variant,size,...props})=>h('button',props,children)},'@/components/ui/table':{},
  '@/components/kontrol/KisiKontroller':{SadeKisiSecimi:({baslik,kisiler,deger,onDegistir,bosSecenekEtiketi,disabled})=>h('select',{'aria-label':baslik,value:deger,disabled,onChange:e=>onDegistir(e.target.value)},h('option',{value:''},bosSecenekEtiketi),kisiler.map(k=>h('option',{key:k.deger,value:k.deger},k.adSoyad)))},
  '@/components/kontrol/SadeKontroller':{SadeKapsulFiltre:({secenekler,deger,onDegistir,etiket})=>h('nav',{'aria-label':etiket},secenekler.map(x=>h('button',{key:x.deger,'aria-pressed':deger===x.deger,onClick:()=>onDegistir(x.deger)},x.etiket)))},
  '@/lib/ogrenmeAraci/turSunumu':load('lib/ogrenmeAraci/turSunumu.ts',temel)};
 for(const[name,tag]of Object.entries({Table:'table',TableBody:'tbody',TableCell:'td',TableHead:'th',TableHeader:'thead',TableRow:'tr'}))modules['@/components/ui/table'][name]=({children,...props})=>h(tag,props,children);
 modules['./_components/TokenKullanimTablosu']=load('app/(panel)/token/_components/TokenKullanimTablosu.tsx',modules,{fetch:fetcher});
 const Page=load('app/(panel)/token/page.tsx',modules,{fetch:fetcher}).default;
 const c=document.createElement('div');document.body.append(c);const root=createRoot(c);
 const choose=async(label,value)=>{const el=c.querySelector(`select[aria-label="${label}"]`);assert(!el.disabled);await act(async()=>{Object.getOwnPropertyDescriptor(dom.HTMLSelectElement.prototype,'value').set.call(el,value);el.dispatchEvent(new dom.Event('change',{bubbles:true}));});};
 const click=async label=>{const el=[...c.querySelectorAll('button')].find(x=>x.textContent===label);assert(el,label);await act(async()=>el.click());};
 const values=()=>[...c.querySelectorAll('.uttStats strong')].map(x=>x.textContent);
 const reps=()=>c.querySelector('select[aria-label="Temsilciler"]');
 try{
  await act(async()=>root.render(h(Page)));assert.deepEqual(values(),['1.500 Token/Ay','50','17','8']);assert(reps().disabled);assert(c.textContent.includes('Takım kaydı'));
  await choose('Bölge Müdürleri',bmA);assert(!reps().disabled);assert.equal(reps().options.length,2);assert.equal(reps().options[1].value,uttA);assert.deepEqual(values(),['1.500 Token/Ay','50','11','5']);
  await click('Daha fazla göster');assert(calls.at(-1).includes('sayfa=1'));
  await choose('Temsilciler',uttA);assert.deepEqual(values(),['1.500 Token/Ay','50','—','—']);
  await choose('Bölge Müdürleri',bmB);assert.equal(reps().value,'');assert.equal(reps().options[1].value,uttB);assert.deepEqual(values(),['1.500 Token/Ay','50','6','3']);
  assert(calls.some(url=>url.includes(`bm_id=${bmB}`)&&url.includes('sayfa=0')&&!url.includes('utt_id=')));
  await act(async()=>pending.forEach(resolve=>resolve()));assert.deepEqual(values(),['1.500 Token/Ay','50','6','3']);assert(!c.textContent.includes('Temsilci kaydı'));
  await choose('Temsilciler',uttB);assert.deepEqual(values(),['1.500 Token/Ay','50','4','2']);
  await click('Viva');assert(calls.at(-1).includes(`bm_id=${bmB}`));assert(calls.at(-1).includes(`utt_id=${uttB}`));assert(calls.at(-1).includes('arac=viva'));
  await click('Eczanem Detayları');assert(calls.at(-1).includes('gonderi=eczanem'));assert(calls.at(-1).includes(`utt_id=${uttB}`));
  await choose('Bölge Müdürleri','');assert(reps().disabled);assert.equal(reps().value,'');assert.equal(reps().options.length,1);assert.deepEqual(values(),['1.500 Token/Ay','50','17','8']);
  const lastDetail=calls.filter(url=>url.startsWith('/token/api/detay')).at(-1);assert(!lastDetail.includes('bm_id='));assert(!lastDetail.includes('utt_id='));assert(lastDetail.includes('sayfa=0'));
 }finally{await act(async()=>root.unmount());c.remove();}
});
test('Yönetici: üç bağlı seçim firma/takım/bölge/UTT toplamlarını izler, eski yanıtlar ve alt seçimler sıfırlanır',async()=>{
 const calls=[],pending=[];const tmA=id(2),tmB=id(20),bmA=id(3),bmB=id(30),uttA=id(4),uttB=id(5);
 const fetcher=async url=>{
  calls.push(url);const q=new URL(url,'http://localhost').searchParams,tm=q.get('tm_id')??'',bm=q.get('bm_id')??'',utt=q.get('utt_id')??'';
  assert.equal(q.get('gorunum'),'yonetici');assert(!bm||tm);assert(!utt||bm);
  if(utt===uttA)await new Promise(resolve=>pending.push(resolve));
  if(url.startsWith('/token/api/rapor'))return{ok:true,json:async()=>({hesap_var:true,secili_tm_id:tm||null,secili_bm_id:bm||null,secili_utt_id:utt||null,
   tmler:[{tm_id:tmA,tm_adi:'A Takım Müdürü'},{tm_id:tmB,tm_adi:'B Takım Müdürü'}],bmler:tm?[{bm_id:tm===tmA?bmA:bmB,bm_adi:tm===tmA?'A Bölge Müdürü':'B Bölge Müdürü'}]:[],uttler:bm?[{utt_id:bm===bmA?uttA:uttB,utt_adi:bm===bmA?'A Temsilci':'B Temsilci'}]:[],
   gun_sonu:{hazir:true,veri_tarihi:'2026-10-28',plan_limiti:1500,firma_toplam_token:50,eclub_token:utt?4:bm?6:tm?17:24,eczanem_token:utt?1:bm?2:tm?6:9}})};
  return{ok:true,json:async()=>({satirlar:[{id:`${tm}-${bm}-${utt}-${q.get('sayfa')}`,gonderimTarihi:'28.10.2026',yayinKodu:'Hepifarma_30037',yayinId:null,yayinAdi:'Etkinlik',urun:utt?'Temsilci kaydı':bm?'Bölge kaydı':tm?'Takım kaydı':'Firma kaydı',yayinAraci:'Video',gonderilenRol:'Eczacı',gonderilenSayi:1,toplamToken:1}],devamiVar:q.get('sayfa')==='0'})};
 };
 const modules={...temel,'@/app/providers/AuthProvider':{useAuth:()=>({kullanici:{id:'gm',rol:'gm'}})},
  './TokenHoykModal':{default:bos},'../token.module.css':{default:new Proxy({},{get:(_,k)=>String(k)})},'./token.module.css':{default:new Proxy({},{get:(_,k)=>String(k)})},'lucide-react':{BarChart3:bos},
  '@/components/ui/button':{Button:({children,variant,size,...props})=>h('button',props,children)},'@/components/ui/table':{},
  '@/components/kontrol/KisiKontroller':{SadeKisiSecimi:({baslik,kisiler,deger,onDegistir,bosSecenekEtiketi,disabled})=>h('select',{'aria-label':baslik,value:deger,disabled,onChange:e=>onDegistir(e.target.value)},h('option',{value:''},bosSecenekEtiketi),kisiler.map(k=>h('option',{key:k.deger,value:k.deger},k.adSoyad)))},
  '@/components/kontrol/SadeKontroller':{SadeKapsulFiltre:({secenekler,deger,onDegistir,etiket})=>h('nav',{'aria-label':etiket},secenekler.map(x=>h('button',{key:x.deger,'aria-pressed':deger===x.deger,onClick:()=>onDegistir(x.deger)},x.etiket)))},
  '@/lib/ogrenmeAraci/turSunumu':load('lib/ogrenmeAraci/turSunumu.ts',temel)};
 for(const[name,tag]of Object.entries({Table:'table',TableBody:'tbody',TableCell:'td',TableHead:'th',TableHeader:'thead',TableRow:'tr'}))modules['@/components/ui/table'][name]=({children,...props})=>h(tag,props,children);
 modules['./_components/TokenKullanimTablosu']=load('app/(panel)/token/_components/TokenKullanimTablosu.tsx',modules,{fetch:fetcher});
 const Page=load('app/(panel)/token/page.tsx',modules,{fetch:fetcher}).default;
 const c=document.createElement('div');document.body.append(c);const root=createRoot(c);
 const select=label=>c.querySelector(`select[aria-label="${label}"]`);
 const choose=async(label,value)=>{const el=select(label);assert(!el.disabled);await act(async()=>{Object.getOwnPropertyDescriptor(dom.HTMLSelectElement.prototype,'value').set.call(el,value);el.dispatchEvent(new dom.Event('change',{bubbles:true}));});};
 const click=async label=>{const el=[...c.querySelectorAll('button')].find(x=>x.textContent===label);assert(el,label);await act(async()=>el.click());};
 const values=()=>[...c.querySelectorAll('.uttStats strong')].map(x=>x.textContent);
 try{
  await act(async()=>root.render(h(Page)));assert.deepEqual(values(),['1.500 Token/Ay','50','24','9']);assert(select('Bölge Müdürleri').disabled);assert(select('Temsilciler').disabled);assert(c.textContent.includes('Firma kaydı'));
  await choose('Takım Müdürleri',tmA);assert(!select('Bölge Müdürleri').disabled);assert(select('Temsilciler').disabled);assert.equal(select('Bölge Müdürleri').options[1].value,bmA);assert.deepEqual(values(),['1.500 Token/Ay','50','17','6']);
  await choose('Bölge Müdürleri',bmA);assert(!select('Temsilciler').disabled);assert.equal(select('Temsilciler').options[1].value,uttA);assert.deepEqual(values(),['1.500 Token/Ay','50','6','2']);
  await click('Daha fazla göster');assert(calls.at(-1).includes('sayfa=1'));
  await choose('Temsilciler',uttA);assert.deepEqual(values(),['1.500 Token/Ay','50','—','—']);
  await choose('Takım Müdürleri',tmB);assert.equal(select('Bölge Müdürleri').value,'');assert.equal(select('Temsilciler').value,'');assert(select('Temsilciler').disabled);assert.equal(select('Bölge Müdürleri').options[1].value,bmB);
  assert.deepEqual(values(),['1.500 Token/Ay','50','17','6']);await act(async()=>pending.forEach(resolve=>resolve()));assert.deepEqual(values(),['1.500 Token/Ay','50','17','6']);assert(!c.textContent.includes('Temsilci kaydı'));
  const afterTmChange=calls.filter(url=>url.startsWith('/token/api/detay')).at(-1);assert(afterTmChange.includes(`tm_id=${tmB}`));assert(!afterTmChange.includes('bm_id='));assert(!afterTmChange.includes('utt_id='));assert(afterTmChange.includes('sayfa=0'));
  await choose('Bölge Müdürleri',bmB);await choose('Temsilciler',uttB);assert.deepEqual(values(),['1.500 Token/Ay','50','4','1']);
  await click('Viva');assert(calls.at(-1).includes(`tm_id=${tmB}`));assert(calls.at(-1).includes(`bm_id=${bmB}`));assert(calls.at(-1).includes(`utt_id=${uttB}`));assert(calls.at(-1).includes('arac=viva'));
  await click('Eczanem Detayları');assert(calls.at(-1).includes('gonderi=eczanem'));assert(calls.at(-1).includes(`utt_id=${uttB}`));
  await choose('Bölge Müdürleri','');assert.equal(select('Temsilciler').value,'');assert(select('Temsilciler').disabled);assert.deepEqual(values(),['1.500 Token/Ay','50','17','6']);
  await choose('Takım Müdürleri','');assert(select('Bölge Müdürleri').disabled);assert(select('Temsilciler').disabled);assert.deepEqual(values(),['1.500 Token/Ay','50','24','9']);
  const last=calls.filter(url=>url.startsWith('/token/api/detay')).at(-1);assert(!last.includes('tm_id='));assert(!last.includes('bm_id='));assert(!last.includes('utt_id='));
 }finally{await act(async()=>root.unmount());c.remove();}
});
