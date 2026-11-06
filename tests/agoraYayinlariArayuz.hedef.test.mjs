import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const repo=fileURLToPath(new URL('../',import.meta.url)).replace(/\/$/,'');
const require=createRequire(repo+'/package.json');
const {Window}=require('happy-dom');
const win=new Window({url:'http://localhost/partner/egitimler'});
for(const k of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLTextAreaElement','HTMLSelectElement','Event','MouseEvent','Node'])Object.defineProperty(globalThis,k,{value:k==='window'?win:k==='document'?win.document:win[k],configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
for(const k of ['MutationObserver','CustomEvent','NodeFilter','HTMLButtonElement','Element','ResizeObserver','PointerEvent'])globalThis[k]=win[k];
globalThis.getComputedStyle=win.getComputedStyle.bind(win);
globalThis.requestAnimationFrame=cb=>setTimeout(cb,0);globalThis.cancelAnimationFrame=clearTimeout;
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client'),ts=require('typescript');
const cache=new Map();const gidilenYollar=[];
function load(file){
 if(cache.has(file))return cache.get(file).exports;
 const mod={exports:{}};cache.set(file,mod);
 const localRequire=id=>{
  if(id==='./AgoraYayinEditoru')return {AgoraYayinEditoru:props=>React.createElement('div',{'data-editor':props.talepId??'liste','data-hedef':props.hedef},'Ortak Yayın Editörü')};
  if(id==='next/navigation')return {useRouter:()=>({push:p=>gidilenYollar.push(p),replace:()=>{},prefetch:()=>{}}),usePathname:()=>'/agora'};


  if(id==='@/app/providers/AuthProvider')return {useAuth:()=>({kullanici:{id:'user',rol:role}})};
  if(id==='@/app/providers/TemaProvider')return {useTema:()=>({tema:'mavi',temaDegistir:()=>{}})};
  if(id.startsWith('@/components/rehber/'))return {__esModule:true,default:()=>null};
  if(id.startsWith('@/lib/rehber/'))return new Proxy({},{get:()=>()=>({giris:[],bolumler:[]})});
  if(id==='@/components/marka/CognitiLogo')return {__esModule:true,default:()=>React.createElement('span',null,'Cogniti')};
  if(id.endsWith('talepOnbellek'))return {prefetchTalepMerkezi:()=>{}};
  if(id.endsWith('ozetOnbellek'))return {prefetchYayinOzet:()=>{}};
  if(id.endsWith('katalogOnbellek'))return {prefetchYayinKatalog:()=>{}};
  if(id.endsWith('uretimRaporuOnbellek'))return {prefetchUretimRaporu:()=>{}};
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


let role='pm';
const Page=load(repo+'/components/agora/AgoraYayinlarim.tsx').default;
const prefix='10000000-0000-4000-8000-',uid=n=>prefix+String(n).padStart(12,'0');
const base={partner_id:uid(1),sirket_adi:'Birinci Partner',kategori:'egitim',yayin_araci:'video',siparis_tarihi:'2026-11-06T00:00:00Z',kapak_video_guid:null,kapak_url:null,hazirliklar:[]};
const data={profil:{firma_id:uid(5),takim_id:uid(6)},yayinlar:[{...base,siparis_id:uid(11),egitim_adi:'Yeni Eğitim',partner_egitim_id:'PE-10001',yayin_sayisi:0},{...base,siparis_id:uid(12),egitim_adi:'Yayınlanmış Eğitim',partner_egitim_id:'PE-10002',yayin_sayisi:2},{...base,siparis_id:uid(13),partner_id:uid(2),sirket_adi:'İkinci Partner',egitim_adi:'Başka Eğitim',partner_egitim_id:'PE-20001',yayin_sayisi:0}]};
let posts=[];
globalThis.fetch=async(url,options)=>{
 if(options?.method==='POST'){posts.push(JSON.parse(options.body));return Response.json({talep_id:uid(50)});}
 if(String(url).startsWith('/urunler/api'))return Response.json({urunler:[{urun_id:uid(7),urun_adi:'Test Ürün'}]});
 if(String(url).startsWith('/teknikler/api'))return Response.json({teknikler:[]});
 return Response.json(data);
};
let passed=0;const check=(name,c)=>{assert.ok(c,name);passed++;};
const a=document.createElement('div');document.body.append(a);const root=createRoot(a);
const flush=()=>act(async()=>{await new Promise(r=>setTimeout(r,30));});
const button=text=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()===text);
const click=async b=>{assert.ok(b);await act(async()=>b.click());await flush();};
await act(async()=>root.render(React.createElement(Page)));await flush();
check('Üç ortak stat kartı',a.querySelector('section[aria-label="Agora yayın özeti"]').querySelectorAll('article').length===3);
check('Satın alınan ve yayımlanan rafları',!!a.querySelector('section[aria-label="Yeni Satın Aldıklarım"]')&&!!a.querySelector('section[aria-label="Yayınladıklarım"]'));
check('Kaynaklar HOYK ile çizilir',a.querySelectorAll('[class="hidden sm:block w-full"] [data-hoyk-kapak]').length===3);
check('Raflar gerçek yayına almaya göre ayrılır',a.querySelector('section[aria-label="Yayınladıklarım"]').textContent.includes('Yayınlanmış Eğitim')&&!a.querySelector('section[aria-label="Yeni Satın Aldıklarım"]').textContent.includes('Yayınlanmış Eğitim'));
await click(Array.from(a.querySelectorAll('button')).find(b=>b.textContent.includes('İkinci Partner')));
check('Partner filtresi rafları değiştirir',!a.querySelector('section[aria-label="Yeni Satın Aldıklarım"]').textContent.includes('Yeni Eğitim'));
await click(Array.from(a.querySelectorAll('button')).find(b=>b.textContent.includes('Tüm Partnerler')));
await click(button('Yayına Al'));
check('Yayına Al yönetimi açar',!!button('Yayın Ayarlarını Aç'));
check('PM ürünsüz ilerleyemez',button('Yayın Ayarlarını Aç').disabled);
check('Ürün ve hedef seçimleri var',!!a.querySelector('button[aria-label="Ürün"]')&&!!a.querySelector('button[aria-label="Hedef Rol"]'));
await click(a.querySelector('button[aria-label="Ürün"]'));
await click(button('Test Ürün'));
check('Ürün seçilince ayarlar açılabilir',!button('Yayın Ayarlarını Aç').disabled);
await click(button('Yayın Ayarlarını Aç'));
check('Seçilen ürün APIye gider',posts[0].urun_id===uid(7));
check('Satın alma ve tekil hazırlık kimliği gönderilir',posts[0].siparis_id===uid(11)&&/^[0-9a-f-]{36}$/.test(posts[0].istek_id));
check('Ortak editöre hazırlanan talep bağlanır',a.querySelector('[data-editor]').getAttribute('data-editor')===uid(50));
await click(a.querySelector('button[aria-label="Hedef Rol"]'));
await click(button('Bölge Müdürleri'));
check('Hedef değişirse eski ayarlar yayımlanamaz',!a.querySelector('[data-editor]')&&!!button('Yayın Ayarlarını Aç'));
await click(button('Yayın Ayarlarını Aç'));
check('Hedef değişimi yeni talep çoğaltmaz',posts[1].istek_id===posts[0].istek_id&&posts[1].hedef==='bm');
await act(async()=>root.unmount());
console.log(JSON.stringify({passed,scope:'HappyDOM gerçek sayfa, ortak HOYK ve seçim kontrolleri; editör/auth/HTTP sahte. Raflar, partner filtresi, zorunlu ürün, yönetim ve yeniden ayarlama bağlantıları.'}));
