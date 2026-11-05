import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const repo=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(repo+'/package.json');
const {Window}=require('happy-dom');
const win=new Window({url:'http://localhost/partner/egitimler'});
for(const k of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLTextAreaElement','HTMLSelectElement','Event','MouseEvent','Node'])Object.defineProperty(globalThis,k,{value:k==='window'?win:k==='document'?win.document:win[k],configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
for(const k of ['MutationObserver','CustomEvent','NodeFilter','HTMLButtonElement'])globalThis[k]=win[k];
globalThis.getComputedStyle=win.getComputedStyle.bind(win);
globalThis.requestAnimationFrame=cb=>setTimeout(cb,0);globalThis.cancelAnimationFrame=clearTimeout;
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client'),ts=require('typescript');
const cache=new Map();
function load(file){
 if(cache.has(file))return cache.get(file).exports;
 const mod={exports:{}};cache.set(file,mod);
 const localRequire=id=>{
  if(id==='next/navigation')return {useRouter:()=>({push:()=>{},replace:()=>{}})};
  if(id==='@/components/agora/PartnerKabugu')return {__esModule:true,default:({children})=>React.createElement('main',null,children)};
  if(id==='next/image')return {__esModule:true,default:({unoptimized,...props})=>React.createElement('img',props)};
  if(id==='./PartnerEgitimFormu')return {__esModule:true,default:()=>null};

  if(id.endsWith('.css'))return {__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};
  if(!id.startsWith('@/')&&!id.startsWith('.'))return require(id);
  const base=id.startsWith('@/')?path.join(repo,id.slice(2)):path.resolve(path.dirname(file),id);
  const full=[base,base+'.ts',base+'.tsx',base+'/index.ts'].find(p=>existsSync(p)&&!require('node:fs').statSync(p).isDirectory());
  if(!full)throw new Error('Missing '+id);
  return load(full);
 };
 const js=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 vm.runInThisContext('(function(require,module,exports){'+js.replaceAll('import.meta.url',JSON.stringify('file://'+file))+'\n})',{filename:file})(localRequire,mod,mod.exports);
 return mod.exports;
}
const Partner=load(repo+'/app/partner/egitimler/PartnerEgitimAlani.tsx').default;
const Admin=load(repo+'/app/admin/_components/PartnerYayinlari.tsx').default;
const a=document.createElement('div'),b=document.createElement('div');document.body.append(a,b);const ra=createRoot(a),rb=createRoot(b);
const id='10000000-0000-4000-8000-000000000001';
process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE='test-thumbnail.b-cdn.net';
let record={kapak_video_guid:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',egitim_id:id,partner_egitim_id:'PE-10001',egitim_adi:'SPIN',kategori:'egitim',yayin_araci:'video',fiyat_tl:100,durum:'yayinda',surum:2,olusturuldu_at:'2026-11-05T00:00:00Z',guncellendi_at:'2026-11-05T00:00:00Z'};
globalThis.fetch=async()=>Response.json({kayitlar:[record],toplam:1});
const settle=async(fn=()=>{})=>{await React.act(async()=>{await fn();await new Promise(r=>setTimeout(r,5));});};
const results=[],check=(n,c)=>{assert.ok(c,n);results.push(n);};
const core=parent=>{const card=parent.querySelector('[data-hoyk-kart]').cloneNode(true);card.querySelector('.islemler').remove();card.querySelectorAll('img').forEach(img=>img.setAttribute('src','partner-logo'));return card.outerHTML;};
try{
 for(const status of ['taslak','yayinda','pasif'])for(const type of ['video','podcast']){
  record={...record,durum:status,yayin_araci:type};
  await settle(()=>{ra.render(React.createElement(Partner,{key:status+type,sirketAdi:'hapbilgi',logoSurumu:1}));rb.render(React.createElement(Admin,{key:status+type,partnerId:id}));});await settle();
  check(`${status}/${type}: Partner ve admin gerçek HOYK bilgileri/görünümü aynıdır`,core(a)===core(b));
  check(`${status}/${type}: Eğitim kapağı logo yerine ortak HOYK çözümleyicisinden gelir`,type==='video' ? a.querySelector('[data-hoyk-kapak] img')?.getAttribute('src')==='https://test-thumbnail.b-cdn.net/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/thumbnail.jpg' : !a.querySelector('[data-hoyk-kapak] img'));
  check(`${status}/${type}: İki kartta aynı PE kodu vardır`,a.querySelector('[aria-label="Eğitim ID: PE-10001"]').textContent===b.querySelector('[aria-label="Eğitim ID: PE-10001"]').textContent);
 }
 check('Ortak kart içinde beğeni/favori görünümü kendiliğinden açılmadı',!a.querySelector('[data-hoyk-kart] [aria-label="Favoriye ekle"]')&&!b.querySelector('[data-hoyk-kart] [aria-label="Favoriye ekle"]'));
 const btn=(parent,text)=>Array.from(parent.querySelectorAll('button')).find(x=>x.textContent===text);
 check('Partner düzenleme/silme ve admin moderasyon eylemleri korunur',!!btn(a,'Eğitimi Sil')&&!!btn(b,'Sil')&&!!btn(b,'Aktife Al'));
 await settle(()=>btn(a,'Eğitimi Sil').click());check('Partner silme eylemi kendi Cogniti modalını açar',!!document.querySelector('[role="alertdialog"]')&&document.querySelector('[role="alertdialog"]').textContent.includes('Eğitimi Sil'));
 await settle(()=>btn(document.querySelector('[role="alertdialog"]'),'İptal').click());
 await settle(()=>btn(b,'Aktife Al').click());check('Admin moderasyon eylemi kendi Cogniti modalını açar',!!document.querySelector('[role="alertdialog"]')&&document.querySelector('[role="alertdialog"]').textContent.includes('Eğitimi Aktife Al'));
 await settle(()=>btn(document.querySelector('[role="alertdialog"]'),'İptal').click());
 record={...record,partner_egitim_id:undefined,fiyat_tl:null,yayin_araci:null};
 await settle(()=>{ra.render(React.createElement(Partner,{key:'incomplete',sirketAdi:'hapbilgi',logoSurumu:1}));rb.render(React.createElement(Admin,{key:'incomplete',partnerId:id}));});await settle();
 check('Eksik kod/fiyat/araç iki ekranda aynı gösterilir; sahte PE kodu üretilmez',core(a)===core(b)&&a.querySelector('[data-hoyk-kart]').textContent.includes('Fiyat Belirlenmedi')&&!a.querySelector('[aria-label="Eğitim ID: PE-10001"]'));
 const report={passed:results.length,tests:results,scope:'Gerçek partner/admin ekranları ve ortak PartnerEgitimKarti + gerçek YayinKarti DOM karşılaştırması; fetch ve logo dosyası sahte, canlı tarayıcı kabulü değildir.'};console.log(JSON.stringify(report));
}finally{await settle(()=>{ra.unmount();rb.unmount();});win.happyDOM.abort();}
