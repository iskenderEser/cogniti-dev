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
const cache=new Map();
function load(file){
 if(cache.has(file))return cache.get(file).exports;
 const mod={exports:{}};cache.set(file,mod);
 const localRequire=id=>{
  if(id==='next/navigation')return {useRouter:()=>({push:()=>{},replace:()=>{},prefetch:()=>{}}),usePathname:()=>'/agora'};


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
const Ekler=load(repo+'/app/partner/egitimler/PartnerPodcastEkleri.tsx').default;
const a=document.createElement('div');document.body.append(a);const root=createRoot(a);let passed=0,hazir=false;
const check=(n,c)=>{assert.ok(c,n);passed++;};
let state={surum:1,kapak_url:null,transkript:{durum:'yok'}},posts=[];
globalThis.fetch=async(url,opts={})=>{
 if(!opts.method)return Response.json(state);
 if(opts.method==='PUT'){state={...state,surum:state.surum+1,kapak_url:'https://test.invalid/cover.png'};return Response.json(state);}
 const d=JSON.parse(opts.body);posts.push(d);
 if(d.islem==='kapak_kaldir')state={...state,surum:state.surum+1,kapak_url:null};
 if(d.islem==='onayla')state={...state,surum:state.surum+1,transkript:{durum:'onaylandi',kaynak:'manuel',onaylanan_metin:d.metin}};
 if(d.islem==='iptal')state={...state,surum:state.surum+1,transkript:{durum:'iptal'}};
 if(d.islem==='ai')state={...state,surum:state.surum+1,transkript:{durum:'ai_bekliyor',kaynak:'ai'}};
 return Response.json(state);
};
const settle=async(fn=()=>{})=>act(async()=>{await fn();await new Promise(r=>setTimeout(r,15));});
const button=t=>[...a.querySelectorAll('button')].find(b=>b.textContent.trim()===t);
try{
 await settle(()=>root.render(React.createElement(Ekler,{egitimId:'e',yuklemeId:'p',disabled:false,onIslem:()=>{},onHazirlik:n=>{hazir=n;}})));await settle();
 check('Görsel yükleme alanı',!!a.querySelector('[aria-label="Podcast Yayın Görseli Yükle"]'));check('Transkriptsiz kayıt geçerli',hazir);
 await settle(()=>button('Manuel Transkript Ekle').click());
 check('Ortak editör metin alanı',!!a.querySelector('textarea'));
 const ta=a.querySelector('textarea');await settle(()=>{Object.getOwnPropertyDescriptor(win.HTMLTextAreaElement.prototype,'value').set.call(ta,'Bu podcast için manuel transkript metnidir.');ta.dispatchEvent(new win.Event('input',{bubbles:true}));});
 check('Düzenleme tamamlanmadan hazır değil',!hazir);
 await settle(()=>button('Onayla ve Kaydet').click());await settle();
 check('Sunucuya onay gönderilir',posts.some(p=>p.islem==='onayla'));
 check('Sunucu onaylı transkript hazır',hazir&&a.textContent.includes('Transkript Onaylandı'));
 check('Yanlış yerel kayıt açıklaması yok',!a.textContent.includes('talep oluşturulurken kaydedilecek'));
 await settle(()=>button('Transkriptsiz Devam Et').click());await settle();check('Açık iptal kaydedilir',posts.at(-1).islem==='iptal'&&hazir);
 const input=a.querySelector('[aria-label="Podcast Yayın Görseli Yükle"]');
 await settle(()=>{Object.defineProperty(input,'files',{configurable:true,value:[new File([new Uint8Array([1])],'cover.png',{type:'image/png'})]});input.dispatchEvent(new win.Event('change',{bubbles:true}));});await settle();
 check('Yüklenen görsel önizlemesi',!!a.querySelector('img[alt="Podcast yayın görseli"]'));
 await settle(()=>button('Görseli Kaldır').click());await settle();check('Görsel kaldırılır',!a.querySelector('img'));
 await settle(()=>button('AI ile Transkript Oluştur').click());await settle();check('AI isteği partner uç noktasına gider',posts.at(-1).islem==='ai');check('AI tamamlanmadan hazır değil',!hazir);
 console.log(JSON.stringify({passed,scope:'Gerçek partner ekleri ve ortak transkript editörü React; API ve görsel dosyası sahte, gerçek tarayıcı/AI kabulü değil.'}));
}finally{await settle(()=>root.unmount());win.happyDOM.abort();}
