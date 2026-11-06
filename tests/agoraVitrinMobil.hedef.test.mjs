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
for(const k of ['MutationObserver','CustomEvent','NodeFilter','HTMLButtonElement'])globalThis[k]=win[k];
globalThis.getComputedStyle=win.getComputedStyle.bind(win);
globalThis.requestAnimationFrame=cb=>setTimeout(cb,0);globalThis.cancelAnimationFrame=clearTimeout;
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client'),ts=require('typescript');
const cache=new Map();const gidilenYollar=[];
function load(file){
 if(cache.has(file))return cache.get(file).exports;
 const mod={exports:{}};cache.set(file,mod);
 const localRequire=id=>{
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
const Provider=load(repo+'/components/agora/AgoraVitrinBaglami.tsx').AgoraVitrinSaglayici;
const Vitrin=load(repo+'/components/agora/AgoraVitrini.tsx').default;
const Shell=load(repo+'/components/panel/PanelKabugu.tsx').default;
const {agoraTokenTutari,agoraRaflari}=load(repo+'/lib/agora/vitrin.ts');
let passed=0;
const check=(name,condition)=>{assert.ok(condition,name);passed++;};
const a=document.createElement('div');document.body.append(a);const root=createRoot(a);
const partnerA='10000000-0000-4000-8000-000000000001',partnerB='10000000-0000-4000-8000-000000000002';
const base={kategori:'egitim',fiyat_tl:4950,hedef_roller:['utt','bm'],aciklama:'Özet',yayinlandi_at:'2026-11-06T00:00:00Z',kapak_video_guid:null,begeni_sayisi:0,favori_sayisi:0,begeni_mi:false,favori_mi:false,siparis_sayisi:null,surum:1,satin_alindi:false};
const data={stat:{partner_sayisi:2,yayin_sayisi:3,siparis_sayisi:null,hafta:'2026-11-02'},partnerler:[{partner_id:partnerA,sirket_adi:'Partner A',yayin_sayisi:2},{partner_id:partnerB,sirket_adi:'Partner B',yayin_sayisi:0}],yayinlar:[
 {...base,egitim_id:'video-a',partner_id:partnerA,sirket_adi:'Partner A',partner_egitim_id:'PE-10001',egitim_adi:'Eğitim A',yayin_araci:'video'},
 {...base,egitim_id:'video-b',partner_id:partnerB,sirket_adi:'Partner B',partner_egitim_id:'PE-20001',egitim_adi:'Eğitim B',yayin_araci:'video'},
 {...base,egitim_id:'podcast',partner_id:partnerA,sirket_adi:'Partner A',partner_egitim_id:'PE-10002',egitim_adi:'Podcast A',yayin_araci:'podcast',transkript_var:false,kapak_var:false},
]};
const requests=[];
globalThis.fetch=async(url,options)=>{
 requests.push(url);
 if(url==='/agora/api/vitrin')return Response.json(data);
 if(url==='/agora/api/siparis'){
  const d=JSON.parse(options.body);data.yayinlar.find(y=>y.egitim_id===d.egitim_id).satin_alindi=true;
  return Response.json({mevcut:false,siparis_id:'siparis',borca_yazilan_token:0});
 }
 if(url==='/agora/api/etkilesim'){
  const d=JSON.parse(options.body),y=data.yayinlar.find(y=>y.egitim_id===d.egitim_id);
  y[d.tur+'_mi']=d.deger;y[d.tur+'_sayisi']=Number(d.deger);
  return Response.json({tamam:true});
 }
 return Response.json({hata:'Yok'},{status:404});
};
const settle=async(fn=()=>{})=>{await act(async()=>{await fn();await new Promise(r=>setTimeout(r,10));});};
const button=(text)=>[...a.querySelectorAll('button')].find(b=>b.textContent.trim()===text);
const render=async()=>{
 await settle(()=>root.render(React.createElement(Provider,{key:role,etkin:true,kimlik:role},React.createElement(Shell,{
 navbar:{adSoyad:'Test',agoraGoster:true,onCikis:()=>{}},baglam:{rolKucu:role,kimlikTuru:'kullanici',storeAcik:false,ccAcik:false,eclubAcik:false,eczanemAcik:false},gruplar:[],badge:{}
 },React.createElement(Vitrin)))));
 await settle();
};

try{
 data.yayinlar=Array.from({length:18},(_,i)=>({...base,egitim_id:'mobil-'+i,partner_id:i===8?partnerB:partnerA,sirket_adi:i===8?'Partner B':'Partner A',partner_egitim_id:'PE-'+i,egitim_adi:'Mobil Eğitim '+i,yayin_araci:i<9?'video':'podcast',transkript_var:false,kapak_var:false}));
 data.partnerler[0].yayin_sayisi=17;data.partnerler[1].yayin_sayisi=1;
 const mobil=()=>a.querySelector('section[aria-label="Yeniler"] [class*="sm:hidden"]');
 const kartSayisi=()=>mobil().querySelectorAll('[data-hoyk-kart]').length;
 const daha=()=>[...mobil().querySelectorAll('button')].find(b=>b.textContent.includes('Daha Fazla Göster'));
 const bas=async b=>{assert.ok(b);await settle(()=>b.click());};
 await render();
 check('Mobil başlangıçta iki kart',kartSayisi()===2);
 check('Mobil tek sütun ortak grid',!!mobil().querySelector('.grid.grid-cols-1'));
 check('Masaüstü tüm yayınları yatay listeler',a.querySelector('section[aria-label="Yeniler"] [class="hidden sm:block w-full"]').querySelectorAll('[data-hoyk-kart]').length===9);
 check('Mobilde kenar oku yok',mobil().querySelectorAll('button[aria-label*="kaydır"]').length===0);
 await bas(daha());check('İlk tıklama beş ekler',kartSayisi()===7);
 await bas(button('Yenile'));check('Aynı kapsamda yenileme açık kartları korur',kartSayisi()===7);
 await bas(daha());check('Son tıklama kalanları gösterir',kartSayisi()===9&&!daha());
 const aside=a.querySelector('aside');await bas([...aside.querySelectorAll('button')].find(b=>b.textContent.includes('Partner A')));
 check('Partner değişimi ikiye sıfırlar',kartSayisi()===2);
 await bas(daha());check('Partnerde beşer açılır',kartSayisi()===7);
 await bas(button('Bölge Müdürleri'));check('Hedef kitle değişimi ikiye sıfırlar',kartSayisi()===2);
 await bas(daha());await bas(button('Podcast'));check('Yayın aracı değişimi ikiye sıfırlar',kartSayisi()===2);
 await bas(daha());await bas(button('Agora'));check('Tüm partnerlere dönüş ikiye sıfırlar',kartSayisi()===2);
 check('Mobil sipariş bağlantısı etkin',[...mobil().querySelectorAll('button')].some(b=>b.textContent==='Sipariş Ver'&&!b.disabled));
 console.log(JSON.stringify({passed,scope:'HappyDOM gerçek Agora vitrini, ortak MobilYayinAkisi ve HOYK; sahte API. 2+5 listeleme, partner/hedef/araç sıfırlaması ve masaüstü rafının korunması. Görsel tarayıcı testi değildir.'}));
}finally{await settle(()=>root.unmount());win.happyDOM.abort();}
